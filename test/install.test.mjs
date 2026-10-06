import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp, readFile, writeFile, readdir, lstat, rm, mkdir, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const cli = fileURLToPath(new URL('../bin/install.mjs', import.meta.url));
const name = 'remotion-content-editor';
async function fixture(t) {
 const root = await mkdtemp(join(tmpdir(), 'remotion-skill test-'));
 t.after(() => rm(root, {recursive:true, force:true})); return root;
}
const run = (root, ...args) => spawnSync(process.execPath, [cli, ...args], {cwd:root, encoding:'utf8'});

test('installs full skill in path with spaces and is idempotent', async t => {
 const root = await fixture(t), parent = join(root,'.agents','skills'), dest = join(parent,name);
 const first=run(root); assert.equal(first.status,0,first.stderr);
 assert.match(await readFile(join(dest,'SKILL.md'),'utf8'), /name: remotion-content-editor/);
 assert.match(await readFile(join(dest,'references','original-role.md'),'utf8'), /# ROLE/);
 assert.ok((await lstat(join(dest,'scripts','probe_media.py'))).isFile());
 const second=run(root); assert.equal(second.status,0,second.stderr);
 assert.match(second.stdout,/Ya está instalada/);
 assert.deepEqual(await readdir(parent),[name]);
});
test('dry-run writes nothing',async t=>{
 const root=await fixture(t); const res=run(root,'--dry-run');
 assert.equal(res.status,0,res.stderr); assert.deepEqual(await readdir(root),[]);
});
test('conflict is refused; explicit update preserves all old files in a backup',async t=>{
 const root=await fixture(t),parent=join(root,'.agents','skills'),dest=join(parent,name);
 assert.equal(run(root).status,0);
 await writeFile(join(dest,'personal.md'),'Notas del usuario');
 await writeFile(join(dest,'SKILL.md'),'Edición personal');
 assert.equal(run(root).status,1);
 assert.equal(await readFile(join(dest,'SKILL.md'),'utf8'),'Edición personal');
 const res=run(root,'--force'); assert.equal(res.status,0,res.stderr);
 const backups=(await readdir(parent)).filter(f=>f.startsWith(name+'.backup-')); assert.equal(backups.length,1);
 assert.equal(await readFile(join(parent,backups[0],'personal.md'),'utf8'),'Notas del usuario');
 assert.equal(await readFile(join(parent,backups[0],'SKILL.md'),'utf8'),'Edición personal');
 assert.match(await readFile(join(dest,'SKILL.md'),'utf8'),/name: remotion-content-editor/);
});
test('global install respects CODEX_HOME without touching real home',async t=>{
 const root=await fixture(t),custom=join(root,'codex home');
 const res=spawnSync(process.execPath,[cli,'--global'],{cwd:root,encoding:'utf8',env:{...process.env,CODEX_HOME:custom}});
 assert.equal(res.status,0,res.stderr); assert.ok((await lstat(join(custom,'skills',name,'SKILL.md'))).isFile());
});
test('custom parent and alternate project',async t=>{
 const root=await fixture(t);
 assert.equal(run(root,'--dest',join(root,'custom')).status,0);
 assert.ok((await lstat(join(root,'custom',name,'SKILL.md'))).isFile());
 assert.equal(run(root,'--project',join(root,'another project')).status,0);
 assert.ok((await lstat(join(root,'another project','.agents','skills',name,'SKILL.md'))).isFile());
});
test('invalid flags fail without writing',async t=>{
 const root=await fixture(t);
 for(const args of [['--unknown'],['--dest'],['--global','--project',root]])assert.equal(run(root,...args).status,1);
 assert.deepEqual(await readdir(root),[]);
});
test('symlink destination is refused even with force',{skip:process.platform==='win32'},async t=>{
 const root=await fixture(t),parent=join(root,'.agents','skills'),real=join(root,'real');
 await mkdir(real); await writeFile(join(real,'keep.txt'),'Keep me'); await mkdir(parent,{recursive:true});
 await symlink(real,join(parent,name)); assert.equal(run(root,'--force').status,1);
 assert.equal(await readFile(join(real,'keep.txt'),'utf8'),'Keep me');
});
