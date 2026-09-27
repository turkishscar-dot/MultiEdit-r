// Ortak arayüz parçaları: alttan kayan bildirim kartları, kut / Gök Demir sayaçları, seviye atlama ekranı.
import { wallet } from './costumes.js';
import { levelOf, title, UNLOCK_NAMES } from './akinci.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

// --- alttan kayan kart (başarım, seviye, kademe, sefer bildirimleri) ---
const queue = [];
let showing = false;
export function toast(icon, head, text = '') {
  queue.push({ icon, head, text });
  if (!showing) nextToast();
}
function nextToast() {
  const t = queue.shift();
  if (!t) { showing = false; return; }
  showing = true;
  const card = el('div', 'toast');
  card.append(el('b', 'ticon', t.icon), Object.assign(el('div', 'tbody'), {}));
  card.lastChild.append(el('strong', null, t.head), el('span', null, t.text));
  $('toasts').append(card);
  requestAnimationFrame(() => card.classList.add('in'));
  setTimeout(() => { card.classList.remove('in'); setTimeout(() => { card.remove(); nextToast(); }, 350); }, 2600);
}

// --- para sayaçları: .money kutuları kendini günceller, kazanınca zıplar ---
export function money() {
  const box = el('div', 'money');
  box.append(el('span', 'mk', '◆ ' + wallet.bank));
  const gd = el('span', 'mg');
  gd.append(el('i', 'gd'), document.createTextNode(' ' + wallet.gokdemir));
  box.append(gd);
  return box;
}
function refresh(kind, n) {
  for (const box of document.querySelectorAll('.money')) {
    box.querySelector('.mk').textContent = '◆ ' + wallet.bank;
    box.querySelector('.mg').lastChild.textContent = ' ' + wallet.gokdemir;
    if (n > 0) {
      const s = box.querySelector(kind === 'gd' ? '.mg' : '.mk');
      if (!s) continue;
      s.classList.remove('bump');
      void s.offsetWidth;
      s.classList.add('bump');
    }
  }
}
wallet.onChange(refresh);
export function fillMoney() { // yer tutucuları (data-money) doldur
  for (const slot of document.querySelectorAll('[data-money]')) if (!slot.firstChild) slot.append(money());
  refresh();
}

// --- menüdeki seviye çubuğu ---
export function levelBar() {
  const L = levelOf();
  const box = $('lvbar');
  if (!box) return;
  box.replaceChildren();
  const head = el('div', 'lvhead');
  head.append(el('b', null, title(L.level)), el('span', null, ' · Seviye ' + L.level));
  const bar = el('div', 'lvtrack');
  const fill = el('i');
  fill.style.width = (L.into / L.need) * 100 + '%';
  bar.append(fill);
  box.append(head, bar, el('small', null, `${L.into} / ${L.need} XP`));
}

// --- seviye atlama ekranı (çizgi roman paneli): sırayla gösterir, ödülleri verir ---
export function levelUps(ups, done = () => {}) {
  if (!ups.length) return done();
  const u = ups.shift();
  wallet.deposit(u.reward.kut);
  wallet.addGD(u.reward.gd);
  const box = $('levelup');
  box.querySelector('h1').textContent = u.newTitle ? `${u.title} OLDUN!` : `SEVİYE ${u.level}!`;
  box.querySelector('h2').textContent = `Akıncı Seviyesi ${u.level} · ${u.title}`;
  const r = box.querySelector('.lvreward');
  r.replaceChildren(el('span', null, `◆ ${u.reward.kut} kut`));
  if (u.reward.gd) { const s = el('span'); s.append(el('i', 'gd'), document.createTextNode(` ${u.reward.gd} Gök Demir`)); r.append(s); }
  for (const k of u.unlocks) r.append(el('span', 'lvunlock', '🔓 ' + UNLOCK_NAMES[k] + ' açıldı!'));
  box.hidden = false;
  box.classList.remove('slam');
  void box.offsetWidth;
  box.classList.add('slam');
  box.querySelector('button').onclick = () => { box.hidden = true; levelUps(ups, done); };
}
