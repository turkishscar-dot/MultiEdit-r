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
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const XS = [22, 55, 80, 50, 18, 45, 78];
export function drawMap(box, nodes, onPick) {
  box.replaceChildren();
  const byLv = {};
  for (const n of nodes) (byLv[n.lv] ??= []).push(n);
  for (const [lv, list] of Object.entries(byLv)) {
    const R = REGIONS[lv];
    const sec = el('section', 'region');
    const head = el('div', 'rhead');
    head.append(el('b', 'ricon', R?.icon || '🗺'), el('h3', null, R ? `${lv}. ${R.name}` : `${lv}. ${list[0].name}`), el('small', null, R?.sub || 'YAKINDA'));
    sec.append(head);
    const field = el('div', 'rfield');
    const H = 40 + list.length * 108;
    field.style.height = H + 'px';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 100 ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const pts = list.map((n, i) => [n.extra ? XS[i % XS.length] > 50 ? XS[i % XS.length] - 8 : XS[i % XS.length] + 8 : XS[i % XS.length], 60 + i * 108]);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pts.map(([x, y], i) => (i ? `S ${(x + pts[i - 1][0]) / 2} ${y - 54} ${x} ${y}` : `M ${x} ${y}`)).join(' '));
    svg.append(path);
    field.append(svg);
    list.forEach((n, i) => {
      const open = isOpen(nodes, n), st = store[n.id];
      const b = el('button', 'mnode' + (n.extra ? ' extra' : '') + (n.boss && !n.extra ? ' boss' : '') + (open ? '' : ' locked') + (st?.m ? ' done' : ''));
      b.style.left = pts[i][0] + '%';
      b.style.top = pts[i][1] + 'px';
      b.append(el('b', 'nicon', n.soon ? '🔒' : n.extra ? n.icon : n.boss ? '👹' : '⚔'));
      const lab = el('span', 'nlab');
      lab.append(el('strong', null, n.name));
      if (n.soon) lab.append(el('small', null, 'YAKINDA · ' + n.boss));
      else if (n.extra) lab.append(el('small', null, `${n.cond[1]} ${COND_TEXT[n.cond[0]]}` + (n.req ? ' · şartlı' : '')));
      else lab.append(el('small', null, n.boss ? 'BOSS: ' + n.boss : n.sub));
      const md = el('span', 'medals');
      for (let k = 0; k < 3; k++) md.append(el('i', k < (st?.m || 0) ? ['bz', 'gm', 'al'][k] : ''));
      lab.append(md);
      b.append(lab);
      b.onclick = () => onPick(n, open);
      field.append(b);
    });
    sec.append(field);
    box.append(sec);
  }
}
