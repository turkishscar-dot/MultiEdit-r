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
  { id: 'at1000', lv: 2, after: 1, name: 'Atlı Akın', icon: '🐎', cond: ['ride_dist', 1000], req: { boy: 'doger' }, mods: { nal: 0.25 }, text: 'Atla 1000 m git. Yolda nal sık çıkar.', reward: { kut: 400, gd: 2, xp: 100 } },
  { id: 'darbesiz500', lv: 3, after: 0, name: 'Dokunulmaz', icon: '🛡', cond: ['nohit', 500], text: 'Hiç darbe almadan 500 m git. İlk darbede görev biter.', reward: { kut: 400, gd: 2, xp: 120 } },
  { id: 'halka25', lv: 4, after: 0, name: 'Göğün Eri', icon: '◯', cond: ['hoop', 25], text: 'Uçarken 25 halkadan geç.', reward: { kut: 400, gd: 1, xp: 100 } },
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

// Düğüm listesi (oynama sırasıyla): LEVELS'tan kısımlar + ek görevler
export function buildNodes(LEVELS, PARTS, BOSSES) {
  const nodes = [];
  for (const part of PARTS) for (const lv of part.levels) {
    const L = LEVELS[lv.id];
    if (!lv.ready || !L?.floors) { nodes.push({ id: 'soon-' + lv.id, lv: lv.id, soon: true, name: lv.name, boss: lv.boss }); continue; }
    L.floors.forEach((F, fi) => {
      nodes.push({ id: `${lv.id}-${fi}`, lv: lv.id, floor: fi, name: F.name, sub: F.sub, boss: F.boss ? BOSSES[F.boss].name : null, dist: F.goals?.find(g => g[0] === 'dist')?.[1], last: fi === L.floors.length - 1,
        reward: { kut: 100 * lv.id + 50 * fi, gd: F.boss ? 1 : 0, xp: 50 + 10 * lv.id } });
      for (const x of EXTRA.filter(e => e.lv === lv.id && e.after === fi)) nodes.push({ ...x, id: 'g-' + x.id, extra: true, dist: x.cond[0] === 'nohit' || x.cond[0] === 'ride_dist' ? x.cond[1] : 600 });
    });
  }
  return nodes;
}

// Açık mı: bir önceki ana düğüm (ek görevleri atlayarak) en az bronzla bitmiş olmalı; ek görev, bağlı olduğu kısımdan sonra açılır
export function isOpen(nodes, n) {
  if (n.soon) return false;
  if (n.extra) return (store[`${n.lv}-${n.after}`]?.m || 0) > 0;
  const main = nodes.filter(x => !x.extra && !x.soon);
  const i = main.indexOf(n);
  return i === 0 || (store[main[i - 1].id]?.m || 0) > 0;
}
export const nextMain = (nodes, n) => { const main = nodes.filter(x => !x.extra && !x.soon); return main[main.indexOf(n) + 1] || null; };

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
// Manzaralar: gökyüzü + üç kat siluet (uzak, orta, yakın). viewBox 0 0 800 400
const SCENE = {
  1: { sky: ['#f6b26b', '#fbe3b0'], layers: [
    ['#b98a6a', 'M0 250 L60 230 L120 245 L200 215 L280 240 L360 220 L440 238 L520 210 L600 236 L700 218 L800 240 L800 400 L0 400 Z'],
    ['#8a5a3a', 'M0 290 L40 290 L40 262 L60 262 L60 290 L140 290 L140 250 L150 240 L160 250 L160 290 L300 290 L300 270 L320 270 L320 290 L520 290 L520 244 L532 232 L544 244 L544 290 L700 290 L700 266 L720 266 L720 290 L800 290 L800 400 L0 400 Z'],
    ['#5a3a22', 'M0 340 L800 330 L800 400 L0 400 Z']], extra: '<path d="M620 120 L620 250" stroke="#3a2a18" stroke-width="5"/><path d="M620 124 q30 10 18 40 q-8 -20 -18 -18 Z" fill="#b3202a"/><circle cx="160" cy="90" r="36" fill="#fff4c0" opacity=".85"/>' },
  2: { sky: ['#4a6a5a', '#a8c0b0'], layers: [
    ['#6a8a7a', 'M0 250 Q120 220 240 250 T480 245 T800 240 L800 400 L0 400 Z'],
    ['#2e4a3a', 'M0 300 Q200 280 400 300 T800 295 L800 400 L0 400 Z'],
    ['#16281e', 'M0 350 Q200 335 400 350 T800 345 L800 400 L0 400 Z']], extra: '<path d="M120 300 L120 190 M120 220 L150 190 M120 240 L95 215 M650 300 L650 200 M650 230 L680 205" stroke="#16281e" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="0" y="230" width="800" height="30" fill="#e8f0ea" opacity=".25"/>' },
  3: { sky: ['#6a9ad8', '#d8e8f8'], layers: [
    ['#9ab0d0', 'M0 260 L90 150 L150 210 L240 110 L330 220 L420 140 L520 230 L620 120 L720 210 L800 170 L800 400 L0 400 Z'],
    ['#e8f0f8', 'M0 300 L120 230 L200 270 L320 210 L440 280 L560 230 L680 280 L800 240 L800 400 L0 400 Z'],
    ['#1f4a3a', 'M0 360 L40 320 L60 350 L90 310 L120 350 L700 350 L730 312 L760 350 L800 320 L800 400 L0 400 Z']], extra: '' },
  4: { sky: ['#3a8ad8', '#bfe0ff'], layers: [
    ['#ffffff', 'M0 260 Q60 220 120 250 Q180 210 250 245 Q320 215 380 250 Q450 220 520 250 Q600 215 680 250 Q740 225 800 245 L800 400 L0 400 Z'],
    ['#e8f2ff', 'M0 320 Q80 290 160 315 Q240 285 330 318 Q420 290 520 318 Q620 292 720 318 Q770 300 800 312 L800 400 L0 400 Z'],
    ['#ffffff', 'M0 370 Q200 350 400 368 T800 362 L800 400 L0 400 Z']], extra: '<circle cx="650" cy="90" r="40" fill="#fff8d0"/>' },
  5: { sky: ['#1a0a0c', '#5a1a14'], layers: [
    ['#3a1612', 'M0 220 L80 260 L160 200 L260 250 L360 190 L460 250 L560 200 L660 255 L800 210 L800 400 L0 400 Z'],
    ['#240c0c', 'M0 300 L120 280 L220 310 L340 285 L480 312 L600 286 L720 308 L800 290 L800 400 L0 400 Z'],
    ['#ff5a10', 'M0 360 Q200 345 400 362 T800 355 L800 400 L0 400 Z']], extra: '<path d="M0 0 L60 90 L110 0 Z M300 0 L340 70 L380 0 Z M620 0 L670 100 L720 0 Z" fill="#240c0c"/>' },
  6: { sky: ['#c86a3a', '#f8d8a0'], layers: [
    ['#b88a6a', 'M0 250 L100 225 L220 245 L340 220 L460 240 L600 215 L800 240 L800 400 L0 400 Z'],
    ['#8a3a2a', 'M0 290 L60 290 L60 268 L80 268 L80 290 L200 290 L200 250 Q240 232 280 250 L280 290 L420 290 L420 268 L440 268 L440 290 L560 290 L560 246 Q610 226 660 246 L660 290 L800 290 L800 400 L0 400 Z'],
    ['#4a2418', 'M0 340 L800 334 L800 400 L0 400 Z']], extra: '' },
  7: { sky: ['#060a20', '#1a2a4a'], layers: [
    ['#2a3a5a', 'M0 260 L100 230 L200 255 L320 215 L440 250 L560 222 L680 252 L800 230 L800 400 L0 400 Z'],
    ['#dfe8f8', 'M0 310 Q200 290 400 312 T800 305 L800 400 L0 400 Z'],
    ['#101830', 'M0 360 L800 352 L800 400 L0 400 Z']], extra: '<path d="M40 110 Q200 40 360 120 T760 80" stroke="#5affb0" stroke-width="18" fill="none" opacity=".5"/><path d="M60 150 Q260 90 440 150 T780 130" stroke="#3ac0ff" stroke-width="12" fill="none" opacity=".4"/>' },
};
function sceneSvg(lv) {
  const D = SCENE[lv] || SCENE[1];
  const e = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  e.setAttribute('viewBox', '0 0 800 400');
  e.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  e.setAttribute('class', 'mbg');
  e.innerHTML = `<defs><linearGradient id="sky${lv}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${D.sky[0]}"/><stop offset="1" stop-color="${D.sky[1]}"/></linearGradient></defs>
    <rect width="800" height="400" fill="url(#sky${lv})"/>${D.extra}${D.layers.map(([c, d]) => `<path d="${d}" fill="${c}"/>`).join('')}`;
  return e;
}
let selLv = null;
const ICON_OF = n => (n.soon ? 'yakinda' : n.extra ? n.cond[0] : n.boss ? 'boss' : 'kisim');
export function drawMap(box, nodes, onPick) {
  const byLv = {};
  for (const n of nodes) (byLv[n.lv] ??= []).push(n);
  const lvs = Object.keys(byLv).map(Number);
  const lastOpen = [...nodes].reverse().find(n => !n.extra && isOpen(nodes, n));
  if (!selLv || !byLv[selLv]) selLv = lastOpen?.lv ?? lvs[0];
  box.replaceChildren();
  // bölge sekmeleri
  const tabs = el('div', 'mtabs');
  for (const lv of lvs) {
    const open = byLv[lv].some(n => isOpen(nodes, n)), R = REGIONS[lv];
    const t = el('button', 'mtab' + (lv === selLv ? ' on' : '') + (open ? '' : ' locked'));
    t.append(svg(REGION_ICON[lv] || 'otuken', 40), el('small', null, R ? R.name : byLv[lv][0].name));
    t.onclick = () => { selLv = lv; drawMap(box, nodes, onPick); };
    tabs.append(t);
  }
  box.append(tabs);
  // seçili bölge
  const list = byLv[selLv], R = REGIONS[selLv];
  const got = list.reduce((a, n) => a + (store[n.id]?.m || 0), 0);
  const cap = el('div', 'mcap');
  cap.append(el('h3', null, R ? `${selLv}. ${R.name}` : list[0].name), el('small', null, (R?.sub || 'YAKINDA') + ` · madalya ${got}/${list.length * 3}`));
  const scene = el('div', 'mscene');
  scene.append(sceneSvg(selLv));
  const tall = innerHeight > innerWidth; // dikey ekranda yol yukarıdan aşağı
  const pts = list.map((n, i) => {
    const k = list.length === 1 ? 0.5 : i / (list.length - 1);
    const wave = i % 2 ? 0.7 : 0.3;
    return tall ? [wave * 100, 10 + k * 70] : [10 + k * 80, (i % 2 ? 0.5 : 0.24) * 100]; // etiket düğümün altında: alt kenara taşmasın
  });
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  path.setAttribute('viewBox', '0 0 100 100');
  path.setAttribute('preserveAspectRatio', 'none');
  path.setAttribute('class', 'mroad');
  path.innerHTML = `<path d="${pts.map(([x, y], i) => (i ? `L ${x} ${y}` : `M ${x} ${y}`)).join(' ')}"/>`;
  scene.append(path);
  list.forEach((n, i) => {
    const open = isOpen(nodes, n), st = store[n.id];
    const b = el('button', 'mnode' + (n.extra ? ' extra' : '') + (n.boss && !n.extra ? ' boss' : '') + (open ? '' : ' locked') + (st?.m ? ' done' : ''));
    b.style.left = pts[i][0] + '%';
    b.style.top = pts[i][1] + '%';
    const ic = el('span', 'nicon');
    ic.append(svg(open || n.soon ? ICON_OF(n) : 'kilit', n.boss && !n.extra ? 50 : 40));
    b.append(ic);
    const lab = el('span', 'nlab');
    lab.append(el('strong', null, n.name));
    if (n.soon) lab.append(el('small', null, 'YAKINDA'));
    else if (n.extra) lab.append(el('small', null, `${n.cond[1]} ${COND_TEXT[n.cond[0]]}` + (n.req ? ' · şartlı' : '')));
    else lab.append(el('small', null, n.boss ? n.boss : n.sub));
    const md = el('span', 'medals');
    for (let k = 0; k < 3; k++) md.append(el('i', k < (st?.m || 0) ? ['bz', 'gm', 'al'][k] : ''));
    lab.append(md);
    b.append(lab);
    b.onclick = () => onPick(n, open);
    scene.append(b);
  });
  box.append(cap, scene);
}
