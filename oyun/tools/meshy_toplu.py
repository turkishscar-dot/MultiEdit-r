# Meshy toplu üretim: ai-kaynak altındaki 4 yönlü görsellerden (on/sag/arka/sol.png) dokulu GLB üretir.
#   python tools/meshy_toplu.py <klasör...> [--dene] [--paralel 4]
#   klasör örnekleri: meshy/oguz   nesneler/engel/barricade   (ai-kaynak'a göre)
#   ya da hazır grup: @yigit  @boss  @dusman  @model  @engel  @esya  @cevre
# Anahtarlar dosyaya YAZILMAZ: MESHY_API_KEY, kredi bitince (402) MESHY_API_KEY_2 ortam değişkeninden okunur.
# Güvenli devam: görev kimliği <klasör>/gorev.json'a yazılır; tekrar çalıştırınca yeni görev açılmaz, eskisi beklenir.
# Çıktı: <klasör>/meshy.glb   Günlük: ai-kaynak/meshy_toplu.log
import os, sys, json, time, base64, urllib.request, urllib.error, threading

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AK = os.path.join(KOK, 'ai-kaynak')
API = 'https://api.meshy.ai/openapi/v1/multi-image-to-3d'
KEYS = [k for k in (os.environ.get('MESHY_API_KEY_2', ''), os.environ.get('MESHY_API_KEY', '')) if k]
YIGIT10 = ['oguz', 'mete', 'bumin', 'bilge', 'kultigin', 'tonyukuk', 'alperTunga', 'attila', 'basat', 'beyrek']
KARAKTER = json.load(open(os.path.join(AK, 'meshy', 'karakterler.json'), encoding='utf-8'))
kilit = threading.Lock()
anahtar_sira = [0]


def grup(ad):
    if ad == 'yigit':
        return [f'meshy/{i}' for i in YIGIT10]
    d = os.path.join(AK, 'nesneler', ad)
    return sorted(f'nesneler/{ad}/{x}' for x in os.listdir(d) if os.path.isdir(os.path.join(d, x)))


def gunluk(s):
    with kilit:
        print(s, flush=True)
        with open(os.path.join(AK, 'meshy_toplu.log'), 'a', encoding='utf-8') as f:
            f.write(time.strftime('%Y-%m-%d %H:%M:%S ') + s + '\n')


def istek(url, veri=None):
    while True:
        key = KEYS[anahtar_sira[0]]
        r = urllib.request.Request(url, data=json.dumps(veri).encode() if veri else None,
                                   headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        try:
            return json.load(urllib.request.urlopen(r, timeout=180))
        except urllib.error.HTTPError as e:
            govde = e.read().decode()[:300]
            if e.code == 402 and veri:
                with kilit:
                    if anahtar_sira[0] + 1 < len(KEYS):
                        anahtar_sira[0] += 1
                        print('birinci hesapta kredi bitti, ikinci hesaba geçildi', flush=True)
                        continue
                raise RuntimeError('kredi bitti (402)')
            if e.code == 429:
                time.sleep(20); continue
            raise RuntimeError(f'HTTP {e.code}: {govde}')
        except (urllib.error.URLError, TimeoutError) as e:
            time.sleep(15)
            if veri:  # gönderim ağ hatasında tekrar edilmez (çift ücret riski)
                raise RuntimeError(f'ağ hatası: {e}')


def govde_hazirla(rel):
    d = os.path.join(AK, rel)
    yollar = [os.path.join(d, f'{y}.png') for y in ('on', 'sag', 'arka', 'sol')]
    eksik = [y for y in yollar if not os.path.exists(y)]
    if eksik:
        raise RuntimeError('görsel yok: ' + ', '.join(os.path.basename(y) for y in eksik))
    g = {
        'image_urls': ['data:image/png;base64,' + base64.b64encode(open(y, 'rb').read()).decode() for y in yollar],
        'ai_model': os.environ.get('MESHY_MODEL', 'meshy-6'),  # bozuk çıkanı yeniden denerken: MESHY_MODEL=meshy-7.1
        'should_remesh': True, 'topology': 'triangle',
        'should_texture': True, 'enable_pbr': False,
    }
    cid = os.path.basename(rel)
    if rel.startswith('meshy/'):  # oynanır yiğit: T-pozu, oyun iskeletine oturtulacak
        g.update(pose_mode='t-pose', target_polycount=30000, texture_prompt=KARAKTER[cid]['texture_prompt'])
    elif '/boss/' in rel or '/dusman/' in rel or '/model/' in rel:
        g.update(target_polycount=20000)
    else:
        g.update(target_polycount=10000)
    return g


def uret(rel, dene):
    d = os.path.join(AK, rel)
    cikti = os.path.join(d, 'meshy.glb')
    if os.path.exists(cikti):
        gunluk(f'atla (var) {rel}'); return 0
    gj = os.path.join(d, 'gorev.json')
    if os.path.exists(gj):
        gorev = json.load(open(gj))['gorev']
        gunluk(f'devam {rel} görev {gorev}')
    else:
        g = govde_hazirla(rel)
        if dene:
            g2 = dict(g); g2['image_urls'] = [f'<{len(u)//1024} KB>' for u in g['image_urls']]
            g2.pop('texture_prompt', None)
            gunluk(f'DENE {rel}: {json.dumps(g2, ensure_ascii=False)}'); return 0
        gorev = istek(API, g)['result']
        json.dump({'gorev': gorev, 'zaman': time.time()}, open(gj, 'w'))
        gunluk(f'gönderildi {rel} görev {gorev}')
    while True:
        t = istek(f'{API}/{gorev}')
        if t['status'] == 'SUCCEEDED': break
        if t['status'] in ('FAILED', 'CANCELED', 'EXPIRED'):
            os.remove(gj)
            raise RuntimeError(f"başarısız: {t.get('task_error')}")
        time.sleep(15)
    urllib.request.urlretrieve(t['model_urls']['glb'], cikti)
    kredi = t.get('consumed_credits') or 0
    gunluk(f'TAMAM {rel} | {os.path.getsize(cikti)//1024} KB | kredi {kredi}')
    return kredi


def main():
    a = sys.argv[1:]
    dene = '--dene' in a
    paralel = int(a[a.index('--paralel') + 1]) if '--paralel' in a else 4
    hedefler = []
    atla = False
    for x in a:
        if atla: atla = False; continue
        if x == '--paralel': atla = True; continue
        if x.startswith('--'): continue
        hedefler += grup(x[1:]) if x.startswith('@') else [x.replace('\\', '/')]
    if not hedefler:
        sys.exit('kullanım: python tools/meshy_toplu.py <klasör|@grup ...> [--dene] [--paralel N]')
    if not KEYS and not dene:
        sys.exit('MESHY_API_KEY ortam değişkeni yok')
    gunluk(f'--- {len(hedefler)} hedef, paralel {paralel}, {"DENEME" if dene else "GERÇEK"} ---')
    sonuc = {'kredi': 0, 'hata': []}
    kuyruk = list(hedefler)

    def isci():
        while True:
            with kilit:
                if not kuyruk: return
                rel = kuyruk.pop(0)
            try:
                k = uret(rel, dene)
                with kilit: sonuc['kredi'] += k
            except Exception as e:
                gunluk(f'HATA {rel}: {e}')
                with kilit: sonuc['hata'].append(rel)
                if 'kredi bitti' in str(e):
                    with kilit: kuyruk.clear()

    th = [threading.Thread(target=isci) for _ in range(paralel)]
    for t in th: t.start()
    for t in th: t.join()
    gunluk(f'--- bitti: harcanan kredi {sonuc["kredi"]}, hata {len(sonuc["hata"])}: {" ".join(sonuc["hata"])} ---')


if __name__ == '__main__':
    main()
