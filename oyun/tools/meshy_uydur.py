# Meshy modelini oyunun iskeletine oturtur (Oğuz gövdesinin kemik ağırlıklarını aktarır): 119 ortak animasyon kendiliğinden çalışır.
#   python3 tools/meshy_uydur.py <meshy.glb> <cikti.glb> [ucgen=30000]
# Meshy modeli T-pozunda, ayakları yerde ve Oğuz'la yaklaşık aynı yönde olmalı (ön -Y). Ölçek kol açıklığından bulunur.
import bpy, os, sys
from mathutils import Vector, Matrix

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]  # blender -b --python ... -- girdi cikti
GIRDI, CIKTI = ARGV[0], ARGV[1]
HEDEF = int(ARGV[2]) if len(ARGV) > 2 else 30000

bpy.ops.wm.read_factory_settings(use_empty=True)
TABAN = os.path.join(KOK, 'ai-kaynak', 'oguz_taban.glb')  # oyunun özgün Oğuz dosyası (gövde + silah/şapka parçaları); çıktı onun üstüne yazılsa da taban değişmez
if not os.path.exists(TABAN): TABAN = os.path.join(KOK, 'src', 'assets', 'oguz.glb')
DIGER = os.environ.get('TABAN_GLB')  # başka bir karakter şablonu (kormos, tepegoz...): gövde ağırlıkları onun kaplama örgülerinden alınır
if DIGER: TABAN = os.path.join(KOK, DIGER)
bpy.ops.import_scene.gltf(filepath=TABAN)
ARM = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
ARM.data.pose_position = 'REST'
bpy.context.view_layer.update()
KAYNAK_AD = ['Kaftan', 'Trousers', 'Collar', 'Boots', 'SuperHero_Male']
if DIGER:
    kaynak = [o for o in bpy.context.scene.objects if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)]
    KAYNAK_AD = [o.name for o in kaynak]
else:
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
# Meshy örgüsü doku dikişlerinde kopuk gelir (aynı konumda ikiz köşeler): kaynaklanmazsa her parça ayrı ağırlık alır, hareket edince yırtılır
import bmesh
bm = bmesh.new(); bm.from_mesh(yeni.data)
nv = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5 * max(yeni.dimensions))
# havada duran kırıntılar (Meshy'nin bıraktığı birkaç köşelik kopuk parçalar) silinir
gor = set(); sil = []
for v0 in bm.verts:
    if v0 in gor: continue
    st, c = [v0], []; gor.add(v0)
    while st:
        x = st.pop(); c.append(x)
        for e in x.link_edges:
            y = e.other_vert(x)
            if y not in gor: gor.add(y); st.append(y)
    if len(c) < 40: sil += c
bmesh.ops.delete(bm, geom=sil, context='VERTS')
print('kaynak', nv, '->', len(bm.verts), 'kırıntı', len(sil)); bm.to_mesh(yeni.data); bm.free()

# sadeleştir
n0 = sum(len(p.vertices) - 2 for p in yeni.data.polygons)
if n0 > HEDEF:
    m = yeni.modifiers.new('dec', 'DECIMATE'); m.ratio = HEDEF / n0
    bpy.ops.object.modifier_apply(modifier='dec')
print('üçgen', n0, '->', sum(len(p.vertices) - 2 for p in yeni.data.polygons))

# ölçek: kol açıklığı; konum: ayaklar zeminde, x/y merkezi gövdeyle aynı
y_min, y_max = dunya_kutu([yeni])
k = 1.0 if os.environ.get('OLCEK') == '0' else (og_max.x - og_min.x) / (y_max.x - y_min.x)  # OLCEK=0: tools/tpoz.py eklemleri zaten oyun iskeletine oturttu
yeni.scale = (k, k, k); bpy.ops.object.transform_apply(scale=True)
y_min, y_max = dunya_kutu([yeni])
if os.environ.get('OLCEK') != '0': yeni.location += Vector(((og_min.x + og_max.x) / 2 - (y_min.x + y_max.x) / 2, (og_min.y + og_max.y) / 2 - (y_min.y + y_max.y) / 2, og_min.z - y_min.z))
bpy.ops.object.transform_apply(location=True)
y_min, y_max = dunya_kutu([yeni])
# yiğide özel şekil düzeltmeleri (tools/meshy_duzelt.json, anahtar: çıktı dosyasının adı). Koordinatlar oyun iskeletinin uzayında (m, z yukarı).
#   indir: z1'in üstü dz kadar iner, z0..z1 arası yumuşak geçiş (başın üstünde süzülen şapkayı oturtur)
import json
DUZ = json.load(open(os.path.join(KOK, 'tools', 'meshy_duzelt.json'), encoding='utf-8')).get(os.path.splitext(os.path.basename(CIKTI))[0], [])
for d in DUZ:
    if d['op'] == 'indir':
        for v in yeni.data.vertices:
            k = min(max((v.co.z - d['z0']) / (d['z1'] - d['z0']), 0), 1)
            v.co.z -= d['dz'] * k
    elif d['op'] == 'sapka':  # şablondaki başlık parçası (Bork, Kalpak...) ölçeklenip başa oturtulur, gövdeye katılır (renk: ilk malzemenin rengi)
        p = bpy.data.objects[d['parca']]
        c = p.copy(); c.data = p.data.copy(); bpy.context.collection.objects.link(c)
        mw = p.matrix_world.copy(); c.parent = None; c.modifiers.clear(); c.data.transform(mw); c.matrix_world = Matrix()
        zs = [v.co.z for v in c.data.vertices]; cx = sum(v.co.x for v in c.data.vertices) / len(zs); cy = sum(v.co.y for v in c.data.vertices) / len(zs)
        merkez = Vector((cx, cy, min(zs)))
        for v in c.data.vertices: v.co = merkez + (v.co - merkez) * d.get('s', 1) + Vector((0, d.get('dy', 0), d.get('dz', 0)))
        if 'renk' in d:
            m = c.data.materials[0].copy(); m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*[int(d['renk'][i:i + 2], 16) / 255 for i in (0, 2, 4)], 1); c.data.materials[0] = m
        bpy.ops.object.select_all(action='DESELECT'); c.select_set(True); yeni.select_set(True); bpy.context.view_layer.objects.active = yeni; bpy.ops.object.join()
    print('düzeltme', d)
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
# Meshy elleri tek parça (parmaklar ayrık değil): parmak ağırlıkları el kemiğine toplanır, yoksa parmak bükümü eli pençeye çevirir
for g in list(yeni.vertex_groups):
    if g.name.split('_')[0] in ('index', 'middle', 'pinky', 'ring', 'thumb'):
        el = yeni.vertex_groups.get('hand_' + g.name[-1]) or yeni.vertex_groups.new(name='hand_' + g.name[-1])
        for v in yeni.data.vertices:
            for x in v.groups:
                if x.group == g.index and x.weight > 0: el.add([v.index], x.weight, 'ADD')
        yeni.vertex_groups.remove(g)
import numpy as np, heapq
from mathutils.bvhtree import BVHTree
def agirlik_duzenle(o, src, tekrar, f=0.5):
    # 1) Yalnız Oğuz gövdesine gerçekten yapışık köşeler (yakın + yüzeyi aynı yöne bakan) en yakın yüzeyin ağırlığını korur ("çapa").
    # 2) Kılıç, sadak, pelerin ucu, şapka gibi gövdeden ayrık köşeler, örgü üzerinde yürüyerek en yakın çapanın ağırlığını alır:
    #    belden sarkan kılıç kemerin (leğen) ağırlığını alır, bacakla birlikte bükülmez; sırttaki sadak kol kemiklerine çekilmez.
    # 3) Küçük ayrık parçalar (gövdeye değmeyen kılıç, takı) tek ağırlıkla kaskatı taşınır. 4) Komşularla yumuşatılır, en güçlü 4 kemik kalır.
    me = o.data; n = len(me.vertices); gl = list(o.vertex_groups); W = np.zeros((n, len(gl)), dtype=np.float32)
    for v in me.vertices:
        for g in v.groups: W[v.index, g.group] = g.weight
    e = np.array([(ed.vertices[0], ed.vertices[1]) for ed in me.edges])
    co = np.array([v.co[:] for v in me.vertices]); L = np.linalg.norm(co[e[:, 0]] - co[e[:, 1]], axis=1)
    adj = [[] for _ in range(n)]
    for (i, j), l in zip(e.tolist(), L.tolist()): adj[i].append((j, l)); adj[j].append((i, l))
    dg = bpy.context.evaluated_depsgraph_get(); bvh = BVHTree.FromObject(src, dg)
    tau = next((d['deger'] for d in DUZ if d['op'] == 'capa'), float(os.environ.get('CAPA', 0.035))); capa = np.zeros(n, bool)  # uzun cübbeli yiğit: daha geniş çapa (cübbe Oğuz'un kaftanını izler)
    kol = np.array([g.name.split('_')[0] in ('upperarm', 'lowerarm', 'hand') for g in gl] + [False])  # kollara gevşek eşik: ince kollu model Oğuz'un kalın yenine uzak düşer
    ust = np.where(W.sum(1) > 0, W.argmax(1), len(gl))
    for v in me.vertices:
        loc, nor, _, d = bvh.find_nearest(v.co)
        capa[v.index] = loc is not None and d < (0.10 if kol[ust[v.index]] else tau) and v.normal.dot(nor) > 0.2
    # parçalar
    parca = -np.ones(n, int); k = 0
    for s0 in range(n):
        if parca[s0] >= 0: continue
        st = [s0]; parca[s0] = k
        while st:
            x = st.pop()
            for y, _ in adj[x]:
                if parca[y] < 0: parca[y] = k; st.append(y)
        k += 1
    boy = np.bincount(parca)
    # çapadan örgü üzerinde en yakın yol (çok kaynaklı Dijkstra)
    dist = np.full(n, np.inf); kaynak = -np.ones(n, int); h = []
    for i in np.where(capa)[0]: dist[i] = 0; kaynak[i] = i; h.append((0.0, int(i)))
    heapq.heapify(h)
    while h:
        d, x = heapq.heappop(h)
        if d > dist[x]: continue
        for y, l in adj[x]:
            if d + l < dist[y]: dist[y] = d + l; kaynak[y] = kaynak[x]; heapq.heappush(h, (d + l, y))
    W0 = W.copy(); bag = kaynak >= 0
    W[bag] = W0[kaynak[bag]]
    # küçük ya da çapasız parçalar (sadaktaki ok, takı, ayrık kılıç) kaskatı: parçaya en yakın büyük-parça köşesinin ağırlığını alır.
    # (ortalama almak uzak kemikleri karıştırıyor, parça hareket edince havaya kopuyordu)
    from mathutils.kdtree import KDTree
    buyuk = np.where(boy[parca] >= 0.04 * n)[0]
    kd = KDTree(len(buyuk))
    for i in buyuk: kd.insert(co[i], int(i))
    kd.balance()
    sabit = {}
    for p in range(k):
        m = np.where(parca == p)[0]
        if boy[p] >= 0.04 * n and bag[m].any(): continue
        en = min((kd.find(co[i]) for i in m), key=lambda r: r[2])
        sabit[p] = W[en[1]].copy(); W[m] = sabit[p]
    print('çapa', int(capa.sum()), '/', n, 'parça', k, 'büyük', int((boy >= 0.04 * n).sum()))
    kati = []  # yiğide özel: sırta takılı yay/sadak gibi arkada duran bölge tek kemiğe kaskatı (tools/meshy_duzelt.json "kaskati")
    for d in DUZ:
        if d['op'] != 'kaskati': continue
        m = (co[:, 1] > d['y']) & (co[:, 2] < d.get('zmax', 9)) & (co[:, 2] > d.get('zmin', -9))
        w = np.zeros(len(gl), np.float32); w[[g.name for g in gl].index(d['kemik'])] = 1
        W[m] = w; kati.append((m, w)); print('kaskatı', int(m.sum()), 'köşe ->', d['kemik'])
    deg = np.bincount(e.ravel(), minlength=n).astype(np.float32)
    for _ in range(tekrar):
        S = np.zeros_like(W); np.add.at(S, e[:, 0], W[e[:, 1]]); np.add.at(S, e[:, 1], W[e[:, 0]])
        W = (1 - f) * W + f * S / np.maximum(deg, 1)[:, None]
    for p, w in sabit.items(): W[parca == p] = w  # yumuşatma kaskatı parçaları yeniden bükmesin
    for m, w in kati: W[m] = w
    for g in gl: g.add(list(range(n)), 0.0, 'REPLACE')
    for i in range(n):  # en güçlü 4 kemik (glTF sınırı)
        idx = np.argsort(-W[i])[:4]; w = W[i][idx]; t = float(w.sum()) or 1.0
        for j, x in zip(idx, w):
            if x > 1e-4: gl[j].add([i], float(x) / t, 'REPLACE')
agirlik_duzenle(yeni, src, int(os.environ.get('YUMUSAT', 12)))
bpy.ops.object.vertex_group_normalize_all(lock_active=False)
yeni.parent = ARM; yeni.matrix_parent_inverse = ARM.matrix_world.inverted()
am = yeni.modifiers.new('arm', 'ARMATURE'); am.object = ARM
for p in yeni.data.polygons: p.use_smooth = True

# eski giydirilmiş gövde parçaları (Meshy gövdesi saç, göz, giysiyi zaten taşır) gider; silah, şapka, kostüm parçaları (kemiğe bağlı) kalır
ESKI = set(KAYNAK_AD) | {'BootFeet', 'Eyebrows', 'Eyes', 'Hair_Beard', 'Hair_Long', '_agirlik'}
GOVDE_TEK = os.environ.get('GOVDE_TEK') == '1'  # yalnız iskelet + yeni gövde (diğer yiğitler: oyunda gövde değişimi)
for o in list(bpy.context.scene.objects):
    if GOVDE_TEK and o is not ARM and o is not yeni or o.name in ESKI or o.name.split('.')[0] in ESKI:
        bpy.data.objects.remove(o)
DOKU = int(os.environ.get('DOKU', 1024))  # yiğitler yakından görünür: DOKU=2048
for im in bpy.data.images:  # Meshy dokusu 4096 gelir: istenen boya küçültülür (WebP)
    if im.size[0] > DOKU: im.scale(DOKU, int(DOKU * im.size[1] / im.size[0]))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=CIKTI, export_format='GLB', use_selection=True, export_skins=True, export_animations=False, export_apply=False, export_image_format='WEBP', export_image_quality=85)
print('yazıldı', CIKTI, os.path.getsize(CIKTI) // 1024, 'KB')
