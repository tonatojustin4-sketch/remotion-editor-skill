#!/usr/bin/env node
import {constants} from 'node:fs';
import {access, cp, lstat, mkdir, readFile, readdir, rename, rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {planRemotion, setupRemotion} from './remotion.mjs';

const name = 'remotion-content-editor';
const source = fileURLToPath(new URL(`../skills/${name}/`, import.meta.url));
const help = `Remotion Editor Skill — instalador para Codex

Uso: remotion-editor-skill [opciones]

Sin opciones: instala en .agents/skills/${name} del proyecto actual.

  --project <ruta>  Instala en un proyecto distinto
  --global          Instala en CODEX_HOME/skills o ~/.codex/skills
  --dest <ruta>     Directorio padre de skills personalizado
  --with-remotion   Instala también Remotion dentro del proyecto local
  --remotion-dir <ruta>  Elige una carpeta para Remotion (requiere --with-remotion)
  --dry-run         Muestra el destino sin escribir archivos
  --force           Actualiza guardando primero una copia de la versión existente
  --help            Muestra esta ayuda

Sin --with-remotion solo copia la skill. Con esa opción prepara Remotion
en edicion-remotion o reutiliza un proyecto existente. Los motores de voz se
preparan al editar. Con --global, Remotion se instala en el proyecto actual.
`;

async function exists(path) {
  try {return await lstat(path);} catch (e) {if (e.code === 'ENOENT') return null; throw e;}
}

async function entries(path, prefix = '') {
  const result = [];
  for (const e of await readdir(path, {withFileTypes: true})) {
    const rel = join(prefix, e.name);
    if (e.isSymbolicLink()) throw new Error(`No se admiten enlaces dentro de una skill: ${rel}`);
    if (e.isDirectory()) result.push(...await entries(join(path, e.name), rel));
    else if (e.isFile()) result.push(rel);
    else throw new Error(`Tipo de archivo no admitido: ${rel}`);
  }
  return result.sort();
}

async function identical(target) {
  const a = await entries(source), b = await entries(target);
  if (JSON.stringify(a) !== JSON.stringify(b)) return false;
  for (const rel of a) {
    if (!(await readFile(join(source, rel))).equals(await readFile(join(target, rel)))) return false;
  }
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--help' || a === '-h') {console.log(help); return;}
    if (['--global', '--dry-run', '--force', '--with-remotion'].includes(a)) {opts[a] = true; continue;}
    if (['--project', '--dest', '--remotion-dir'].includes(a)) {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Falta el valor de ${a}`);
      opts[a] = args[++i]; continue;
    }
    throw new Error(`Opción desconocida: ${a}. Consulta --help.`);
  }
  if (['--global', '--project', '--dest'].filter(k => opts[k]).length > 1) {
    throw new Error('Elige solo una opción: --global, --project o --dest.');
  }
  if (opts['--remotion-dir'] && !opts['--with-remotion']) throw new Error('--remotion-dir requiere --with-remotion.');
  const remotionPlan = opts['--with-remotion'] ? await planRemotion(opts['--project'] || process.cwd(), opts['--remotion-dir']) : null;
  const finish = async () => {if (remotionPlan) await setupRemotion(remotionPlan, {dryRun: !!opts['--dry-run']});};
  await access(join(source, 'SKILL.md'), constants.R_OK);
  await entries(source);
  const parent = opts['--dest'] ? resolve(opts['--dest']) : opts['--global']
    ? join(resolve(process.env.CODEX_HOME || join(homedir(), '.codex')), 'skills')
    : join(resolve(opts['--project'] || process.cwd()), '.agents', 'skills');
  const target = join(parent, name);
  const current = await exists(target);
  if (current && (!current.isDirectory() || current.isSymbolicLink())) {
    throw new Error(`El destino no es un directorio normal: ${target}. No se reemplazó.`);
  }
  if (current && await identical(target)) {console.log(`Ya está instalada esta versión: ${target}`); await finish(); return;}
  if (current && !opts['--force']) {
    throw new Error(`Ya existe una versión distinta: ${target}. Usa --force para actualizar con respaldo.`);
  }
  if (opts['--dry-run']) {
    console.log(`${current ? 'Actualizaría con respaldo' : 'Instalaría'}: ${target}`); await finish(); return;
  }
  await mkdir(parent, {recursive: true});
  const staging = join(parent, `.${name}.tmp-${randomUUID()}`);
  let backup;
  try {
    await cp(source, staging, {recursive: true, errorOnExist: true, force: false});
    if (current) {
      backup = join(parent, `${name}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`);
      await rename(target, backup);
    } else if (await exists(target)) {
      throw new Error('El destino apareció durante la instalación. Reintenta después de revisarlo.');
    }
    try {await rename(staging, target);} catch (e) {
      if (backup) await rename(backup, target);
      throw e;
    }
  } finally {await rm(staging, {recursive: true, force: true});}
  console.log(`Skill instalada: ${target}`);
  if (backup) console.log(`Versión anterior guardada: ${backup}`);
  console.log('Disponible en el próximo turno de Codex. Si no aparece, vuelve a abrir el proyecto.');
  console.log(`Úsala así: $${name} Edita los fragmentos de esta carpeta y entrega el MP4.`);
  await finish();
}

main().catch(e => {console.error(`Instalación incompleta: ${e.message}`); process.exitCode = 1;});
