# Yapay zekâ ile oyun nesnesi üretimi (Replicate): önce görsel (FLUX), sonra 3B model (TRELLIS).
# Anahtar dosyaya yazılmaz: REPLICATE_API_TOKEN ortam değişkeninden okunur.
#   python3 tools/ai_uret.py gorsel <id> [<id> ...]      -> ai-kaynak/<id>/g0..g2.png + ai-kaynak/<id>/secim.png (üçü yan yana)
#   python3 tools/ai_uret.py model <id>:<no> [...]       -> ai-kaynak/<id>/ham.glb (seçilen görselden)
#   python3 tools/ai_uret.py doku <id> [<id> ...]        -> ai-kaynak/doku/<id>/g0..g2.png (döşenebilir doku adayları)
# Tarifler: tools/ai_liste.json. Bakiye 5 doların altındayken Replicate aynı anda tek iş kabul eder; betik sırayla çalışır.
import json, os, sys, time, urllib.request, urllib.error, uuid

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAYNAK = os.path.join(KOK, 'ai-kaynak')
LISTE = json.load(open(os.path.join(KOK, 'tools', 'ai_liste.json')))
TOKEN = os.environ.get('REPLICATE_API_TOKEN', '')
API = 'https://api.replicate.com/v1'
TRELLIS = 'e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c'
STIL = ('stylized hand-painted fantasy game asset in the style of Genshin Impact and Zelda Breath of the Wild, '
        'clean readable shapes, rich but soft colors, isolated on a plain pure white background, entire object visible, centered, '
        'three-quarter view from slightly above, no ground, no floor, no shadow, no text')


def istek(yol, veri=None, bekle=0, tur='application/json'):
    for deneme in range(12):
        h = {'Authorization': 'Bearer ' + TOKEN}
        if veri is not None: h['Content-Type'] = tur
        if bekle: h['Prefer'] = f'wait={bekle}'
        r = urllib.request.Request(yol if yol.startswith('http') else API + yol, data=veri, headers=h, method='POST' if veri is not None else 'GET')
        try:
            with urllib.request.urlopen(r, timeout=bekle + 60) as c: return json.load(c)
        except urllib.error.HTTPError as e:
            govde = e.read().decode()
            if e.code == 429:  # hız sınırı: biraz bekle, tekrar dene
                time.sleep(12); continue
            raise RuntimeError(f'{e.code} {govde[:300]}')
        except (TimeoutError, urllib.error.URLError) as e:
            if veri is not None and deneme == 0:
                raise RuntimeError(f'bağlantı zaman aşımı (iş başlamış olabilir): {e}')
            time.sleep(5)
    raise RuntimeError('çok fazla deneme')


def calistir(model, girdi):
    yol = f'/models/{model}/predictions' if '/' in model else '/predictions'
    govde = {'input': girdi} if '/' in model else {'version': model, 'input': girdi}
    p = istek(yol, json.dumps(govde).encode(), bekle=30)
    while p['status'] not in ('succeeded', 'failed', 'canceled'):
        time.sleep(4); p = istek(f"/predictions/{p['id']}")
    if p['status'] != 'succeeded': raise RuntimeError(f"{p['id']} {p['status']}: {p.get('error')}")
    return p


def indir(url, yol):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    with urllib.request.urlopen(url, timeout=180) as c, open(yol, 'wb') as f: f.write(c.read())


def yukle(yol):  # dosyayı Replicate'e yükle (teslim adresleri bir saatte silinir)
    sinir = uuid.uuid4().hex
    govde = (f'--{sinir}\r\nContent-Disposition: form-data; name="content"; filename="{os.path.basename(yol)}"\r\n'
             f'Content-Type: image/png\r\n\r\n').encode() + open(yol, 'rb').read() + f'\r\n--{sinir}--\r\n'.encode()
    return istek('/files', govde, tur=f'multipart/form-data; boundary={sinir}')['urls']['get']


def yan_yana(yollar, cikti, h=420):
    from PIL import Image, ImageDraw
    ims = [Image.open(p).convert('RGB') for p in yollar]
    ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
    w = Image.new('RGB', (sum(i.width for i in ims) + 8 * (len(ims) - 1), h + 26), 'white')
    x = 0
    for n, im in enumerate(ims):
        w.paste(im, (x, 26)); ImageDraw.Draw(w).text((x + 6, 6), str(n), fill='black'); x += im.width + 8
    w.save(cikti)


def gorsel(i, doku=False):
    t = LISTE['doku' if doku else 'nesne'][i]
    klasor = os.path.join(KAYNAK, 'doku' if doku else '', i)
    if doku:
        istem = t['istem'] + ', seamless tileable texture, flat top-down orthographic view, even lighting, no shadows, no perspective, stylized hand-painted game texture'
    else:
        istem = t['istem'] + ', ' + STIL
    p = calistir('black-forest-labs/flux-schnell', {'prompt': istem, 'aspect_ratio': t.get('oran', '1:1'), 'output_format': 'png', 'num_outputs': 3, 'seed': t.get('tohum', 5)})
    yollar = []
    for n, u in enumerate(p['output']):
        yollar.append(os.path.join(klasor, f'g{n}.png')); indir(u, yollar[-1])
    yan_yana(yollar, os.path.join(klasor, 'secim.png'))
    print('görsel', i, '->', klasor)


def model(i, no):
    klasor = os.path.join(KAYNAK, i)
    url = yukle(os.path.join(klasor, f'g{no}.png'))
    p = calistir(TRELLIS, {'images': [url], 'generate_model': True, 'generate_color': False, 'texture_size': 1024, 'mesh_simplify': 0.95, 'seed': 7})
    indir(p['output']['model_file'], os.path.join(klasor, 'ham.glb'))
    json.dump({'gorsel': no, 'tahmin': p['id'], 'sure': p.get('metrics', {}).get('predict_time')}, open(os.path.join(klasor, 'bilgi.json'), 'w'))
    print('model', i, 'hazır', round(p.get('metrics', {}).get('predict_time', 0)), 'sn')


if __name__ == '__main__':
    if not TOKEN: sys.exit('REPLICATE_API_TOKEN yok')
    is_, *adlar = sys.argv[1:]
    for a in adlar:
        try:
            if is_ == 'gorsel': gorsel(a)
            elif is_ == 'doku': gorsel(a, True)
            elif is_ == 'model': i, no = a.split(':'); model(i, int(no))
        except Exception as e:
            print('HATA', a, e)
