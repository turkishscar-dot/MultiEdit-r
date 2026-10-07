# (adlandırma ai_isle.py paket ile aynı)
# Mevcut src/assets/dunya.glb'yi korur; ai-kaynak/<id>/temiz.glb dosyalarını 'Engel_<id>' (dekor: aile adı) olarak üstüne yazar/ekler.
#   blender -b --python tools/dunya_birlestir.py -- barikat [<id> ...]
import os, sys, json, bpy
from mathutils import Vector
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ai_isle import eski_boylar
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YOL = os.path.join(KOK, 'src', 'assets', 'dunya.glb')
LISTE = json.load(open(os.path.join(KOK, 'tools', 'ai_liste.json'), encoding='utf-8'))['nesne']
TAM_AD = {'Bush', 'Bush_Flowers', 'Tower', 'WatchTowerWRoof', 'LargeTower', 'Pagoda'}
ids = sys.argv[sys.argv.index('--') + 1:]
eski = eski_boylar()  # dekor, doga/kale paketindeki aynı ailenin ortalama boyuna ölçeklenir (ai_isle.py paket gibi)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=YOL)
for i in ids:
    t = LISTE[i]
    ad = ('Engel_' + i) if t['tur'] != 'dekor' else (t['aile'] if t['aile'] in TAM_AD else f"{t['aile']}_ai{i}")
    for o in [x for x in bpy.context.scene.objects if x.name.split('.')[0] == ad]:
        bpy.data.objects.remove(o, do_unlink=True)
    once = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(KOK, 'ai-kaynak', i, 'temiz.glb'))
    yeni = [o for o in bpy.context.scene.objects if o not in once]
    m = [o for o in yeni if o.type == 'MESH'][0]
    m.name = ad; m.data.name = ad; m.parent = None
    for o in yeni:
        if o != m: bpy.data.objects.remove(o, do_unlink=True)
    hs = [h for n, h in eski.items() if n == t.get('aile') or n.startswith(str(t.get('aile')) + '_')] if t['tur'] == 'dekor' else []
    if hs:
        zs = [(m.matrix_world @ Vector(c)).z for c in m.bound_box]
        m.scale *= (sum(hs) / len(hs)) / (max(zs) - min(zs))
        bpy.ops.object.select_all(action='DESELECT'); m.select_set(True); bpy.context.view_layer.objects.active = m
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=YOL, export_format='GLB', use_selection=True, export_apply=True, export_animations=False,
                          export_yup=True, export_image_format='WEBP', export_image_quality=82, export_normals=True, export_texcoords=True)
print('dunya.glb:', len([o for o in bpy.context.scene.objects]), 'düğüm', round(os.path.getsize(YOL) / 1e6, 2), 'MB')
