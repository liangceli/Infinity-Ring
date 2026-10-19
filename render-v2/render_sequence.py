"""Render native WebP frames from the authored Blender assembly.
Run with the master .blend loaded. Frames are indexed by scroll, not wall time.
"""
import bpy,sys,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
import build_r3 as r3
for name in r3.OFFSETS:r3.GROUPS[name]=bpy.data.objects['R3 / '+name]

def ease(t):
    t=max(0,min(1,t));return t*t*t*(t*(6*t-15)+10)
def mix(a,b,t):return a+(b-a)*t
KEYS=[
    (0.00,0.0,(3.45,-5.7,3.95),(.0,0,.18),4.25),
    (0.17,0.0,(2.55,-5.9,4.55),(.0,0,.26),3.90),
    (0.54,1.0,(3.6,-6.8,4.6),(.0,0,1.40),6.45),
    (0.68,1.0,(1.8,-7.4,4.5),(.0,0,1.40),6.45),
    (1.00,0.0,(3.0,-5.8,4.3),(.0,0,.18),4.25),
]
def frame_pose(p):
    a=KEYS[0];b=KEYS[-1]
    for j in range(len(KEYS)-1):
        if KEYS[j][0]<=p<=KEYS[j+1][0]:a,b=KEYS[j:j+2];break
    t=ease((p-a[0])/(b[0]-a[0]))
    return mix(a[1],b[1],t),Vector(a[2]).lerp(Vector(b[2]),t),Vector(a[3]).lerp(Vector(b[3]),t),mix(a[4],b[4],t)

scene=bpy.context.scene
cp=bpy.context.preferences.addons['cycles'].preferences
cp.compute_device_type='OPTIX';cp.get_devices()
for d in cp.devices:d.use=d.type=='OPTIX'
scene.cycles.device='GPU'
print('SEQUENCE_DEVICE '+str([(d.name,d.type) for d in cp.devices if d.use]),flush=True)
scene.render.resolution_x=1120;scene.render.resolution_y=1120;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.quality=88
scene.render.film_transparent=True;scene.cycles.samples=48;scene.cycles.adaptive_threshold=.04
scene.render.use_persistent_data=True
bpy.data.objects['Studio floor'].hide_render=True
scene.use_nodes=False
out=ROOT.parent/'site'/'assets'/'r3-sequence';out.mkdir(parents=True,exist_ok=True)
frames=121
start=int(sys.argv[-1]) if sys.argv[-1].isdigit() else 0
for i in range(start,frames):
    amount,location,target,scale=frame_pose(i/(frames-1))
    r3.pose(amount);scene.camera.location=location;r3.aim(scene.camera,target);scene.camera.data.ortho_scale=scale
    scene.render.filepath=str(out/f'{i:03d}.webp')
    bpy.ops.render.render(write_still=True)
    print(f'SEQUENCE {i+1}/{frames}',flush=True)
manifest={'schema':1,'frames':frames,'width':1120,'height':1120,'format':'webp','alpha':True,'renderer':'Blender 4.5.14 Cycles','model':'infinity-r3-master.blend','keyframes':[{'frame':round(k[0]*(frames-1)),'explode':k[1]} for k in KEYS],'same_geometry':True}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('SEQUENCE_COMPLETE',flush=True)
