# Yapay zekâ doku görselini döşenebilir (kenarları birbirine uyan) hale getirir.
#   python3 tools/ai_doku.py <id>:<no> [...]   ai-kaynak/doku/<id>/g<no>.png -> src/assets/doku/<id>.jpg (512 px)
# Yöntem: görsel yarım kaydırılır, kenarlarda kaydırılmış hali, ortada aslı kalacak şekilde yumuşak geçişle karıştırılır.
import os, sys
import numpy as np
import json
from PIL import Image, ImageEnhance

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOY = 512
LISTE = json.load(open(os.path.join(KOK, 'tools', 'ai_liste.json')))['doku']


def doseme(im):
    a = np.asarray(im.convert('RGB'), dtype=np.float32)
    h, w, _ = a.shape
    k = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
    y = np.abs(np.linspace(-1, 1, h))[:, None]; x = np.abs(np.linspace(-1, 1, w))[None, :]
    m = np.clip((1 - np.maximum(x, y)) / 0.18, 0, 1)  # ortada 1, kenarda 0
    m = (m * m * (3 - 2 * m))[..., None]
    return Image.fromarray(np.clip(a * m + k * (1 - m), 0, 255).astype(np.uint8))


if __name__ == '__main__':
    os.makedirs(os.path.join(KOK, 'src', 'assets', 'doku'), exist_ok=True)
    for a in sys.argv[1:]:
        i, no = a.split(':')
        im = Image.open(os.path.join(KOK, 'ai-kaynak', 'doku', i, f'g{no}.png'))
        s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
        d = doseme(im.resize((BOY, BOY), Image.LANCZOS))
        if 'doygunluk' in LISTE[i]: d = ImageEnhance.Color(d).enhance(LISTE[i]['doygunluk'])  # fazla canlı rengi soldur
        yol = os.path.join(KOK, 'src', 'assets', 'doku', i + '.jpg')
        if LISTE[i].get('detay'):  # karakter ayrıntı dokusu: gri, ortalama 0.5, sabit karşıtlık (kostüm rengini çarpar)
            g = np.asarray(d.convert('L'), dtype=np.float32) / 255
            g = np.clip(0.5 + (g - g.mean()) / (g.std() + 1e-5) * 0.22, 0, 1)
            d = Image.fromarray((g * 255).astype(np.uint8)).resize((256, 256), Image.LANCZOS)
        d.save(yol, quality=88)
        # 2x2 döşeme denetimi
        B = d.width; t = Image.new('RGB', (B * 2, B * 2))
        for p in [(0, 0), (B, 0), (0, B), (B, B)]: t.paste(d, p)
        t.resize((BOY, BOY)).save(os.path.join(KOK, 'ai-kaynak', 'doku', i, 'doseme.png'))
        print(i, '->', yol, os.path.getsize(yol) // 1024, 'KB')
