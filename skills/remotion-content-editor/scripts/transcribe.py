#!/usr/bin/env python3
"""Transcribe each source locally with word timing; requires ffmpeg and a selected engine."""
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from probe_media import discover, natural_key


def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''): h.update(chunk)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--root', default='.')
    p.add_argument('--file', action='append')
    p.add_argument('--out', default='analisis/transcripciones')
    p.add_argument('--engine', required=True, choices=['mlx', 'whisper'])
    p.add_argument('--model', default='small', choices=['tiny', 'base', 'small', 'medium', 'large-v3'])
    p.add_argument('--language', required=True, help='Actual spoken language, e.g. es or en')
    args = p.parse_args()
    if not shutil.which('ffmpeg'): p.error('ffmpeg is required')
    module = 'mlx_whisper' if args.engine == 'mlx' else 'whisper'
    if importlib.util.find_spec(module) is None:
        p.error(f'Engine unavailable. Install {"mlx-whisper" if args.engine == "mlx" else "openai-whisper"} in a project-local environment.')
    root = Path(args.root).resolve()
    if not root.is_dir(): p.error('Root is not a directory')
    files = sorted([root / f for f in args.file], key=natural_key) if args.file else discover(root)
    if not files: p.error('No source videos found')
    out = Path(args.out).resolve(); out.mkdir(parents=True, exist_ok=True)
    cache = out / 'models'; cache.mkdir(exist_ok=True)
    # Set before importing either engine; all downloads stay in the analysis directory.
    os.environ['HF_HOME'] = str(cache / 'huggingface')
    if args.engine == 'mlx':
        import mlx_whisper
        model_name = f'mlx-community/whisper-{args.model}-mlx'
        run = lambda wav: mlx_whisper.transcribe(str(wav), path_or_hf_repo=model_name, language=args.language, word_timestamps=True)
    else:
        import whisper
        model = whisper.load_model(args.model, device='cpu', download_root=str(cache / 'whisper'))
        run = lambda wav: model.transcribe(str(wav), language=args.language, word_timestamps=True, fp16=False)
    failed = []
    for source in files:
        try:
            fingerprint = sha256(source)
            path_key = hashlib.sha256(str(source).encode()).hexdigest()[:10]
            stem = source.stem.replace('/', '_') + '-' + path_key
            dest = out / f'{stem}.json'; wav = out / f'{stem}.wav'
            meta = {'source': str(source), 'sha256': fingerprint, 'engine': args.engine, 'model': args.model, 'language': args.language}
            if dest.exists():
                old = json.loads(dest.read_text(encoding='utf-8'))
                if old.get('sourceMetadata') == meta:
                    print(f'Cached: {source.name}', flush=True); continue
            print(f'Transcribing: {source.name}', flush=True)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', str(wav)], check=True)
            result = run(wav); result['sourceMetadata'] = meta
            temp = dest.with_suffix('.json.tmp')
            temp.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
            temp.replace(dest)
            print(result.get('text', ''), flush=True)
        except Exception as e:
            failed.append(str(source)); print(f'Could not transcribe {source}: {e}', file=sys.stderr)
    if failed: raise SystemExit(1)

if __name__ == '__main__': main()
