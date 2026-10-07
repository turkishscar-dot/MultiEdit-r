# Meshy çevre/engel çıktılarını ai_isle.py hattına bağlar.
#   python tools/meshy_cevre.py          ai-kaynak/nesneler/cevre/<X>/meshy.glb -> ai-kaynak/<id>/ham.glb
# Sonra (Blender ile):
#   blender -b --python tools/ai_isle.py -- <id...>   ve   blender -b --python tools/ai_isle.py -- paket
import os, json, shutil

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AK = os.path.join(KOK, 'ai-kaynak')
LISTE = json.load(open(os.path.join(KOK, 'tools', 'ai_liste.json'), encoding='utf-8'))['nesne']
TAM = {'Bush': 'cali1', 'Bush_Flowers': 'cali2', 'Tower': 'kule1', 'WatchTowerWRoof': 'kule2', 'LargeTower': 'kule3', 'Pagoda': 'pagoda'}


def id_bul(klasor):
    if klasor in TAM: return TAM[klasor]
    if klasor.startswith('Engel_'): return klasor[6:]
    if '_ai' in klasor: return klasor.split('_ai', 1)[1]
    return None


hazir = []
cevre = os.path.join(AK, 'nesneler', 'cevre')
for k in sorted(os.listdir(cevre)):
    g = os.path.join(cevre, k, 'meshy.glb')
    i = id_bul(k)
    if not os.path.exists(g) or i not in LISTE: continue
    os.makedirs(os.path.join(AK, i), exist_ok=True)
    shutil.copyfile(g, os.path.join(AK, i, 'ham.glb'))
    hazir.append(i)
print(' '.join(hazir))
