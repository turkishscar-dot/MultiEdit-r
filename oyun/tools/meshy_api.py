# Meshy Multi-Image-to-3D: ön/sağ/arka/sol görüntülerinden dokulu GLB üretir.
#   python tools/meshy_api.py <id> [--dene]      (--dene: yalnızca göndereceği isteği yazar, kredi harcamaz)
# Anahtar dosyaya YAZILMAZ: MESHY_API_KEY ortam değişkeninden okunur. Çıktı: ai-kaynak/meshy/<id>/meshy.glb
# Sonra: python tools/meshy_uydur.py ai-kaynak/meshy/<id>/meshy.glb src/assets/<id>.glb 30000
import os, sys, json, time, base64, urllib.request, urllib.error

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.meshy.ai/openapi/v1/multi-image-to-3d'
# İki hesap: MESHY_API_KEY (birinci) ve MESHY_API_KEY_2 (ikinci). Birincinin kredisi bitince ikinciye geçilir.
KEYS = [k for k in (os.environ.get('MESHY_API_KEY', ''), os.environ.get('MESHY_API_KEY_2', '')) if k]
KEY = KEYS[0] if KEYS else ''
sira = 0
args = [a for a in sys.argv[1:] if not a.startswith('--')]
DENE = '--dene' in sys.argv
if not args:
    sys.exit('kullanım: python tools/meshy_api.py <yiğit> [--dene]')
cid = args[0]
D = os.path.join(KOK, 'ai-kaynak', 'meshy')
bilgi = json.load(open(os.path.join(D, 'karakterler.json'), encoding='utf-8'))[cid]


def data_uri(yol):
    return 'data:image/png;base64,' + base64.b64encode(open(yol, 'rb').read()).decode()


# Meshy en çok 4 görsel alır; sıra: ön, sağ, arka, sol
yollar = [os.path.join(D, cid, f'{y}.png') for y in ('on', 'sag', 'arka', 'sol')]
for y in yollar:
    if not os.path.exists(y):
        sys.exit(f'yok: {y}  (önce: node tools/meshy-4yon.mjs {cid})')
govde = {
    'image_urls': [data_uri(y) for y in yollar],
    'ai_model': 'meshy-6',            # meshy-7.1 daha yeni ama pahalı olabilir; fiyatı panelden kontrol et
    'pose_mode': 't-pose',            # oyun iskeleti T-pozdan ağırlık aktarır
    'should_remesh': True, 'topology': 'triangle', 'target_polycount': 30000,
    'should_texture': True, 'enable_pbr': True, 'texture_resolution': '2k',
    'texture_prompt': bilgi['texture_prompt'],
    'target_formats': ['glb'],
}
if DENE:
    g = dict(govde); g['image_urls'] = [f'<{os.path.basename(y)} {os.path.getsize(y)//1024} KB>' for y in yollar]
    print(json.dumps(g, indent=1, ensure_ascii=False)); sys.exit()
if not KEY:
    sys.exit('MESHY_API_KEY yok (ortam değişkeni). README: ai-kaynak/meshy/NASIL.md')
print(f'{len(KEYS)} hesap anahtarı bulundu')


def istek(yol, veri=None):
    global KEY, sira
    r = urllib.request.Request(yol, data=json.dumps(veri).encode() if veri else None, headers={'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(r, timeout=120))
    except urllib.error.HTTPError as e:
        if e.code == 402 and veri and sira + 1 < len(KEYS):  # yetersiz kredi: yeni görev açarken ikinci hesaba geç
            sira += 1; KEY = KEYS[sira]; print('birinci hesapta kredi yok, ikinci hesaba geçildi')
            return istek(yol, veri)
        sys.exit(f'Meshy hata {e.code}: {e.read().decode()[:400]}')


gorev = istek(API, govde)['result']
print('görev', gorev)
while True:
    t = istek(f'{API}/{gorev}')
    print(t['status'], t.get('progress'), end='\r')
    if t['status'] == 'SUCCEEDED': break
    if t['status'] in ('FAILED', 'CANCELED'): sys.exit(f"\nbaşarısız: {t.get('task_error')}")
    time.sleep(10)
cikti = os.path.join(D, cid, 'meshy.glb')
urllib.request.urlretrieve(t['model_urls']['glb'], cikti)
print('\ntamam', cikti, '| harcanan kredi:', t.get('consumed_credits'))
