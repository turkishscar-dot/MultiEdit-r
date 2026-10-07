# Meshy Rigging (5 kredi): Meshy modelinin eklem yerlerini bulup iskelet takar. T-pozunda gelmeyen modeli tools/tpoz.py ile T-pozuna çevirmek için.
#   python tools/meshy_iskelet.py <id...>     girdi: <id>/metin.json'daki doku görevi; çıktı: ai-kaynak/meshy/<id>/rigli.glb
# Anahtar dosyaya yazılmaz: MESHY_API_KEY_2 (yoksa MESHY_API_KEY). Görev kimliği metin.json'a yazılır (tekrar çalıştırmak kredi harcamaz).
import os, sys, json, time, urllib.request, urllib.error
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.meshy.ai/openapi/v1/rigging'
KEY = os.environ.get('MESHY_API_KEY_2') or os.environ.get('MESHY_API_KEY', '')


def istek(url, veri=None):
    r = urllib.request.Request(url, data=json.dumps(veri).encode() if veri else None, headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(r, timeout=120))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code}: {e.read().decode()[:300]}')


for cid in sys.argv[1:]:
    kd = os.path.join(KOK, 'ai-kaynak', 'meshy', cid); kayit = os.path.join(kd, 'metin.json')
    k = json.load(open(kayit))
    if 'rig' not in k:
        k['rig'] = istek(API, {'input_task_id': k['refine'], 'height_meters': 1.8})['result']; json.dump(k, open(kayit, 'w'))
    while True:
        g = istek(f"{API}/{k['rig']}")
        if g['status'] == 'SUCCEEDED': break
        if g['status'] in ('FAILED', 'CANCELED'): raise RuntimeError(f"iskelet {g['status']}: {g.get('task_error')}")
        print(f"  {cid} iskelet %{g.get('progress', 0)}", flush=True); time.sleep(10)
    urllib.request.urlretrieve(g['result']['rigged_character_glb_url'], os.path.join(kd, 'rigli.glb'))
    print(cid, 'rigli.glb', os.path.getsize(os.path.join(kd, 'rigli.glb')) // 1024, 'KB', flush=True)
