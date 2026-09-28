# Karakterlerde gölge boşlukları (ortam kapanması, AO): kol altı, yaka altı, bacak arası, kıvrımlar.
# Blender Python modülüyle (pip install bpy): python3 tools/karakter_ao.py [model ...]  -> src/assets/ao.json
# Model dosyalarına dokunulmaz. Her parça için köşe başına bir bayt; anahtar: köşe sayısı + ilk köşenin konumu
# (src/ayrinti.js aoAnahtar ile aynı). Blender glTF köşe sırasını birebir korur (denetlendi).
# Kapatan yüzeyler: iskelete giydirilmiş gövde parçaları. Kemiğe takılı parçalar (başlık, silah) kostüme göre
# açılıp kapandığı için gölge düşürmez ama kendileri gölge alır.
import base64, glob, json, math, os, random, sys
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLA = {'anims', 'doga', 'kale', 'dunya'}
import re
ACILIR = re.compile(r'^(Hair_Beard|C_.*|orgu_.*|Bork|Kavuk|Sarik|Taj|Collar|AltinBork|GoldPlates|Antlers|EagleHat|Feathers|BearHat|ClawL|ClawR|YakutHat|Headband|Kalpak|HunCap|KulTiginTac|Tug)(\.\d+)?$')
ISIN = 24          # köşe başına ışın
MESAFE = 0.1       # model boyunun oranı olarak ışın uzunluğu


def yon_kumesi(n):
    """Birim yarıküre üzerinde kosinüs ağırlıklı, düzgün dağılmış yönler (z yukarı)."""
    rnd = random.Random(7); out = []
    for i in range(n):
        u, v = (i + rnd.random()) / n, rnd.random()
        r, a = math.sqrt(u), 2 * math.pi * v
        out.append(Vector((r * math.cos(a), r * math.sin(a), math.sqrt(max(0, 1 - u)))))
    return out


def model_ao(yol):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=yol)
    if os.path.basename(yol) == 'oguz.glb' and os.path.exists(yol.replace('oguz.glb', 'kiyafet.glb')):  # kostüm parçaları gövdeyle birlikte
        bpy.ops.import_scene.gltf(filepath=yol.replace('oguz.glb', 'kiyafet.glb'))
    for a in [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']: a.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ms = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    giyinik = any(any(m.type == 'ARMATURE' for m in o.modifiers) for o in ms)
    # açılıp kapanan parçalar (sakal, başlıklar, C_ kostüm parçaları) gölge düşürmez: kapalıyken yüzde iz bırakmasın
    deri = lambda o: not ACILIR.match(o.name) and (any(m.type == 'ARMATURE' for m in o.modifiers) or not giyinik)
    # kapatan yüzeyler (dünya koordinatında, dinlenme duruşu)
    vs, ps, zmin, zmax = [], [], 1e9, -1e9
    veri = {}
    for o in ms:
        ev = o.evaluated_get(dg); me = ev.to_mesh(); M = o.matrix_world; N = M.to_3x3().inverted().transposed()
        pos = [M @ v.co for v in me.vertices]; nor = [(N @ v.normal).normalized() for v in me.vertices]
        veri[o.name] = (pos, nor)
        for p in pos: zmin, zmax = min(zmin, p.z), max(zmax, p.z)
        if deri(o):
            b = len(vs); vs += pos; ps += [[b + i for i in p.vertices] for p in me.polygons]
        ev.to_mesh_clear()
    if not ps: return {}
    agac = BVHTree.FromPolygons(vs, ps)
    d = MESAFE * (zmax - zmin); yonler = yon_kumesi(ISIN); eps = d * 0.01
    # glTF ilk köşe konumu (anahtar) için: yerel koordinat, Blender z-yukarı -> glTF y-yukarı
    sonuc = {}
    for o in ms:
        pos, nor = veri[o.name]
        ao = bytearray(len(pos))
        for i, (p, n) in enumerate(zip(pos, nor)):
            t = n.orthogonal().normalized(); bt = n.cross(t)
            k = 0.0
            for y in yonler:
                r = t * y.x + bt * y.y + n * y.z
                hit, _, _, dist = agac.ray_cast(p + n * eps, r, d)
                if hit is not None: k += 1 - (dist / d) ** 2  # yakındaki engel daha koyu
            ao[i] = max(0, min(255, round(255 * (1 - k / ISIN))))
        # parçaları glTF ilkellerine göre böl: Blender köşeleri ilkel sırasıyla ardışık; malzeme yuvası sırası = ilkel sırası
        me = o.data
        sinir = {}
        for pl in me.polygons:
            r = sinir.setdefault(pl.material_index, [10 ** 9, -1])
            for vi in pl.vertices: r[0] = min(r[0], vi); r[1] = max(r[1], vi)
        araliklar = sorted(tuple(x) for x in sinir.values()) if sinir else [(0, len(me.vertices) - 1)]
        for a, b in araliklar:
            v0 = me.vertices[a].co; x, y, z = v0.x, v0.z, -v0.y
            f = lambda q: f'{round(q * 1000) / 1000:.3f}'.replace('-0.000', '0.000')
            sonuc[f'{b - a + 1}:{f(x)},{f(y)},{f(z)}'] = base64.b64encode(bytes(ao[a:b + 1])).decode()
    return sonuc


if __name__ == '__main__':
    adlar = sys.argv[1:] or sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(KOK, 'src', 'assets', '*.glb')) if os.path.basename(f)[:-4] not in ATLA)
    cikti = os.path.join(KOK, 'src', 'assets', 'ao.json')
    hepsi = json.load(open(cikti)) if os.path.exists(cikti) else {}
    for ad in adlar:
        hepsi[ad] = model_ao(os.path.join(KOK, 'src', 'assets', ad + '.glb'))
        print(ad, len(hepsi[ad]), 'parça', flush=True)
    json.dump(hepsi, open(cikti, 'w'), separators=(',', ':'))
    print('->', cikti, os.path.getsize(cikti) // 1024, 'KB')
