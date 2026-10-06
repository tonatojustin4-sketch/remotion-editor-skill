import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {lstat, readFile, readdir, mkdir} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';

async function stat(path) {
  try {return await lstat(path);} catch(e) {if(e.code==='ENOENT') return null; throw e;}
}
async function manifest(path) {
  const s=await stat(join(path,'package.json'));
  if(!s)return null;
  if(!s.isFile()||s.isSymbolicLink())throw new Error(`package.json no es un archivo normal: ${path}`);
  return JSON.parse(await readFile(join(path,'package.json'),'utf8'));
}
function hasRemotion(pkg) {
  return !!(pkg?.dependencies?.remotion || pkg?.devDependencies?.remotion);
}
export async function planRemotion(project, custom) {
  const base=resolve(project);
  const basePkg=await manifest(base);
  const target=custom?resolve(base,custom):hasRemotion(basePkg)?base:join(base,'edicion-remotion');
  const s=await stat(target);
  if(s&&(!s.isDirectory()||s.isSymbolicLink()))throw new Error(`El destino de Remotion no es un directorio normal: ${target}`);
  const pkg=await manifest(target);
  if(pkg){
    if(!hasRemotion(pkg))throw new Error(`La carpeta contiene otro proyecto: ${target}. Elige una carpeta nueva con --remotion-dir.`);
    const cli=await stat(join(target,'node_modules','@remotion','cli','package.json'));
    const core=await stat(join(target,'node_modules','remotion','package.json'));
    if(!cli||!core)return {target,action:'install'};
    return {target,action:'reuse'};
  }
  if(s&&(await readdir(target)).length)throw new Error(`La carpeta de Remotion ya contiene archivos: ${target}. Usa --remotion-dir con una carpeta nueva.`);
  return {target,action:'create'};
}
export function runNpm(args,{cwd}) {
  // On Windows run npm's JS entrypoint directly, avoiding shell interpretation of paths.
  let command='npm', argv=args;
  if(process.platform==='win32'){
    const candidates=[process.env.npm_execpath,join(dirname(process.execPath),'node_modules','npm','bin','npm-cli.js')];
    const cli=candidates.find(p=>p&&p.endsWith('npm-cli.js')&&existsSync(p));
    if(!cli)throw new Error('No se encontró npm-cli.js. Ejecuta el instalador con npx o revisa la instalación de Node.js.');
    command=process.execPath;argv=[cli,...args];
  }
  return new Promise((ok,fail)=>{
    const child=spawn(command,argv,{cwd,stdio:'inherit',shell:false});
    child.once('error',fail);
    child.once('exit',(code,signal)=>code===0?ok():fail(new Error(`npm terminó con ${signal||`código ${code}`}`)));
  });
}
export async function setupRemotion(plan,{dryRun=false,run=runNpm,log=console.log}={}) {
  const {target,action}=plan;
  if(dryRun){log(`Remotion: ${action==='create'?'crearía un proyecto':action==='install'?'instalaría las dependencias existentes':'reutilizaría el proyecto'} en ${target}`);return;}
  if(action==='reuse'){log(`Remotion ya está instalado: ${target}`);return;}
  try{
    if(action==='create'){
      await mkdir(dirname(target),{recursive:true});
      log(`Preparando Remotion en ${target}`);
      await run(['exec','--yes','--package=create-video@latest','--','create-video','--yes','--blank','--no-tailwind',basename(target)],{cwd:dirname(target)});
    }
    // Some create-video versions already install packages; finish only if they are missing.
    const ready=await planRemotion(target);
    if(ready.action!=='reuse')await run(['install'],{cwd:target});
    if(!await stat(join(target,'node_modules','@remotion','cli','package.json'))){
      const core=await manifest(join(target,'node_modules','remotion'));
      if(!core?.version)throw new Error('No se encontró una versión instalada de Remotion.');
      await run(['install','--save-exact',`@remotion/cli@${core.version}`],{cwd:target});
    }
    const checked=await planRemotion(target);
    if(checked.action!=='reuse')throw new Error('No se encontraron Remotion y su CLI después de instalar.');
  }catch(e){throw new Error(`La skill sigue instalada, pero Remotion no quedó listo en ${target}: ${e.message}. Corrige el problema y vuelve a ejecutar --with-remotion.`);}
  log(`Remotion listo: ${target}`);
  log('Para abrirlo, ejecuta npx remotion studio --no-open dentro de esa carpeta.');
}
