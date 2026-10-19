import {cp,mkdir,writeFile,readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const output=path.join(root,'.vercel','output'),target=path.join(output,'static');
await mkdir(target,{recursive:true});
for(const item of ['index.html','styles.css','src','vendor','assets'])await cp(path.join(root,item),path.join(target,item),{recursive:true});
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const all=await walk(target),overrides={};
for(const f of all.filter(f=>f.endsWith('.mjs')))overrides[path.relative(target,f).replaceAll('\\','/')]={contentType:'text/javascript; charset=utf-8'};
await writeFile(path.join(output,'config.json'),JSON.stringify({version:3,overrides},null,2));
const manifest=[];
for(const f of all)manifest.push({file:path.relative(target,f).replaceAll('\\','/'),sha256:createHash('sha256').update(await readFile(f)).digest('hex')});
await writeFile(path.resolve(root,'../docs/deployment-files.json'),JSON.stringify({createdAt:new Date().toISOString(),files:manifest},null,2));
console.log(`Prepared ${all.length} static files in ${output}`);
