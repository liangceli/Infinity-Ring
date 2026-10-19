import {readFile,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chapters,components} from '../src/content.mjs';
import {stateAt} from '../src/motion.mjs';
import {renderedFrameAt,renderedLayout} from '../src/rendered-motion.mjs';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return(await Promise.all(entries.filter(e=>!e.name.startsWith('.')&&e.name!=='node_modules').map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=await walk(root);let checked=0;
for(const file of files.filter(f=>/\.m?js$/.test(f)&&!f.includes(`${path.sep}vendor${path.sep}`))){
 const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(result.status,0,`${file}\n${result.stderr}`);checked++;
 const text=await readFile(file,'utf8');for(const m of text.matchAll(/(?:from\s*|import\s*\()['"](\.[^'"]+)['"]/g))await access(path.resolve(path.dirname(file),m[1]));
}
for(const file of ['index.html','styles.css']){
 const source=await readFile(path.join(root,file),'utf8');
 for(const m of source.matchAll(/(?:src|href)=["']([^"']+)["']|url\(['"]?([^)'"\s]+)['"]?\)/g)){
  const ref=m[1]||m[2];if(/^(?:#|https?:|data:)/.test(ref))continue;await access(path.resolve(root,ref));
 }
}
assert.equal(chapters.length,12);assert.equal(new Set(chapters.map(c=>c.id)).size,12);assert.equal(components.length,6);
for(const c of chapters.filter(c=>c.photo))await access(path.join(root,`assets/iris-${c.photo}.png`));
const images=[];
for(const file of files.filter(f=>f.endsWith('.png'))){const buf=await readFile(file);assert.equal(buf.toString('ascii',1,4),'PNG');images.push({name:path.basename(file),width:buf.readUInt32BE(16),height:buf.readUInt32BE(20),bytes:buf.length});}
const model=JSON.parse(await readFile(path.resolve(root,'../render-v2/model-validation.json'),'utf8'));
assert.ok(model.same_instances_reassembled);assert.equal(model.max_endpoint_error,0);
const sequence=JSON.parse(await readFile(path.join(root,'assets/r3-sequence/manifest.json'),'utf8'));
for(let i=0;i<sequence.frames;i++)await access(path.join(root,`assets/r3-sequence/${String(i).padStart(3,'0')}.webp`));
for(let i=0;i<25;i++)await access(path.join(root,`assets/r3-projection/${String(i).padStart(3,'0')}.webp`));
for(const n of ['off','illumination'])await access(path.join(root,`assets/r3-projection/${n}.webp`));
for(const part of components)await access(path.join(root,`assets/r3-details/${part.id}.webp`));
for(let i=0;i<=2200;i++){
 const state=stateAt(i/2200),frame=renderedFrameAt(state);assert.ok(frame>=0&&frame<sequence.frames);
 for(const [w,h] of [[1920,1080],[390,844]])Object.values(renderedLayout(state,w,h)).forEach(n=>assert.ok(Number.isFinite(n)));
}
console.log(JSON.stringify({syntaxModules:checked,chapters:chapters.length,componentGroups:components.length,modelMeshInstances:model.mesh_instances,productFrames:sequence.frames,projectionFrames:25,partDetails:components.length,modelStatesChecked:2201,images,browserVisualQA:'See docs/site-qa-v2.md for separate screenshot and interaction evidence'},null,2));
