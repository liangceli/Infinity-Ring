import {mkdir,cp,writeFile,readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
for(const args of [['scripts/check.mjs'],['--test','tests/motion.test.mjs']]){const r=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);}
const stamp=new Date().toISOString().replace(/[:.]/g,'-'),out=path.resolve(root,'../releases',`r3-${stamp}`);await mkdir(out,{recursive:true});
for(const file of ['index.html','styles.css','src','vendor','assets'])await cp(path.join(root,file),path.join(out,file),{recursive:true});
async function entries(dir){const es=await readdir(dir,{withFileTypes:true});return(await Promise.all(es.map(e=>e.isDirectory()?entries(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const manifest={createdAt:new Date().toISOString(),source:'site/',verification:'Static checks and deterministic math tests only; browser visual QA pending.',files:[]};
for(const file of await entries(out))manifest.files.push({path:path.relative(out,file).replaceAll('\\','/'),sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
await writeFile(path.join(out,'build-manifest.json'),JSON.stringify(manifest,null,2));console.log(`Prepared local package: ${out}`);
