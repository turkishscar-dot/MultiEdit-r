# Poly Haven (CC0) modellerini 1K glTF olarak tools/ph-kaynak/<ad>/ içine indirir. Kullanım: python tools/ph_indir.py ad1 ad2 ...
import json, os, sys, urllib.request
KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ph-kaynak')
def al(u): return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'oguz-kagan'})).read()
for ad in sys.argv[1:]:
    d = json.loads(al(f'https://api.polyhaven.com/files/{ad}'))['gltf']['1k']['gltf']
    k = os.path.join(KOK, ad); os.makedirs(k, exist_ok=True)
    top = 0
    for yol, f in [(os.path.basename(d['url']), d)] + list(d['include'].items()):
        hedef = os.path.join(k, yol); os.makedirs(os.path.dirname(hedef), exist_ok=True)
        if not os.path.exists(hedef): open(hedef, 'wb').write(al(f['url']))
        top += os.path.getsize(hedef)
    print(ad, round(top / 1e6, 1), 'MB')
