# GLB önizleme: blender -b --python tools/glb_onizle.py -- <girdi.glb> <cikti.png> [aci_derece]
import bpy, sys, math
from mathutils import Vector
A = sys.argv[sys.argv.index('--') + 1:]
GIRDI, CIKTI = A[0], A[1]
ACI = math.radians(float(A[2])) if len(A) > 2 else math.radians(25)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GIRDI)
ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
ps = [o.matrix_world @ Vector(c) for o in ms for c in o.bound_box]
mn = Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps)))
mx = Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))
mer, boy = (mn + mx) / 2, max(mx - mn)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.collection.objects.link(cam)
d = boy * 2.2
cam.location = mer + Vector((math.sin(ACI) * d, -math.cos(ACI) * d, boy * 0.25))
cam.rotation_euler = (mer - cam.location).to_track_quat('-Z', 'Y').to_euler()
for r, e in ((( 0.9, 0, 0.6), 4), ((-0.5, 0, -2.4), 2)):
    l = bpy.data.objects.new('l', bpy.data.lights.new('l', 'SUN')); l.data.energy = e; l.rotation_euler = r
    bpy.context.collection.objects.link(l)
w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.color = (0.75, 0.75, 0.72)
s = bpy.context.scene; s.camera = cam
s.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE_NEXT'
s.render.resolution_x = s.render.resolution_y = 768
s.render.filepath = CIKTI
bpy.ops.render.render(write_still=True)
tri = sum(len(p.vertices) - 2 for o in ms for p in o.data.polygons)
print('ONIZLEME', CIKTI, 'ucgen', tri, 'boyut', tuple(round(x, 2) for x in (mx - mn)))
