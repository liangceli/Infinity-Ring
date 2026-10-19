import * as THREE from '../vendor/three.module.js';

// Unitless concept geometry. These dimensions are visual proportions, not CAD.
function bandGeometry({inner=1,outer=1.2,width=.33,crown=.19,segments=180}={}){
 const vertices=[],uv=[],indices=[],profile=[[-1,0],[-1,.65],[-.92,.9],[-.75,1],[.75,1],[.92,.9],[1,.65],[1,0],[.92,-.12],[.75,-.18],[-.75,-.18],[-.92,-.12]];
 for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,top=Math.pow(Math.max(0,Math.sin(a)),8),r=outer+crown*top,w=width+.17*top;
  for(let j=0;j<profile.length;j++){
   const [z,t]=profile[j],radius=inner+(r-inner)*Math.max(0,t);
   vertices.push(Math.cos(a)*radius,Math.sin(a)*radius,z*w);uv.push(i/segments,j/profile.length);
  }
 }
 const n=profile.length;
 for(let i=0;i<segments;i++)for(let j=0;j<n;j++){
  const a=i*n+j,b=i*n+(j+1)%n,c=(i+1)*n+(j+1)%n,d=(i+1)*n+j;
  indices.push(a,d,b,b,d,c);
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

function washer(inner,outer,height,segments=96){
 const shape=new THREE.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
 const hole=new THREE.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
 const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:2,curveSegments:segments/4,steps:1});
 geo.translate(0,0,-height/2);geo.rotateX(-Math.PI/2);return geo;
}
const mesh=(geo,mat,parent,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m;};
function arc(radius,tube,start,length,material,parent,y=0){
 const m=mesh(new THREE.TorusGeometry(radius,tube,10,90,length),material,parent,0,y,0);m.rotation.x=Math.PI/2;m.rotation.z=start;return m;
}

export function createRing(){
 const group=new THREE.Group();group.name='Infinity Ring · R3 Iris';
 const materials={
  shell:new THREE.MeshPhysicalMaterial({color:0x454d50,metalness:.97,roughness:.29,clearcoat:.25,clearcoatRoughness:.26}),
  edge:new THREE.MeshPhysicalMaterial({color:0x98a3a6,metalness:1,roughness:.2}),
  dark:new THREE.MeshStandardMaterial({color:0x080d0c,metalness:.65,roughness:.27}),
  blade:new THREE.MeshStandardMaterial({color:0x252d2b,metalness:.92,roughness:.24}),
  green:new THREE.MeshStandardMaterial({color:0x42ff9e,emissive:0x17ee7c,emissiveIntensity:1.2,metalness:.2,roughness:.26}),
  lens:new THREE.MeshPhysicalMaterial({color:0x071e1c,metalness:.62,roughness:.1,clearcoat:1}),
  pcb:new THREE.MeshStandardMaterial({color:0x09382a,metalness:.4,roughness:.65}),
  gold:new THREE.MeshStandardMaterial({color:0xaf9a50,metalness:.85,roughness:.4}),
  battery:new THREE.MeshStandardMaterial({color:0x283534,metalness:.78,roughness:.32})
 };
 const parts={};for(const id of ['housing','liner','bezel','iris','optics','electronics','power']){parts[id]=new THREE.Group();parts[id].name=id;group.add(parts[id]);}
 mesh(bandGeometry(),materials.shell,parts.housing);
 mesh(bandGeometry({inner:.974,outer:1.012,width:.31,crown:0}),materials.edge,parts.liner);
 // Continuous sculpted shoulders meet a recessed crown, rather than a gemstone.
 mesh(new THREE.CylinderGeometry(.65,.58,.13,96),materials.shell,parts.housing,0,1.35,0);
 mesh(washer(.515,.648,.075),materials.edge,parts.bezel,0,1.46,0);
 mesh(washer(.507,.616,.075),materials.dark,parts.bezel,0,1.475,0);
 const notchGeo=new THREE.BoxGeometry(.008,.055,.022),notches=new THREE.InstancedMesh(notchGeo,materials.shell,144),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1);
 for(let i=0;i<144;i++){const a=i/144*Math.PI*2;q.setFromEuler(new THREE.Euler(0,-a,0));matrix.compose(new THREE.Vector3(Math.sin(a)*.642,1.465,Math.cos(a)*.642),q,scale);notches.setMatrixAt(i,matrix);}parts.bezel.add(notches);
 mesh(new THREE.CylinderGeometry(.51,.51,.035,96),materials.dark,parts.iris,0,1.45,0);
 const blades=[];
 for(let i=0;i<7;i++){
  const shape=new THREE.Shape();shape.moveTo(.07,-.04);shape.quadraticCurveTo(.10,.33,.33,.42);shape.quadraticCurveTo(.49,.26,.48,.04);shape.lineTo(.18,-.10);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.007,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1});geo.rotateX(-Math.PI/2);
  const g=new THREE.Group();g.rotation.y=i/7*Math.PI*2;g.position.y=1.48+i*.0008;parts.iris.add(g);mesh(geo,materials.blade,g);blades.push(g);
 }
 arc(.563,.012,.12,1.26,materials.green,parts.bezel,1.519);arc(.563,.012,Math.PI+.12,1.26,materials.green,parts.bezel,1.519);
 arc(.615,.004,0,Math.PI*2,materials.edge,parts.bezel,1.512);
 mesh(new THREE.CylinderGeometry(.065,.065,.006,32),materials.lens,parts.iris,0,1.49,0);
 // Forward optical windows are a separate proposed assembly.
 for(const x of [-.22,.22]){
  mesh(new THREE.BoxGeometry(.24,.13,.045),materials.dark,parts.optics,x,1.16,.475);
  const lens=mesh(new THREE.CylinderGeometry(.050,.050,.018,40),materials.lens,parts.optics,x,1.16,.509);lens.rotation.x=Math.PI/2;
  const ring=mesh(washer(.048,.058,.01,48),materials.edge,parts.optics,x,1.16,.512);ring.rotation.x=Math.PI/2;
 }
 mesh(new THREE.BoxGeometry(.66,.065,.42),materials.pcb,parts.electronics,0,1.22,0);
 mesh(new THREE.BoxGeometry(.22,.06,.22),materials.dark,parts.electronics,-.12,1.285,0);
 mesh(new THREE.BoxGeometry(.12,.045,.18),materials.edge,parts.electronics,.20,1.274,.01);
 for(let i=0;i<8;i++)mesh(new THREE.BoxGeometry(.024,.015,.05),materials.gold,parts.electronics,-.27+i*.077,1.265,.17);
 const flex=mesh(new THREE.TorusGeometry(1.12,.026,8,90,Math.PI*.55),materials.pcb,parts.electronics);flex.rotation.z=-Math.PI*.85;flex.position.z=.21;
 const battery=mesh(new THREE.TorusGeometry(1.08,.084,16,64,Math.PI*.6),materials.battery,parts.power);battery.rotation.z=Math.PI*1.22;
 for(const z of [-.12,.12]){const pad=mesh(new THREE.CylinderGeometry(.034,.034,.01,24),materials.gold,parts.power,0,-1.04,z);pad.rotation.z=Math.PI;}
 const offsets={housing:[0,0,0],liner:[0,-.32,1.02],bezel:[0,1.20,0],iris:[0,1.75,0],electronics:[-1.32,.20,0],power:[-.85,-1.15,0],optics:[1.20,.10,.55]};
 function update(state,controls={},time=0){
  const e=state.explode;
  for(const [id,part]of Object.entries(parts)){const off=offsets[id];part.position.set(off[0]*e,off[1]*e,off[2]*e);}
  parts.bezel.rotation.y=state.turn+(controls.turn||0);
  const opening=controls.iris??state.iris;
  blades.forEach((b,i)=>{const a=i/7*Math.PI*2;b.rotation.y=a+opening*.38;b.position.x=Math.sin(a)*opening*.058;b.position.z=Math.cos(a)*opening*.058;});
  materials.green.emissiveIntensity=(controls.status??state.green)*1.4+.08;
  const idle=controls.reduced?0:Math.sin(time*.42)*.016;
  group.position.set(state.x,state.y+idle,state.z);group.scale.setScalar(state.scale);group.rotation.set(state.rx,state.ry+idle*.6,state.rz);
  group.visible=state.model>.006;
 }
 function dispose(){const geos=new Set();group.traverse(o=>{if(o.geometry)geos.add(o.geometry);});geos.forEach(g=>g.dispose());Object.values(materials).forEach(m=>m.dispose());}
 return{group,parts,materials,update,dispose};
}
