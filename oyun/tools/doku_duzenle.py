# Poly Haven dokularını (CC0) oyunun ışığına göre parlaklaştırır; bazalta kor çatlakları ekler.
# Girdi: src/assets/doku_eski (önceki hali, parlaklık hedefi), src/assets/doku (indirilen 1K'lar).
import numpy as np
from PIL import Image
from scipy.spatial import cKDTree
D = 'src/assets/doku/'
HEDEF = {'bazalt': 80, 'tasyol': 150, 'surduvar': 150, 'tahta': 105, 'iskele': 95, 'kaya': 140, 'toprak': 115, 'cimen': 115}
for ad, hedef in HEDEF.items():
    im = np.asarray(Image.open(D + ad + '.jpg').convert('RGB')).astype(np.float32)
    kazanc = hedef / max(im.mean(), 1)
    im = np.clip(im * kazanc, 0, 255)
    if ad == 'bazalt':
        n = im.shape[0]
        rng = np.random.default_rng(7)
        p = rng.random((34, 2)) * n
        ofs = [(i * n, j * n) for i in (-1, 0, 1) for j in (-1, 0, 1)]
        tum = np.concatenate([p + o for o in ofs])
        yy, xx = np.mgrid[0:n:2, 0:n:2]
        d, _ = cKDTree(tum).query(np.c_[xx.ravel(), yy.ravel()], k=2)
        kenar = (d[:, 1] - d[:, 0]).reshape(xx.shape)
        kenar = np.array(Image.fromarray(kenar.astype(np.float32)).resize((n, n), Image.BICUBIC))
        gurultu = np.asarray(Image.fromarray((rng.random((n // 16, n // 16)) * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)).astype(np.float32) / 255
        k = np.clip(1 - kenar / (5 + 7 * gurultu), 0, 1) ** 1.5       # ince ve değişken kalınlıklı çatlak
        lav = np.stack([255 * np.ones_like(k), 110 + 90 * k, 20 + 30 * k], -1)
        im = im * (1 - k[..., None]) + lav * k[..., None]
        halo = np.clip(1 - kenar / 22, 0, 1)[..., None] ** 2 * 0.35    # çatlak çevresinde sıcak ışıma
        im = np.clip(im + halo * np.array([120, 30, 0]), 0, 255)
    Image.fromarray(im.astype(np.uint8)).save(D + ad + '.jpg', quality=88)
    print(ad, round(im.mean()))
