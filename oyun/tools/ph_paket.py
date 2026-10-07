# tools/ph-kaynak/<ad>/ (Poly Haven, CC0) modellerini sadeleştirir, dokuları küçültür, tek src/assets/ph.glb paketine yazar.
#   blender -b --python tools/ph_paket.py            (hepsi)   |   ... -- ad1 ad2   (yalnız bunlar)
# Düğüm adı 'PH_<ad>': dibi (0,0,0)'da, ayakta (Y yukarı), gerçek ölçekte (metre).
import os, sys, bpy
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(KOK, 'tools', 'ph-kaynak')
HEDEF_UCGEN = {  # varsayılan 3500; büyük parçalar ve dokulu detaylılar için
    'namaqualand_cliff_01': 6000, 'namaqualand_cliff_02': 6000, 'rock_face_01': 5000, 'rock_face_02': 5000,
    'modular_fort_01': 9000, 'modular_wooden_pier': 4000, 'gothic_statue': 5000, 'horse_statue_01': 4000,
    'root_cluster_01': 3000, 'root_cluster_02': 3000, 'pine_roots': 3000, 'fir_sapling_medium': 6000, 'island_tree_01': 5000,
}
DOKU = 512
ATLA = {'fir_sapling_medium', 'island_tree_01'}  # milyonlarca üçgen, Blender'da kilitleniyor
adlar = sorted(a for a in (sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else os.listdir(KAYNAK)) if a not in ATLA)
bpy.ops.wm.read_factory_settings(use_empty=True)
sahne = bpy.context.scene
yeni = []
for ad in adlar:
    print('BASLA', ad, flush=True)
    kl = os.path.join(KAYNAK, ad)
    gl = [f for f in os.listdir(kl) if f.endswith('.gltf')][0]
    once = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(kl, gl))
    yeniler = [o for o in bpy.data.objects if o not in once]
    meshler = [o for o in yeniler if o.type == 'MESH']
    if not meshler: print('ATLANDI (mesh yok)', ad, flush=True); continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshler:
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.ops.object.join()
    m = bpy.context.view_layer.objects.active
    for o in [x for x in bpy.data.objects if x != m and x.type != 'MESH' and x.name in {y for y in bpy.data.objects.keys()}]:
        bpy.data.objects.remove(o, do_unlink=True)
    if m.data.shape_keys:
        for k in list(m.data.shape_keys.key_blocks)[::-1]: m.shape_key_remove(k)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0005); bpy.ops.mesh.delete_loose(); bpy.ops.object.mode_set(mode='OBJECT')
    n = len(m.data.polygons)
    hedef = HEDEF_UCGEN.get(ad, 3500)
    for _ in range(4):  # ayrık kabuklu parçalarda tek geçiş hedefe inmeyebilir
        n_ = len(m.data.polygons)
        if n_ <= hedef * 1.15: break
        d = m.modifiers.new('d', 'DECIMATE'); d.ratio = max(0.02, hedef / n_); d.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier='d')
    # dibi (0,0,0), tabanın ortası
    zs = [v.co.z for v in m.data.vertices]; xs = [v.co.x for v in m.data.vertices]; ys = [v.co.y for v in m.data.vertices]
    for v in m.data.vertices:
        v.co.x -= (min(xs) + max(xs)) / 2; v.co.y -= (min(ys) + max(ys)) / 2; v.co.z -= min(zs)
    m.name = 'PH_' + ad; m.data.name = 'PH_' + ad
    # pürüzlülük/metal bağlantılarını kes (ORM dokusu pakete girmesin), dokuları küçült
    for mat in {s.material for s in m.material_slots if s.material}:
        if not mat.node_tree: continue
        for nd in mat.node_tree.nodes:
            if nd.type == 'BSDF_PRINCIPLED':
                for ad_ in ('Roughness', 'Metallic'):
                    for l in list(nd.inputs[ad_].links): mat.node_tree.links.remove(l)
                nd.inputs['Roughness'].default_value = 0.9; nd.inputs['Metallic'].default_value = 0
    print('PAKET', ad, n, '->', len(m.data.polygons), flush=True)
    yeni.append(m)
for im in bpy.data.images:
    if im.size[0] > DOKU: im.scale(DOKU, max(1, int(im.size[1] * DOKU / im.size[0])))
bpy.ops.object.select_all(action='DESELECT')
for o in yeni: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(KOK, 'src', 'assets', 'ph.glb'), export_format='GLB', use_selection=True,
    export_image_format='WEBP', export_image_quality=78, export_yup=True, export_apply=True)
print('YAZILDI', os.path.getsize(os.path.join(KOK, 'src', 'assets', 'ph.glb')) // 1024, 'KB')
