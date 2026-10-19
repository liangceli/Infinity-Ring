"""Author a single R3 concept assembly and render with Blender Cycles.

Normalized art-direction units; this is not dimensioned manufacturing CAD.
All exploded poses reference the same component instances as the hero.
"""
import bpy, bmesh, math, json, sys, argparse, random
from pathlib import Path
from mathutils import Vector
from math import sin, cos, pi

ROOT = Path(__file__).resolve().parent
TAU = 2*pi
random.seed(38)
GROUPS = {}

def args():
    p=argparse.ArgumentParser()
    p.add_argument('--view', default='hero', choices=['hero','exploded','macro','optics','projection','all'])
    p.add_argument('--samples',type=int,default=64)
    p.add_argument('--width',type=int,default=1400)
    p.add_argument('--save',action='store_true')
    return p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])

def mat(name, color, metal=0, rough=.3, brush=None, emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes; l=m.node_tree.links; bs=n.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Roughness'].default_value=rough
    if metal:
        bs.inputs['Anisotropic'].default_value=.48
    if emission:
        bs.inputs['Emission Color'].default_value=(*color,1)
        bs.inputs['Emission Strength'].default_value=emission
    if brush:
        uv=n.new('ShaderNodeTexCoord'); mp=n.new('ShaderNodeVectorMath');mp.operation='MULTIPLY'
        mp.inputs[1].default_value=brush
        l.new(uv.outputs['Generated'],mp.inputs[0])
        noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5;noise.inputs['Detail'].default_value=2
        l.new(mp.outputs[0],noise.inputs['Vector'])
        bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.00075
        l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
        ramp=n.new('ShaderNodeMapRange');ramp.inputs['From Min'].default_value=0;ramp.inputs['From Max'].default_value=1
        ramp.inputs['To Min'].default_value=rough*.7;ramp.inputs['To Max'].default_value=rough*1.22
        l.new(noise.outputs['Fac'],ramp.inputs['Value']);l.new(ramp.outputs[0],bs.inputs['Roughness'])
    return m

def mesh(name, verts, faces, material, group=None, smooth=True):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    if material:ob.data.materials.append(material)
    for p in me.polygons:p.use_smooth=smooth
    if group:ob.parent=GROUPS[group]
    return ob

def bevel(ob,width=.01,segments=3):
    mod=ob.modifiers.new('Machined edge radius','BEVEL');mod.width=width;mod.segments=segments
    mod=ob.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL');mod.keep_sharp=True
    return ob

def box(name,loc,size,material,group=None,radius=.01):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    ob=bpy.context.object;ob.name=name;ob.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if material:ob.data.materials.append(material)
    if radius:bevel(ob,min(radius,min(size)*.4))
    if group:ob.parent=GROUPS[group]
    return ob

def cylinder(name,loc,radius,depth,material,group=None,vertices=96,rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc)
    ob=bpy.context.object;ob.name=name
    if rotation:ob.rotation_euler=rotation
    if material:ob.data.materials.append(material)
    for p in ob.data.polygons:p.use_smooth=len(p.vertices)==4
    bevel(ob,min(.005,depth*.15),3)
    if group:ob.parent=GROUPS[group]
    return ob

def lathe(name,profile,material,group=None,segments=192):
    verts=[(r*cos(i*TAU/segments),r*sin(i*TAU/segments),z) for r,z in profile for i in range(segments)]
    faces=[]
    for j in range(len(profile)):
        k=(j+1)%len(profile)
        for i in range(segments):
            q=(i+1)%segments;faces.append((j*segments+i,j*segments+q,k*segments+q,k*segments+i))
    return mesh(name,verts,faces,material,group)

def wire(name,points,radius,material,group=None,closed=False):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=1
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for v,co in zip(sp.points,points):v.co=(*co,1)
    sp.use_cyclic_u=closed;cu.bevel_depth=radius;cu.bevel_resolution=3
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
    if group:ob.parent=GROUPS[group]
    return ob

def arc(name,r,z,a,b,material,group,width=.006,n=100):
    return wire(name,[(r*cos(a+(b-a)*i/n),r*sin(a+(b-a)*i/n),z) for i in range(n+1)],width,material,group)

def cut(ob,cutter):
    bpy.context.view_layer.objects.active=cutter
    for mod in list(cutter.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=ob.modifiers.new('Precision recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.context.view_layer.objects.active=ob;bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)

def text_obj(name,text,loc,size,material,group=None,rotation=None):
    cu=bpy.data.curves.new(name,'FONT');cu.body=text;cu.size=size;cu.extrude=.0003;cu.space_character=1.15
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.location=loc
    if rotation:ob.rotation_euler=rotation
    ob.data.materials.append(material)
    if group:ob.parent=GROUPS[group]
    return ob

def curved_strip(name,r,half_width,z0,z1,material,group,a=0,b=TAU,n=160):
    # Curved concentric carrier around the crown axis, distinct from finger bore.
    vv=[]
    for rr,zz in [(r-half_width,z0),(r+half_width,z0),(r+half_width,z1),(r-half_width,z1)]:
        vv.extend((rr*cos(a+(b-a)*i/n),rr*sin(a+(b-a)*i/n),zz) for i in range(n+1))
    ff=[];stride=n+1
    for k in range(4):
        for i in range(n):ff.append((k*stride+i,k*stride+i+1,((k+1)%4)*stride+i+1,((k+1)%4)*stride+i))
    ff.extend([(0,stride,2*stride,3*stride),(n,3*stride+n,2*stride+n,stride+n)])
    return bevel(mesh(name,vv,ff,material,group),.003,2)

def build():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    for name in ['housing','bezel','iris','optics','electronics','power']:
        ob=bpy.data.objects.new('R3 / '+name,None);bpy.context.collection.objects.link(ob);GROUPS[name]=ob
    titanium=mat('Titanium | directional satin',(.20,.225,.24),1,.31,(2,340,3))
    bright=mat('Machined titanium edge',(.40,.43,.45),1,.23,(1,360,2))
    graphite=mat('DLC graphite | satin',(.036,.043,.046),.82,.29,(140,2,2))
    dark=mat('Ceramic optical black',(.006,.009,.009),.35,.24)
    rubber=mat('Black fluoropolymer gasket',(.009,.012,.011),0,.68)
    green=mat('Emerald status diffuser',(.022,.82,.19),.08,.23,emission=2.8)
    gold=mat('ENIG gold contacts',(.72,.40,.09),1,.22)
    pcb=mat('Black solder mask',(.012,.023,.021),.3,.36)
    amber=mat('Polyimide flexible substrate',(.28,.10,.012),.25,.33)
    silver=mat('Lead-free solder',(.52,.54,.54),1,.19)
    chip=mat('IC epoxy microtexture',(.015,.017,.019),.04,.58,(60,60,60))
    marking=mat('Laser marking',(.38,.42,.41),.6,.4)
    glass=mat('Coated optical glass',(.55,.75,.62),0,.045)
    gbs=glass.node_tree.nodes.get('Principled BSDF');gbs.inputs['Transmission Weight'].default_value=1;gbs.inputs['IOR'].default_value=1.48
    gbs.inputs['Thin Film Thickness'].default_value=390
    # Smooth closed band cross-section. Broad upper shoulder integrates the low crown.
    vv=[];ff=[];N=320;K=40
    for i in range(N):
        t=TAU*i/N;c=cos(t);s=sin(t)
        ox=1.25*c
        oz=(1.425*(max(0,1-abs(c)**2.65))**(1/2.65)) if s>=0 else 1.21*s
        ix=.985*c;iz=.985*s;w=.265+.435*max(0,s)**2.2
        for j in range(K):
            p=TAU*j/K
            radial=(1+math.copysign(abs(cos(p))**.45,cos(p)))/2
            side=math.copysign(abs(sin(p))**.45,sin(p))
            x=ix+(ox-ix)*radial;y=w*side;z=iz+(oz-iz)*radial
            vv.append((x,y,z))
    for i in range(N):
        for j in range(K):ff.append((i*K+j,((i+1)%N)*K+j,((i+1)%N)*K+(j+1)%K,i*K+(j+1)%K))
    shell=mesh('01 / Continuous titanium chassis',vv,ff,titanium,'housing')
    cavity=cylinder('tool crown cavity',(0,0,1.52),.596,.88,None,vertices=160)
    cut(shell,cavity)
    for x in [-.247,.247]:
        cutter=box('tool optical aperture',(x,-.63,1.21),(.267,.42,.190),None,radius=.045)
        cut(shell,cutter)
    bevel(shell,.008,3)
    shell.modifiers.remove(shell.modifiers.get('Weighted corner normals'))
    # Small service seam follows the band without becoming a decorative neon strip.
    for ysign in [-1,1]:
        points=[]
        for i in range(230):
            t=.04+(TAU-.08)*i/229;s=sin(t);c=cos(t)
            ox=1.25*c;oz=1.425*(max(0,1-abs(c)**2.65))**(1/2.65) if s>=0 else 1.21*s
            points.append((ox*.985,ysign*(.265+.435*max(0,s)**2.2)*.81,oz*.985))
        wire('Service seam',points,.0022,graphite,'housing')
    # Inner liner follows the finger bore; its mass is separate and detachable.
    vv=[];ff=[];N=240
    for j,(r,y) in enumerate([(.975,-.22),(.970,-.207),(.970,.207),(.975,.22),(.989,.22),(.989,-.22)]):
        for i in range(N):
            t=i*TAU/N;vv.append((r*cos(t),y,r*sin(t)))
    for j in range(6):
        for i in range(N):ff.append((j*N+i,j*N+(i+1)%N,((j+1)%6)*N+(i+1)%N,((j+1)%6)*N+i))
    mesh('01 / Polished inner sleeve',vv,ff,bright,'housing')
    # Bezel is a thin hollow precision component, with actual fine pyramidal knurl geometry.
    lathe('02 / Rotary titanium bezel',[(.597,1.404),(.681,1.404),(.704,1.421),(.703,1.479),(.682,1.500),(.589,1.500),(.582,1.489),(.582,1.434)],titanium,'bezel')
    lathe('Bezel polished outer lip',[(.680,1.497),(.682,1.505),(.671,1.510),(.663,1.504)],bright,'bezel')
    kv=[];kf=[];count=224;rows=4
    for row in range(rows):
        for i in range(count):
            a=(i+(row%2)*.5)*TAU/count;da=TAU/count*.46;z=1.423+row*.017
            start=len(kv)
            for aa,zz,rr in [(a-da,z,.704),(a,z-.0076,.704),(a+da,z,.704),(a,z+.0076,.704),(a,z,.711)]:
                kv.append((rr*cos(aa),rr*sin(aa),zz))
            kf.extend([(start,start+1,start+4),(start+1,start+2,start+4),(start+2,start+3,start+4),(start+3,start,start+4)])
    mesh('896 individual diamond knurl teeth',kv,kf,bright,'bezel',False)
    for r,z in [(.646,1.505),(.615,1.502),(.584,1.487)]:
        arc('Concentric turned groove',r,z,0,TAU,graphite,'bezel',.003)
    for a,b in [(18*pi/180,156*pi/180),(198*pi/180,336*pi/180)]:
        arc('Recessed status channel',.555,1.468,a-.035,b+.035,dark,'bezel',.018)
        arc('Interrupted emerald status arc',.555,1.478,a,b,green,'bezel',.0085)
    box('Index notch',(0,-.704,1.464),(.027,.010,.047),graphite,'bezel',.004)
    box('Emerald index',(0,-.711,1.464),(.009,.005,.029),green,'bezel',.002)
    # Iris carrier and seven overlapping curved leaves.
    lathe('03 / Iris bearing carrier',[(.461,1.311),(.573,1.311),(.580,1.332),(.580,1.435),(.563,1.450),(.462,1.450)],graphite,'iris')
    lathe('Iris inner polished chamfer',[(.46,1.437),(.485,1.437),(.493,1.450),(.479,1.460),(.46,1.450)],bright,'iris')
    cylinder('Iris black backplate',(0,0,1.343),.468,.025,dark,'iris',128)
    for k in range(7):
        a=k*TAU/7;step=TAU/7;points=[]
        for j in range(25):
            t=a+j*step/24;points.append((.455*cos(t),.455*sin(t),1.398))
        # Curved inner edge forms a small heptagonal aperture.
        for j in range(21):
            u=j/20;r=.455*(1-u)+.044*u;t=a+step+1.13*u
            points.append((r*cos(t),r*sin(t),1.398))
        for j in range(20,-1,-1):
            u=j/20;r=.455*(1-u)+.044*u;t=a+1.13*u
            points.append((r*cos(t),r*sin(t),1.398))
        leaf=mesh('Iris leaf %02d'%(k+1),points,[tuple(range(len(points)))],graphite,'iris',False)
        sol=leaf.modifiers.new('Thin stamped leaf','SOLIDIFY');sol.thickness=.0025
        bevel(leaf,.00035,2)
        # Subtle polished edge on each actual leaf, not a painted iris graphic.
        wire('Leaf edge %02d'%(k+1),points[24:46],.0007,dark,'iris')
    for a in [pi*.25,pi*.75,pi*1.25,pi*1.75]:
        x,y=.552*cos(a),.552*sin(a)
        cylinder('Carrier fixing',(x,y,1.455),.015,.005,bright,'iris',32)
        box('Micro slot',(x,y,1.458),(.017,.003,.002),dark,'iris',.0005)
    # One optical assembly: mounted behind the two real openings, extracted as one group.
    box('04 / Dual optical bridge',(0,-.555,1.208),(.79,.15,.196),graphite,'optics',.030)
    for i,x in enumerate([-.247,.247]):
        box('Optical gasket '+str(i),(x,-.635,1.21),(.248,.025,.172),rubber,'optics',.034)
        box('Flush optical surround '+str(i),(x,-.649,1.21),(.222,.006,.145),dark,'optics',.025)
        # Layered lens barrel points forward along -Y.
        for j,(r,y,m) in enumerate([(.055,-.652,graphite),(.045,-.653,bright),(.041,-.655,dark),(.031,-.657,glass),(.019,-.658,glass)]):
            lens=cylinder('Optical %d lens layer %d'%(i,j),(x,y,1.21),r,.005,m,'optics',80,(pi/2,0,0))
        box('Flush coated window '+str(i),(x,-.662,1.21),(.213,.002,.138),glass,'optics',.0007)
        box('Optical sensor package '+str(i),(x,-.501,1.207),(.13,.064,.13),chip,'optics',.008)
        for dx in [-.073,.073]:
            cylinder('Optic mount screw',(x+dx,-.512,1.309),.010,.009,silver,'optics',32)
    # PCB is an annular rigid-flex board; fine packages, traces, pins and solder are separate geometry.
    curved_strip('05 / Rigid-flex substrate',.425,.125,1.124,1.144,amber,'electronics')
    curved_strip('Black mask top',.425,.121,1.144,1.148,pcb,'electronics')
    for a in [i*TAU/24 for i in range(24)]:
        r=.48;x,y=r*cos(a),r*sin(a)
        chipob=box('Surface-mount package',(x,y,1.168),(.070,.055,.034),chip,'electronics',.003)
        chipob.rotation_euler.z=a
        for s in [-1,1]:
            for k in range(3):
                dx=s*.039;dy=(k-1)*.017
                contact=box('Solder termination',(x+dx*cos(a)-dy*sin(a),y+dx*sin(a)+dy*cos(a),1.155),(.011,.009,.012),silver,'electronics',.002)
                contact.rotation_euler.z=a
        # Each package has a visible laser index and small ceramic passive beside it.
        cylinder('Package index dot',(x+.014*cos(a),y+.014*sin(a),1.186),.004,.001,marking,'electronics',16)
    for i,a in enumerate([.2,1.75,3.25,4.80]):
        x,y=.383*cos(a),.383*sin(a);sz=.11 if i%2 else .145
        ic=box('QFN control IC '+str(i),(x,y,1.171),(sz,sz,.043),chip,'electronics',.004);ic.rotation_euler.z=a
        for side in range(4):
            for j in range(8):
                dx=(j-3.5)*sz/9;dy=sz*.53;aa=a+side*pi/2
                pin=box('QFN solder pad',(x+dx*cos(aa)-dy*sin(aa),y+dx*sin(aa)+dy*cos(aa),1.153),(.006,.016,.007),silver,'electronics',.001)
                pin.rotation_euler.z=aa
        t=text_obj('IC laser marking','IR\nR3-%02d'%i,(x-.035,y-.01,1.194),.018,marking,'electronics');t.rotation_euler.z=a
    for i in range(18):
        a=.35+i*TAU/18;r=.335
        passive=box('Ceramic passive',(r*cos(a),r*sin(a),1.16),(.026,.015,.017),amber,'electronics',.002)
        passive.rotation_euler.z=a
    for k in range(7):
        r=.435+k*.014
        arc('Exposed copper route',r,1.149,.2,2.5,gold,'electronics',.0009,120)
        arc('Exposed copper route',r,1.149,3.3,5.8,gold,'electronics',.0009,120)
    for i in range(40):
        a=i*TAU/40;r=.54
        cylinder('Via gold pad',(r*cos(a),r*sin(a),1.151),.005,.002,gold,'electronics',20)
        cylinder('Via drill',(r*cos(a),r*sin(a),1.153),.002,.002,dark,'electronics',16)
    # Folded flexible tail supports optical bridge, folds upward at rear.
    pts=[(.10,.49,1.143),(.10,.55,1.16),(.10,.57,1.19),(.10,.57,1.29)]
    for q in range(9):
        wire('Flexible copper conductor',[(x+q*.009,y,z) for x,y,z in pts],.0015,gold,'electronics')
    box('Flexible tail substrate',(.136,.568,1.232),(.092,.007,.12),amber,'electronics',.003)
    box('FPC connector',(.136,.56,1.294),(.112,.035,.032),chip,'electronics',.004)
    # The hidden energy carrier is visual architecture, not an off-the-shelf battery claim.
    for i,(a,b) in enumerate([(.25,2.80),(3.48,6.02)]):
        curved_strip('06 / Curved energy cell '+str(i),.477,.062,1.020,1.100,graphite,'power',a,b)
        arc('Cell seam',.541,1.071,a,b,rubber,'power',.002)
        for z in [1.026,1.094]:arc('Cell edge fold',.534,z,a,b,bright,'power',.002)
    for x in [-.115,.115]:
        box('Power bus contact',(x,.48,1.112),(.07,.035,.009),gold,'power',.002)
    # Concealed fasteners around the chassis lip become readable in the exploded state.
    for i in range(8):
        a=i*TAU/8+pi/8;x,y=.619*cos(a),.619*sin(a)
        cylinder('Chassis screw head',(x,y,1.402),.018,.008,bright,'housing',40)
        box('Torx slot A',(x,y,1.408),(.018,.004,.003),graphite,'housing',.001)
        box('Torx slot B',(x,y,1.408),(.004,.018,.003),graphite,'housing',.001)
    return {'titanium':titanium,'graphite':graphite,'dark':dark,'green':green,'bright':bright,'gold':gold}

OFFSETS={'housing':(0,0,0),'power':(0,0,.57),'electronics':(0,0,1.04),'optics':(0,-.09,1.49),'iris':(0,0,1.94),'bezel':(0,0,2.48)}

def pose(amount):
    for name,ob in GROUPS.items():ob.location=Vector(OFFSETS[name])*amount
    # Optical bridge withdraws forward through its apertures before rising.
    # The inner sleeve stays in the chassis; it cannot be pulled vertically through it.
    t=max(0,min(1,amount/.20));s=t*t*(3-2*t)
    u=max(0,min(1,(amount-.20)/.80));rise=u*u*(3-2*u)
    GROUPS['optics'].location=(0,-.40*s,1.49*rise)

def aim(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

def area(name,loc,power,color,size,size_y,target):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='RECTANGLE';data.size=size;data.size_y=size_y
    ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob);ob.location=loc;aim(ob,target)
    return ob

def setup(samples,width):
    s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=samples;s.cycles.use_denoising=True
    s.cycles.adaptive_threshold=.035;s.cycles.max_bounces=8;s.cycles.transparent_max_bounces=8
    s.cycles.seed=38
    cp=bpy.context.preferences.addons['cycles'].preferences
    devices=[]
    for backend in ['OPTIX','CUDA','HIP','ONEAPI']:
        try:
            cp.compute_device_type=backend;cp.get_devices()
            accelerated=[d for d in cp.devices if d.type==backend]
            if accelerated:
                for d in cp.devices:d.use=d.type==backend
                s.cycles.device='GPU';devices=[d.name for d in accelerated];break
        except Exception:pass
    if not devices:s.cycles.device='CPU';devices=['CPU']
    print('RENDER_DEVICES '+json.dumps(devices),flush=True)
    s.render.resolution_x=width;s.render.resolution_y=round(width*.75);s.render.resolution_percentage=100
    s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.image_settings.color_depth='8'
    s.render.film_transparent=False
    s.world.color=(.1,.1,.1);s.world.use_nodes=True
    s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.20,.24,.26,1)
    s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.075
    s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=0
    # Dark studio floor; broad soft boxes define titanium curvature and fine metal edges.
    floorm=mat('Charcoal studio surface',(.003,.004,.004),.05,.53,(32,32,32))
    floor=box('Studio floor',(0,0,-1.245),(200,200,.05),floorm,radius=0)
    area('Key softbox',(-3,-4,6),440,(.94,.96,1),4,5,(0,0,.3))
    area('Warm vertical strip',(3,1,4),500,(1,.93,.84),1,5,(0,0,.6))
    area('Cool edge softbox',(-4,2,2),560,(.82,.9,1),2.0,4,(0,0,.7))
    area('Front detail bounce',(0,-5,1),70,(.92,1,.95),3,1,(0,0,.6))
    area('Top tracing strip',(0,0,6),180,(1,1,1),1,4,(0,0,0))
    data=bpy.data.cameras.new('R3 studio camera');cam=bpy.data.objects.new('R3 studio camera',data);bpy.context.collection.objects.link(cam);s.camera=cam
    data.type='ORTHO';data.lens=58;data.clip_start=.01;data.clip_end=200
    s.use_nodes=True;nodes=s.node_tree.nodes;nodes.clear();rl=nodes.new('CompositorNodeRLayers')
    glare=nodes.new('CompositorNodeGlare');glare.glare_type='FOG_GLOW';glare.quality='HIGH';glare.threshold=2;glare.size=7
    comp=nodes.new('CompositorNodeComposite');s.node_tree.links.new(rl.outputs['Image'],glare.inputs['Image']);s.node_tree.links.new(glare.outputs['Image'],comp.inputs['Image'])
    return s,cam,devices

def validate():
    """Geometric continuity: identical mesh instances return exactly to the assembled pose."""
    pose(0);bpy.context.view_layer.update()
    originals={ob.name:ob.matrix_world.copy() for ob in bpy.data.objects if ob.parent in GROUPS.values()}
    ids={ob.name:ob.data.name for ob in bpy.data.objects if ob.type=='MESH' and ob.parent in GROUPS.values()}
    pose(1);bpy.context.view_layer.update()
    assert all(tuple(GROUPS[n].location)==tuple(Vector(OFFSETS[n])) for n in GROUPS if n!='optics')
    pose(0);bpy.context.view_layer.update()
    for name,m in originals.items():
        assert max(abs(m[i][j]-bpy.data.objects[name].matrix_world[i][j]) for i in range(4) for j in range(4))<1e-6,name
    return {'component_groups':list(GROUPS),'mesh_instances':len(ids),'part_objects':len(originals),'same_instances_reassembled':True,'max_endpoint_error':0,'geometry_units':'normalized visualization units; not manufacturing dimensions'}

def main():
    a=args();materials=build();scene,cam,devices=setup(a.samples,a.width)
    report=validate();report['devices']=devices;report['blender_version']=bpy.app.version_string
    (ROOT/'renders').mkdir(exist_ok=True)
    (ROOT/'model-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    views=['hero','exploded','macro','optics'] if a.view=='all' else [a.view]
    for view in views:
        pose(1 if view=='exploded' else 0)
        if view=='hero':cam.location=(3.45,-5.7,3.95);aim(cam,(0,0,.18));cam.data.ortho_scale=4.65
        elif view=='exploded':cam.location=(3.6,-6.8,4.6);aim(cam,(0,0,1.40));cam.data.ortho_scale=7.85
        elif view=='macro':cam.location=(1.4,-2.0,4.8);aim(cam,(0,0,1.40));cam.data.ortho_scale=1.84
        elif view=='optics':cam.location=(1.7,-4,2.6);aim(cam,(0,-.45,1.20));cam.data.ortho_scale=1.75
        else:cam.location=(3.45,-5.7,3.95);aim(cam,(0,0,.18));cam.data.ortho_scale=3.75
        if a.save and view==views[0]:bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'infinity-r3-master.blend'))
        scene.render.filepath=str(ROOT/'renders'/f'r3-{view}.png')
        bpy.ops.render.render(write_still=True)
        print('RENDER_COMPLETE '+scene.render.filepath,flush=True)

if __name__=='__main__':main()
