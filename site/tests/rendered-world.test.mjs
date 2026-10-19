import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/rendered-world.mjs';
import {stateAt} from '../src/motion.mjs';

function harness(){
 const saved=new Map();let now=100,fail=false,requests=0,draws=0;
 const replace=(name,value)=>{saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,value,writable:true});};
 const context=()=>({clearRect(){},setTransform(){},drawImage(){draws++;},fillRect(){},createLinearGradient(){return {addColorStop(){}};}});
 const canvas=()=>({clientWidth:1265,clientHeight:720,width:0,height:0,style:{},getContext:()=>context()});
 replace('document',{createElement:()=>canvas()});replace('devicePixelRatio',1);replace('performance',{now:()=>now});
 replace('Image',class {width=1120;height=1120;set src(value){if(!value)return;requests++;const failed=fail&&/r3-sequence\/(?!000)/.test(value);queueMicrotask(()=>failed?this.onerror?.():this.onload?.());}});
 return {canvas:canvas(),get draws(){return draws;},get requests(){return requests;},set fail(value){fail=value;},advance(){now+=6000;},restore(){for(const [name,d] of saved)d?Object.defineProperty(globalThis,name,d):delete globalThis[name];}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('a stationary frame repaints after same-size canvas resize',async()=>{
 const h=harness();let world;
 try{world=await createWorld(h.canvas);const s=stateAt(0),c={size:.55,brightness:.7};world.render(s,c);await settle();world.render(s,c);const before=h.draws;world.resize();world.render(s,c);assert.ok(h.draws>before,'cleared canvas must be repainted without a scroll');}
 finally{world?.dispose();h.restore();}
});
test('failed nearby frames recover while scroll progress remains fixed',async()=>{
 const h=harness();let world;
 try{world=await createWorld(h.canvas);await settle();h.fail=true;const s=stateAt(2/11),c={size:.55,brightness:.7};world.render(s,c);await settle();world.render(s,c);const failedRequests=h.requests;h.fail=false;h.advance();world.render(s,c);await settle();assert.ok(h.requests>failedRequests,'stationary scenes must retry after network recovery');}
 finally{world?.dispose();h.restore();}
});
