// Ayarlar: ses düzeyleri, grafik kalitesi (açılışta FPS ölçülerek kendiliğinden seçilir), titreşim, eğerek yönlendirme,
// ipuçlarını sıfırlama, ara sahne galerisi, emeği geçenler, dil. Hepsi localStorage'da.
import { vol, setVol, sfx } from './sound.js';
import { resetTips } from './tips.js';

const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k)) }; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const cfg = load('oguz-ayar', { gfx: null, dynRes: true, vibrate: true, lang: 'tr' });
const persist = () => save('oguz-ayar', cfg);

// Grafik düzeyleri:
// Yerel (cihaz piksel oranı, üst sınır 2; MSAA yok (HalfFloat hedefte çok pahalı), 16x anizotropi, 2048 gölge, yarı çözünürlük bloom)
// Yüksek (en çok 1.25x oran, 8x anizotropi, 1024 gölge) / Orta (1.0x oran, 4x anizotropi, 512 gölge) / Düşük (0.75x oran, gölgesiz)
export const GFX = {
  yerel: { name: 'YEREL', ratio: Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 2, 2), shadow: 'high', bloom: true, outline: true, msaa: 4, aniso: 16 },
  yuksek: { name: 'YÜKSEK', ratio: Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, 1.5), shadow: 'high', bloom: true, outline: true, msaa: 4, aniso: 8 },
  orta: { name: 'ORTA', ratio: 1.0, shadow: 'med', bloom: true, outline: true, msaa: 2, aniso: 4 },
  dusuk: { name: 'DÜŞÜK', ratio: 0.75, shadow: 'none', bloom: false, outline: false, msaa: 0, aniso: 1 },
};
// Açılışta ölçülen FPS'e göre öneri (oyuncu seçtiyse o kalır; kalıcı düşürme yok)
export function autoGfx(fps) {
  cfg.autoFps = Math.round(fps);
  if (cfg.gfx) return cfg.gfx;
  return fps < 25 ? 'dusuk' : fps < 40 ? 'orta' : fps < 55 ? 'yuksek' : 'yerel'; // güçlü cihazda tam çözünürlük + kenar yumuşatma
}
export const vibrate = ms => { if (cfg.vibrate) navigator.vibrate?.(ms); };

// Emeği geçenler ve kaynakça
const CREDITS = [
  ['Karakter ve animasyonlar', 'Quaternius (CC0), Mixamo (Adobe) hareketleri'],
  ['Modelleme', 'Blender'],
  ['Oyun motoru', 'Three.js (MIT), Vite (MIT)'],
  ['Ses ve müzik', 'Oyunun kendi kodunda üretildi (Web Audio). Ayrıntı: SES-KAYNAKLARI.md'],
  ['Yazı tipleri', 'Bangers, Noto Sans Old Turkic, Noto Serif TC (Google Fonts, OFL)'],
  ['Kaynakça', 'Bahaeddin Ögel, Türk Mitolojisi I; Uygurca Oğuz Kağan Destanı; Dede Korkut Kitabı; Orhun Yazıtları; Reşidüddin, Oğuznâme'],
];

// U: { setState, toMenu, gallery: [[ad, oynat]], applyGfx, setTilt, tilt }
let U = null, tab = 'ses';
const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
export function init(u) { U = u; }
export function open() {
  U.setState('ayar');
  $('menu').hidden = true;
  draw();
  $('ayar').hidden = false;
}
function draw() {
  for (const b of document.querySelectorAll('#atabs button')) b.classList.toggle('on', b.dataset.tab === tab);
  const box = $('alist');
  box.replaceChildren();
  const row = (label, ctl) => { const r = el('div', 'arow'); r.append(el('span', null, label), ctl); box.append(r); };
  if (tab === 'ses') {
    for (const [k, name] of [['music', 'Müzik'], ['sfx', 'Efektler'], ['voice', 'Seslendirme']]) {
      const s = el('input');
      Object.assign(s, { type: 'range', min: 0, max: 1, step: 0.05, value: vol[k] });
      s.oninput = () => { setVol(k, +s.value); if (k === 'sfx') sfx('kut', { gap: 0.15 }); };
      row(name, s);
    }
    const lang = el('select');
    for (const [v, t] of [['tr', 'Türkçe'], ['en', 'English (yakında)']]) { const o = el('option', null, t); o.value = v; o.disabled = v === 'en'; lang.append(o); }
    lang.value = cfg.lang;
    row('Dil', lang);
  } else if (tab === 'oyun') {
    const g = el('div', 'aseg');
    const curGfx = cfg.gfx || 'yuksek';
    for (const [k, G] of Object.entries(GFX)) {
      const b = el('button', 'small' + (curGfx === k ? ' on' : ''), G.name);
      b.onclick = () => { cfg.gfx = k; persist(); U.applyGfx(k); draw(); };
      g.append(b);
    }
    row('Grafik', g);
    if (cfg.autoFps) box.append(el('small', 'anote', `Açılışta ölçülen: ${cfg.autoFps} FPS → ${GFX[curGfx]?.name || ''} etkin.`));
    const tog = (on, fn) => { const b = el('button', 'small' + (on ? ' on' : ''), on ? 'AÇIK' : 'KAPALI'); b.onclick = () => { fn(); draw(); }; return b; };
    row('Dinamik Çözünürlük', tog(cfg.dynRes ?? true, () => {
      cfg.dynRes = !(cfg.dynRes ?? true);
      persist();
      U.applyDynRes?.(cfg.dynRes);
    }));
    row('Titreşim (telefon)', tog(cfg.vibrate, () => { cfg.vibrate = !cfg.vibrate; persist(); vibrate(60); }));
    row('Eğerek yönlendirme (özel bölümler)', tog(U.tilt(), () => U.setTilt()));
    const r = el('button', 'small', 'SIFIRLA');
    r.onclick = () => { resetTips(); r.textContent = 'SIFIRLANDI ✓'; r.disabled = true; };
    row('Eğitim ipuçları', r);
  } else if (tab === 'galeri') {
    box.append(el('small', 'anote', 'Oyundaki ara sahneleri yeniden izle.'));
    const g = el('div', 'agal');
    for (const [name, play] of U.gallery()) { const b = el('button', 'small', name); b.onclick = () => { $('ayar').hidden = true; play(() => { open(); }); }; g.append(b); }
    box.append(g);
  } else {
    for (const [k, v] of CREDITS) { const r = el('div', 'acred'); r.append(el('b', null, k), el('span', null, v)); box.append(r); }
  }
}
export function wire() {
  for (const b of document.querySelectorAll('#atabs button')) b.onclick = () => { tab = b.dataset.tab; draw(); };
  $('ayarback').onclick = () => U.toMenu();
}
