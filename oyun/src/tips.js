// Eğitim ipuçları: ilk kez karşılaşılan şeyde oyun kısa ağır çekime girer, ortada sarı çizgi roman kutusu çıkar.
// Her ipucu bir kez gösterilir (localStorage). Ayarlar'dan sıfırlanır.
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const seen = new Set(load('oguz-tips', []));
let off = (() => { try { return localStorage.getItem('oguz-test') === '1'; } catch { return false; } })(); // test botu ipuçlarında takılmasın
let hideT = null;
export const tipsOff = v => { off = v; };
export const tipSeen = id => seen.has(id);
export function resetTips() { seen.clear(); save('oguz-tips', []); }
// show(id, metin, simge, slow): ilk kezse gösterir ve true döner. slow = oyunun ağır çekim fonksiyonu
export function tip(id, text, icon = '', slow = null) {
  if (off || seen.has(id)) return false;
  seen.add(id);
  save('oguz-tips', [...seen]);
  const box = document.getElementById('hint');
  box.replaceChildren();
  if (icon) { const i = document.createElement('b'); i.className = 'hicon'; i.textContent = icon; box.append(i); }
  const t = document.createElement('span');
  t.textContent = text;
  box.append(t);
  box.hidden = false;
  box.classList.remove('in'); void box.offsetWidth; box.classList.add('in');
  slow?.(0.3, 0.6);
  clearTimeout(hideT);
  hideT = setTimeout(() => { box.hidden = true; }, 2600);
  return true;
}
