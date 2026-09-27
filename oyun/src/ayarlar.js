// Ayarlar: ses düzeyleri, grafik kalitesi (açılışta FPS ölçülerek kendiliğinden seçilir), titreşim, eğerek yönlendirme,
// ipuçlarını sıfırlama, ara sahne galerisi, emeği geçenler, dil. Hepsi localStorage'da.
import { vol, setVol, sfx } from './sound.js';
import { resetTips } from './tips.js';

const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k)) }; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
export const cfg = load('oguz-ayar', { gfx: null, vibrate: true, lang: 'tr' });
const persist = () => save('oguz-ayar', cfg);

// Grafik düzeyleri: Yüksek (bloom, gölge, mürekkep çizgisi) / Orta / Düşük (gölgesiz, bloomsuz, düşük çözünürlük)
export const GFX = {
  yuksek: { name: 'YÜKSEK', ratio: 1.5, shadow: true, bloom: true, outline: true },
  orta: { name: 'ORTA', ratio: 1, shadow: true, bloom: false, outline: true },
  dusuk: { name: 'DÜŞÜK', ratio: 0.75, shadow: false, bloom: false, outline: false },
};
// Açılışta ölçülen FPS'e göre varsayılan (oyuncu seçtiyse o kalır)
export function autoGfx(fps) {
  if (cfg.gfx) return cfg.gfx;
  cfg.gfx = fps < 32 ? 'dusuk' : fps < 50 ? 'orta' : 'yuksek';
  cfg.autoFps = Math.round(fps);
  persist();
  return cfg.gfx;
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
    for (const [k, G] of Object.entries(GFX)) {
      const b = el('button', 'small' + (cfg.gfx === k ? ' on' : ''), G.name);
      b.onclick = () => { cfg.gfx = k; persist(); U.applyGfx(k); draw(); };
      g.append(b);
    }
    row('Grafik', g);
    if (cfg.autoFps) box.append(el('small', 'anote', `Açılışta ölçülen: ${cfg.autoFps} FPS → ${GFX[cfg.gfx]?.name || ''} önerildi.`));
    const tog = (on, fn) => { const b = el('button', 'small' + (on ? ' on' : ''), on ? 'AÇIK' : 'KAPALI'); b.onclick = () => { fn(); draw(); }; return b; };
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
