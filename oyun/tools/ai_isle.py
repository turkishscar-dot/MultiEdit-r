# Yapay zekâ modellerini oyuna hazırlar (Blender Python modülü: pip install bpy).
#   python3 tools/ai_isle.py <id> [<id> ...]     ai-kaynak/<id>/ham.glb -> ai-kaynak/<id>/temiz.glb
#   python3 tools/ai_isle.py paket               ai-kaynak/*/temiz.glb -> src/assets/dunya.glb (tek paket, isimli düğümler)
# Temizlik: görseldeki gölgeden kalan yer plakası silinir, üçgen sayısı düşürülür, yumuşak gölgelendirme,
# taban ortası sıfır noktası olur, doku 512 piksel WebP'ye küçülür.
import json, math, os, sys
import bpy, bmesh
from mathutils import Vector

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(KOK, 'ai-kaynak')
LISTE = json.load(open(os.path.join(KOK, 'tools', 'ai_liste.json')))['nesne']
UCGEN = {'engel': 3500, 'alcak': 3000, 'yuksek': 4000, 'dekor': 1000}
# dekor sahnede yüzlerce kez tekrarlanır (telefonda üçgen bütçesi): aileye göre
AILE_UCGEN = {'Rock': 500, 'Bush': 1500, 'Bush_Flowers': 1500, 'Tower': 1500, 'WatchTowerWRoof': 1500, 'LargeTower': 1500, 'Pagoda': 1500}
DOKU = 512


def sifirla():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mesh_nesneleri():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']


def birlestir(ad):
    ms = mesh_nesneleri()
    bpy.ops.object.select_all(action='DESELECT')
    for o in ms: o.select_set(True)
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    for x in [x for x in bpy.context.scene.objects if x != o]: bpy.data.objects.remove(x, do_unlink=True)
    o.name = ad
    return o


def taban_temizle(o, esik=0.03):
    """Gölgeden kalan düz yer plakasını sil: en alttaki yatay, merkezden uzak yüzler ve alçak, yassı kopuk parçalar."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    zs = [v.co.z for v in bm.verts]; z0, z1 = min(zs), max(zs); h = z1 - z0
    cx = sum(v.co.x for v in bm.verts) / len(bm.verts); cy = sum(v.co.y for v in bm.verts) / len(bm.verts)
    # kopuk parçalar
    sil, gorulen = set(), set()
    for f in bm.faces:
        if f.index in gorulen: continue
        yigin, parca = [f], []
        gorulen.add(f.index)
        while yigin:
            g = yigin.pop(); parca.append(g)
            for e in g.edges:
                for n in e.link_faces:
                    if n.index not in gorulen: gorulen.add(n.index); yigin.append(n)
        pz = [v.co.z for g in parca for v in g.verts]
        if max(pz) - min(pz) < 0.05 * h and max(pz) < z0 + 0.08 * h: sil.update(parca)
    for f in bm.faces:
        if f in sil: continue
        if all(v.co.z < z0 + esik * h for v in f.verts) and abs(f.normal.z) > (0.85 if esik <= 0.03 else 0.6):
            r = min(math.hypot(v.co.x - cx, v.co.y - cy) for v in f.verts)
            if r > 0.06 * h: sil.add(f)
    bmesh.ops.delete(bm, geom=list(sil), context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(o.data); bm.free()
    return len(sil)


def hafiflet(o, hedef):
    n = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if n > hedef:
        m = o.modifiers.new('dec', 'DECIMATE'); m.ratio = hedef / n; m.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
    return n, sum(len(p.vertices) - 2 for p in o.data.polygons)


def hizala(o):
    """Engeller çapraz açıdan çizilmiş görsellerden gelir: dikey eksen etrafında derinliği en az yapan açıya döndür (genişlik X boyunca)."""
    ps = [v.co.copy() for v in o.data.vertices]
    en_iyi, aci = 1e9, 0
    for d in range(0, 180):
        a = math.radians(d); c, s_ = math.cos(a), math.sin(a)
        ys = [p.x * s_ + p.y * c for p in ps]; xs = [p.x * c - p.y * s_ for p in ps]
        derin, gen = max(ys) - min(ys), max(xs) - min(xs)
        k = derin - 0.15 * gen  # geniş ve sığ olan duruş
        if k < en_iyi: en_iyi, aci = k, d
    a = math.radians(aci); c, s_ = math.cos(a), math.sin(a)
    for v in o.data.vertices: x, y = v.co.x, v.co.y; v.co.x, v.co.y = x * c - y * s_, x * s_ + y * c
    return aci


def tabana_otur(o):
    xs = [(o.matrix_world @ v.co) for v in o.data.vertices]
    mn = Vector((min(p.x for p in xs), min(p.y for p in xs), min(p.z for p in xs)))
    mx = Vector((max(p.x for p in xs), max(p.y for p in xs), max(p.z for p in xs)))
    kay = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    for v in o.data.vertices: v.co -= kay
    return mx - mn


def doku_kucult(o, parlak=1.0):
    for s in o.material_slots:
        m = s.material
        if not m or not m.use_nodes: continue
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image and max(n.image.size) > DOKU:
                n.image.scale(DOKU, DOKU)
            if n.type == 'TEX_IMAGE' and n.image and parlak != 1.0:  # fazla koyu dokuyu aç
                import numpy as np
                px = np.empty(len(n.image.pixels), dtype=np.float32); n.image.pixels.foreach_get(px)
                px = px.reshape(-1, 4); px[:, :3] = np.clip(px[:, :3] * parlak, 0, 1)
                n.image.pixels.foreach_set(px.ravel()); n.image.update()
        b = m.node_tree.nodes.get('Principled BSDF')
        if b: b.inputs['Roughness'].default_value = 1.0; b.inputs['Metallic'].default_value = 0.0


def disa_aktar(yol, secili=True):
    bpy.ops.export_scene.gltf(filepath=yol, export_format='GLB', use_selection=secili, export_apply=True, export_animations=False,
                              export_yup=True, export_image_format='WEBP', export_image_quality=82, export_normals=True, export_texcoords=True)


def isle(i):
    t = LISTE[i]
    sifirla()
    bpy.ops.import_scene.gltf(filepath=os.path.join(KAYNAK, i, 'ham.glb'))
    o = birlestir(i)
    silinen = taban_temizle(o, t.get('taban', 0.03))
    once, sonra = hafiflet(o, AILE_UCGEN.get(t.get('aile'), UCGEN[t['tur']]))
    aci = hizala(o) if t['tur'] != 'dekor' else 0
    boy = tabana_otur(o)
    doku_kucult(o, t.get('parlak', 1.0))
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
    disa_aktar(os.path.join(KAYNAK, i, 'temiz.glb'))
    print(f'{i}: taban {silinen} yüz silindi, üçgen {once} -> {sonra}, dönüş {aci}°, boyut {boy.x:.2f} x {boy.y:.2f} x {boy.z:.2f}')


def eski_boylar():
    """Eski paketlerdeki (doga, kale) her üst düğümün yüksekliği: yeni dekor aynı boya ölçeklenir."""
    sifirla(); boy = {}
    for f in ('doga', 'kale'):
        once = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(KOK, 'src', 'assets', f + '.glb'))
        for o in [x for x in bpy.context.scene.objects if x not in once and x.parent is None]:
            zs = [(m.matrix_world @ Vector(c)).z for m in [o, *o.children_recursive] if m.type == 'MESH' for c in m.bound_box]
            if zs: boy[o.name] = max(zs) - min(zs)
    return boy


def paket():
    """temiz.glb'leri tek pakete topla. Düğüm adları: engeller 'Engel_<id>', dekor '<aile>_ai<id>' (Bush ve kule aileleri aynı adla)."""
    eski = eski_boylar()
    sifirla()
    tam_ad = {'Bush', 'Bush_Flowers', 'Tower', 'WatchTowerWRoof', 'LargeTower', 'Pagoda'}
    adlar = []
    for i, t in LISTE.items():
        yol = os.path.join(KAYNAK, i, 'temiz.glb')
        if not os.path.exists(yol) or t.get('atla'): continue
        once = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=yol)
        yeni = [o for o in bpy.context.scene.objects if o not in once]
        o = [x for x in yeni if x.type == 'MESH'][0]
        ad = ('Engel_' + i) if t['tur'] != 'dekor' else (t['aile'] if t['aile'] in tam_ad else f"{t['aile']}_ai{i}")
        o.name = ad; o.data.name = ad; adlar.append(ad)
        if t['tur'] == 'dekor':  # eski ailenin ortalama boyu
            hs = [h for n, h in eski.items() if n == t['aile'] or n.startswith(t['aile'] + '_')]
            if hs:
                zs = [(o.matrix_world @ Vector(c)).z for c in o.bound_box]
                o.scale *= (sum(hs) / len(hs)) / (max(zs) - min(zs))
                bpy.context.view_layer.objects.active = o; bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
                bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        for x in yeni:
            if x != o: bpy.data.objects.remove(x, do_unlink=True)
    bpy.ops.object.select_all(action='SELECT')
    cikti = os.path.join(KOK, 'src', 'assets', 'dunya.glb')
    disa_aktar(cikti)
    print('paket:', len(adlar), 'nesne ->', cikti, round(os.path.getsize(cikti) / 1e6, 2), 'MB')
    print(' '.join(adlar))


if __name__ == '__main__':
    if sys.argv[1] == 'paket': paket()
    else:
        for i in sys.argv[1:]: isle(i)
