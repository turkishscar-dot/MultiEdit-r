// Eğitim ipuçları: ilk kez karşılaşılan şeyde oyun 0.6 sn ağır çekime girer, ortada sarı çizgi roman kutusu çıkar.
// Her ipucu bir kez gösterilir (localStorage); Ayarlar'dan sıfırlanır. Telefonda el hareketi, masaüstünde klavye tuşu.
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seen = new Set(load('oguz-tips', []));
let off = false;
const testMode = () => { try { return localStorage.getItem('oguz-test') === '1'; } catch { return false; } }; // test botu ipuçlarında takılmasın
const touch = () => matchMedia('(pointer: coarse)').matches;
let hideT = null;
let gate = () => true; // öğretici sırası: izin verilmeyen ipucu bekler
export const setGate = fn => { gate = fn; };
export const tipsOff = v => { off = v; };
export const tipSeen = id => seen.has(id);
export function resetTips() { seen.clear(); save('oguz-tips', []); }
export function hideTip() { const b = document.getElementById('hint'); if (b) b.hidden = true; }

// El hareketleri: kaydırma yönü ya da dokunma (CSS ile canlandırılır)
const GESTURE = { lr: '👆', up: '👆', down: '👆', tap: '👆' };
// tip(id, metin | { text, icon, gesture, key }, simge, ağırÇekim)
export function tip(id, t, icon = '', slow = null) {
  if (off || testMode() || seen.has(id) || !gate(id)) return false;
  const o = typeof t === 'string' ? { text: t, icon } : t;
  seen.add(id);
  save('oguz-tips', [...seen]);
  const box = document.getElementById('hint');
  box.replaceChildren();
  if (o.icon) { const i = document.createElement('b'); i.className = 'hicon'; i.textContent = o.icon; box.append(i); }
  const s = document.createElement('span');
  s.textContent = o.text;
  box.append(s);
  if (o.gesture && touch()) { // telefonda: parmak kaydırma canlandırması
    const g = document.createElement('i');
    g.className = 'hgest g-' + o.gesture;
    g.textContent = GESTURE[o.gesture];
    box.append(g);
  } else if (o.key && !touch()) { // masaüstünde: tuş
    const k = document.createElement('kbd');
    k.textContent = o.key;
    box.append(k);
  }
  box.hidden = false;
  box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  // ağır çekim yok: ipucu yolu kapatmaz, oyunu durdurmaz (üstte küçük bant)
  clearTimeout(hideT);
  hideT = setTimeout(() => { box.hidden = true; }, 3200);
  return true;
}
