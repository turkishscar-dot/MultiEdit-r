// Spider-Man Unlimited videolarından alınan sunum öğeleri (RAPOR-CLAUDE/RAPOR.md):
//  - boss tanıtım kartı (tam ekran çizgi roman, "DİKKAT! GELEN: ..."),
//  - özel bölüm bandı (sol üstte "SERBEST DÜŞÜŞ" gibi),
//  - Kam'ın Davulu çekim gösterisi (ışık küresi -> girdap -> yiğit kartı, yıldızlar tek tek yanar),
//  - koşu sonu çizgi roman paneli (yiğit görseli + konuşma balonu + sayarak yükselen skor + YENİ REKOR damgası).
const SPLASH = import.meta.glob('./assets/splash/*.jpg', { eager: true, query: '?url', import: 'default' });
export const splashOf = id => SPLASH[`./assets/splash/${id}.jpg`];
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const box = id => document.getElementById(id) || document.body.appendChild(Object.assign(el('div'), { id, hidden: true }));
const pick = a => a[Math.floor(Math.random() * a.length)];

// ---------- boss tanıtımı: ~2,4 sn ----------
const GULUS = ['KAH KAH KAH!', 'HA HA HAAA!', 'HIRRR!', 'GELDİN DEMEK!'];
export function bossIntro(name, sfx) {
  const b = box('bintro');
  b.replaceChildren(el('div', 'bgulus ink', pick(GULUS)), Object.assign(el('div', 'bband'), {}));
  b.lastChild.append(el('small', null, 'DİKKAT! GELEN:'), el('strong', 'ink', name));
  b.hidden = false;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  sfx?.('roar');
  clearTimeout(bossIntro.t);
  bossIntro.t = setTimeout(() => { b.hidden = true; }, 2400);
}

// ---------- özel bölüm bandı ----------
export function modeBand(text) {
  const b = box('modeband');
  if (!text) { b.hidden = true; return; }
  b.textContent = text;
  b.hidden = false;
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
}

// ---------- Kam'ın Davulu çekimi: ~4,5 sn, dokununca hızlanır ----------
// card: { id, name, title, stars }, rank: rütbe adı, isNew, done(): gösteri bitince
export function drumReveal(card, rank, isNew, done, sfx) {
  const b = box('drumfx');
  const st = el('div', 'dstars');
  for (let i = 0; i < 8; i++) st.append(el('i', i < card.stars ? 'on' : 'off'));
  const art = el('div', 'dcard');
  const u = splashOf(card.id);
  if (u) art.style.backgroundImage = `url("${u}")`;
  art.append(el('div', 'dname ink', card.name), el('div', 'dtitle', card.title || ''));
  b.replaceChildren(el('div', 'dorb'), el('div', 'dflash'), el('div', 'dswirl'), art, st,
    el('div', 'drank ink r' + card.stars, rank), el('div', 'dnew ink', isNew ? 'YENİ YİĞİT!' : 'KOPYA +1 · RÜTBE İÇİN'), el('small', 'dhint', 'devam etmek için dokun'));
  b.className = 'r' + card.stars;
  b.hidden = false;
  b.classList.remove('play'); void b.offsetWidth; b.classList.add('play');
  sfx?.('levelup');
  // yıldızlar sırayla yanar (videodaki gibi): 2,4 sn'den sonra her biri 0,22 sn arayla
  [...st.children].forEach((s, i) => { if (i < card.stars) setTimeout(() => { s.classList.add('lit'); sfx?.('kut'); }, 2400 + i * 220); });
  let bitti = false;
  const kapat = () => { if (bitti) return; bitti = true; b.hidden = true; done?.(); };
  setTimeout(() => { b.onclick = kapat; }, 2600 + card.stars * 220); // gösteri bitmeden dokunuş geçmez
}

// ---------- koşu sonu paneli ----------
const SOZ = {
  win: ['Töre yerini buldu. Gök Tengri şahit!', 'Bu akın destanlara yazılacak!', 'Oğuz boyları bu günü unutmayacak!'],
  over: ['Bu daha başlangıç... Yeniden akına çıkacağım!', 'Yere düşen kalkar. Atımı eyerleyin!', 'Erlik bu sefer güldü, son gülen biz olacağız!'],
};
// hedef: #over ya da #win; skor sayarak yükselir; rekor kırıldıysa damga vurulur
export function endPanel(hedef, { kind, cardId, score, best, newBest }) {
  const h = document.getElementById(hedef);
  h.querySelector('.endpanel')?.remove();
  const p = el('div', 'endpanel ' + kind);
  const band = el('div', 'eband ink', kind === 'win' ? 'BÜYÜK AKIN!' : 'AKIN BİTTİ');
  const art = el('div', 'eart');
  const u = splashOf(cardId);
  if (u) art.style.backgroundImage = `url("${u}")`;
  const bub = el('div', 'ebubble', pick(SOZ[kind]));
  const sc = el('div', 'escore');
  const num = el('strong', 'ink', '0');
  sc.append(el('small', null, 'SKOR'), num, el('small', 'ebest', newBest ? '' : `EN İYİ ${Math.floor(best).toLocaleString('tr-TR')}`));
  const stamp = el('div', 'estamp', 'YENİ REKOR!');
  stamp.hidden = true;
  p.append(band, art, bub, sc, stamp);
  h.querySelector('h1').after(p);
  const t0 = performance.now(), dur = 1400, hedefSkor = Math.floor(score);
  const tick = t => { // 0'dan yukarı sayar, sonunda rekorsa damga
    const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 3;
    num.textContent = Math.floor(hedefSkor * e).toLocaleString('tr-TR');
    if (k < 1) requestAnimationFrame(tick);
    else if (newBest) { stamp.hidden = false; }
  };
  requestAnimationFrame(tick);
}
