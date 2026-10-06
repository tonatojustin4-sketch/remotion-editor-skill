#!/usr/bin/env python3
"""Inventory source videos with natural order. Requires ffprobe, no Python packages."""
import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

EXTENSIONS = {'.mp4', '.mov', '.mkv', '.webm', '.m4v', '.avi', '.mts'}
EXCLUDED = {'node_modules', '.git', '.agents', '.codex', '__pycache__', 'output', 'out', 'dist', 'build', 'processed', 'generated', 'analisis', 'analysis'}

def natural_key(path):
    return tuple((1, int(s)) if s.isdigit() else (0, s.casefold()) for s in re.split(r'(\d+)', str(path)))

def discover(root):
    root = Path(root).resolve()
    videos = []
    for parent, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = [d for d in dirs if d not in EXCLUDED and not d.startswith('.') and not Path(parent, d).is_symlink()]
        for file in files:
            p = Path(parent, file)
            if p.suffix.lower() in EXTENSIONS and not p.is_symlink(): videos.append(p)
    return sorted(videos, key=lambda p: natural_key(p.relative_to(root)))

def probe(path):
    p = subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', str(path)], capture_output=True, text=True, check=True)
    raw = json.loads(p.stdout)
    videos = [s for s in raw.get('streams', []) if s.get('codec_type') == 'video' and not s.get('disposition', {}).get('attached_pic')]
    if not videos: raise ValueError('No video stream')
    s = videos[0]
    rotation = float(s.get('tags', {}).get('rotate', 0))
    for data in s.get('side_data_list', []):
        if 'rotation' in data: rotation = float(data['rotation'])
    width, height = s.get('width'), s.get('height')
    if width and height and round(rotation) % 180 == 90: width, height = height, width
    return {
        'file': str(path), 'durationSeconds': float(raw.get('format', {}).get('duration') or s.get('duration') or 0),
        'video': {'codec': s.get('codec_name'), 'storedWidth': s.get('width'), 'storedHeight': s.get('height'),
                  'displayWidth': width, 'displayHeight': height, 'rotationDegrees': rotation,
                  'averageFps': s.get('avg_frame_rate'), 'nominalFps': s.get('r_frame_rate')},
        'audio': [{'codec': a.get('codec_name'), 'sampleRate': a.get('sample_rate'), 'channels': a.get('channels')} for a in raw.get('streams', []) if a.get('codec_type') == 'audio'],
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.')
    parser.add_argument('--file', action='append', help='Explicit source file; repeat to restrict discovery')
    parser.add_argument('--out', help='Save JSON here; otherwise print it')
    args = parser.parse_args()
    if not shutil.which('ffprobe'): parser.error('ffprobe is required. Install FFmpeg using your platform package manager.')
    root = Path(args.root).resolve()
    if not root.is_dir(): parser.error('Root is not a directory')
    files = sorted([root / p for p in args.file], key=natural_key) if args.file else discover(root)
    if not files: parser.error('No source videos found')
    records = []
    for f in files:
        try: records.append(probe(f))
        except (subprocess.CalledProcessError, ValueError) as e:
            records.append({'file': str(f), 'error': e.stderr if isinstance(e, subprocess.CalledProcessError) else str(e)})
    result = {'root': str(root), 'files': records}
    text = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.out:
        out = Path(args.out); out.parent.mkdir(parents=True, exist_ok=True); out.write_text(text, encoding='utf-8')
        print(f'Inventory saved: {out} ({len(records)} source files)')
    else: print(text, end='')
    if any('error' in r for r in records): raise SystemExit(1)

if __name__ == '__main__': main()
