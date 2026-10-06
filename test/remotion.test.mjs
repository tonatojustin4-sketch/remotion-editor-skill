import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readdir,rm,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {planRemotion,setupRemotion} from '../bin/remotion.mjs';
const cli=fileURLToPath(new URL('../bin/install.mjs',import.meta.url));
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'remotion-setup test-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
async function project(root,installed=true){
 await mkdir(root,{recursive:true});await writeFile(join(root,'package.json'),JSON.stringify({dependencies:{remotion:'4.0.533','@remotion/cli':'4.0.533'}}));
 if(installed)for(const pkg of ['remotion','@remotion/cli']){await mkdir(join(root,'node_modules',pkg),{recursive:true});await writeFile(join(root,'node_modules',pkg,'package.json'),JSON.stringify({version:'4.0.533'}));}
}
test('creates a separate project when source videos exist',async t=>{
 const root=await fixture(t);await writeFile(join(root,'Parte 1.mp4'),'source');
 const plan=await planRemotion(root);assert.equal(plan.action,'create');assert.equal(plan.target,join(root,'edicion-remotion'));
 const calls=[];await setupRemotion(plan,{log:()=>{},run:async(args,opts)=>{calls.push({args,...opts});await project(plan.target);}});
 assert.equal(calls.length,1);assert.ok(calls[0].args.includes('create-video'));assert.equal(calls[0].cwd,root);
 assert.equal(await readFile(join(root,'Parte 1.mp4'),'utf8'),'source');
});
test('reuses installed Remotion without running npm',async t=>{
 const root=await fixture(t);await project(root);const plan=await planRemotion(root);assert.equal(plan.action,'reuse');
 await setupRemotion(plan,{log:()=>{},run:()=>{assert.fail('npm must not run');}});
});
test('installs missing dependencies of an existing project',async t=>{
 const root=await fixture(t);await project(root,false);const plan=await planRemotion(root);assert.equal(plan.action,'install');
 const calls=[];await setupRemotion(plan,{log:()=>{},run:async(args)=>{calls.push(args);await project(root);}});
 assert.deepEqual(calls,[['install']]);
});
test('refuses nonempty destinations and unrelated projects',async t=>{
 const root=await fixture(t);await mkdir(join(root,'edicion-remotion'));await writeFile(join(root,'edicion-remotion','keep.txt'),'keep');
 await assert.rejects(planRemotion(root),/ya contiene archivos/);
 await writeFile(join(root,'edicion-remotion','package.json'),'{}');
 await assert.rejects(planRemotion(root),/otro proyecto/);
 const plan=await planRemotion(root,'otra carpeta');assert.equal(plan.target,join(root,'otra carpeta'));
});
test('dry-run with Remotion never writes or downloads',async t=>{
 const root=await fixture(t);const plan=await planRemotion(root);await setupRemotion(plan,{dryRun:true,log:()=>{},run:()=>assert.fail('no download')});
 assert.deepEqual(await readdir(root),[]);
 const res=spawnSync(process.execPath,[cli,'--with-remotion','--dry-run'],{cwd:root,encoding:'utf8'});
 assert.equal(res.status,0,res.stderr);assert.match(res.stdout,/Remotion: crearía/);assert.deepEqual(await readdir(root),[]);
});
test('already installed skill still processes --with-remotion; reuse is idempotent',async t=>{
 const root=await fixture(t);await project(join(root,'edicion-remotion'));
 const first=spawnSync(process.execPath,[cli],{cwd:root,encoding:'utf8'});assert.equal(first.status,0,first.stderr);
 const second=spawnSync(process.execPath,[cli,'--with-remotion'],{cwd:root,encoding:'utf8'});assert.equal(second.status,0,second.stderr);
 assert.match(second.stdout,/Ya está instalada/);assert.match(second.stdout,/Remotion ya está instalado/);
});
test('download failure has actionable retry and preserves files',async t=>{
 const root=await fixture(t);const plan=await planRemotion(root);
 await assert.rejects(setupRemotion(plan,{log:()=>{},run:()=>{throw new Error('network unavailable');}}),/vuelve a ejecutar --with-remotion/);
});
test('remotion-dir requires explicit Remotion installation',async t=>{
 const root=await fixture(t);const res=spawnSync(process.execPath,[cli,'--remotion-dir','custom'],{cwd:root,encoding:'utf8'});
 assert.equal(res.status,1);assert.match(res.stderr,/requiere --with-remotion/);assert.deepEqual(await readdir(root),[]);
});
test('adds missing CLI matching the installed Remotion version',async t=>{
 const root=await fixture(t);await project(root);
 await rm(join(root,'node_modules','@remotion','cli'),{recursive:true});
 const calls=[];
 await setupRemotion(await planRemotion(root),{log:()=>{},run:async(args)=>{
  calls.push(args);
  if(args.includes('--save-exact'))await project(root);
 }});
 assert.deepEqual(calls,[['install'],['install','--save-exact','@remotion/cli@4.0.533']]);
});
