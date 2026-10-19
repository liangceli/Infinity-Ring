import test from 'node:test';
import assert from 'node:assert/strict';
import {stateAt,chapterProgress,CHAPTER_COUNT} from '../src/motion.mjs';

test('navigation reaches each chapter with readable fully present content',()=>{
  for(let i=0;i<CHAPTER_COUNT;i++){
    const s=stateAt(chapterProgress(i));
    assert.equal(s.chapter,i);assert.equal(s.textOpacity,1);
  }
});
test('a reverse trip returns exactly to each previously visited state',()=>{
  const samples=Array.from({length:1201},(_,i)=>i/1200);
  const forward=samples.map(p=>stateAt(p));
  for(let i=samples.length-1;i>=0;i--)assert.deepEqual(stateAt(samples[i]),forward[i]);
});
test('geometry and camera remain finite and continuous across every chapter boundary',()=>{
  for(let i=0;i<=CHAPTER_COUNT-1;i++){
    const p=i/(CHAPTER_COUNT-1),before=stateAt(p-1e-7),after=stateAt(p+1e-7);
    for(const key of ['x','y','z','scale','rx','ry','rz','explode','iris','green','photo','cameraZ']){
      assert.ok(Number.isFinite(before[key])&&Number.isFinite(after[key]),key);
      assert.ok(Math.abs(before[key]-after[key])<.001,key+' discontinuity');
    }
  }
});
test('overscroll clamps to complete assembled endpoints',()=>{
  assert.deepEqual(stateAt(-5),stateAt(0));assert.deepEqual(stateAt(5),stateAt(1));
  assert.equal(stateAt(0).explode,0);assert.equal(stateAt(1).explode,0);
});
test('mobile camera framing stays continuous while crossing the anatomy text switch',async()=>{
 const {viewportPose}=await import('../src/motion.mjs');
 for(const segment of [1,2]){
  const a=viewportPose(stateAt((segment+.58-1e-7)/11),.55);
  const b=viewportPose(stateAt((segment+.58+1e-7)/11),.55);
  for(const key of ['x','y','scale','cameraZ'])assert.ok(Math.abs(a[key]-b[key])<.001,`${key} jumped on mobile`);
 }
});
