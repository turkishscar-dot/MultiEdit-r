# Tanıtım sitesini (repo kökündeki site/) günceller: görseller + oynanabilir oyun derlemesi.
#   python3 tools/site-yap.py           -> görseller (site/img) ve oyun (site/oyna)
#   python3 tools/site-yap.py gorsel    -> yalnız görseller
# Kaynaklar: ai-kaynak/splash/<id>-ai.png (kart resimleri), ai-kaynak/site/ekran-*.png (tools/site-ekran.mjs).
import json, os, shutil, subprocess, sys
from PIL import Image

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(os.path.dirname(KOK), 'site')
SPL = os.path.join(KOK, 'ai-kaynak', 'splash')
EKR = os.path.join(KOK, 'ai-kaynak', 'site')


def kaydet(im, yol, en, kalite=82):
    os.makedirs(os.path.dirname(yol), exist_ok=True)
    if im.width > en: im = im.resize((en, round(im.height * en / im.width)), Image.LANCZOS)
    im.convert('RGB').save(yol, quality=kalite, optimize=True, progressive=True)


def gorseller():
    ana = Image.open(os.path.join(SPL, 'oguz-ai.png')).convert('RGB')
    kaydet(ana, os.path.join(SITE, 'img', 'hero.jpg'), 1600, 84)
    w, h = ana.size; dar = ana.crop((int(w * .28), 0, int(w * .28) + int(h * .72), h))  # telefon: karakter ortada, dikey kesit
    kaydet(dar, os.path.join(SITE, 'img', 'hero-dar.jpg'), 900, 84)
    og = ana.resize((1200, round(h * 1200 / w)), Image.LANCZOS); t = (og.height - 630) // 2
    kaydet(og.crop((0, max(0, t), 1200, max(0, t) + 630)), os.path.join(SITE, 'img', 'og.jpg'), 1200, 85)
    ids = [l.split("id: '")[1].split("'")[0] for l in open(os.path.join(SITE, 'js', 'veri.js'), encoding='utf-8') if "{ id: '" in l]
    for i in ids:
        kaydet(Image.open(os.path.join(SPL, f'{i}-ai.png')), os.path.join(SITE, 'img', 'yigit', f'{i}.jpg'), 720, 80)
    for f in sorted(os.listdir(EKR)):
        if f.startswith('ekran-') and f.endswith('.png'):
            kaydet(Image.open(os.path.join(EKR, f)), os.path.join(SITE, 'img', 'ekran', f[6:-4] + '.jpg'), 1280, 82)
    print('görseller:', len(ids), 'yiğit')


def oyun():
    hedef = os.path.join(SITE, 'oyna')
    subprocess.run(['npx', 'vite', 'build', '--config', 'vite.web.config.js', '--outDir', hedef, '--emptyOutDir'], cwd=KOK, check=True)
    boyut = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(hedef) for f in fs)
    buyuk = max(((os.path.getsize(os.path.join(r, f)), f) for r, _, fs in os.walk(hedef) for f in fs))
    print(f'oyun: {boyut / 1e6:.1f} MB, en büyük dosya {buyuk[1]} {buyuk[0] / 1e6:.1f} MB (Cloudflare sınırı 25 MB)')


if __name__ == '__main__':
    gorseller()
    if 'gorsel' not in sys.argv: oyun()
