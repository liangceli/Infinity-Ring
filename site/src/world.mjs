import * as THREE from '../vendor/three.module.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {createRing} from './ring-model.mjs';
import {viewportPose} from './motion.mjs';

export function createWorld(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,60),pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
 const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=1.25;room.dispose();pmrem.dispose();
 const key=new THREE.DirectionalLight(0xecf3ed,3.4);key.position.set(-3,6,5);scene.add(key);
 const fill=new THREE.DirectionalLight(0x99b1aa,2.5);fill.position.set(5,2,-4);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xcfe4dd,2);rim.position.set(-4,-1,-3);scene.add(rim);
 const ring=createRing();scene.add(ring.group);
 let width=1,height=1;
 function resize(){width=canvas.clientWidth||innerWidth;height=canvas.clientHeight||innerHeight;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
 function render(state,controls,time){
  const pose=viewportPose(state,width/height);
  ring.update(pose,controls,time);camera.position.set(0,1.65,pose.cameraZ);camera.lookAt(0,.35,0);
  canvas.style.opacity=String(state.model);renderer.render(scene,camera);
 }
 resize();return{render,resize,dispose(){ring.dispose();env.dispose();renderer.dispose();}};
}
