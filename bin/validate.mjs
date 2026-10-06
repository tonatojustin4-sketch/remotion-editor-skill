import {readFile,readdir,lstat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const skill=join(root,'skills','remotion-content-editor');
async function walk(dir){
 const result=[];
 for(const e of await readdir(dir,{withFileTypes:true})){
  assert.ok(!e.isSymbolicLink(),`Symlink: ${e.name}`);const p=join(dir,e.name);
  if(e.isDirectory())result.push(...await walk(p));else result.push(p);
 }
 return result;
}
const entry=await readFile(join(skill,'SKILL.md'),'utf8');
assert.match(entry,/^---\r?\nname: remotion-content-editor\r?\ndescription: .+\r?\n---/);
for(const file of await walk(skill)){
 assert.ok(!['.mp4','.mov','.wav','.mp3','.env','.tgz'].includes(extname(file)),`Private/binary asset: ${file}`);
 if(extname(file)==='.md'){
  const text=await readFile(file,'utf8');
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
   const ref=m[1];if(/^(https?:|#)/.test(ref))continue;
   assert.ok((await lstat(join(dirname(file),ref.split('#')[0]))).isFile(),`Missing reference: ${ref}`);
  }
 }
}
const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'));
assert.equal(Object.keys(pkg.dependencies||{}).length,0);
for(const k of ['preinstall','install','postinstall','prepare'])assert.ok(!pkg.scripts[k]);
assert.equal(pkg.bin['remotion-editor-skill'],'bin/install.mjs');
console.log('Skill metadata, local references and package contents are valid.');
