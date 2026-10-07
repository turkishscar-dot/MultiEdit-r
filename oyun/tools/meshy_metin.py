# Meshy Text-to-3D: yiğidi yazılı tariften (tools/meshy_metin.json) T-pozunda, dokulu üretir. Eski referans görüntülerinin kusurlarını taşımaz.
#   python tools/meshy_metin.py <id...> [--dene]     (--dene: isteği yazar, kredi harcamaz)
# Model: MESHY_MODEL (varsayılan meshy-6-lite: şekil 5 + doku 10 = 15 kredi; meshy-6: 20 + 10 = 30)
# Anahtar dosyaya yazılmaz: MESHY_API_KEY_2 (yoksa MESHY_API_KEY). Görev kimlikleri <id>/metin.json'a yazılır: tekrar çalıştırmak yeni kredi harcamaz.
# Çıktı: ai-kaynak/meshy/<id>/meshy.glb (eskisi eski/meshy_onceki.glb). Sonra: tools/meshy_uydur.py ile giydir.
import os, sys, json, time, shutil, urllib.request, urllib.error

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(KOK, 'ai-kaynak', 'meshy')
API = 'https://api.meshy.ai/openapi/v2/text-to-3d'
KEY = os.environ.get('MESHY_API_KEY_2') or os.environ.get('MESHY_API_KEY', '')
MODEL = os.environ.get('MESHY_MODEL', 'meshy-6-lite')
T = json.load(open(os.path.join(KOK, 'tools', 'meshy_metin.json'), encoding='utf-8'))
DENE = '--dene' in sys.argv
ids = [a for a in sys.argv[1:] if not a.startswith('--')]


def istek(url, veri=None):
    for _ in range(20):
        r = urllib.request.Request(url, data=json.dumps(veri).encode() if veri else None, headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
        try:
            return json.load(urllib.request.urlopen(r, timeout=120))
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(20); continue
            raise RuntimeError(f'HTTP {e.code}: {e.read().decode()[:300]}')
        except (urllib.error.URLError, TimeoutError):
            if veri: raise  # gönderim tekrar edilmez (çift ücret riski)
            time.sleep(15)
    raise RuntimeError('çok fazla 429')


def bekle(gid):
    while True:
        g = istek(f'{API}/{gid}')
        if g['status'] == 'SUCCEEDED': return g
        if g['status'] in ('FAILED', 'CANCELED'): raise RuntimeError(f"görev {g['status']}: {g.get('task_error')}")
        print(f"  {gid[:8]} %{g.get('progress', 0)}", flush=True); time.sleep(15)


for cid in ids:
    t = T[cid]
    prompt = (T['_on'] + ' ' + t['prompt'] + ' ' + T['_son'])[:800]
    doku = (T['_doku'] + ' ' + t['doku'])[:800]
    on = {'mode': 'preview', 'prompt': prompt, 'ai_model': MODEL, 'pose_mode': 't-pose', 'should_remesh': True, 'topology': 'triangle', 'target_polycount': 30000, 'target_formats': ['glb']}
    if DENE:
        print(cid, len(prompt), 'harf\n', json.dumps(on, ensure_ascii=False, indent=1), '\ndoku:', doku); continue
    kd = os.path.join(D, cid); kayit = os.path.join(kd, 'metin.json')
    k = json.load(open(kayit)) if os.path.exists(kayit) else {}
    if 'preview' not in k:
        k['preview'] = istek(API, on)['result']; json.dump(k, open(kayit, 'w'))
    print(cid, 'şekil', k['preview']); bekle(k['preview'])
    if 'refine' not in k:
        k['refine'] = istek(API, {'mode': 'refine', 'preview_task_id': k['preview'], 'texture_prompt': doku, 'enable_pbr': False, 'texture_resolution': '2k', 'target_formats': ['glb']})['result']; json.dump(k, open(kayit, 'w'))
    print(cid, 'doku', k['refine']); g = bekle(k['refine'])
    os.makedirs(os.path.join(kd, 'eski'), exist_ok=True)
    if os.path.exists(os.path.join(kd, 'meshy.glb')) and not os.path.exists(os.path.join(kd, 'eski', 'meshy_onceki.glb')):
        shutil.copy(os.path.join(kd, 'meshy.glb'), os.path.join(kd, 'eski', 'meshy_onceki.glb'))
    urllib.request.urlretrieve(g['model_urls']['glb'], os.path.join(kd, 'meshy.glb'))
    if g.get('thumbnail_url'): urllib.request.urlretrieve(g['thumbnail_url'], os.path.join(kd, 'metin_onizleme.png'))
    print(cid, 'tamam', os.path.getsize(os.path.join(kd, 'meshy.glb')) // 1024, 'KB', flush=True)
