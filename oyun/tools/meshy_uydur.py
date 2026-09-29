# Meshy modelini oyunun iskeletine oturtur (Oğuz gövdesinin kemik ağırlıklarını aktarır): 119 ortak animasyon kendiliğinden çalışır.
#   python3 tools/meshy_uydur.py <meshy.glb> <cikti.glb> [ucgen=30000]
# Meshy modeli T-pozunda, ayakları yerde ve Oğuz'la yaklaşık aynı yönde olmalı (ön -Y). Ölçek kol açıklığından bulunur.
import bpy, os, sys
from mathutils import Vector

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GIRDI, CIKTI = sys.argv[1], sys.argv[2]
HEDEF = int(sys.argv[3]) if len(sys.argv) > 3 else 30000

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(KOK, 'src', 'assets', 'oguz.glb'))
ARM = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
ARM.data.pose_position = 'REST'
bpy.context.view_layer.update()
KAYNAK_AD = ['Kaftan', 'Trousers', 'Collar', 'Boots', 'SuperHero_Male']
kaynak = [bpy.data.objects[a] for a in KAYNAK_AD]


def dunya_kutu(objs):
    ps = []
    for o in objs:
        ps += [o.matrix_world @ Vector(c) for c in o.bound_box]
    return Vector((min(p.x for p in ps), min(p.y for p in ps), min(p.z for p in ps))), Vector((max(p.x for p in ps), max(p.y for p in ps), max(p.z for p in ps)))


og_min, og_max = dunya_kutu(kaynak)
onceki = set(bpy.context.scene.objects)
bpy.ops.import_scene.gltf(filepath=GIRDI)
yeniler = [o for o in bpy.context.scene.objects if o not in onceki and o.type == 'MESH']
bpy.ops.object.select_all(action='DESELECT')
for o in yeniler:
    o.select_set(True)
bpy.context.view_layer.objects.active = yeniler[0]
if len(yeniler) > 1:
    bpy.ops.object.join()
yeni = bpy.context.view_layer.objects.active
w = yeni.matrix_world.copy(); yeni.parent = None; yeni.matrix_world = w
for o in list(bpy.context.scene.objects):  # Meshy'nin boş üst düğümleri
    if o.type == 'EMPTY' and o not in onceki: bpy.data.objects.remove(o)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
yeni.name = 'Govde_Meshy'

# sadeleştir
n0 = sum(len(p.vertices) - 2 for p in yeni.data.polygons)
if n0 > HEDEF:
    m = yeni.modifiers.new('dec', 'DECIMATE'); m.ratio = HEDEF / n0
    bpy.ops.object.modifier_apply(modifier='dec')
print('üçgen', n0, '->', sum(len(p.vertices) - 2 for p in yeni.data.polygons))

# ölçek: kol açıklığı; konum: ayaklar zeminde, x/y merkezi gövdeyle aynı
y_min, y_max = dunya_kutu([yeni])
k = (og_max.x - og_min.x) / (y_max.x - y_min.x)
yeni.scale = (k, k, k); bpy.ops.object.transform_apply(scale=True)
y_min, y_max = dunya_kutu([yeni])
yeni.location += Vector(((og_min.x + og_max.x) / 2 - (y_min.x + y_max.x) / 2, (og_min.y + og_max.y) / 2 - (y_min.y + y_max.y) / 2, og_min.z - y_min.z))
bpy.ops.object.transform_apply(location=True)
y_min, y_max = dunya_kutu([yeni])
print('ölçek', round(k, 3), 'oğuz boy', round(og_max.z - og_min.z, 3), 'yeni boy', round(y_max.z - y_min.z, 3))

# ağırlık aktarımı (Oğuz gövdesinin kemik ağırlıkları, en yakın yüzeyden)
kopya = []
for s in kaynak:
    c = s.copy(); c.data = s.data.copy(); bpy.context.collection.objects.link(c)
    c.modifiers.clear(); c.parent = None; c.matrix_world = s.matrix_world; kopya.append(c)
bpy.ops.object.select_all(action='DESELECT')
for c in kopya:
    c.select_set(True)
bpy.context.view_layer.objects.active = kopya[0]; bpy.ops.object.join()
src = bpy.context.view_layer.objects.active; src.name = '_agirlik'
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.select_all(action='DESELECT'); yeni.select_set(True); bpy.context.view_layer.objects.active = yeni
dt = yeni.modifiers.new('dt', 'DATA_TRANSFER'); dt.object = src; dt.use_vert_data = True
dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
bpy.ops.object.datalayout_transfer(modifier='dt'); bpy.ops.object.modifier_apply(modifier='dt')
def agirlik_yumusat(o, tekrar, f=0.5):  # dağınık ağırlıklar komşu köşelerle ortalanır
    import numpy as np
    n = len(o.data.vertices); gl = list(o.vertex_groups); W = np.zeros((n, len(gl)), dtype=np.float32)
    for v in o.data.vertices:
        for g in v.groups: W[v.index, g.group] = g.weight
    e = np.array([(ed.vertices[0], ed.vertices[1]) for ed in o.data.edges]); deg = np.bincount(e.ravel(), minlength=n).astype(np.float32)
    for _ in range(tekrar):
        S = np.zeros_like(W); np.add.at(S, e[:, 0], W[e[:, 1]]); np.add.at(S, e[:, 1], W[e[:, 0]])
        W = (1 - f) * W + f * S / np.maximum(deg, 1)[:, None]
    for i in range(n):  # en güçlü 4 kemik kalsın (glTF sınırı)
        idx = np.argsort(-W[i])[:4]; w = W[i][idx]; t = w.sum()
        for g in gl: g.remove([i]) if g.index in [] else None
    for g in gl: g.add(list(range(n)), 0.0, 'REPLACE')
    for i in range(n):
        idx = np.argsort(-W[i])[:4]; w = W[i][idx]; t = float(w.sum()) or 1.0
        for j, x in zip(idx, w):
            if x > 1e-4: gl[j].add([i], float(x) / t, 'REPLACE')
agirlik_yumusat(yeni, int(os.environ.get('YUMUSAT', 12)))
bpy.ops.object.vertex_group_normalize_all(lock_active=False)
yeni.parent = ARM; yeni.matrix_parent_inverse = ARM.matrix_world.inverted()
am = yeni.modifiers.new('arm', 'ARMATURE'); am.object = ARM
for p in yeni.data.polygons: p.use_smooth = True

# yalnız iskelet + yeni gövde kalsın
for o in list(bpy.context.scene.objects):
    if o is not ARM and o is not yeni:
        bpy.data.objects.remove(o)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=CIKTI, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_apply=False)
print('yazıldı', CIKTI, os.path.getsize(CIKTI) // 1024, 'KB')
