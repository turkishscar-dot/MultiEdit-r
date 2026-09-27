// Çarşı: koşu öncesi tek kullanımlık takviyeler (kut / Gök Demir) ve 5 kademeli kalıcı yükseltmeler.
// Oyun kodu yükseltmeleri upg(id) ile, koşuya seçilen takviyeleri shop.consume() ile okur.
import { wallet } from './costumes.js';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const BOOSTS = [
  { id: 'kimiz', name: 'Kımız Tulumu', icon: '🍶', text: 'Koşuya fazladan bir canla başla (4 can).', price: 150 },
  { id: 'kurt', name: 'Kurt Çağrısı', icon: '🐺', text: 'Koşuya Gök Yeleli Kurt ile başla.', price: 200 },
  { id: 'bereket', name: 'Bereket Muskası', icon: '📿', text: 'İlk 3 dakika topladığın kut iki kat.', price: 250 },
  { id: 'nal', name: 'Hız Nalı', icon: '🐎', text: 'Koşuya at sırtında başla.', price: 150 },
  { id: 'nazar', name: 'Nazar Boncuğu', icon: '🧿', text: 'İlk darbe işlemez. Kara-evli boyunun kalkanıyla toplanır.', price: 200 },
  { id: 'kilic', name: 'Tengri Kılıcı', icon: '⚔', text: 'Koşuya 10 saniye Tanrı Kılıcı ile başla.', gd: 2 },
];
// Kalıcı yükseltmeler: değer = temel + kademe × adım
export const UPGRADES = [
  { id: 'at', name: 'At Süresi', icon: '🐴', base: 12, step: 2, unit: ' sn', text: 'Altın nalla binilen at daha uzun koşar.' },
  { id: 'kurt', name: 'Kurt Süresi', icon: '🐺', base: 14, step: 2, unit: ' sn', text: 'Gök Yeleli Kurt daha uzun yol gösterir.' },
  { id: 'kilic', name: 'Tanrı Kılıcı Süresi', icon: '⚔', base: 12, step: 2, unit: ' sn', text: 'Tanrı Kılıcı elinde daha uzun kalır.' },
  { id: 'yagmur', name: 'Ok Yağmuru', icon: '🏹', base: 40, step: 10, unit: ' ok', text: 'Islıklı okun çağırdığı yağmur daha geniş ve yoğun.' },
  { id: 'kimiz', name: 'Kımız Şansı', icon: '🍶', base: 100, step: 25, unit: '%', text: 'Şifalı kımız yolda daha sık çıkar.' },
  { id: 'miknatis', name: 'Kut Mıknatısı', icon: '🧲', base: 0, step: 1, unit: '', text: 'Yakındaki kutlar sana çekilir; 5. kademede yan şeritlerden bile.' },
];
export const UPG_PRICE = [300, 700, 1500, 3000, 6000];
export const MAX_RACK = 3;

export const shop = {
  inv: load('oguz-takviye', {}), // takviye id -> adet
  upg: load('oguz-yukselt', {}), // yükseltme id -> kademe (0-5)
  rack: load('oguz-raf', []), // bir sonraki koşuya seçilen takviyeler
  onBuy: null, // (tür, id): istatistik kancası
  saveAll() { save('oguz-takviye', this.inv); save('oguz-yukselt', this.upg); save('oguz-raf', this.rack); },
  buyBoost(id) {
    const b = BOOSTS.find(x => x.id === id);
    if (b.gd ? !wallet.spendGD(b.gd) : !wallet.spend(b.price)) return false;
    this.inv[id] = (this.inv[id] || 0) + 1;
    this.saveAll();
    this.onBuy?.('boost', id);
    return true;
  },
  buyUpg(id) {
    const t = this.upg[id] || 0;
    if (t >= 5 || !wallet.spend(UPG_PRICE[t])) return false;
    this.upg[id] = t + 1;
    this.saveAll();
    this.onBuy?.('upgrade', id);
    return true;
  },
  toggleRack(id) {
    if (this.rack.includes(id)) this.rack = this.rack.filter(x => x !== id);
    else if (this.rack.length < MAX_RACK && (this.inv[id] || 0) > 0) this.rack.push(id);
    this.saveAll();
  },
  // Koşu başında: raftaki takviyeleri harcar, kullanılanları döner
  consume() {
    const used = this.rack.filter(id => (this.inv[id] || 0) > 0);
    for (const id of used) this.inv[id]--;
    this.rack = this.rack.filter(id => (this.inv[id] || 0) > 0);
    this.saveAll();
    return used;
  },
};
export const upg = id => shop.upg[id] || 0;
export const upgVal = id => { const u = UPGRADES.find(x => x.id === id); return u.base + upg(id) * u.step; };

// ---------- arayüz ----------
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const priceTxt = b => (b.gd ? `⬢ ${b.gd}` : `◆ ${b.price}`);

// Çarşı ekranının içeriği: sekmeye göre kartlar
export function drawShop(box, tab, redraw) {
  box.replaceChildren();
  if (tab === 'takviye') {
    for (const b of BOOSTS) {
      const c = el('div', 'scard');
      c.append(el('b', 'sicon', b.icon), el('h3', null, b.name), el('p', null, b.text), el('div', 'sown', `Elinde: ${shop.inv[b.id] || 0}`));
      const btn = el('button', 'small', priceTxt(b));
      btn.disabled = b.gd ? wallet.gokdemir < b.gd : wallet.bank < b.price;
      btn.onclick = () => { if (shop.buyBoost(b.id)) redraw(); };
      c.append(btn);
      box.append(c);
    }
  } else if (tab === 'yukselt') {
    for (const u of UPGRADES) {
      const t = upg(u.id), c = el('div', 'scard');
      const pips = el('div', 'pips');
      for (let i = 0; i < 5; i++) pips.append(el('i', i < t ? 'on' : ''));
      const now = u.id === 'miknatis' ? (t ? `Menzil ${t}` : 'Yok') : `${u.base + t * u.step}${u.unit}`;
      const next = t < 5 ? (u.id === 'miknatis' ? `Menzil ${t + 1}` : `${u.base + (t + 1) * u.step}${u.unit}`) : null;
      c.append(el('b', 'sicon', u.icon), el('h3', null, u.name), el('p', null, u.text), pips, el('div', 'sown', next ? `${now} → ${next}` : `${now} · EN ÜST KADEME`));
      const btn = el('button', 'small', t < 5 ? `◆ ${UPG_PRICE[t]}` : 'TAMAM');
      btn.disabled = t >= 5 || wallet.bank < UPG_PRICE[t];
      btn.onclick = () => { if (shop.buyUpg(u.id)) redraw(); };
      c.append(btn);
      box.append(c);
    }
  } else {
    for (const [n, p] of [[10, '₺ —'], [60, '₺ —'], [150, '₺ —']]) {
      const c = el('div', 'scard soon');
      const i = el('b', 'sicon'); i.append(el('i', 'gd'));
      c.append(i, el('h3', null, `${n} Gök Demir`), el('p', null, 'Telefon sürümünde mağazadan alınabilecek.'), el('div', 'sown', p));
      const btn = el('button', 'small', 'YAKINDA');
      btn.disabled = true;
      c.append(btn);
      box.append(c);
    }
  }
}

// Boy Seçimi ekranındaki takviye rafı: elindeki takviyelerden en çok 3'ü seçilir; olmayanı oradan da alabilirsin
export function drawRack(box, redraw) {
  box.replaceChildren(el('small', 'rackhead', `TAKVİYE RAFI · ${shop.rack.length}/${MAX_RACK}`));
  const row = el('div', 'rackrow');
  for (const b of BOOSTS) {
    const have = shop.inv[b.id] || 0, on = shop.rack.includes(b.id);
    const c = el('button', 'rack' + (on ? ' on' : '') + (have ? '' : ' none'));
    c.append(el('b', null, b.icon), el('span', null, have ? `×${have}` : priceTxt(b)));
    c.title = `${b.name}: ${b.text}`;
    c.onclick = () => {
      if (!have) { if (!shop.buyBoost(b.id)) return; }
      else shop.toggleRack(b.id);
      if (!have && shop.rack.length < MAX_RACK) shop.toggleRack(b.id);
      redraw();
    };
    row.append(c);
  }
  box.append(row);
}
