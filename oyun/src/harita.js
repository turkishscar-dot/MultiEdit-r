import { svg } from './simge.js';
// Akın Haritası: parşömen üstünde Türk dünyası; her bölümün kısımları yol üstünde düğüm, aralarda ek görevler.
// Her düğüm ayrı bir görevdir (SMU'daki gibi): bitince 0-3 madalya (bronz/gümüş/altın skor eşiği).
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export const REGIONS = {
  1: { name: 'ÖTÜKEN', sub: 'Surlar', icon: '🏯' }, 2: { name: 'KARA BATAKLIK', sub: 'Sisli sazlık', icon: '🌫' },
  3: { name: 'ALTAY', sub: 'Karlı dağlar', icon: '🏔' }, 4: { name: 'GÖK YOLU', sub: 'Bulutlar', icon: '☁' },
  5: { name: 'YERALTI', sub: 'Yedi kat', icon: '🔥' }, 6: { name: 'ÇİN', sub: 'Esir Türkler', icon: '🏮' },
  7: { name: 'KARANLIK ÜLKE', sub: 'Kuzey', icon: '🌌' },
};

// Ek görevler: bölümün bir kısmından sonra açılır. cond: [ölçü, hedef]; req: boy ya da kostüm şartı; mods: görev ayarı
export const EXTRA = [
  { id: 'kilpayi20', lv: 1, after: 0, name: 'Kıl Payı Talimi', icon: '✦', cond: ['kilpayi', 20], text: '20 kez kıl payı geç.', reward: { kut: 300, gd: 1, xp: 80 } },
  { id: 'kayi30', lv: 1, after: 2, name: 'Kayı Akını', icon: '⚔', cond: ['kill', 30], req: { boy: 'kayi' }, text: '30 düşman biç.', reward: { kut: 400, gd: 1, xp: 100 } },
  { id: 'darbesiz500', lv: 3, after: 0, name: 'Dokunulmaz', icon: '🛡', cond: ['nohit', 500], text: 'Hiç darbe almadan 500 m git. İlk darbede görev biter.', reward: { kut: 400, gd: 2, xp: 120 } },
  { id: 'halka25', lv: 4, after: 0, name: 'Göğün Eri', icon: '◯', cond: ['kilpayi', 25], text: 'Bulut sırtında 25 kez kıl payı geç.', reward: { kut: 400, gd: 1, xp: 100 } },
  { id: 'isabet12', lv: 5, after: 1, name: 'Tamga Avı', icon: '𐰴', cond: ['isabet', 12], text: '12 tamga halkasından geç.', reward: { kut: 500, gd: 2, xp: 120 } },
  { id: 'yay15', lv: 6, after: 0, name: 'Yayın Hakkı', icon: '🏹', cond: ['kill_arrow', 15], req: { boy: 'yazir' }, text: 'Sadece yayla 15 düşman vur (kılıçla öldürülen sayılmaz).', reward: { kut: 500, gd: 2, xp: 120 } },
  { id: 'manas25', lv: 7, after: 1, name: "Manas'ın Yolu", icon: '👑', cond: ['kilpayi', 25], req: { costume: 'manas' }, text: '25 kez kıl payı geç.', reward: { kut: 600, gd: 3, xp: 150 } },
];
export const COND_TEXT = { kilpayi: 'kıl payı', kill: 'düşman', ride_dist: 'm atla', nohit: 'm darbesiz', hoop: 'halka', isabet: 'isabet', kill_arrow: 'okla düşman' };

// Madalya: bitirmek bronz; skor eşikleri gümüş ve altın. Eşik kısmın mesafe hedefiyle ölçeklenir; boss'lu kısımda
// boss puanı (2000 + vuruşlar) eklenir. Test botu (ölümsüz) çoğu kısımda bronz-gümüş alıyor; altın iyi kombo ister.
export function thresholds(node) {
  const d = node.dist || 600, boss = node.boss && !node.extra ? 1 : 0;
  const r = v => Math.round(v / 100) * 100;
  return [0, r(d * 9 + boss * 1500), r(d * 15 + boss * 3500)];
}
export const medalsFor = (node, score) => { const t = thresholds(node); return 1 + (score >= t[1]) + (score >= t[2]); };

// Kayıt: düğüm id -> { m: madalya, best: en iyi skor }
export const store = load('oguz-harita', {});
export const saveStore = () => save('oguz-harita', store);

// Üretilen görevler: her hazır bölge en az HEDEF düğüme tamamlanır. Mevcut kısımlar ve elle yazılmış ek görevler
// korunur; eksik kadar kısa görev, bölgenin temasında ve gittikçe zorlaşarak kısımların arasına dizilir.
const HEDEF = 22;
const PLACES = {
  1: ['Sur Önü', 'Kule Dibi', 'Kervan Yolu', 'Otağ Meydanı', 'Tuğ Alanı', 'Bozkır Kıyısı', 'Nöbet Burcu', 'Ötüken Geçidi'],
  2: ['Sisli Sazlık', 'Kara Su', 'Batak Kıyısı', 'Çürük Köprü', 'Ölü Ağaç', 'Yeşil Pus', 'Albastı Çukuru', 'Kamış Yolu'],
  3: ['Karlı Geçit', 'Buz Göl', 'Çam Ormanı', 'Yurt Köyü', 'Kayalık', 'Don Vadisi', 'Kızak Yolu', 'Tipi Başı'],
  4: ['Bulut Sırtı', 'Rüzgâr Geçidi', 'Güneş Basamağı', 'Yıldız Köprüsü', 'Uçan Kaya', 'Tan Yeli', 'Ak Bulut', 'Tengri Eşiği'],
  5: ['Kor Yolu', 'Zincir Geçidi', 'Lav Nehri', 'Kemik Ovası', 'Demir Kapı', 'Kara Mağara', 'Ateş Çukuru', 'Erlik Eşiği'],
  6: ['Taş Avlu', 'Fener Sokağı', 'Esir Kampı', 'Sur Gözcüsü', 'Pagoda Yolu', 'Zindan Önü', 'Pazar Meydanı', 'Bekçi Kulesi'],
  7: ['Kutup Işığı', 'Kara Çam', 'Gölge Ova', 'Don Tepesi', 'Ruh Yolu', 'Buz Çölü', 'Ay Eşiği', 'Kuzey Geçidi'],
};
const r50 = v => Math.round(v / 50) * 50;
// [ölçü, ad sonu, hedef(k), açıklama]; k: bölgedeki sıra, büyüdükçe hedef artar
const TASKS = [
  ['dist', 'Gözcülüğü', k => r50(450 + k * 35), v => `${v} m yol kat et.`],
  ['kill', 'Avı', k => 8 + Math.round(k * 1.6), v => `${v} düşman biç.`],
  ['kut', 'Ganimeti', k => 30 + k * 5, v => `${v} kut topla.`],
  ['combo', 'Kılıç Oyunu', k => 5 + Math.floor(k * 0.7), v => `${v} kombo yap.`],
  ['kilpayi', 'Kıl Payı Geçidi', k => 4 + Math.floor(k * 0.6), v => `${v} kez kıl payı geç.`],
  ['nohit', 'Dokunulmaz Yürüyüş', k => r50(150 + k * 25), v => `Hiç darbe almadan ${v} m git. İlk darbede görev biter.`],
];
function genNode(lv, k, slot) {
  const [kind, tail, goal, text] = TASKS[(k + lv) % TASKS.length], v = goal(k), place = PLACES[lv][k % PLACES[lv].length];
  return { id: `g-gen${lv}_${k}`, lv, after: slot, extra: true, gen: true, name: `${place} ${tail}`, text: text(v), cond: [kind, v],
    dist: kind === 'dist' || kind === 'nohit' ? v : 400, reward: { kut: 60 + 12 * lv + 5 * k, gd: k % 5 === 4 ? 1 : 0, xp: 30 + 5 * lv } };
}

// Düğüm listesi (oynama sırasıyla): LEVELS'tan kısımlar + ek görevler
export function buildNodes(LEVELS, PARTS, BOSSES) {
  const nodes = [];
  for (const part of PARTS) for (const lv of part.levels) {
    const L = LEVELS[lv.id];
    if (!lv.ready || !L?.floors) { nodes.push({ id: 'soon-' + lv.id, lv: lv.id, soon: true, name: lv.name, boss: lv.boss }); continue; }
    const manual = EXTRA.filter(e => e.lv === lv.id).length, G = Math.max(0, HEDEF - L.floors.length - manual), slots = Math.max(1, L.floors.length - 1);
    let gk = 0;
    L.floors.forEach((F, fi) => {
      nodes.push({ id: `${lv.id}-${fi}`, lv: lv.id, floor: fi, name: F.name, sub: F.sub, boss: F.boss ? BOSSES[F.boss].name : null, dist: F.goals?.find(g => g[0] === 'dist')?.[1], last: fi === L.floors.length - 1,
        reward: { kut: 100 * lv.id + 50 * fi, gd: F.boss ? 1 : 0, xp: 50 + 10 * lv.id } });
      if (fi < slots && PLACES[lv.id]) for (let c = Math.floor(G / slots) + (fi < G % slots ? 1 : 0); c > 0; c--) nodes.push(genNode(lv.id, gk++, fi));
      for (const x of EXTRA.filter(e => e.lv === lv.id && e.after === fi)) nodes.push({ ...x, id: 'g-' + x.id, extra: true, dist: x.cond[0] === 'nohit' || x.cond[0] === 'ride_dist' ? x.cond[1] : 600 });
    });
  }
  return nodes;
}

// Açık mı: zincirdeki (kısımlar + üretilen görevler) bir önceki düğüm en az bronzla bitmiş olmalı; elle yazılmış ek görev,
// bağlı olduğu kısımdan sonra açılır. Bir kez bitirilen düğüm hep açık kalır (görev eklenince eski kayıt kilitlenmesin).
const chainOf = nodes => nodes.filter(x => !x.soon && (!x.extra || x.gen));
export function isOpen(nodes, n) {
  if (n.soon) return false;
  if (store[n.id]?.m) return true;
  if (n.extra && !n.gen) return (store[`${n.lv}-${n.after}`]?.m || 0) > 0;
  const c = chainOf(nodes), i = c.indexOf(n);
  return i === 0 || (store[c[i - 1].id]?.m || 0) > 0;
}
export const nextMain = (nodes, n) => { const c = chainOf(nodes); return c[c.indexOf(n) + 1] || null; };

// Eski kayıt (bölüm yıldızları) madalyaya dönüşür: ilerleme kaybolmaz
export function migrate(progress, nodes) {
  if (store.__migrated) return;
  for (const n of nodes) if (!n.extra && !n.soon && progress[n.lv] && !store[n.id]) store[n.id] = { m: progress[n.lv], best: 0 };
  store.__migrated = true;
  saveStore();
}

// ---------- çizim ----------
// Bölge sekmeleri + bölgenin çizilmiş manzarası üstünde düğümler. Yatay ekranda yol soldan sağa, dikeyde yukarıdan aşağı.
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const REGION_ICON = { 1: 'otuken', 2: 'bataklik', 3: 'altay', 4: 'gok', 5: 'yeralti', 6: 'cin', 7: 'karanlik' };
// Zemin: yapay zekâyla çizilmiş dikey manzara karoları (src/assets/harita). Bölge uzadıkça karolar alt alta döşenir,
// her ikinci karo aynalanır ki birleşim yeri belli olmasın. Yol karoda yok; kodla çizilir, düğümlerle hep hizalı kalır.
const TILES = import.meta.glob('./assets/harita/*.jpg', { eager: true, query: '?url', import: 'default' });
const TILE_OF = { 1: 'otuken', 2: 'bataklik', 3: 'altay', 4: 'goksirt', 5: 'yeralti', 6: 'cin', 7: 'karanlik', 8: 'orman', 9: 'altay', 10: 'bataklik', 11: 'cin', 12: 'karanlik' };
// Yol renkleri bölgeye göre: [kenar, dolgu, orta çizgi]
const ROAD = { 1: ['#5a3a1a', '#f0d79a', '#fff6d8'], 2: ['#2a2a18', '#c2b184', '#f0e6c0'], 3: ['#5a2a10', '#ecc88a', '#fff0cc'], 4: ['#2a4a7a', '#d8ecff', '#ffffff'],
  5: ['#3a0a00', '#ff9a30', '#ffe08a'], 6: ['#4a1a10', '#ecdcbc', '#fff6e0'], 7: ['#101840', '#8ac4ff', '#e0f4ff'] };
function tilesFor(lv, H, width) {
  const box = el('div', 'mbg');
  const src = TILES['./assets/harita/' + (TILE_OF[lv] || 'otuken') + '.jpg'];
  const n = Math.ceil(H / (Math.max(width, 320) * 1120 / 640)) + 1;
  for (let i = 0; i < n; i++) { const im = el('img'); im.src = src; im.alt = ''; im.draggable = false; if (i % 2) im.style.transform = 'scaleY(-1)'; box.append(im); }
  return box;
}
// Noktalardan yumuşak S eğrisi: her parça dikey teğetle başlayıp biter, yol kıvrılarak yükselir
const curve = pts => pts.map(([x, y], i) => { if (!i) return 'M ' + x + ' ' + y; const [px, py] = pts[i - 1], m = (py + y) / 2; return 'C ' + px + ' ' + m + ' ' + x + ' ' + m + ' ' + x + ' ' + y; }).join(' ');
let selLv = null;
const ICON_OF = n => (n.soon ? 'yakinda' : n.gen ? { dist: 'kisim', kill: 'kill', kut: 'carsi', combo: 'kilpayi', kilpayi: 'kilpayi', nohit: 'nohit' }[n.cond[0]] : n.extra ? n.cond[0] : n.boss ? 'boss' : 'kisim');
// Tek parça dünya: bölgeler alt alta, en yeni bölge üstte; yol aşağıdan yukarı tırmanır.
// Ekranda ortadaki bölge net, komşuları bulanık ("far") görünür.
const STEP = 120, PAD_BOTTOM = 120, PAD_TOP = 150;
const regionH = n => Math.max(Math.round(innerHeight * 0.9), n * STEP + PAD_BOTTOM + PAD_TOP);
export function drawMap(box, nodes, onPick) {
  const byLv = {};
  for (const n of nodes) (byLv[n.lv] ??= []).push(n);
  const lvs = Object.keys(byLv).map(Number);
  const chain = chainOf(nodes), curNode = chain.find(n => !store[n.id]?.m && isOpen(nodes, n));
  const lastOpen = curNode || chain.at(-1);
  if (!selLv || !byLv[selLv]) selLv = lastOpen?.lv ?? lvs[0];
  box.replaceChildren();
  const world = el('div', 'mworld');
  const tabs = el('div', 'mtabs');
  const regs = {};
  const yOf = {}; // düğüm id -> bölge üstünden px
  const focus = lv => {
    selLv = lv;
    for (const k in regs) regs[k].classList.toggle('far', +k !== lv);
    for (const t of tabs.children) { const on = +t.dataset.lv === lv; t.classList.toggle('on', on); if (on) tabs.scrollTo({ left: t.offsetLeft - (tabs.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' }); }
  };
  const center = (lv, n, smooth) => {
    const r = regs[lv];
    if (!r) return;
    const y = r.offsetTop + (n && yOf[n.id] != null ? yOf[n.id] : r.offsetHeight / 2);
    world.scrollTo({ top: Math.max(0, y - world.clientHeight / 2), behavior: smooth ? 'smooth' : 'auto' });
  };
  // bölge sekmeleri
  for (const lv of lvs) {
    const open = byLv[lv].some(n => isOpen(nodes, n)), R = REGIONS[lv];
    const t = el('button', 'mtab' + (open ? '' : ' locked'));
    t.dataset.lv = lv;
    t.append(svg(REGION_ICON[lv] || 'otuken', 40), el('small', null, R ? R.name : byLv[lv][0].name));
    t.onclick = () => { focus(lv); center(lv, byLv[lv].find(n => (!n.extra || n.gen) && isOpen(nodes, n) && !store[n.id]?.m) || byLv[lv][0], true); };
    tabs.append(t);
  }
  box.append(tabs, world);
  // bölgeler: üstte en yeni (listeyi ters çevir)
  for (const lv of [...lvs].reverse()) {
    const list = byLv[lv], R = REGIONS[lv], H = regionH(list.length);
    const reg = el('section', 'mreg th' + Math.min(lv, 7));
    reg.style.height = H + 'px';
    regs[lv] = reg;
    reg.append(tilesFor(lv, H, world.clientWidth), el('div', 'mfx'));
    const main = chainOf(list);
    const done = main.filter(n => store[n.id]?.m).length, pct = main.length ? Math.round(100 * done / main.length) : 0;
    const got = list.reduce((a, n) => a + (store[n.id]?.m || 0), 0);
    const head = el('div', 'mhead');
    head.append(el('h3', null, R ? `${lv}. ${R.name}` : list[0].name), el('small', null, (R?.sub || 'YAKINDA') + ` · madalya ${got}/${list.length * 3}`));
    if (main.length) { const bar = el('div', 'mbar'), f = el('i'); f.style.width = pct + '%'; bar.append(f, el('b', null, '%' + pct)); head.append(bar); }
    reg.append(head);
    // düğümler aşağıdan yukarı; x sağ-sol salınır, bölgenin alt ve üst kenarında yol ortada buluşur
    const span = H - PAD_BOTTOM - PAD_TOP;
    const pts = list.map((n, i) => [50 + 22 * Math.sin(i * 1.25 + lv), H - PAD_BOTTOM - (list.length === 1 ? 0 : i * span / (list.length - 1))]);
    list.forEach((n, i) => { yOf[n.id] = pts[i][1]; });
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    path.setAttribute('viewBox', `0 0 100 ${H}`);
    path.setAttribute('preserveAspectRatio', 'none');
    path.setAttribute('class', 'mroad');
    const [ce, cf, cm] = ROAD[lv] || ROAD[1], d = curve([[50, H], ...pts, [50, 0]]);
    path.style.setProperty('--re', ce); path.style.setProperty('--rf', cf); path.style.setProperty('--rm', cm);
    path.innerHTML = `<path class="re" d="${d}"/><path class="rf" d="${d}"/><path class="rm" d="${d}"/>`;
    reg.append(path);
    list.forEach((n, i) => {
      const open = isOpen(nodes, n), st = store[n.id];
      const b = el('button', 'mnode' + (n.extra && !n.gen ? ' extra' : '') + (n.boss && !n.extra ? ' boss' : '') + (open ? '' : ' locked') + (st?.m ? ' done' : '') + (n === curNode ? ' cur' : ''));
      b.style.left = pts[i][0] + '%';
      b.style.top = pts[i][1] + 'px';
      b.style.setProperty('--d', (i % 7) * 0.35 + 's'); // komşu düğümler aynı anda oynamasın
      b.setAttribute('aria-label', n.name);
      const ic = el('span', 'nicon');
      ic.append(svg(open || n.soon ? ICON_OF(n) : 'kilit', n.boss && !n.extra ? 50 : 40));
      b.append(ic);
      const md = el('span', 'medals');
      for (let k = 0; k < 3; k++) md.append(el('i', k < (st?.m || 0) ? ['bz', 'gm', 'al'][k] : ''));
      b.append(md);
      b.onclick = () => onPick(n, open);
      reg.append(b);
    });
    world.append(reg);
  }
  // kaydırdıkça ortadaki bölge netleşir
  world.onscroll = () => {
    const mid = world.scrollTop + world.clientHeight / 2;
    for (const k in regs) {
      const r = regs[k];
      if (mid >= r.offsetTop && mid < r.offsetTop + r.offsetHeight) { if (+k !== selLv) focus(+k); break; }
    }
  };
  focus(selLv);
  // harita ekranı görünürken çizilir (openMap); okuma düzeni zorlar, açık düğüme hemen kaydır
  center(selLv, selLv === lastOpen?.lv ? lastOpen : byLv[selLv][0], false);
}
