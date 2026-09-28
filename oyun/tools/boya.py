# Boyalı ayrıntı: Oğuz gövdesinin T duruşundaki önden/arkadan görüntüsünü yapay zekâya (FLUX Kontext) ayrıntılı boyattırır,
# boyanın düz renge oranından gri ayrıntı haritası çıkarır (kıvrım, dikiş, işleme). Renk alınmaz: kostüm renkleri bozulmaz.
#   node tools/boya-render.mjs            -> ai-kaynak/boya/{on,arka}-{isik,duz}.png, cerceve.json
#   python3 tools/boya.py                 -> src/assets/doku/boya_{on,arka}.jpg, src/assets/doku/boya.json  (REPLICATE_API_TOKEN)
#   python3 tools/boya.py yerel           -> yapay zekâyı yeniden çağırmadan (ai-kaynak/boya/*-ai.png'den) haritaları üretir
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_uret as R

KOK = R.KOK; DIR = os.path.join(KOK, 'ai-kaynak', 'boya'); CIK = os.path.join(KOK, 'src', 'assets', 'doku')
ISTEM = {
    'on': ('Repaint this 3D game character as a richly detailed hand-painted fantasy game character texture reference. '
           'Keep EXACTLY the same T-pose, silhouette, proportions, camera, framing and base colors. Add fine painted detail: '
           'soft fabric folds and creases on the blue kaftan, ornate embroidered trim along the kaftan edges, cuffs and collar, '
           'visible stitched seams, a tooled leather belt with small buckle, worn leather folds and stitching on the boots, '
           'gentle cloth folds on the red trousers. Plain white background, no new objects.'),
    'arka': ('Repaint this 3D game character seen from the back as a richly detailed hand-painted fantasy game character texture '
             'reference. Keep EXACTLY the same T-pose, silhouette, proportions, camera, framing and base colors. Add fine painted '
             'detail: soft fabric folds and creases on the blue kaftan back, embroidered trim on cuffs and hem, stitched seams, '
             'leather belt back, worn leather folds on the boots, gentle cloth folds on the red trousers. Plain white background, no new objects.'),
}


def yapay_zeka(yon):
    url = R.yukle(os.path.join(DIR, f'{yon}-isik.png'))
    p = R.calistir('black-forest-labs/flux-kontext-pro', {'prompt': ISTEM[yon], 'input_image': url, 'aspect_ratio': 'match_input_image', 'output_format': 'png', 'seed': 11})
    out = p['output'] if isinstance(p['output'], str) else p['output'][0]
    R.indir(out, os.path.join(DIR, f'{yon}-ai.png')); print('boyandı', yon)


def harita(yon):
    duz = np.asarray(Image.open(os.path.join(DIR, f'{yon}-duz.png')).convert('RGB'), dtype=np.float32) / 255
    ai = np.asarray(Image.open(os.path.join(DIR, f'{yon}-ai.png')).convert('RGB').resize((duz.shape[1], duz.shape[0]), Image.LANCZOS), dtype=np.float32) / 255
    maske = ~((duz[..., 0] > 0.85) & (duz[..., 1] < 0.2) & (duz[..., 2] > 0.85))  # eflatun arka plan değil
    m = Image.fromarray((maske * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))  # kenar kaymalarına karşı içe çek
    maske = np.asarray(m) > 127
    L = lambda a: 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    oran = L(ai) / np.maximum(L(duz), 0.04)
    oran = np.where(maske, oran, 1.0)
    # büyük ölçekli aydınlatmayı at (yüksek geçiren): maskeli bulanıklığa böl
    from scipy.ndimage import gaussian_filter
    def bulanik(x, r):
        return gaussian_filter(x.astype(np.float32), r)
    w = bulanik(maske.astype(np.float32), 18); ort = bulanik(np.where(maske, oran, 0), 18) / np.maximum(w, 1e-3)
    hp = np.where(maske, oran / np.maximum(ort, 1e-3), 1.0)
    hp = np.clip(hp, 0.6, 1.4)
    g = ((hp - 0.6) / 0.8 * 255).astype(np.uint8)  # 0.5 = değişmez
    Image.fromarray(g).resize((512, 512), Image.LANCZOS).save(os.path.join(CIK, f'boya_{yon}.jpg'), quality=90)
    print('harita', yon, 'ortalama', round(float(hp[maske].mean()), 3), 'sapma', round(float(hp[maske].std()), 3))


if __name__ == '__main__':
    if 'yerel' not in sys.argv:
        if not R.TOKEN: sys.exit('REPLICATE_API_TOKEN yok')
        for y in ('on', 'arka'): yapay_zeka(y)
    for y in ('on', 'arka'): harita(y)
    c = json.load(open(os.path.join(DIR, 'cerceve.json')))
    json.dump({'cx': c['cx'], 'cy': c['cy'], 'H': c['H']}, open(os.path.join(CIK, 'boya.json'), 'w'))
    print('->', CIK)
