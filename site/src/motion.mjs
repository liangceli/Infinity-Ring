export const CHAPTER_COUNT=12;
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=t=>{t=clamp(t);return t*t*t*(t*(6*t-15)+10);};
export const ramp=(a,b,p)=>ease((p-a)/(b-a));
export const chapterProgress=i=>clamp(i,0,CHAPTER_COUNT-1)/(CHAPTER_COUNT-1);
export function viewportPose(state,aspect){
 const pose={...state};
 if(aspect<.85){
  const anatomy=mix(state.segment===2?1:0,Math.min(state.segment+1,CHAPTER_COUNT-1)===2?1:0,state.blend);
  pose.x=.20*anatomy;pose.y=mix(1.70,.15,anatomy);pose.scale*=mix(.85,.73,anatomy);pose.cameraZ+=3.2;
 }
 return pose;
}
const poses=[
 {x:1.65,y:-.16,z:0,scale:1.18,rx:.55,ry:-.50,rz:-.20,explode:0,iris:.12,turn:0,green:.4,cameraZ:8.4,model:1},
 {x:1.65,y:-.10,z:.1,scale:1.13,rx:.66,ry:-.15,rz:.08,explode:0,iris:.24,turn:.12,green:1,cameraZ:8.1,model:1},
 {x:.4,y:-.75,z:0,scale:.83,rx:.40,ry:-.30,rz:-.03,explode:1,iris:.50,turn:.24,green:.65,cameraZ:9.2,model:1},
 {x:1.65,y:-.25,z:.1,scale:1.0,rx:.80,ry:-.3,rz:-.15,explode:0,iris:.83,turn:.72,green:1,cameraZ:7.9,model:0,photo:'projection'},
 {x:2.10,y:.05,z:0,scale:.84,rx:.48,ry:.42,rz:.14,explode:.08,iris:.36,turn:1.04,green:.65,cameraZ:8.5,model:1},
 {x:2.15,y:-.6,z:0,scale:.38,rx:.48,ry:.42,rz:.12,explode:0,iris:.18,turn:1.05,green:.4,cameraZ:8.5,model:0,photo:'wear'},
 {x:2.25,y:-.65,z:0,scale:.34,rx:.5,ry:.2,rz:.12,explode:0,iris:.67,turn:1.45,green:1,cameraZ:8.5,model:0,photo:'workbench'},
 {x:2.2,y:-.6,z:0,scale:.34,rx:.5,ry:.2,rz:.12,explode:0,iris:.44,turn:1.8,green:1,cameraZ:8.5,model:0,photo:'reading'},
 {x:2.1,y:-.65,z:0,scale:.35,rx:.5,ry:.2,rz:.12,explode:0,iris:.25,turn:2.05,green:.75,cameraZ:8.5,model:0,photo:'illumination'},
 {x:1.7,y:-.20,z:0,scale:1.05,rx:.6,ry:-.5,rz:-.15,explode:0,iris:.07,turn:2.12,green:.10,cameraZ:8.5,model:1},
 {x:2.8,y:-.8,z:-.4,scale:.5,rx:.5,ry:-.4,rz:-.1,explode:0,iris:.10,turn:2.15,green:.25,cameraZ:8.5,model:.6},
 {x:1.7,y:-.12,z:0,scale:1.17,rx:.65,ry:-.45,rz:-.20,explode:0,iris:.15,turn:2.3,green:.5,cameraZ:8.4,model:1}
];
const keys=['x','y','z','scale','rx','ry','rz','explode','iris','turn','green','cameraZ','model'];
export function stateAt(value){
 const p=clamp(Number.isFinite(value)?value:0),x=p*(CHAPTER_COUNT-1),i=Math.min(CHAPTER_COUNT-1,Math.floor(x)),t=x-i,j=Math.min(i+1,CHAPTER_COUNT-1);
 const blend=ramp(.24,.94,t),a=poses[i],b=poses[j];
 const state={p,segment:i,local:t,blend};for(const key of keys)state[key]=mix(a[key],b[key],blend);
 state.chapter=t<.58?i:j;
 state.textOpacity=t<.58?1-ramp(.28,.50,t):ramp(.61,.88,t);
 if(i===j)state.textOpacity=1;
 state.textY=t<.58?-24*ramp(.28,.50,t):24*(1-ramp(.61,.88,t));
 state.photos={wear:0,workbench:0,reading:0,night:0,projection:0,illumination:0};
 if(a.photo)state.photos[a.photo]+=1-blend;if(b.photo)state.photos[b.photo]+=blend;
 state.photo=Object.values(state.photos).reduce((sum,n)=>sum+n,0);
 return state;
}
