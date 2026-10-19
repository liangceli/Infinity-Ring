import bpy,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
import build_r3 as r3
for name in r3.OFFSETS:r3.GROUPS[name]=bpy.data.objects['R3 / '+name]
r3.pose(0)
s=bpy.context.scene;cp=bpy.context.preferences.addons['cycles'].preferences;cp.compute_device_type='OPTIX';cp.get_devices()
for d in cp.devices:d.use=d.type=='OPTIX'
s.cycles.device='GPU';s.cycles.samples=96;s.render.use_persistent_data=True
s.render.resolution_x=1400;s.render.resolution_y=1000;s.render.resolution_percentage=100
s.render.image_settings.file_format='WEBP';s.render.image_settings.color_mode='RGB';s.render.image_settings.quality=93
out=ROOT.parent/'site'/'assets'/'r3-details';out.mkdir(parents=True,exist_ok=True)
settings={
 'housing':((3.4,-5.8,3.7),(0,0,.18),4.7),
 'bezel':((1.3,-3.0,4.2),(0,0,1.46),1.96),
 'iris':((1.2,-3.0,4.6),(0,0,1.38),1.68),
 'optics':((1.1,-3.4,2.7),(0,-.55,1.21),1.35),
 'electronics':((1.2,-2.6,4.7),(0,0,1.17),1.58),
 'power':((1.3,-3.1,4.6),(0,0,1.07),1.6)
}
for name,(loc,target,scale) in settings.items():
 for ob in bpy.data.objects:
  if ob.parent in r3.GROUPS.values():ob.hide_render=ob.parent!=r3.GROUPS[name]
 objs=[ob for ob in bpy.data.objects if ob.type=='MESH' and ob.parent==r3.GROUPS[name]]
 z=min((ob.matrix_world@v.co).z for ob in objs for v in ob.data.vertices)
 bpy.data.objects['Studio floor'].location.z=z-.06
 s.camera.location=loc;r3.aim(s.camera,target);s.camera.data.ortho_scale=scale
 s.render.filepath=str(out/f'{name}.webp');bpy.ops.render.render(write_still=True)
 print('DETAIL_DONE '+name,flush=True)
