# Meshy'nin iskelet taktığı modeli (rigli.glb, tools/meshy_iskelet.py) T-pozuna çevirir: kol zincirleri (omuz -> dirsek -> bilek -> el) yataya,
# bacaklar dikeye döndürülür, avuç aşağı bakacak şekilde bilek burulur. Çıktı iskeletsiz, dokulu GLB: tools/meshy_uydur.py'nin girdisi.
#   blender -b --python tools/tpoz.py -- ai-kaynak/meshy/<id>/rigli.glb ai-kaynak/meshy/<id>/meshy_t.glb
import bpy, sys, numpy as np
from mathutils import Vector, Matrix
a = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
A = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
M = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == A][0]
for o in list(bpy.context.scene.objects):
    if o not in (A, M): bpy.data.objects.remove(o)
bpy.context.view_layer.objects.active = A; bpy.ops.object.mode_set(mode='POSE')
pb = A.pose.bones; W = A.matrix_world


def bas(n):  # kemiğin (pozlanmış) dünya konumu
    bpy.context.view_layer.update(); return W @ pb[n].head


def dondur(n, R):  # kemiği kendi başı etrafında dünya uzayında R kadar döndür (çocukları da döner)
    bpy.context.view_layer.update()
    h = pb[n].head.copy(); Ra = (W.inverted().to_3x3() @ R.to_matrix() @ W.to_3x3()).to_4x4()
    pb[n].matrix = Matrix.Translation(h) @ Ra @ Matrix.Translation(-h) @ pb[n].matrix


def el_ucu(n):  # elin ağırlıklı köşelerinin ortası (pozlanmış örgüden, dünya)
    g = M.vertex_groups.get(n)
    if g is None: return None
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); me = M.evaluated_get(dg).to_mesh()
    ps = [M.matrix_world @ me.vertices[v.index].co for v in M.data.vertices for x in v.groups if x.group == g.index and x.weight > 0.5]
    M.evaluated_get(dg).to_mesh_clear()
    return (sum(ps, Vector()) / len(ps), ps) if ps else None


for yan, sx in (('Left', 1), ('Right', -1)):
    hedef = Vector((sx, 0, 0))
    for k, c in ((f'{yan}Arm', f'{yan}ForeArm'), (f'{yan}ForeArm', f'{yan}Hand')):
        d = bas(c) - bas(k); dondur(k, d.normalized().rotation_difference(hedef))
    r = el_ucu(f'{yan}Hand')
    if r:  # el yataya, sonra avuç (elin en ince ekseni) dikey olsun
        uc, _ = r; dondur(f'{yan}Hand', (uc - bas(f'{yan}Hand')).normalized().rotation_difference(hedef))
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get(); me = M.evaluated_get(dg).to_mesh()
        g = M.vertex_groups[f'{yan}Hand'].index
        P = np.array([(M.matrix_world @ me.vertices[v.index].co)[:] for v in M.data.vertices for x in v.groups if x.group == g and x.weight > 0.5])
        M.evaluated_get(dg).to_mesh_clear()
        P = P - P.mean(0); n = np.linalg.svd(P, full_matrices=False)[2][2]; n = Vector(n); n.x = 0
        if n.length > 1e-6:
            n.normalize(); z = Vector((0, 0, 1 if n.z >= 0 else -1))
            dondur(f'{yan}Hand', n.rotation_difference(z))
    for k, c in ((f'{yan}UpLeg', f'{yan}Leg'),):  # bacak dik (diz kırık değilse etkisi küçük)
        d = bas(c) - bas(k); h = Vector((d.x, 0, d.z)).normalized()  # yalnız yana açıklığı düzelt, öne-arkaya dokunma
        dondur(k, d.normalized().rotation_difference(Vector((0.08 * sx, 0, -1)).normalized()) if abs(h.x) > 0.15 else d.normalized().rotation_difference(d.normalized()))
# eklem eşleme: model bölge bölge esnetilir, Meshy'nin bulduğu eklemler oyun iskeletinin (Oğuz) eklemleriyle çakışır.
# Yükseklik: ayak bileği, diz, kalça, omuz; kollar (yatay): omuz, dirsek, bilek. Arası doğrusal, uçlar komşu parçanın oranıyla.
OGUZ_Z = [0.086, 0.542, 0.971, 1.456]
OGUZ_X = [0.212, 0.463, 0.706]
ort = lambda n: (bas('Left' + n) + bas('Right' + n)) / 2 if n else None
mz = [ort('Foot').z, ort('Leg').z, ort('UpLeg').z, ort('Arm').z]  # baş eklemi Meshy'de farklı tanımlı: omzun üstü orantılı uzar
mx = [(bas('LeftArm').x - bas('RightArm').x) / 2, (bas('LeftForeArm').x - bas('RightForeArm').x) / 2, (bas('LeftHand').x - bas('RightHand').x) / 2]
print('eklem z', [round(v, 3) for v in mz], 'kol x', [round(v, 3) for v in mx])


def esle(v, kaynak, hedef):  # parça parça doğrusal; uçlarda komşu parçanın eğimi
    o = lambda i: (hedef[i + 1] - hedef[i]) / (kaynak[i + 1] - kaynak[i])
    if v <= kaynak[0]: return hedef[0] + (v - kaynak[0]) * o(0)
    for i in range(len(kaynak) - 1):
        if v <= kaynak[i + 1]:
            t = (v - kaynak[i]) / (kaynak[i + 1] - kaynak[i]); return hedef[i] + t * (hedef[i + 1] - hedef[i])
    return hedef[-1] + (v - kaynak[-1]) * o(len(kaynak) - 2)


bpy.ops.object.mode_set(mode='OBJECT'); bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
yeni = bpy.data.objects.new('Meshy_T', bpy.data.meshes.new_from_object(M.evaluated_get(dg)))
yeni.matrix_world = M.matrix_world; bpy.context.collection.objects.link(yeni)
yeni.data.transform(yeni.matrix_world); yeni.matrix_world = Matrix()
kalca = bas('Hips')
for v in yeni.data.vertices:
    c = v.co
    c.x -= kalca.x; c.y += 0.043 - kalca.y  # gövde ekseni oyun iskeletinin leğen kemiğine
    if abs(c.x) > mx[0]: c.x = (1 if c.x > 0 else -1) * esle(abs(c.x), mx, OGUZ_X)
    c.z = esle(c.z, mz, OGUZ_Z)
bpy.data.objects.remove(M); bpy.data.objects.remove(A)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=a[1], export_format='GLB', use_selection=True, export_image_format='AUTO')
print('T-poz yazıldı', a[1])
