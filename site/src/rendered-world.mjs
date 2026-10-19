import {renderedFrameAt,renderedLayout,projectionFrame} from './rendered-motion.mjs';
import {clamp} from './motion.mjs';

// Decode only a small moving window. Compressed browser cache is reusable on reverse scroll.
function frames(base,count,budget=24){
 const cache=new Map(),pending=new Map(),failed=new Map();let queue=[],running=0,disposed=false,center=0,version=0,requestKey='',retryCheck=0;
 const path=i=>`${base}/${String(i).padStart(3,'0')}.webp`;
 function trim(){for(const [i,img] of cache){if(cache.size<=budget)break;if(Math.abs(i-center)>6){img.src='';cache.delete(i);}}}
 function pump(){while(!disposed&&running<3&&queue.length){const item=queue.shift();running++;const img=new Image();img.decoding='async';img.onload=()=>{running--;pending.delete(item.i);if(disposed){img.src='';item.resolve(null);return;}cache.set(item.i,img);version++;trim();item.resolve(img);pump();};img.onerror=()=>{running--;pending.delete(item.i);failed.set(item.i,performance.now());item.resolve(null);pump();};img.src=path(item.i);}}
 function load(i,priority=false){i=Math.round(clamp(i,0,count-1));if(cache.has(i))return Promise.resolve(cache.get(i));if(pending.has(i)){if(priority){const at=queue.findIndex(item=>item.i===i);if(at>0)queue.unshift(queue.splice(at,1)[0]);}return pending.get(i);}if(performance.now()-(failed.get(i)||-10000)<5000)return Promise.resolve(null);let resolve;const p=new Promise(r=>resolve=r);pending.set(i,p);const item={i,resolve};priority?queue.unshift(item):queue.push(item);pump();return p;}
 function near(value){const key=`${Math.floor(value)}:${Math.ceil(value)}`,now=performance.now();if(key===requestKey&&now<retryCheck)return;requestKey=key;retryCheck=now+1000;center=Math.round(value);load(Math.floor(value),true);load(Math.ceil(value),true);for(let d=1;d<=7;d++){load(clamp(center+d,0,count-1));load(clamp(center-d,0,count-1));}}
 function pair(value){near(value);const lo=Math.floor(value),hi=Math.ceil(value),a=cache.get(lo),b=cache.get(hi);if(a&&b)return [[a,1-(value-lo)],[b,value-lo]];if(a||b)return [[a||b,1]];let nearest;for(const [i,img] of cache)if(!nearest||Math.abs(i-value)<nearest.distance)nearest={img,distance:Math.abs(i-value)};return nearest?[[nearest.img,1]]:[];}
 return {load,pair,get version(){return version;},dispose(){disposed=true;queue=[];cache.forEach(img=>img.src='');cache.clear();}};
}
function imageFile(src){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;});}
export async function createWorld(canvas){
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas unavailable');
 const ring=frames('assets/r3-sequence',121),light=frames('assets/r3-projection',25,18);
 const first=await ring.load(0);if(!first)throw Error('Rendered product assets unavailable');
 let unlit,illumination;
 imageFile('assets/r3-projection/off.webp').then(v=>unlit=v);
 imageFile('assets/r3-projection/illumination.webp').then(v=>illumination=v);
 light.load(12);let w=1,h=1,dpr=1,lastKey='';
 const ringBlend=document.createElement('canvas'),lightBlend=document.createElement('canvas');
 function blended(pair,buffer){if(!pair.length)return null;const first=pair[0][0];if(buffer.width!==first.width||buffer.height!==first.height){buffer.width=first.width;buffer.height=first.height;}const b=buffer.getContext('2d');b.clearRect(0,0,buffer.width,buffer.height);b.globalCompositeOperation='lighter';for(const [img,a] of pair){b.globalAlpha=a;b.drawImage(img,0,0);}b.globalAlpha=1;b.globalCompositeOperation='source-over';return buffer;}
 function resize(){w=canvas.clientWidth||innerWidth;h=canvas.clientHeight||innerHeight;dpr=Math.min(devicePixelRatio||1,1.6);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);lastKey='';}
 function cover(img,alpha){if(!img||alpha<=0)return;ctx.globalAlpha=alpha;if(w/h<.85){const sx=img.width*.39,sw=img.width*.48,scale=Math.min(w/sw,h*.45/img.height);const dw=sw*scale,dh=img.height*scale;ctx.drawImage(img,sx,0,sw,img.height,(w-dw)/2,72,dw,dh);}else{const scale=Math.min(w/img.width,(h-100)/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,w-dw-24,(h-dh)/2,dw,dh);}}
 function shade(alpha){if(w/h<.85)return;ctx.globalAlpha=alpha;const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'#080c0afa');g.addColorStop(.29,'#080c0ada');g.addColorStop(.65,'#080c0a10');g.addColorStop(1,'#080c0a00');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 function render(state,controls){
  // Keep retrying missing nearby frames even while the visitor stops scrolling.
  const projection=state.photos.projection||0,night=state.photos.illumination||0;
  const lightPair=projection?light.pair(projectionFrame(controls.size??.55)):null;
  const ringPair=state.model>.001?ring.pair(renderedFrameAt(state)):null;
  const key=[state.p,controls.size,controls.brightness,w,h,dpr,ring.version,light.version,!!unlit,!!illumination].join('|');
  if(key===lastKey)return;lastKey=key;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  if(projection){cover(unlit,projection);cover(blended(lightPair,lightBlend),projection*(controls.brightness??.7));shade(projection);}
  if(night){cover(illumination,night);shade(night);}
  if(state.model>.001){const pose=renderedLayout(state,w,h),img=blended(ringPair,ringBlend);if(img){ctx.globalAlpha=state.model;ctx.drawImage(img,pose.x-pose.size/2,pose.y-pose.size/2,pose.size,pose.size);}}
  ctx.globalAlpha=1;canvas.style.opacity='1';
 }
 resize();return {resize,render,dispose(){ring.dispose();light.dispose();}};
}
