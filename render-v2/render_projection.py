"""Native 3D projected-light study with actual surface occlusion.
Projection is an intended interaction, not measured hardware performance.
"""
import bpy,sys,math,json
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;sys.path.insert(0,str(ROOT))
import build_r3 as r3
for name in r3.OFFSETS:r3.GROUPS[name]=bpy.data.objects['R3 / '+name]
r3.pose(0)
scene=bpy.context.scene
cp=bpy.context.preferences.addons['cycles'].preferences;cp.compute_device_type='OPTIX';cp.get_devices()
for d in cp.devices:d.use=d.type=='OPTIX'
scene.cycles.device='GPU'

def mathnode(nodes,links,op,a=None,b=None):
    n=nodes.new('ShaderNodeMath');n.operation=op
    for i,v in enumerate([a,b]):
        if v is not None:
            if isinstance(v,(float,int)):n.inputs[i].default_value=v
            else:links.new(v,n.inputs[i])
    return n.outputs[0]

rig=bpy.data.objects.new('Assembled R3 optical study',None);bpy.context.collection.objects.link(rig)
for ob in r3.GROUPS.values():ob.parent=rig
rig.location=(-1.35,.65,.10);rig.scale=(.68,)*3
rig.rotation_mode='QUATERNION';rig.rotation_quaternion=Vector((0,-1,0)).rotation_difference(Vector((.45,-.78,-.45)).normalized())
bpy.context.view_layer.update()
min_z=min((ob.matrix_world@v.co).z for ob in bpy.data.objects if ob.type=='MESH' and ob.parent in r3.GROUPS.values() for v in ob.data.vertices)
rig.location.z+=-.615-min_z
bpy.context.view_layer.update()
wood=r3.mat('Smoked walnut workbench',(.040,.020,.007),0,.55,(1,190,4))
floor=bpy.data.objects['Studio floor'];floor.data.materials.clear();floor.data.materials.append(wood)
boardmat=r3.mat('Bench PCB matte green',(.016,.042,.029),.25,.38)
black=r3.mat('Connector graphite polymer',(.012,.014,.013),.1,.44)
brass=r3.mat('Connector brushed brass',(.46,.28,.07),1,.29,(2,30,3))
white=r3.mat('Silkscreen ivory',(.68,.70,.59),0,.64)
darkmetal=r3.mat('Satin fixture',(.026,.032,.033),.7,.35)
target=Vector((.90,-1.45,-1.12))
board=r3.box('Diagnostic circuit board',(target.x,target.y,-1.16),(2.2,1.3,.075),boardmat,radius=.025)
for x in [-.86,.86]:
    for y in [-.48,.48]:
        r3.cylinder('Board fastener',(target.x+x,target.y+y,-1.112),.055,.016,brass)
        r3.cylinder('Fastener socket',(target.x+x,target.y+y,-1.101),.025,.007,black)
for i in range(14):
    x=target.x-.92+i*.14
    r3.box('Board test pad',(x,target.y-.54,-1.112),(.085,.08,.009),brass,radius=.005)
    for j in range(2):
        y=target.y+.33+j*.15
        r3.box('Board passive',(x,y,-1.085),(.055,.027,.04),black,radius=.004)
        r3.box('Passive solder',(x+.034,y,-1.102),(.013,.033,.012),brass,radius=.002)
for k in range(8):
    y=target.y-.4+k*.11
    r3.wire('Circuit trace',[(target.x-.9,y,-1.113),(target.x-.55,y,-1.113),(target.x-.3,y+.08,-1.113),(target.x+.7,y+.08,-1.113)],.003,brass)
r3.box('Central connector block',(target.x,target.y,-.96),(.61,.37,.30),black,radius=.028)
for i in range(5):
    r3.box('Connector contact',(target.x-.22+i*.11,target.y-.19,-.96),(.038,.018,.15),brass,radius=.005)
r3.text_obj('Board label','J4  /  INTERFACE',(target.x-.42,target.y-.40,-1.112),.11,white)
# A low matte display block lifts the optical path clear of the surface.
r3.cylinder('Low display cradle',(-1.35,.65,-.925),.51,.60,black,vertices=128)

# Local normal coordinates on a Cycles spot light produce a true projected annulus.
# Its light is occluded by the connector and picks up table perspective naturally.
data=bpy.data.lights.new('R3 projected selection','SPOT');data.energy=4800;data.spot_size=math.radians(70);data.spot_blend=.05;data.shadow_soft_size=.002
data.use_nodes=True
lamp=bpy.data.objects.new('R3 projected selection',data);bpy.context.collection.objects.link(lamp)
lamp.location=rig.matrix_world@Vector((.247,-.714,1.21));r3.aim(lamp,target)
n=data.node_tree.nodes;n.clear();l=data.node_tree.links
coord=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');l.new(coord.outputs['Normal'],sep.inputs[0])
xx=mathnode(n,l,'MULTIPLY',sep.outputs['X'],sep.outputs['X']);yy=mathnode(n,l,'MULTIPLY',sep.outputs['Y'],sep.outputs['Y'])
rho=mathnode(n,l,'SQRT',mathnode(n,l,'ADD',xx,yy));den=mathnode(n,l,'ABSOLUTE',sep.outputs['Z'])
angle=mathnode(n,l,'DIVIDE',rho,den)
radius=n.new('ShaderNodeValue');radius.name='Target angular radius';radius.outputs[0].default_value=.19
delta=mathnode(n,l,'ABSOLUTE',mathnode(n,l,'SUBTRACT',angle,radius.outputs[0]))
band=n.new('ShaderNodeMapRange');band.clamp=True;band.interpolation_type='SMOOTHERSTEP';band.inputs['From Min'].default_value=.002;band.inputs['From Max'].default_value=.005;band.inputs['To Min'].default_value=1;band.inputs['To Max'].default_value=0;l.new(delta,band.inputs['Value'])
emission=n.new('ShaderNodeEmission');emission.inputs['Color'].default_value=(.015,1,.065,1);l.new(band.outputs[0],emission.inputs['Strength'])
out=n.new('ShaderNodeOutputLight');l.new(emission.outputs[0],out.inputs['Surface'])

filldata=bpy.data.lights.new('R3 diffuse illumination','SPOT');filldata.energy=0;filldata.color=(.80,.93,1);filldata.spot_size=math.radians(60);filldata.spot_blend=.7;filldata.shadow_soft_size=.025
fill=bpy.data.objects.new('R3 diffuse illumination',filldata);bpy.context.collection.objects.link(fill);fill.location=lamp.location;r3.aim(fill,target)
for ob in bpy.data.objects:
    if ob.type=='LIGHT' and ob not in [lamp,fill]:ob.data.energy*=.20
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.025
scene.camera.location=(5,-7.5,5.2);r3.aim(scene.camera,(-.1,-.35,-.30));scene.camera.data.ortho_scale=7.8;scene.camera.data.shift_x=-.15
scene.camera.data.dof.use_dof=False
scene.render.resolution_x=1600;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.quality=91
scene.cycles.samples=80;scene.cycles.adaptive_threshold=.025;scene.cycles.denoiser='OPTIX';scene.render.use_persistent_data=True
dest=ROOT.parent/'site'/'assets'/'r3-projection';dest.mkdir(parents=True,exist_ok=True)
mode=sys.argv[-1]
if mode=='test':
    scene.render.image_settings.file_format='PNG';scene.cycles.samples=48
    scene.render.filepath=str(ROOT/'renders'/'r3-projection-test.png');bpy.ops.render.render(write_still=True)
else:
    for i in range(25):
        radius.outputs[0].default_value=.095+(.19-.095)*(i/24)
        r3.GROUPS['bezel'].rotation_euler.z=(i/24)*1.1
        scene.render.filepath=str(dest/f'{i:03d}.webp');bpy.ops.render.render(write_still=True)
        print(f'PROJECTION {i+1}/25',flush=True)
    data.energy=0
    scene.render.filepath=str(dest/'off.webp');bpy.ops.render.render(write_still=True)
    filldata.energy=420
    scene.render.filepath=str(dest/'illumination.webp');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'infinity-r3-projection.blend'))
print('PROJECTION_DONE',flush=True)
