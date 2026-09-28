# Kostüm parçaları (kostum/BLENDER.md, oyun/src/yigit.js DETAY): Oğuz gövdesine ölçülerek Blender'da üretilir.
#   python3 tools/build_kiyafet.py   (Blender Python modülü: pip install bpy)  -> src/assets/kiyafet.glb
# oguz.glb'ye dokunulmaz: parçalar ayrı dosyada, aynı iskeletle (kemik adları) dışa aktarılır; oyun yüklerken
# Oğuz şablonuna ekler (src/assets.js -> kiyafetEkle). Kurallar:
#  - C_ ile başlayan her parça kostüm parçasıdır; hangi yiğitte görüneceği DETAY'da.
#  - Gövdeye sarılan parçalar (kemer, kuşak, uzun kaftan, pul zırh, omuzluk, kürk yaka) gövdenin kemik ağırlıklarını alır
#    (Data Transfer), yani koşarken gövdeyle birlikte bükülür.
#  - Adında Sway geçen parça (pelerin, örgü, saçak) menteşeli katı parçadır: kemik <- hizala_C_* (dünya eksenli) <- C_*_Sway
#    (menteşe noktası, dönmesiz) <- örgü. Kod C_*_Sway'in rotation.x'ini değiştirir: dünya yan ekseninde döner, geriye kalkar.
#  - Başa takılan bıyık, sakal, örgü, saç tepesi Head kemiğine; ayna ve davul spine_03'e katı bağlıdır.
# Koordinatlar Blender'da: z yukarı, karakter -Y yönüne bakar (ön -Y, sırt +Y), sol el +X.
import math, os, random
import bpy, bmesh
from mathutils import Vector, Matrix

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CIKTI = os.path.join(KOK, 'src', 'assets', 'kiyafet.glb')
rnd = random.Random(3)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(KOK, 'src', 'assets', 'oguz.glb'))
ARM = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE'][0]
ARM.data.pose_position = 'REST'
bpy.context.view_layer.update()
GOVDE_ADLARI = ['Kaftan', 'Trousers', 'Collar', 'Boots', 'SuperHero_Male', 'Hair_Long']
DG = bpy.context.evaluated_depsgraph_get()


def dunya_noktalari(ad):
    o = bpy.data.objects[ad]; ev = o.evaluated_get(DG); me = ev.to_mesh()
    ps = [o.matrix_world @ v.co for v in me.vertices]; ev.to_mesh_clear(); return ps


GOVDE = []
for a in ['Kaftan', 'Trousers', 'Collar']: GOVDE += dunya_noktalari(a)
BAS = [p for p in dunya_noktalari('SuperHero_Male') if p.z > 1.6 and abs(p.x) < 0.15]


def yuz_on(z, x=0.0):
    """Yüzün z yüksekliğinde, x yanal konumunda en öndeki (en küçük y) nokta."""
    ps = [p for p in BAS if abs(p.z - z) < 0.008 and abs(p.x - x) < 0.012]
    return min(p.y for p in ps) if ps else -0.11


def kemik(ad):
    return ARM.data.bones[ad]


def kemik_dunya(ad):
    b = kemik(ad); return ARM.matrix_world @ b.matrix_local


# ---------------- malzemeler ----------------
MAT = {}
def mat(ad, rgb, rough=0.8):
    if ad in MAT: return MAT[ad]
    m = bpy.data.materials.new(ad); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF'); b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough
    m.diffuse_color = (*rgb, 1); MAT[ad] = m; return m


mat('M_Leather', (0.28, 0.16, 0.08)); mat('M_Gold', (0.85, 0.62, 0.18)); mat('M_Steel', (0.62, 0.64, 0.68))
mat('M_Kaftan', (0.12, 0.22, 0.55)); mat('M_Cape', (0.75, 0.75, 0.75)); mat('M_Sash', (0.8, 0.8, 0.8)); mat('M_Kurk', (0.7, 0.66, 0.6))
mat('M_Black', (0.03, 0.025, 0.02)); mat('M_BeardWhite', (0.86, 0.85, 0.82)); mat('M_Cloth', (0.62, 0.18, 0.12)); mat('M_Iron', (0.3, 0.3, 0.32))
mat('M_Wood', (0.4, 0.24, 0.12)); mat('M_Hide', (0.82, 0.7, 0.5)); mat('MI_Hair_Braid', (0.1, 0.07, 0.05)); mat('M_Jewel', (0.7, 0.1, 0.1))


# ---------------- ölçü yardımcıları ----------------
def kesit(z, dz=0.025, xlim=0.3, n=48, kaynak=None):
    """z yüksekliğinde gövde kesiti: n açı dilimi için merkezden en uzak nokta (açı 0 = +X, ön -Y 270°)."""
    ps = [p for p in (kaynak or GOVDE) if abs(p.z - z) < dz and abs(p.x) < xlim]
    if not ps: return None
    cy = (max(p.y for p in ps) + min(p.y for p in ps)) / 2
    r = [0.0] * n
    for p in ps:
        a = math.atan2(p.y - cy, p.x) % (2 * math.pi); i = int(a / (2 * math.pi) * n) % n
        r[i] = max(r[i], math.hypot(p.x, p.y - cy))
    for _ in range(n):  # boş dilimleri komşulardan doldur
        for i in range(n):
            if r[i] == 0: r[i] = max(r[(i - 1) % n], r[(i + 1) % n])
    r = [(r[(i - 1) % n] + 2 * r[i] + r[(i + 1) % n]) / 4 for i in range(n)]  # yumuşat
    return cy, r


def aci_nokta(cy, r, i, n, z, pad):
    a = (i + 0.5) / n * 2 * math.pi
    return Vector(((r[i] + pad) * math.cos(a), cy + (r[i] + pad) * math.sin(a), z))


def nesne(ad, bm, mats):
    me = bpy.data.meshes.new(ad); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(ad, me); bpy.context.collection.objects.link(o)
    for m in mats: o.data.materials.append(MAT[m])
    return o


def bant(ad, z0, z1, pad, mat_ad, satir=4, n=48, kalin=0.012, dalga=0.0, xlim=0.3, sub=1):
    """Gövdeye sarılı bant (kemer, kuşak): z0..z1 arasında kesitleri izleyen halka."""
    bm = bmesh.new(); rows = []
    for k in range(satir + 1):
        z = z0 + (z1 - z0) * k / satir; ks = kesit(z, xlim=xlim); cy, r = ks
        rows.append([bm.verts.new(aci_nokta(cy, r, i, n, z + dalga * math.sin(i * 0.9), pad)) for i in range(n)])
    for k in range(satir):
        for i in range(n):
            bm.faces.new([rows[k][i], rows[k][(i + 1) % n], rows[k + 1][(i + 1) % n], rows[k + 1][i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = nesne(ad, bm, [mat_ad]); kalinlastir(o, kalin, sub=sub); return o


def kalinlastir(o, t, sub=1):
    m = o.modifiers.new('sol', 'SOLIDIFY'); m.thickness = t; m.offset = 1
    if sub: s = o.modifiers.new('sub', 'SUBSURF'); s.levels = sub; s.render_levels = sub
    uygula(o)


def uygula(o):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    for m in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=m.name)
    for p in o.data.polygons: p.use_smooth = True


def kutu(ad, merkez, boyut, mat_ad, don=(0, 0, 0), bevel=0.3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=merkez, rotation=don)
    o = bpy.context.object; o.name = ad; o.scale = boyut
    o.data.materials.append(MAT[mat_ad])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    if bevel:
        b = o.modifiers.new('bev', 'BEVEL'); b.width = min(boyut) * bevel; b.segments = 2; uygula(o)
    return o


def kure(ad, merkez, boyut, mat_ad, seg=12, ring=8, don=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1, location=merkez, rotation=don)
    o = bpy.context.object; o.name = ad; o.scale = boyut; o.data.materials.append(MAT[mat_ad])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    for p in o.data.polygons: p.use_smooth = True
    return o


def silindir(ad, merkez, r, h, mat_ad, don=(0, 0, 0), v=24, r2=None):
    if r2 is None: bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=merkez, rotation=don)
    else: bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=merkez, rotation=don)
    o = bpy.context.object; o.name = ad; o.data.materials.append(MAT[mat_ad])
    for p in o.data.polygons: p.use_smooth = True
    return o


def boru(ad, noktalar, yaricap, mat_ad, incel=True, cozunurluk=6):
    """Nokta dizisi boyunca boru (bıyık, örgü şeridi, saçak): uca doğru incelir."""
    cu = bpy.data.curves.new(ad, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = yaricap; cu.bevel_resolution = 2; cu.resolution_u = cozunurluk
    sp = cu.splines.new('POLY' if len(noktalar) < 3 else 'NURBS'); sp.points.add(len(noktalar) - 1)
    for i, p in enumerate(noktalar):
        sp.points[i].co = (*p, 1); sp.points[i].radius = (1 - 0.75 * i / (len(noktalar) - 1)) if incel else 1
    if sp.type == 'NURBS': sp.use_endpoint_u = True; sp.order_u = 3
    o = bpy.data.objects.new(ad, cu); bpy.context.collection.objects.link(o)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.convert(target='MESH'); o = bpy.context.object; o.data.materials.append(MAT[mat_ad])
    for p in o.data.polygons: p.use_smooth = True
    return o


def birlestir(ad, parcalar):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parcalar: p.select_set(True)
    bpy.context.view_layer.objects.active = parcalar[0]
    bpy.ops.object.join(); o = bpy.context.object; o.name = ad; o.data.name = ad
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


# ---------------- bağlama ----------------
KAYNAK = None
def agirlik_kaynagi():
    """Gövde parçalarının kopyalarını tek nesnede birleştir (ağırlık aktarımı için)."""
    global KAYNAK
    if KAYNAK: return KAYNAK
    kopyalar = []
    for a in ['Kaftan', 'Trousers', 'Collar', 'Boots']:
        s = bpy.data.objects[a]; c = s.copy(); c.data = s.data.copy(); bpy.context.collection.objects.link(c)
        c.modifiers.clear(); c.parent = None; c.matrix_world = s.matrix_world; kopyalar.append(c)
    bpy.ops.object.select_all(action='DESELECT')
    for c in kopyalar: c.select_set(True)
    bpy.context.view_layer.objects.active = kopyalar[0]; bpy.ops.object.join()
    KAYNAK = bpy.context.object; KAYNAK.name = '_agirlik'
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return KAYNAK


BUTCE = {'C_Belt': 1500, 'C_Sash': 1800, 'C_KaftanLong': 2200, 'C_FurCollar': 2200, 'C_Lamellar': 6000, 'orgu_Cape': 1500,
         'orgu_Fringe': 1500, 'C_BraidsSide': 1200, 'C_BeardLong': 1500, 'C_BeardLongWhite': 1500, 'C_HairTop': 1200}
def sinirla(o, ad=None):
    """Telefon bütçesi: parça başına üçgen sınırı (kostum/BLENDER.md: tek parça <= 1500, gövdeye sarılanlar biraz fazla)."""
    hedef = BUTCE.get(ad or o.name, 1500); n = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if n <= hedef: return
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = hedef / n; bpy.ops.object.modifier_apply(modifier='dec')


def giydir(o, sadece=None):
    """Gövdenin kemik ağırlıklarını en yakın yüzeyden aktar, iskelete bağla. sadece: {kemik: çarpan} ile sınırla."""
    sinirla(o)
    src = agirlik_kaynagi()
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    dt = o.modifiers.new('dt', 'DATA_TRANSFER'); dt.object = src; dt.use_vert_data = True
    dt.data_types_verts = {'VGROUP_WEIGHTS'}; dt.vert_mapping = 'POLYINTERP_NEAREST'
    dt.layers_vgroup_select_src = 'ALL'; dt.layers_vgroup_select_dst = 'NAME'
    bpy.ops.object.datalayout_transfer(modifier='dt'); bpy.ops.object.modifier_apply(modifier='dt')
    if sadece:  # istenmeyen kemikleri sil; ağırlıksız kalan köşe ilk kemiğe (yoksa orijine çöker), sonra normalize
        for g in list(o.vertex_groups):
            if g.name not in sadece: o.vertex_groups.remove(g)
        yedek = o.vertex_groups.get(sadece[0]) or o.vertex_groups.new(name=sadece[0])
        bos_kose = [v.index for v in o.data.vertices if sum(g.weight for g in v.groups) < 1e-4]
        if bos_kose: yedek.add(bos_kose, 1.0, 'REPLACE')
        bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    o.parent = ARM; o.matrix_parent_inverse = ARM.matrix_world.inverted()
    m = o.modifiers.new('arm', 'ARMATURE'); m.object = ARM
    return o


def kemige_bagla(o, kemik_ad):
    if o.type == 'MESH': sinirla(o)
    w = o.matrix_world.copy()
    o.parent = ARM; o.parent_type = 'BONE'; o.parent_bone = kemik_ad
    o.matrix_world = w
    return o


def sallanir(ad, o, kemik_ad, mentese):
    """Menteşeli parça: kemik <- hizala_ad (dünya eksenli) <- C_ad (menteşe, dönmesiz) <- örgü."""
    hz = bpy.data.objects.new('hizala_' + ad.replace('_Sway', ''), None)  # adında Sway geçmemeli (kod onu da döndürürdü)
    bpy.context.collection.objects.link(hz)
    hz.matrix_world = Matrix.Translation(mentese); kemige_bagla(hz, kemik_ad)
    pv = bpy.data.objects.new(ad, None); bpy.context.collection.objects.link(pv)
    pv.parent = hz; pv.matrix_parent_inverse = Matrix.Identity(4); pv.location = (0, 0, 0)
    bpy.context.view_layer.update()
    w = o.matrix_world.copy(); o.name = 'orgu_' + ad[2:].replace('_Sway', ''); o.data.name = o.name  # C_ ile başlamamalı
    sinirla(o)
    o.parent = pv; o.matrix_world = w
    return pv


# =====================================================================================
PARCALAR = []

# 1. C_Belt: deri kemer, 7 altın levha, iki yanda sarkan kayış
z_bel = 1.0
kemer = bant('C_Belt', z_bel - 0.03, z_bel + 0.03, 0.014, 'M_Leather', satir=2, kalin=0.012)
cy, r = kesit(z_bel); n = len(r); lev = []
for k in range(7):
    i = int((0.75 + (k - 3) * 0.055) * n) % n  # önde (-Y, 270°) ortalı
    a = (i + 0.5) / n * 2 * math.pi; p = aci_nokta(cy, r, i, n, z_bel, 0.03)
    lev.append(kutu('lv', p, (0.034, 0.012, 0.042), 'M_Gold', don=(0, 0, a + math.pi / 2), bevel=0.25))
for s in (-1, 1):  # yan kayışlar ve uçlarında altın
    i = int(((0.75 + s * 0.2) % 1) * n); p = aci_nokta(cy, r, i, n, z_bel - 0.1, 0.03); a = (i + 0.5) / n * 2 * math.pi
    lev.append(kutu('ks', p, (0.028, 0.008, 0.18), 'M_Leather', don=(0, 0, a + math.pi / 2), bevel=0.2))
    lev.append(kutu('ku', p + Vector((0, 0, -0.1)), (0.032, 0.012, 0.03), 'M_Gold', don=(0, 0, a + math.pi / 2), bevel=0.3))
kemer = birlestir('C_Belt', [kemer] + lev); giydir(kemer); PARCALAR.append(kemer)

# 2. C_Sash: bele iki tur ince kuşak, yan önde düğüm ve sarkan iki uç
k1 = bant('C_Sash', 0.99, 1.09, 0.014, 'M_Sash', satir=4, kalin=0.01, dalga=0.004)
k2 = bant('ks2', 1.05, 1.12, 0.022, 'M_Sash', satir=3, kalin=0.008, dalga=0.005)
cy, r = kesit(1.06); n = len(r); i = int(0.68 * n); p = aci_nokta(cy, r, i, n, 1.06, 0.03)
dugum = kure('kd', p, (0.035, 0.022, 0.03), 'M_Sash')
uclar = []
for s_, uz in ((-1, 0.26), (1, 0.2)):
    q = p + Vector((s_ * 0.02, -0.005, -0.015)); nokt = [q, q + Vector((s_ * 0.02, -0.01, -uz * 0.5)), q + Vector((s_ * 0.035, -0.006, -uz))]
    u = boru('ku', nokt, 0.022, 'M_Sash', incel=False); u.scale = (1, 0.3, 1); bpy.context.view_layer.objects.active = u
    bpy.ops.object.transform_apply(scale=True); uclar.append(u)
kusak = birlestir('C_Sash', [k1, k2, dugum] + uclar); giydir(kusak); PARCALAR.append(kusak)

# 3. C_Cape_Sway: omuzdan diz üstüne pelerin, dalgalı alt kenar, önde altın toka
satir, sut = 14, 16; bm = bmesh.new(); rows = []
z_ust, z_alt = 1.5, 0.52
for k in range(satir + 1):
    t = k / satir; z = z_ust + (z_alt - z_ust) * t
    ks = kesit(min(max(z, 0.9), 1.48), xlim=0.32); cy, r = ks; n = len(r)
    gen = 0.19 + 0.2 * t  # yarı genişlik: omuzda dar, altta geniş
    row = []
    for j in range(sut + 1):
        u = j / sut; x = (u - 0.5) * 2 * gen
        a = math.atan2(0.14, x) % (2 * math.pi); i = int(a / (2 * math.pi) * n) % n
        yarka = cy + math.sqrt(max(0.0, (r[i] + 0.035) ** 2 - x * x)) if abs(x) < r[i] + 0.03 else cy + 0.06
        y = max(yarka, cy + 0.08 + 0.1 * t) + 0.012 * math.sin(u * 9 + t * 4)  # sırtı izler, aşağıda serbest sarkar
        z2 = z + (0.03 * math.sin(u * 7.5) if k == satir else 0)  # dalgalı etek
        row.append(bm.verts.new((x, y, z2)))
    rows.append(row)
for k in range(satir):
    for j in range(sut):
        bm.faces.new([rows[k][j], rows[k][j + 1], rows[k + 1][j + 1], rows[k + 1][j]])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
pel = nesne('pelerin', bm, ['M_Cape']); kalinlastir(pel, 0.014)
toka = []
for s in (-1, 1):
    toka.append(silindir('tk', (s * 0.13, -0.1, 1.47), 0.028, 0.012, 'M_Gold', don=(math.pi / 2, 0, 0)))
pel = birlestir('pelerin', [pel] + toka)
PARCALAR.append(sallanir('C_Cape_Sway', pel, 'spine_03', Vector((0, 0.1, 1.5))))

# 4. C_KaftanLong: belden diz altına önü açık etek, yanlarda yırtmaç, kenarda altın şerit (M_Kaftan: renk ve desen kaftandan)
satir, n = 10, 48; bm = bmesh.new(); rows = []; uvs = []
z_ust, z_alt = 1.0, 0.36
ac_on = 5; yirtmac = (0.25, 0.75)  # önde açık dilim sayısı; yanlarda (x yönünde) yırtmaç
ks0 = kesit(z_ust); cy0, r0 = ks0
for k in range(satir + 1):
    t = k / satir; z = z_ust + (z_alt - z_ust) * t
    row = []
    for i in range(n):
        a = (i + 0.5) / n * 2 * math.pi
        rr = r0[i] + 0.02 + 0.2 * t ** 1.3  # aşağı doğru açılır (bacaklar sığsın)
        row.append(bm.verts.new((rr * math.cos(a) * (1 + 0.15 * t), cy0 + rr * math.sin(a), z)))
    rows.append(row)
on = int(0.75 * n)
bos = {(on + d) % n for d in range(-ac_on // 2, ac_on // 2 + 1)}
yan = {int(0.0 * n), int(0.5 * n), n - 1, int(0.5 * n) - 1}
uv_l = bm.loops.layers.uv.new('UVMap')
for k in range(satir):
    for i in range(n):
        if i in bos: continue
        if k >= satir // 2 and i in yan: continue  # yırtmaç
        f = bm.faces.new([rows[k][i], rows[k][(i + 1) % n], rows[k + 1][(i + 1) % n], rows[k + 1][i]])
        for l, (uu, vv) in zip(f.loops, [(i / n, 1 - k / satir), ((i + 1) / n, 1 - k / satir), ((i + 1) / n, 1 - (k + 1) / satir), (i / n, 1 - (k + 1) / satir)]):
            l[uv_l].uv = (uu, vv)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
etek = nesne('C_KaftanLong', bm, ['M_Kaftan']); kalinlastir(etek, 0.012, sub=0)
serit = []
for k in (satir,):
    z = z_alt + 0.015
    sira = [(on + ac_on // 2 + 1 + k) % n for k in range(n - ac_on)]
    pts = [((0.02 + r0[i] + 0.2) * math.cos((i + 0.5) / n * 2 * math.pi) * 1.15, cy0 + (0.02 + r0[i] + 0.2) * math.sin((i + 0.5) / n * 2 * math.pi), z) for i in sira]
    serit.append(boru('ser', pts[:len(pts) // 2 + 1], 0.012, 'M_Gold', incel=False))
    serit.append(boru('ser', pts[len(pts) // 2:], 0.012, 'M_Gold', incel=False))
etek = birlestir('C_KaftanLong', [etek] + serit)
giydir(etek, sadece=['pelvis', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'spine_01']); PARCALAR.append(etek)

# 5. C_FurCollar: omuzlara taşan kalın kürk yaka (gürültüyle kabarık)
yaka = bant('C_FurCollar', 1.42, 1.53, 0.03, 'M_Kurk', satir=4, kalin=0.05, xlim=0.26)
tex = bpy.data.textures.new('kurk', 'CLOUDS'); tex.noise_scale = 0.03
d = yaka.modifiers.new('disp', 'DISPLACE'); d.texture = tex; d.strength = 0.03; d.mid_level = 0.3
s = yaka.modifiers.new('sub', 'SUBSURF'); s.levels = 1; uygula(yaka); giydir(yaka); PARCALAR.append(yaka)

# 6. C_Mustache: uçları çeneye sarkan bıyık
bi = []
for s in (-1, 1):
    bi.append(boru('bi', [(s * 0.006, yuz_on(1.655) - 0.006, 1.655), (s * 0.026, yuz_on(1.65, s * 0.026) - 0.006, 1.649), (s * 0.04, yuz_on(1.635, s * 0.04) - 0.005, 1.632), (s * 0.045, yuz_on(1.61, s * 0.045) - 0.008, 1.603)], 0.008, 'M_Black'))
biy = birlestir('C_Mustache', bi); kemige_bagla(biy, 'Head'); PARCALAR.append(biy)

# 7. C_BraidBack_Sway: enseden sırta tek kalın örgü, ucunda altın halka
def orgu(ad, bas, yon, uzunluk, kalin, mat_ad='MI_Hair_Braid', halka=True):
    par = []; adim = kalin * 1.3; m = int(uzunluk / adim)
    for k in range(m):
        p = bas + yon * (adim * k) ; s = 1 - 0.35 * k / m
        par.append(kure('og', p + Vector((((-1) ** k) * kalin * 0.25, 0, 0)), (kalin * s, kalin * 0.8 * s, adim * 0.75), mat_ad, seg=10, ring=6, don=(0, ((-1) ** k) * 0.35, 0)))
    if halka:
        uc = bas + yon * (adim * m)
        par.append(silindir('ha', uc, kalin * 0.7, kalin * 0.6, 'M_Gold'))
        par.append(kure('pu', uc + yon * kalin * 0.9, (kalin * 0.5, kalin * 0.5, kalin * 0.8), 'MI_Hair_Braid', seg=8, ring=6))
    return birlestir(ad, par)
og = orgu('orgu', Vector((0, 0.1, 1.64)), Vector((0, 0.18, -1)).normalized(), 0.42, 0.028)
PARCALAR.append(sallanir('C_BraidBack_Sway', og, 'Head', Vector((0, 0.1, 1.64))))

# 8. C_Lamellar: deri astar üstünde sıra sıra, birbirine binen demir pullar (gövde kesitini izler)
lv = [bant('C_Lamellar', 1.12, 1.47, 0.016, 'M_Leather', satir=6, kalin=0.01, xlim=0.25, sub=0)]
for sira in range(8):
    z = 1.15 + sira * 0.042; cy, r = kesit(z, xlim=0.25); n = len(r)
    for i in range(n):
        a_ = (i + 0.5 + 0.5 * (sira % 2)) / n * 2 * math.pi
        on_ = math.pi * 1.08 < a_ < math.pi * 1.92; arka = math.pi * 0.08 < a_ < math.pi * 0.92
        if not (on_ or arka): continue  # kol altında yalnız deri
        ii = int(a_ / (2 * math.pi) * n) % n
        p = Vector(((r[ii] + 0.03) * math.cos(a_), cy + (r[ii] + 0.03) * math.sin(a_), z))
        gen = 2 * math.pi * r[ii] / n * 1.15
        lv.append(kutu('pl', p, (gen, 0.006, 0.052), 'M_Iron', don=(0.12, 0, a_ + math.pi / 2), bevel=0))
for z in (1.13, 1.465):
    lv.append(bant('lk', z - 0.01, z + 0.01, 0.036, 'M_Gold', satir=1, kalin=0.008, xlim=0.25, sub=0))
zirh = birlestir('C_Lamellar', lv); giydir(zirh); PARCALAR.append(zirh)

# 9. C_BraidsSide: kulak önünden göğse iki ince örgü
yo = [orgu('yo', Vector((s * 0.085, -0.04, 1.67)), Vector((s * 0.12, -0.35, -1)).normalized(), 0.28, 0.014) for s in (-1, 1)]
yan = birlestir('C_BraidsSide', yo); kemige_bagla(yan, 'Head'); PARCALAR.append(yan)

# 10. C_Pauldrons: omuzdan kola doğru üst üste binen üç kavisli levha (iki omuz, upperarm ağırlıkları)
def kavis(x0, uz, r, yz, s_, mat_ad):
    """Kol ekseni (X) boyunca uzanan, üstü örten yay şeklinde levha."""
    bm = bmesh.new(); sat = []
    for k in range(9):
        t = -1.9 + 3.8 * k / 8
        sat.append([bm.verts.new((s_ * (x0 + uz * j / 3), yz[0] + r * math.sin(t), yz[1] + r * math.cos(t) - 0.012 * j)) for j in range(4)])
    for k in range(8):
        for j in range(3): bm.faces.new([sat[k][j], sat[k][j + 1], sat[k + 1][j + 1], sat[k + 1][j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    o = nesne('kv', bm, [mat_ad]); kalinlastir(o, 0.007); return o
om = []
for s_ in (-1, 1):
    for kat in range(3):
        om.append(kavis(0.19 + kat * 0.045, 0.085, 0.088 - kat * 0.006, (0.055, 1.456 + 0.012 - kat * 0.012), s_, 'M_Steel'))
    om.append(kavis(0.185, 0.018, 0.094, (0.055, 1.47), s_, 'M_Gold'))
omz = birlestir('C_Pauldrons', om); giydir(omz, sadece=['spine_03', 'clavicle_l', 'clavicle_r', 'upperarm_l', 'upperarm_r']); PARCALAR.append(omz)

# 11. C_BeardLong / C_BeardLongWhite: göğse inen uzun sakal (sivri, dalgalı tutamlar)
def sakal(ad, mat_ad):
    tut = []
    for k in range(9):
        x = (k - 4) * 0.014; boy = 0.2 - abs(k - 4) * 0.018
        y0 = yuz_on(1.625, x) - 0.004
        tut.append(boru('sk', [(x, y0, 1.63), (x * 1.1, y0 - 0.025, 1.59), (x * 0.8 + 0.004 * math.sin(k), y0 - 0.03, 1.59 - boy * 0.6), (x * 0.4, y0 - 0.02, 1.59 - boy)], 0.02, mat_ad))
    o = birlestir(ad, tut); kemige_bagla(o, 'Head'); return o
PARCALAR.append(sakal('C_BeardLong', 'M_Black'))
PARCALAR.append(sakal('C_BeardLongWhite', 'M_BeardWhite'))

# 12. C_Fringe_Sway: belden dize renkli kumaş şeritler, uçlarında demir çıngırak
cy, r = kesit(0.98); n = len(r); sr = []
for i in range(0, n, 2):
    p = aci_nokta(cy, r, i, n, 0.98, 0.04); boy = 0.3 + 0.1 * rnd.random()
    s = boru('fs', [p, p + Vector((0, 0, -boy * 0.5)), p + Vector((0, 0, -boy))], 0.016, 'M_Cloth', incel=False)
    a = (i + 0.5) / n * 2 * math.pi; s.rotation_euler = (0, 0, 0); s.scale = (1, 1, 1)
    sr.append(s)
    if i % 4 == 0: sr.append(silindir('cn', p + Vector((0, 0, -boy - 0.02)), 0.018, 0.04, 'M_Iron', r2=0.004, v=10))
sac = birlestir('sacak', sr)
PARCALAR.append(sallanir('C_Fringe_Sway', sac, 'pelvis', Vector((0, cy, 0.98))))

# 13. C_ShamanMirror: göğüste yuvarlak bronz ayna (küzüngü)
cy, r = kesit(1.36, xlim=0.25); n = len(r); p = aci_nokta(cy, r, int(0.75 * n), n, 1.36, 0.02)
ay = [silindir('ay', p, 0.07, 0.012, 'M_Gold', don=(math.pi / 2, 0, 0), v=32),
      silindir('ak', p + Vector((0, -0.008, 0)), 0.045, 0.01, 'M_Gold', don=(math.pi / 2, 0, 0), v=32),
      kure('ag', p + Vector((0, -0.014, 0)), (0.015, 0.008, 0.015), 'M_Jewel', seg=10, ring=6)]
ayna = birlestir('C_ShamanMirror', ay); kemige_bagla(ayna, 'spine_03'); PARCALAR.append(ayna)

# 14. C_Drum: sırtta tek yüzlü şaman davulu: ahşap çember, deri yüz, ortada tutamak
cy, r = kesit(1.3, xlim=0.25); n = len(r); p = aci_nokta(cy, r, int(0.25 * n), n, 1.3, 0.07)
dv = [silindir('dc', p, 0.2, 0.06, 'M_Wood', don=(math.pi / 2, 0, 0.2), v=32),
      silindir('dy', p + Vector((0, 0.032, 0)), 0.19, 0.006, 'M_Hide', don=(math.pi / 2, 0, 0.2), v=32)]
for k in range(8):
    a = k / 8 * 2 * math.pi
    dv.append(kure('dz', p + Vector((0.2 * math.cos(a), -0.02, 0.2 * math.sin(a))), (0.012, 0.012, 0.012), 'M_Iron', seg=6, ring=4))
davul = birlestir('C_Drum', dv); kemige_bagla(davul, 'spine_03'); PARCALAR.append(davul)

# 15. C_HairTop: başlıksız yiğitlerde (Tomris, Banu Çiçek, Ak Oğlan) başın tepesini örten saç.
# Kafanın kendi yüzeyinden, saç çizgisinin üstü kesilir (alında yüksek, arkada ense hizası; kulaklar açık), dışa kalınlaştırılır.
def sac_cizgisi(y):  # ön -Y: alında 1.755, arkada 1.66
    t = min(1.0, max(0.0, (y + 0.06) / 0.08)); return 1.755 + (1.66 - 1.755) * t
bas_ob = bpy.data.objects['SuperHero_Male']
kafa = bas_ob.copy(); kafa.data = bas_ob.data.copy(); bpy.context.collection.objects.link(kafa)
kafa.modifiers.clear(); kafa.parent = None; kafa.matrix_world = bas_ob.matrix_world; kafa.name = 'C_HairTop'
bpy.context.view_layer.objects.active = kafa; bpy.ops.object.select_all(action='DESELECT'); kafa.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
kafa.vertex_groups.clear()
bm = bmesh.new(); bm.from_mesh(kafa.data)
sil = [v for v in bm.verts if not (abs(v.co.x) < 0.14 and v.co.z > sac_cizgisi(v.co.y) and not (abs(v.co.x) > 0.07 and v.co.z < 1.73 and v.co.y < 0.04))]
bmesh.ops.delete(bm, geom=sil, context='VERTS'); bm.to_mesh(kafa.data); bm.free()
kafa.data.materials.clear(); kafa.data.materials.append(MAT['MI_Hair_Braid'])
sol = kafa.modifiers.new('sol', 'SOLIDIFY'); sol.thickness = 0.012; sol.offset = 1
tex = bpy.data.textures.new('sac', 'CLOUDS'); tex.noise_scale = 0.01
dsp = kafa.modifiers.new('disp', 'DISPLACE'); dsp.texture = tex; dsp.strength = 0.004
uygula(kafa); kemige_bagla(kafa, 'Head'); PARCALAR.append(kafa)

# ---------------- dışa aktarma: iskelet + parçalar ----------------
if KAYNAK: bpy.data.objects.remove(KAYNAK, do_unlink=True)
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ARM and not o.name.startswith('C_') and o.parent_type != 'BONE']:
    bpy.data.objects.remove(o, do_unlink=True)  # oguz.glb'nin kendi gövdesi dışarıda kalır
for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.name.startswith(('C_', 'orgu_'))]:
    bpy.data.objects.remove(o, do_unlink=True)  # oguz.glb'nin başlık ve silahları
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    o.select_set(True)
for o in bpy.context.scene.objects:
    if o.type == 'MESH': print(f'{o.name:22s} üçgen {sum(len(p.vertices) - 2 for p in o.data.polygons):6d}  bağ: {o.parent_bone or (o.parent.name if o.parent else "-")}')
bpy.ops.export_scene.gltf(filepath=CIKTI, export_format='GLB', use_selection=True, export_animations=False, export_skins=True,
                          export_yup=True, export_apply=False, export_normals=True, export_texcoords=True)
print('yazıldı:', CIKTI, os.path.getsize(CIKTI) // 1024, 'KB')
