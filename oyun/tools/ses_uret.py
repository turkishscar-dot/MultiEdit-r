# Oyunun ses ve müzik dosyaları. Çevrimdışı üretilir, public/ses/ altına MP3 olarak yazılır, manifest.json güncellenir.
# Kullanım: pip install numpy scipy soundfile pedalboard ; python3 tools/ses_uret.py [ad ...]
# Tarayıcıdaki kodla-üretilen seslerden farkı: fiziksel tel modeli (Karplus-Strong + gövde rezonansı), nefesli kaval,
# gerçekçi davul, hareketli bant süzgeçli kılıç "vuuş"u, yankı ve sıkıştırma (pedalboard). Hepsi projeye ait, lisans derdi yok.
import json
import os
import sys
import numpy as np
import soundfile as sf
from scipy import signal
from pedalboard import Pedalboard, Reverb, Compressor, HighpassFilter, LowpassFilter, Gain, Limiter, Chorus, Delay

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'ses')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def env_ad(n, a, d, curve=4.0):
    """a: atak (sn), d: sönüm (sn) üstel"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e *= np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def norm(x, peak=0.89):
    m = np.max(np.abs(x)) or 1
    return x / m * peak
def fx(x, *plugins):
    return Pedalboard(list(plugins))(x.astype(np.float32), SR)
def sweep_bp(x, f0, f1, q=3.0, shape=None):
    """Zamanla kayan bant süzgeç (blok blok): kılıç ve ok vuuşu için."""
    n = len(x); out = np.zeros(n); B = 256
    for i in range(0, n, B):
        k = i / n
        k = shape(k) if shape else k
        f = f0 * (f1 / f0) ** k
        b, a = signal.iirpeak(min(f, SR / 2 - 100), q, fs=SR)
        out[i:i + B] = signal.lfilter(b, a, x[i:i + B])
    return out

def ks(freq, dur, bright=0.5, decay=0.996, pick=0.2):
    """Karplus-Strong tel: bright 0..1 (ilk gürültünün parlaklığı), decay: geri besleme"""
    N = int(SR / freq)
    n = int(dur * SR)
    burst = rng.uniform(-1, 1, N)
    burst = lp(burst, 800 + bright * 7000)
    # çekme noktası: tarak süzgeç (teli nereden çektiğin)
    d = max(1, int(N * pick)); burst = burst - np.roll(burst, d)
    x = np.zeros(n); x[:N] = burst
    a = np.zeros(N + 2); a[0] = 1; a[N] = -decay / 2; a[N + 1] = -decay / 2
    return signal.lfilter([1], a, x)

def body(x, peaks=((260, 4), (900, 3), (2400, 2))):
    """tahta gövde rezonansı (kopuz/dombra)"""
    y = x * 0.5
    for f, q in peaks:
        b, a = signal.iirpeak(f, q, fs=SR)
        y += signal.lfilter(b, a, x) * 0.6
    return y

def save(name, x, stereo=False):
    x = np.asarray(x, dtype=np.float32)
    path = os.path.join(OUT, name + '.mp3')
    sf.write(path, x.T if x.ndim == 2 else x, SR, format='MP3', compression_level=0.35)
    print(f'{name:12s} {len(x.T if x.ndim==2 else x)/SR:5.2f} sn  {os.path.getsize(path)//1024:4d} KB')
    return name + '.mp3'

# =================================================================== EFEKTLER
def swing(var=0):
    """Kılıç vuuşu: patlama yok. Gürültü, hızla yükselip inen dar bir bantta akar (hava bıçağın kenarında yarılır).
    Hafif Doppler: bant önce yükselir sonra biraz iner; yanında çok kısık metal şarkısı."""
    d = [0.26, 0.22, 0.3][var]
    n = noise(d)
    k = np.linspace(0, 1, len(n))
    peak = [0.42, 0.36, 0.5][var]
    shape = lambda u: np.sin(min(1, u / peak) * np.pi / 2) if u < peak else 1 - 0.35 * (u - peak) / (1 - peak)
    s = sweep_bp(n, [500, 650, 420][var], [2600, 3200, 2200][var], q=2.2, shape=shape)
    s += sweep_bp(n, 1400, 5200, q=4, shape=shape) * 0.35  # ince ıslık
    e = np.where(k < peak, (k / peak) ** 1.6, np.exp(-(k - peak) * 7))
    ring = np.sin(2 * np.pi * (3600 - 500 * k) * t_(d)) * e * 0.03
    y = s * e + ring
    y = fx(norm(y), HighpassFilter(250), Reverb(room_size=0.18, wet_level=0.12, dry_level=0.9))
    return norm(y, 0.8)

def hit(var=0):
    """Kılıç değer: kısa kesik (bant gürültü), gövdeye tok vuruş (düşük sinüs), küçük metal çınlama."""
    d = 0.45
    t = t_(d)
    thud = np.sin(2 * np.pi * (120 * np.exp(-t * 18) + 55) * t) * env_ad(len(t), 0.002, 0.12)
    cut = bp(noise(d), 900, 4200) * env_ad(len(t), 0.001, 0.05, 5)
    part = [1180, 2870, 4610, 6200] if var == 0 else [980, 2350, 3900, 5550]
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (9 + i * 5)) / (i + 1) for i, f in enumerate(part)) * 0.18
    y = thud * 0.9 + cut * 0.7 + ring
    y = fx(norm(y), Compressor(threshold_db=-14, ratio=4), Reverb(room_size=0.25, wet_level=0.15))
    return norm(y, 0.9)

def bowdraw():
    """Yay çekme: ahşap gıcırtısı (düzensiz sürtünme darbeleri, rezonanslı) ve gerilen kirişin ince sesi."""
    d = 0.42; n = int(d * SR); t = t_(d)
    pulses = np.zeros(n)
    rate = np.linspace(40, 130, n)  # sürtünme hızlanır
    ph = np.cumsum(rate / SR)
    idx = np.where(np.diff(np.floor(ph)) > 0)[0]
    pulses[idx] = rng.uniform(0.5, 1, len(idx))
    creak = sum(signal.lfilter(*signal.iirpeak(f, 12, fs=SR), pulses) for f in (380, 760, 1450))
    string = np.sin(2 * np.pi * (180 + 120 * t / d) * t) * 0.05
    y = (creak * 0.6 + string) * np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.35) * 30)
    return norm(fx(norm(y), HighpassFilter(150), Reverb(room_size=0.15, wet_level=0.1)), 0.3)

def bowrelease():
    """Kiriş bırakılır: alçak, tok "tınn" (kısa KS tel, gövdede) + okun havayı yarışı (hızlı yukarı kayan dar bant)."""
    twang = body(ks(98, 0.5, bright=0.35, decay=0.985, pick=0.5), ((180, 3), (520, 3)))
    twang *= env_ad(len(twang), 0.001, 0.25, 3)
    fly = sweep_bp(noise(0.22), 900, 4800, q=3)
    fly *= np.concatenate([np.linspace(0, 1, int(0.03 * SR)), np.exp(-np.linspace(0, 5, len(fly) - int(0.03 * SR)))])
    y = np.zeros(int(0.55 * SR)); y[:len(twang)] += norm(twang) * 0.8; y[int(0.01 * SR):int(0.01 * SR) + len(fly)] += norm(fly) * 0.45
    return norm(fx(y, HighpassFilter(60), Reverb(room_size=0.2, wet_level=0.12)), 0.8)

def arrowhit():
    """Ok saplanır: kuru "tak" + okun gövdesinin titreşimi (kısa vibrato)."""
    d = 0.35; t = t_(d)
    knock = bp(noise(d), 500, 2200) * env_ad(len(t), 0.0005, 0.03, 6)
    low = np.sin(2 * np.pi * 160 * t) * env_ad(len(t), 0.001, 0.06)
    wob = np.sin(2 * np.pi * 260 * t + 3 * np.sin(2 * np.pi * 24 * t)) * np.exp(-t * 14) * 0.25
    return norm(fx(norm(knock + low * 0.7 + wob), Reverb(room_size=0.15, wet_level=0.1)), 0.85)

def parry():
    """Kılıçla geri çalma: parlak çelik çınlaması, uzun kuyruk."""
    d = 1.2; t = t_(d)
    parts = [(1320, 1), (2910, .7), (3740, .5), (5230, .35), (7120, .2)]
    y = sum(a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * (3 + i * 2.5)) for i, (f, a) in enumerate(parts))
    y += bp(noise(d), 2000, 8000) * env_ad(len(t), 0.0005, 0.02, 6) * 1.5
    return norm(fx(norm(y), Reverb(room_size=0.5, wet_level=0.3)), 0.8)

def shieldbreak():
    d = 0.8; t = t_(d)
    crack = bp(noise(d), 300, 3000) * env_ad(len(t), 0.001, 0.12, 4)
    wood = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 20) for f in (210, 330, 470))
    y = crack + wood * 0.3 + parry()[:len(t)] * 0.25
    return norm(fx(norm(y), Reverb(room_size=0.3, wet_level=0.15)), 0.9)

def jump():
    d = 0.25; n = noise(d); t = t_(d)
    y = bp(n, 250, 1500) * env_ad(len(t), 0.01, 0.12)
    y += np.sin(2 * np.pi * (140 + 80 * t / d) * t) * env_ad(len(t), 0.005, 0.08) * 0.3  # nefes/deri
    return norm(fx(norm(y), LowpassFilter(3000)), 0.5)

def land():
    d = 0.3; t = t_(d)
    y = np.sin(2 * np.pi * (90 * np.exp(-t * 10) + 45) * t) * env_ad(len(t), 0.001, 0.09)
    y += lp(noise(d), 1200) * env_ad(len(t), 0.001, 0.05) * 0.8  # toz, çakıl
    return norm(fx(norm(y), Reverb(room_size=0.1, wet_level=0.08)), 0.7)

def slide():
    d = 0.55; t = t_(d)
    y = sweep_bp(noise(d), 1800, 700, q=1.5) * np.minimum(1, t / 0.03) * np.exp(-t * 4)
    return norm(fx(norm(y), LowpassFilter(5000)), 0.5)

def kut():
    """Kut toplama: küçük çan (iki kısmi, yukarı aralık) - göze batmayan, parlak."""
    d = 0.35; t = t_(d)
    f = 1568
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 12) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 20)
    y2 = np.zeros_like(y); off = int(0.06 * SR)
    y2[off:] = (np.sin(2 * np.pi * f * 1.335 * t) * np.exp(-t * 12))[:len(y) - off]
    return norm(fx(norm(y + y2 * 0.8), Reverb(room_size=0.2, wet_level=0.15)), 0.45)

def hurt():
    d = 0.4; t = t_(d)
    thud = np.sin(2 * np.pi * (140 * np.exp(-t * 15) + 60) * t) * env_ad(len(t), 0.001, 0.1)
    grunt = bp(noise(d), 180, 700) * env_ad(len(t), 0.02, 0.15) * 0.5
    return norm(fx(norm(thud + grunt), Compressor(threshold_db=-12, ratio=3)), 0.85)

def roar():
    """Dev kükremesi: alçak testere dalgası, açılıp kapanan ağız formantları, pürüz."""
    d = 1.6; t = t_(d)
    f0 = 70 + 25 * np.sin(np.pi * t / d) + 4 * rng.standard_normal(len(t)).cumsum() / 400
    ph = np.cumsum(f0 / SR)
    saw = (ph % 1) * 2 - 1
    rough = saw * (1 + 0.6 * lp(noise(d), 60))
    formant = bp(rough, 300, 900) * 0.9 + bp(rough, 1100, 2200) * 0.35
    e = np.minimum(1, t / 0.12) * np.exp(-np.maximum(0, t - 1.0) * 5)
    y = formant * e
    return norm(fx(norm(y), Compressor(threshold_db=-18, ratio=5), Reverb(room_size=0.6, wet_level=0.25)), 0.9)

def thunder():
    d = 2.2; t = t_(d)
    crack = hp(noise(d), 1500) * env_ad(len(t), 0.001, 0.05, 6)
    rumble = lp(noise(d), 180, 4) * (np.minimum(1, t / 0.1) * np.exp(-t * 1.6)) * 3
    y = crack + rumble
    return norm(fx(norm(y), Reverb(room_size=0.8, wet_level=0.35)), 0.95)

def whoosh():
    d = 1.4; t = t_(d)
    y = sweep_bp(noise(d), 300, 1400, q=1.2) * np.sin(np.pi * t / d) ** 1.5
    return norm(fx(norm(y), Reverb(room_size=0.4, wet_level=0.2)), 0.6)

EFEKT = {
    'swing': lambda: swing(0), 'swing2': lambda: swing(1), 'swing3': lambda: swing(2),
    'hit': lambda: hit(0), 'hit2': lambda: hit(1),
    'bowdraw': bowdraw, 'bowrelease': bowrelease, 'arrowhit': arrowhit, 'parry': parry, 'shieldbreak': shieldbreak,
    'jump': jump, 'land': land, 'slide': slide, 'kut': kut, 'hurt': hurt, 'roar': roar, 'thunder': thunder, 'whoosh': whoosh,
}

# =================================================================== ÇALGILAR
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

def kopuz(m, dur, vel=0.8, bright=0.5):
    """dombra/kopuz teli: KS + ahşap gövde; iki tel hafif akortsuz (çift tel)"""
    f = mtof(m)
    a = ks(f, dur, bright=bright, decay=0.9965)
    b = ks(f * 1.003, dur, bright=bright * 0.8, decay=0.996)
    return body(a + b * 0.6) * vel

def kaval(m, dur, vel=0.7, vib=5.2, glide_from=None):
    """kaval/ney: sinüs + zayıf üst sesler + nefes gürültüsü, yavaş atak, titreşim (vibrato) geç başlar"""
    t = t_(dur); n = len(t)
    f = np.full(n, mtof(m))
    if glide_from is not None:
        g = min(n, int(0.08 * SR)); f[:g] = np.linspace(mtof(glide_from), mtof(m), g)
    vdepth = np.clip((t - 0.25) / 0.3, 0, 1) * 0.012
    f = f * (1 + vdepth * np.sin(2 * np.pi * vib * t))
    ph = np.cumsum(f / SR) * 2 * np.pi
    tone = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.07 * np.sin(3 * ph)
    breath = bp(noise(dur), mtof(m) * 0.9, min(SR / 2 - 200, mtof(m) * 4)) * 0.25
    e = np.minimum(1, t / 0.07) * np.minimum(1, (dur - t) / 0.08).clip(0, 1)
    return (tone + breath * (0.6 + 0.4 * np.exp(-t * 6))) * e * vel

def zurna(m, dur, vel=0.6):
    """zurna: çift kamış - zengin üst sesli, burundan (formantlı), titreşimli"""
    t = t_(dur)
    f = mtof(m) * (1 + 0.008 * np.sin(2 * np.pi * 6 * t) * np.clip((t - 0.1) / 0.2, 0, 1))
    ph = np.cumsum(f / SR)
    x = sum(np.sin(2 * np.pi * k * ph) / k ** 0.9 for k in range(1, 12))
    x = bp(x, 700, 1700, 1) * 0.7 + bp(x, 2300, 3400, 1) * 0.4 + x * 0.08
    e = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.05).clip(0, 1)
    return x * e * vel

def davul(vel=1.0, low=True):
    """davul: tokmak (bas: alçak inen sinüs + deri) ya da çubuk (tiz: kuru şaklama)"""
    if low:
        d = 0.6; t = t_(d)
        y = np.sin(2 * np.pi * (95 * np.exp(-t * 14) + 52) * t) * env_ad(len(t), 0.001, 0.35, 3)
        y += lp(noise(d), 600) * env_ad(len(t), 0.001, 0.04) * 0.5
    else:
        d = 0.18; t = t_(d)
        y = bp(noise(d), 1200, 5000) * env_ad(len(t), 0.0005, 0.035, 5) + np.sin(2 * np.pi * 420 * t) * env_ad(len(t), 0.001, 0.04) * 0.3
    return y * vel

def def_(vel=0.6):
    """def (zilli çerçeve davul): tek vuruş + zil çıngırtısı"""
    d = 0.35; t = t_(d)
    skin = np.sin(2 * np.pi * 180 * t) * env_ad(len(t), 0.001, 0.08)
    jingle = sum(np.sin(2 * np.pi * f * t) for f in (5200, 6800, 8100, 9400)) * np.exp(-t * 18) * rng.uniform(0.5, 1, len(t))
    return (skin * 0.6 + jingle * 0.08) * vel

def drone(m, dur, vel=0.25, throat=False):
    """uzun ses (tampura gibi) ya da boğazdan söyleme: üst sesler dar bantla seçilir, yavaşça gezinir"""
    t = t_(dur)
    ph = np.cumsum(np.full(len(t), mtof(m)) / SR)
    saw = (ph % 1) * 2 - 1
    y = lp(saw, 900) * 0.6
    if throat:
        n = len(t); B = 512; out = np.zeros(n)
        for i in range(0, n, B):
            h = 8 + 4 * np.sin(2 * np.pi * i / n * 3)
            b, a = signal.iirpeak(mtof(m) * h, 30, fs=SR)
            out[i:i + B] = signal.lfilter(b, a, saw[i:i + B])
        y += out * 1.6
    return y * vel

# =================================================================== BESTE
# Diziler (yarım ses): uşşak (koma perdesi -0.5), hicaz, pentatonik
MAKAM = {
    'ussak': [0, 1.5, 3, 5, 7, 8, 10], 'hicaz': [0, 1, 4, 5, 7, 8, 10], 'penta': [0, 3, 5, 7, 10],
    'bozlak': [0, 2, 3, 5, 7, 8, 10], 'cin': [0, 2, 4, 7, 9],
}
def deg(root, mk, d):
    s = MAKAM[mk]; o, i = divmod(d, len(s))
    return root + s[i] + 12 * o

class Mix:
    def __init__(self, beats, bpm):
        self.spb = 60 / bpm
        self.n = int(beats * self.spb * SR)
        self.buf = {k: np.zeros(self.n + SR * 4) for k in ('mel', 'str', 'drm', 'pad')}
    def put(self, bus, beat, x, pan=0):
        i = int(beat * self.spb * SR)
        self.buf[bus][i:i + len(x)] += x[:len(self.buf[bus]) - i]
    def render(self, verb=0.35, room=0.6):
        y = np.zeros_like(self.buf['mel'])
        y += fx(self.buf['mel'], Reverb(room_size=room, wet_level=verb, dry_level=0.85))[:len(y)] if self.buf['mel'].any() else 0
        y += fx(self.buf['str'], Reverb(room_size=room * 0.7, wet_level=verb * 0.6, dry_level=0.9))[:len(y)] if self.buf['str'].any() else 0
        y += fx(self.buf['drm'], Compressor(threshold_db=-16, ratio=3), Reverb(room_size=0.3, wet_level=0.12))[:len(y)] * 0.9 if self.buf['drm'].any() else 0
        y += fx(self.buf['pad'], LowpassFilter(2500), Reverb(room_size=0.9, wet_level=0.5))[:len(y)] if self.buf['pad'].any() else 0
        # döngü: taşan kuyruk başa eklenir (kesintisiz döngü)
        loop = y[:self.n].copy(); tail = y[self.n:]
        loop[:len(tail)] += tail[:self.n]
        loop = fx(norm(loop, 0.7), Compressor(threshold_db=-20, ratio=2), Limiter(threshold_db=-1.5))
        rms = np.sqrt(np.mean(loop ** 2)) or 1
        loop = loop * (10 ** (-18 / 20) / rms)  # hepsi aynı ses düzeyinde (-18 dBFS RMS): parçalar arası atlama olmasın
        return np.clip(loop, -0.97, 0.97)

def up(p, k=1): return [((d + k) if d is not None else None, *r) for d, *r in p]  # ezgiyi bir derece yukarı taşı (varyasyon)
def form(A, B): return (A, B, A, B, up(A), up(B, 2), A, B)  # 64 vuruş: A B A B A' B' A B
def phrase(mix, start, notes, root, mk, inst, beat_len=1, **kw):
    """notes: [(derece, vuruş, [süre])]; None = es"""
    b = start
    for nt in notes:
        d, ln = nt[0], nt[1]
        if d is not None:
            m = deg(root, mk, d)
            x = inst(m, ln * mix.spb * beat_len * 1.05, **kw)
            mix.put('mel' if inst in (kaval, zurna) else 'str', b, x)
        b += ln
    return b

def track_menu():
    """Menü: uşşak, sakin kopuz ve uzak kaval. 76 vuruş/dk, 32 vuruş"""
    m = Mix(64, 76); R = 62
    for bar in range(16):
        for k in range(4):  # kopuz ritmi: bas + üst tel (dombra gibi aşağı-yukarı vuruş)
            b = bar * 4 + k
            m.put('str', b, kopuz(R - 12 if k % 2 == 0 else R - 5, 1.2, 0.45, 0.35))
            m.put('str', b + 0.5, kopuz(deg(R, 'ussak', [0, 2, 4, 2][k]), 0.8, 0.28, 0.5))
    A = [(4, 1), (3, .5), (2, .5), (3, 1), (4, .5), (5, .5), (4, 2), (None, 2)]
    B = [(5, 1), (4, .5), (3, .5), (2, 1), (1, .5), (2, .5), (0, 3), (None, 1)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R, 'ussak', kaval, vel=0.55)
    m.put('pad', 0, drone(R - 24, 64 * m.spb, 0.12))
    return m.render(verb=0.4)

def track_otuken():
    """Ötüken: davul-zurna değil, akıncı marşı: bozlak dizisi, kopuz + kaval + davul. 104 vuruş/dk, 32 vuruş"""
    m = Mix(64, 104); R = 57
    for b in range(64):
        m.put('drm', b, davul(0.9 if b % 4 == 0 else 0.55, low=b % 2 == 0))
        if b % 4 == 3: m.put('drm', b + 0.5, davul(0.4, low=False))
        m.put('drm', b + 0.5, def_(0.35))
        m.put('str', b, kopuz(R - 12, 0.6, 0.4, 0.3))
        m.put('str', b + 0.5, kopuz(deg(R, 'bozlak', [0, 4, 2, 4][b % 4]), 0.5, 0.3, 0.55))
    A = [(0, .5), (2, .5), (3, 1), (4, 1), (3, .5), (4, .5), (5, 1), (4, 1), (2, 2)]
    B = [(7, 1), (6, .5), (5, .5), (4, 1), (3, 1), (2, .5), (3, .5), (1, 1), (0, 2)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R + 12, 'bozlak', kaval, vel=0.6)
    return m.render(verb=0.3, room=0.5)

def track_boss():
    """Boss: hicaz, hızlı davul-zurna, ağır aksak hissi. 148 vuruş/dk, 32 vuruş"""
    m = Mix(64, 148); R = 57
    pat = [1, 0, .5, 1, 0, .5, 1, 0]  # 8'lik: güm . tek güm . tek güm .
    for b in range(128):
        v = pat[b % 8]
        if v: m.put('drm', b / 2, davul(0.95 if v == 1 else 0.5, low=v == 1))
        else: m.put('drm', b / 2, davul(0.3, low=False))
    for bar in range(16):
        m.put('str', bar * 4, kopuz(R - 12, 2, 0.5, 0.3))
    A = [(0, .5), (1, .5), (2, .5), (1, .5), (0, 1), (4, .5), (3, .5), (2, 1), (1, 1), (0, 2)]
    B = [(7, .5), (6, .5), (5, .5), (4, .5), (5, 1), (4, .5), (2, .5), (1, 1), (2, 1), (0, 2)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R + 12, 'hicaz', zurna, vel=0.4)
    m.put('pad', 0, drone(R - 12, 64 * m.spb, 0.1))
    return m.render(verb=0.2, room=0.4)

def track_altay():
    """Altay: boğazdan söyleme + topşur ritmi (at yürüyüşü), pentatonik kaval. 92 vuruş/dk"""
    m = Mix(64, 92); R = 50
    m.put('pad', 0, drone(R - 12, 64 * m.spb, 0.35, throat=True))
    for b in range(64):
        for k, (o, v) in enumerate([(0, .5), (.33, .3), (.66, .35)]):  # dörtnala üçleme
            m.put('str', b + o, kopuz(R if k == 0 else R + 7, 0.5, v, 0.4))
    A = [(5, 1.5), (4, .5), (3, 1), (2, 1), (3, 2), (None, 2)]
    B = [(7, 1.5), (5, .5), (4, 1), (5, 1), (3, 2), (None, 2)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R + 12, 'penta', kaval, vel=0.5)
    return m.render(verb=0.45, room=0.8)

def track_bataklik():
    """Kara Bataklık: karanlık, yankılı, seyrek tel; alçak uğultu."""
    m = Mix(64, 64); R = 50
    m.put('pad', 0, drone(R - 12, 64 * m.spb, 0.3))
    for b in range(0, 64, 2):
        m.put('str', b, kopuz(deg(R, 'hicaz', [0, 1, 0, 4, 3, 1, 0, -1][b // 2 % 8]), 3, 0.35, 0.25))
    for b in (6, 14, 22, 30, 38, 46, 54, 62): m.put('mel', b, kaval(R + 13, 2.2, 0.3))
    return m.render(verb=0.6, room=0.95)

def track_gok():
    """Gök Yolu: ferah, pentatonik kaval yükselir; hafif rüzgâr."""
    m = Mix(64, 84); R = 60
    wind = sweep_bp(noise(64 * m.spb + 1), 300, 900, q=0.8, shape=lambda u: 0.5 + 0.5 * np.sin(u * np.pi * 6)) * 0.25
    m.put('pad', 0, wind)
    for b in range(0, 64, 1):
        m.put('str', b, kopuz(deg(R, 'penta', [0, 2, 4, 2][b % 4]), 1.5, 0.25, 0.6))
    A = [(5, 2), (6, 1), (7, 1), (6, 2), (4, 2)]
    B = [(7, 1), (8, 1), (7, 1), (5, 1), (4, 3), (None, 1)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R + 12, 'penta', kaval, vel=0.55)
    return m.render(verb=0.55, room=0.85)

def track_yeralti():
    """Yeraltı: çok alçak davul, örs çınlaması, hicaz drone."""
    m = Mix(64, 70); R = 45
    m.put('pad', 0, drone(R, 64 * m.spb, 0.35))
    for b in range(64):
        if b % 2 == 0: m.put('drm', b, davul(1.0, low=True))
        if b % 4 == 3:
            t = t_(1.5); anvil = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (4 + i)) for i, f in enumerate((880, 1430, 2340))) * 0.15
            m.put('drm', b + 0.5, anvil)
    for b in range(0, 64, 4): m.put('mel', b + 1, zurna(deg(R + 24, 'hicaz', [0, 1, 4, 1][b // 4 % 4]), 2.5, 0.2))
    return m.render(verb=0.5, room=0.9)

def track_cin():
    """Çin: pentatonik parlak tel (zheng benzeri: parlak KS), tahta tokmak."""
    m = Mix(64, 96); R = 62
    for b in range(64):
        m.put('drm', b, davul(0.3, low=False))
        if b % 4 == 0: m.put('drm', b, davul(0.7, low=True))
    A = [(0, .5), (1, .5), (2, 1), (4, .5), (3, .5), (2, 1), (1, .5), (0, .5), (1, 2), (None, 2)]
    B = [(4, .5), (5, .5), (6, 1), (5, .5), (4, .5), (2, 1), (3, .5), (2, .5), (0, 2), (None, 2)]
    b = 0
    for p in form(A, B):
        b = phrase(m, b, p, R + 12, 'cin', lambda mm, dd, **kw: kopuz(mm, dd + 1, 0.6, 0.85), )
    for b in range(0, 64, 2): m.put('str', b, kopuz(R - 12, 1.8, 0.35, 0.3))
    return m.render(verb=0.4, room=0.7)

def track_karanlik():
    """Karanlık Ülke: soğuk, yankılı çan ve uzun kaval, uzakta kurt uluması."""
    m = Mix(64, 60); R = 52
    m.put('pad', 0, drone(R - 12, 64 * m.spb, 0.25))
    for b in range(0, 64, 4):
        t = t_(4); bell = sum(np.sin(2 * np.pi * mtof(deg(R + 12, 'penta', [0, 3, 2, 4][b // 4 % 4])) * r * t) * np.exp(-t * (1 + i)) / (i + 1) for i, r in enumerate((1, 2.4, 3.9)))
        m.put('str', b, bell * 0.3)
    for b, d in ((2, 4), (10, 3), (18, 5), (26, 2), (34, 6), (42, 4), (50, 3), (58, 2)): m.put('mel', b, kaval(deg(R + 12, 'penta', d), 3, 0.4))
    t = t_(2.5); howl = np.sin(2 * np.pi * np.cumsum(420 + 180 * np.sin(np.pi * t / 2.5) ** 2) / SR) * np.sin(np.pi * t / 2.5) * 0.15
    m.put('pad', 12, howl); m.put('pad', 44, howl * 0.7)
    return m.render(verb=0.6, room=0.95)

def sting_win():
    m = Mix(8, 120); R = 57
    for i, d in enumerate([0, 2, 4, 7]): m.put('mel', i * 0.5, zurna(deg(R + 12, 'bozlak', d), 0.45, 0.45))
    m.put('mel', 2, zurna(deg(R + 12, 'bozlak', 7), 2.4, 0.5))
    for i in range(8): m.put('drm', i * 0.25, davul(0.4 + i * 0.07, low=True))
    m.put('drm', 2, davul(1.0, low=True))
    y = m.render(verb=0.3)
    return y[:int(4 * m.spb * SR)] * np.minimum(1, (np.arange(int(4 * m.spb * SR))[::-1]) / (0.4 * SR))

def sting_lose():
    m = Mix(8, 70); R = 57
    for i, d in enumerate([4, 3, 1, 0]): m.put('str', i * 0.8, kopuz(deg(R, 'hicaz', d), 1.6, 0.6, 0.4))
    m.put('drm', 3.4, davul(0.9, low=True))
    y = m.render(verb=0.4)
    return y[:int(6 * m.spb * SR)] * np.minimum(1, (np.arange(int(6 * m.spb * SR))[::-1]) / (0.6 * SR))

MUZIK = {'menu': track_menu, 'otuken': track_otuken, 'boss': track_boss, 'altay': track_altay, 'bataklik': track_bataklik,
         'gok': track_gok, 'yeralti': track_yeralti, 'cin': track_cin, 'karanlik': track_karanlik, 'win': sting_win, 'lose': sting_lose}

if __name__ == '__main__':
    want = set(sys.argv[1:])
    mpath = os.path.join(OUT, 'manifest.json')
    man = json.load(open(mpath)) if os.path.exists(mpath) else {}
    for name, fn in {**EFEKT, **MUZIK}.items():
        if want and name not in want: continue
        x = fn()
        f = save(name, x)
        # döngülü müzik: MP3 kodlayıcısı başa sessizlik ekler; oyun ilk sesi bulup tam `n` örnek döngüler
        man[name] = {'f': f, 'n': len(x)} if name in MUZIK and name not in ('win', 'lose') else f
    json.dump(man, open(mpath, 'w'), indent=1, ensure_ascii=False)
    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f'toplam {total // 1024} KB')
