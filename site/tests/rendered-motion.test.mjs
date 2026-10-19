import test from 'node:test';
import assert from 'node:assert/strict';
import {stateAt} from '../src/motion.mjs';
import {renderedFrameAt,renderedLayout,projectionFrame} from '../src/rendered-motion.mjs';

test('assembly travels through the same rendered frames in either scroll direction',()=>{
 const forwards=Array.from({length:3001},(_,i)=>renderedFrameAt(stateAt(i/11000)));
 const reverse=Array.from({length:3001},(_,i)=>renderedFrameAt(stateAt((3000-i)/11000))).reverse();
 assert.deepEqual(forwards,reverse);
 for(let i=1;i<forwards.length;i++){
  if(Math.abs(forwards[i]-forwards[i-1])>=1){
   // Track resets are permitted only while the product is completely invisible.
   assert.equal(stateAt(i/11000).model,0);assert.equal(stateAt((i-1)/11000).model,0);
  }
 }
});
test('all frames stay valid and viewport placement is finite at arbitrary stops',()=>{
 for(let i=0;i<=2200;i++){
  const s=stateAt(i/2200),f=renderedFrameAt(s);assert.ok(f>=0&&f<=120);
  for(const [w,h] of [[1920,1080],[390,844],[1080,1440]]){
   const r=renderedLayout(s,w,h);Object.values(r).forEach(x=>assert.ok(Number.isFinite(x)));
   assert.ok(r.size>0&&r.x>=0&&r.x<=w&&r.y>=0&&r.y<=h);
  }
 }
 assert.equal(projectionFrame(0),0);assert.equal(projectionFrame(1),24);
 assert.equal(projectionFrame(-1),0);assert.equal(projectionFrame(5),24);
});
