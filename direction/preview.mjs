import * as THREE from 'three';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {motionAt,lerp,smooth,clamp,phases} from './motion.mjs';

const host=document.querySelector('#motion-canvas'),track=document.querySelector('#motion-track');
const status=document.querySelector('#render-status'),seek=document.querySelector('#seek'),play=document.querySelector('#play');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){status.textContent='此设备无法开启三维视图；上方主视觉和下方叙事仍可查看。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x070b08);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,.1,80);camera.position.set(0,2.1,9);camera.lookAt(0,0,0);
const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();
scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=1.1;room.dispose();pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xdfeee7,0x101b14,2));
const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(-4,5,5);scene.add(key);
const rim=new THREE.DirectionalLight(0x79e5ad,2);rim.position.set(5,1,-3);scene.add(rim);
const white=new THREE.DirectionalLight(0xe4e9f0,2);white.position.set(3,-1,5);scene.add(white);

// Symbolic geometry has no real-world dimensions or claimed component fit.
const grainCanvas=document.createElement('canvas');grainCanvas.width=512;grainCanvas.height=64;
const gc=grainCanvas.getContext('2d');const pixels=gc.createImageData(512,64);let seed=73;
for(let y=0;y<64;y++){seed=(seed*1664525+1013904223)>>>0;const base=116+(seed%25);for(let x=0;x<512;x++){const i=(y*512+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=base;pixels.data[i+3]=255;}}
gc.putImageData(pixels,0,0);const grain=new THREE.CanvasTexture(grainCanvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,5);
const metal=new THREE.MeshPhysicalMaterial({color:0x6c7471,metalness:1,roughness:.25,clearcoat:.12,bumpMap:grain,bumpScale:.004});
const polished=new THREE.MeshPhysicalMaterial({color:0xa8b0ad,metalness:1,roughness:.16});
const dark=new THREE.MeshStandardMaterial({color:0x101a15,metalness:.6,roughness:.35});
const green=new THREE.MeshStandardMaterial({color:0x22e487,emissive:0x1bea80,emissiveIntensity:1.8,roughness:.3});
const glass=new THREE.MeshPhysicalMaterial({color:0x071b16,metalness:.65,roughness:.08,clearcoat:1});
const boardMaterial=new THREE.MeshStandardMaterial({color:0x183e29,roughness:.65,metalness:.2});
const gold=new THREE.MeshStandardMaterial({color:0xbab078,metalness:.9,roughness:.4});
const ring=new THREE.Group();scene.add(ring);
function band(inner,outer,width,material){const h=width/2,b=Math.min(.028,width*.15);const pts=[[inner,-h+b],[inner+b,-h],[outer-b,-h],[outer,-h+b],[outer,h-b],[outer-b,h],[inner+b,h],[inner,h-b],[inner,-h+b]].map(([x,y])=>new THREE.Vector2(x,y));return new THREE.Mesh(new THREE.LatheGeometry(pts,160),material);}
function block(w,h,d,mat,x=0,y=0,z=0){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);return mesh;}
const shell=new THREE.Group();shell.add(band(1.04,1.18,.28,metal));shell.position.y=.22;ring.add(shell);
const lower=band(1.04,1.17,.25,metal);lower.position.y=-.22;ring.add(lower);
const control=new THREE.Group();control.add(band(1.035,1.183,.115,polished));ring.add(control);
for(let i=0;i<150;i++){const a=i/150*Math.PI*2;const notch=block(.007,.09,.012,dark,Math.sin(a)*1.184,0,Math.cos(a)*1.184);notch.rotation.y=a;control.add(notch);}
const lining=band(.97,1.035,.72,polished);ring.add(lining);
const pcb=new THREE.Group();pcb.add(band(1.045,1.065,.16,boardMaterial));ring.add(pcb);
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const chip=block(.12,.09,.06,dark,Math.sin(a)*1.078,0,Math.cos(a)*1.078);chip.rotation.y=a;pcb.add(chip);for(let j=-1;j<=1;j+=2){const pin=block(.14,.014,.012,gold,Math.sin(a)*1.109,j*.06,Math.cos(a)*1.109);pin.rotation.y=a;pcb.add(pin);}}
const optical=new THREE.Group();optical.position.set(0,.22,1.185);shell.add(optical);
optical.add(block(.68,.17,.035,dark));
function lens(x,r,material){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.04,48),material);mesh.rotation.x=Math.PI/2;mesh.position.set(x,0,.025);optical.add(mesh);return mesh;}
lens(-.17,.073,polished);lens(-.17,.057,glass);lens(.17,.069,glass);
const stateLight=block(.06,.012,.015,green,.30,-.05,.026);optical.add(stateLight);
const sensor=new THREE.Group();sensor.add(block(.16,.12,.08,dark,0,0,0));sensor.add(block(.09,.05,.01,glass,0,0,.046));sensor.position.set(.5,0,.93);ring.add(sensor);
const battery=new THREE.Group();const cell=new THREE.Mesh(new THREE.TorusGeometry(1.08,.045,8,48,1.4),polished);cell.rotation.x=Math.PI/2;cell.rotation.z=3.9;battery.add(cell);ring.add(battery);

// A target surface, distinct from the ring's status indicator.
const target=new THREE.Group();scene.add(target);
target.add(block(2.65,1.9,.05,boardMaterial,0,0,0));
for(let i=0;i<30;i++){const x=((i*73)%100)/100*2.3-1.15,y=((i*47)%100)/100*1.58-.79;target.add(block(.12+(i%3)*.05,.09,.07,dark,x,y,.065));target.add(block(.18,.012,.005,gold,x+.09,y,.035));}
for(let i=0;i<9;i++){target.add(block(2.3,.008,.004,gold,0,-.72+i*.17,.028));}
const connector=block(.5,.21,.15,new THREE.MeshStandardMaterial({color:0xc4c9b6,roughness:.6}),.34,.12,.14);target.add(connector);
for(let i=0;i<4;i++)target.add(block(.05,.08,.035,dark,.17+i*.11,.13,.23));
const targetCircle=new THREE.Mesh(new THREE.TorusGeometry(1,.012,8,160),green);targetCircle.position.set(.34,.12,.27);target.add(targetCircle);
const boardEdge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.65,1.9,.05)),new THREE.LineBasicMaterial({color:0x70937d,transparent:true,opacity:.4}));target.add(boardEdge);
const mobile=()=>host.clientWidth<760;
let width=0,height=0;function resize(){width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
let progress=0,last=performance.now(),playing=false,startTime=0,wasInside=false,phase=-1;
function scrollProgress(){const available=track.offsetHeight-host.clientHeight;return clamp((window.scrollY-track.offsetTop)/available);}
function seekTo(p){window.scrollTo({top:track.offsetTop+p*(track.offsetHeight-host.clientHeight),behavior:'instant'});}
seek.addEventListener('input',()=>{playing=false;play.textContent='播放 12 秒预览';seekTo(Number(seek.value)/1000);});
play.addEventListener('click',()=>{playing=!playing;if(playing){startTime=performance.now();seekTo(0);}play.textContent=playing?'暂停预览':'播放 12 秒预览';});
window.addEventListener('wheel',()=>{playing=false;play.textContent='播放 12 秒预览';},{passive:true});
window.addEventListener('touchstart',()=>{playing=false;play.textContent='播放 12 秒预览';},{passive:true});
window.addEventListener('keydown',(event)=>{if(['PageDown','PageUp','ArrowDown','ArrowUp','Home','End',' '].includes(event.key)){playing=false;play.textContent='播放 12 秒预览';}});
let inside=false;new IntersectionObserver(([entry])=>{inside=entry.isIntersecting;},{rootMargin:'100px'}).observe(track);
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.06);last=now;
  if(playing){const p=clamp((now-startTime)/12000);seekTo(p);if(p===1){playing=false;play.textContent='重新预览';}}
  const desired=scrollProgress();progress=reduced.matches?desired:lerp(progress,desired,1-Math.exp(-dt*11));if(Math.abs(progress-desired)<.00001)progress=desired;
  if(!inside&&wasInside===false)return;wasInside=inside;
  const f=motionAt(progress),m=mobile();
  const scale=(m?.78:1.08)*(1-.40*f.explode+.12*f.focus)*(1-.5*f.scene);
  ring.scale.setScalar(scale);ring.position.set(lerp(m?0:1.1,m?-.95:-.1,f.scene)-f.focus*.4,m?-.95:.1,0);
  ring.rotation.set(lerp(.84,1.05,f.explode),lerp(-.48,.25,f.turn/1.3),lerp(-.40,.2,f.explode)-f.scene*.55);
  shell.position.y=.22+f.shell;lower.position.y=-.22-f.explode*.20;
  control.position.y=f.control;control.rotation.y=f.turn;lining.position.y=f.lining;
  pcb.position.set(.26*f.explode,0,0);sensor.position.set(.5+f.explode*.42,0,.93+f.explode*.3);
  battery.position.set(0,-.3*f.explode,-.5*f.explode);
  optical.position.set(f.focus*.45,.02,1.185+f.focus*.3);
  stateLight.material.emissiveIntensity=.5+smooth(.03,.14,progress)*1.8;
  target.visible=f.scene>.001;target.position.set(lerp(5,m?.1:1.7,f.scene),m?-1.14:0,-.2);
  target.rotation.set(.06,lerp(.8,-.2,f.scene),-.08);target.scale.setScalar(m?.69:.91);
  targetCircle.scale.setScalar(f.radius);
  document.querySelector('#component-labels').style.opacity=(f.explode*(1-f.focus)).toFixed(3);
  if(f.phase!==phase){phase=f.phase;const data=phases[phase];document.querySelector('#phase-label').textContent=data.label;document.querySelector('#phase-title').textContent=data.title;document.querySelector('#phase-copy').textContent=data.copy;}
  const copyOpacity=phases.reduce((opacity,p,i)=>i===0?opacity:Math.min(opacity,Math.abs(progress-p.at)<.022?Math.abs(progress-p.at)/.022:1),1);
  document.querySelector('.scene-copy').style.opacity=String(.12+.88*copyOpacity);
  seek.value=String(Math.round(progress*1000));document.querySelector('#progress').value=`${Math.round(progress*100)}%`;
  renderer.render(scene,camera);status.textContent='三维视图已加载 · 可停顿 / 可反向';
}
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();status.textContent='三维视图已暂停，请刷新恢复。';playing=false;});
requestAnimationFrame(animate);
