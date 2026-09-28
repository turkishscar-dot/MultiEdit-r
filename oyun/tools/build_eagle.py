# Kara Kuş / kartal modeli (karakus.glb). Blender'ın Python modülüyle çalışır: pip install bpy; python3 tools/build_eagle.py
# Eski modelin düğüm adları, yönü ve kanat menteşeleri korunur (oyun kodu değişmeden kullanır):
#   Body, Wing_L, Wing_R; baş -Y (glTF +Z) yönünde; kanatlar gövdenin uzun ekseni etrafında çırpılır.
# Kanatlar düz levha değil: kalınlığı olan kol bölümü, altın örtü tüyleri bandı, arka kenarda ikincil tüyler ve
# ucunda parmak gibi açılan yedi birincil tüy. Gövde: göğüs, altın ense, kaş çıkıntısı, çengel gaga, sarı pençeler, yelpaze kuyruk.
import math
import bpy
import bmesh
from mathutils import Vector, Matrix

OUT = __file__.rsplit('/', 2)[0] + '/src/assets/karakus.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, rough=0.8):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Roughness'].default_value = rough
    return m

M = {
    'plume': mat('M_Plumage', (0.045, 0.035, 0.03)),
    'plume2': mat('M_Plumage2', (0.11, 0.075, 0.05)),
    'nape': mat('M_Nape', (0.62, 0.40, 0.13)),
    'beak': mat('M_Beak', (0.86, 0.70, 0.22)),
    'tip': mat('M_BeakTip', (0.12, 0.11, 0.1)),
    'leg': mat('M_Leg', (0.88, 0.66, 0.16)),
    'iris': mat('M_Iris', (0.95, 0.55, 0.05)),
    'pupil': mat('M_Pupil', (0.01, 0.01, 0.01)),
}

def obj(o, m, smooth=True, sub=0):
    o.data.materials.append(M[m])
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
    if sub:
        md = o.modifiers.new('sub', 'SUBSURF'); md.levels = sub; md.render_levels = sub
    return o

def sphere(name, loc, scale, m, rot=(0, 0, 0), seg=16, ring=10, sub=0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    return obj(o, m, sub=sub)

def cone(name, loc, r1, r2, depth, m, rot=(0, 0, 0), v=10):
    bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    return obj(o, m)

def apply_all(o):
    bpy.ops.object.select_all(action='DESELECT')
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)

def join(objs, name):
    for o in objs: apply_all(o)
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.object; o.name = name
    return o

def slab(name, pts, thick, m, z=0.0):
    """XY düzleminde çokgen, kalınlıklı (kanat bölümü)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for x, y in pts]
    f = bm.faces.new(vs)
    bmesh.ops.triangulate(bm, faces=[f])
    r = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    for v in [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]: v.co.z += thick
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return obj(o, m, smooth=False)

def feather(name, root, length, width, angle, m, lift=0.0, thick=0.022):
    """Uzun, ucu yuvarlak tüy: kökü `root`ta, XY düzleminde `angle` yönünde (x dışarı)."""
    a = math.radians(angle)
    mid = Vector(root) + Vector((math.cos(a), math.sin(a), 0)) * (length / 2)
    mid.z += lift
    o = sphere(name, mid, (length / 2, width / 2, thick), m, rot=(0, -lift * 0.8, a), seg=12, ring=6)
    return o

# ---------------- GÖVDE ----------------
parts = []
parts.append(sphere('torso', (0, -0.08, 0), (0.31, 0.55, 0.3), 'plume', sub=1))
parts.append(sphere('rump', (0, 0.36, 0.02), (0.2, 0.42, 0.17), 'plume', sub=1))  # gövde kuyruğa doğru incelir
parts.append(sphere('chest', (0, -0.42, -0.04), (0.29, 0.40, 0.30), 'plume2', sub=1))
parts.append(sphere('neck', (0, -0.72, 0.1), (0.2, 0.24, 0.21), 'nape', sub=1))
parts.append(sphere('head', (0, -0.9, 0.2), (0.17, 0.2, 0.17), 'nape', sub=1))
parts.append(sphere('crown', (0, -0.86, 0.3), (0.13, 0.16, 0.07), 'plume2', sub=1))
# kaş çıkıntısı: kartalın sert bakışı
for s in (-1, 1):
    parts.append(sphere('eye', (s * 0.118, -0.98, 0.215), (0.05, 0.05, 0.05), 'iris', seg=12, ring=8))
    parts.append(sphere('pupil', (s * 0.148, -0.995, 0.215), (0.026, 0.026, 0.026), 'pupil', seg=8, ring=6))
    parts.append(sphere('brow', (s * 0.1, -0.985, 0.275), (0.075, 0.06, 0.022), 'plume', rot=(-0.35, 0, s * -0.25)))
# gaga: sarı kök (ağız), üstte kanca: bükülmüş koni
parts.append(sphere('cere', (0, -1.05, 0.19), (0.085, 0.08, 0.07), 'beak'))
parts.append(sphere('beak', (0, -1.13, 0.175), (0.06, 0.1, 0.065), 'beak'))
parts.append(sphere('jaw', (0, -1.1, 0.13), (0.05, 0.08, 0.03), 'beak'))
parts.append(cone('hook', (0, -1.215, 0.13), 0.04, 0.006, 0.12, 'tip', rot=(math.radians(145), 0, 0), v=10))
# kuyruk: yedi tüylük yelpaze
for i in range(7):
    a = 90 + (i - 3) * 9  # +Y geriye
    parts.append(feather('tail', (0, 0.62, 0.03), 0.78, 0.15, a, 'plume2' if i % 2 else 'plume', lift=-0.02))
parts.append(sphere('tailbase', (0, 0.72, 0.02), (0.16, 0.18, 0.08), 'plume'))
# bacaklar ve pençeler (uçuşta geriye, gövdenin altında)
for s in (-1, 1):
    parts.append(sphere('thigh', (s * 0.14, 0.12, -0.2), (0.11, 0.18, 0.12), 'plume2'))
    parts.append(cone('leg', (s * 0.12, 0.34, -0.27), 0.035, 0.03, 0.16, 'leg', rot=(math.radians(-75), 0, 0), v=8))
    for k, dx in enumerate((-0.035, 0, 0.035)):
        parts.append(cone('talon', (s * 0.12 + dx, 0.43, -0.3), 0.014, 0.002, 0.09, 'tip', rot=(math.radians(-110), 0, dx * 3), v=6))
body = join(parts, 'Body')

# ---------------- KANAT (sağ: +x) ----------------
def wing(name, side):
    ps = []
    # kol ve el kemiği: kanadın kalın ön kenarı
    ps.append(sphere('arm', (0.52, -0.2, 0.0), (0.56, 0.085, 0.055), 'plume2', seg=14, ring=8))
    ps.append(sphere('hand', (1.08, -0.17, 0.0), (0.22, 0.07, 0.04), 'plume2', seg=12, ring=6))
    # küçük örtü tüyleri (altın), orta örtü tüyleri, ikincil tüyler: üst üste binen üç sıra
    for i in range(8):
        ps.append(feather('lesser', (0.04 + i * 0.12, -0.2, 0.035), 0.22, 0.16, 90 - i * 1.5, 'nape', lift=0.0, thick=0.03))
    for i in range(9):
        ps.append(feather('median', (0.03 + i * 0.12, -0.08, 0.02), 0.3, 0.15, 90 - i * 2, 'plume2', lift=0.0, thick=0.026))
    for i in range(10):
        ps.append(feather('sec', (0.02 + i * 0.112, 0.05, 0.0), 0.42, 0.15, 92 - i * 2.8, 'plume', lift=0.0))
    for i in range(7):  # birincil tüyler: bilekten parmak gibi açılır
        ang = -16 + i * 13
        ln = 0.66 + math.sin(i / 6 * math.pi) * 0.2
        ps.append(feather('prim', (1.05, -0.2 + i * 0.06, 0.0), ln, 0.11, ang, 'plume', lift=0.008 * i))
    w = join(ps, name)
    w.rotation_euler = (0, math.radians(-6), 0)  # hafif yukarı açı (dihedral)
    apply_all(w)
    if side < 0:
        w.scale.x = -1
        apply_all(w)
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT')
    w.location = (side * 0.22, -0.1, 0.08)
    return w

wr = wing('Wing_R', 1)
wl = wing('Wing_L', -1)

# yumuşak gölgelendirme
for o in (body, wl, wr):
    for p in o.data.polygons: p.use_smooth = True
    print(o.name, 'üçgen:', sum(len(p.vertices) - 2 for p in o.data.polygons))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_animations=False, export_yup=True)
print('yazıldı:', OUT)
