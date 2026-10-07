// Menü ekranları: Yiğitler (kartlar, ordu, Tunç Davul), Kağanlık Kademesi, Akın Seferleri, Destan Koleksiyonları.
// main.js init(U) ile sahne ve ortak yardımcıları verir.
import * as Y from './yigit.js';
import { drumReveal } from './smu.js';
import * as SF from './seferler.js';
import * as KO from './koleksiyon.js';
import * as THREE from 'three';
import { wallet, applyCostume } from './costumes.js';

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const SPLASH = import.meta.glob('./assets/splash/*.jpg', { eager: true, query: '?url', import: 'default' });
const splashUrl = id => SPLASH[`./assets/splash/${id}.jpg`];
const splashArka = (id, alt) => { const u = splashUrl(id); return u ? `linear-gradient(180deg, rgba(0,0,0,0) ${alt}, rgba(8,6,12,.88)), url("${u}")` : ''; };
let U = null;
export function init(u) { U = u; }

const stars = n => '★'.repeat(n);
const RCLS = { 3: 'r3', 4: 'r4', 5: 'r5', 6: 'r6', 7: 'r7', 8: 'r8' };

// ================= YİĞİTLER =================
let sel = null;
export function openYigit(focus) {
  U.setState('yigit');
  for (const id of ['menu', 'map']) $(id).hidden = true;
  U.book.pedestal(true);
  U.book.show({ id: 'oguz', model: 'oguz', anim: 'Idle_Loop', h: 1.9 });
  sel = focus || Y.leader().id;
  lastPrev = null;
  drawYigit();
  $('yigit').hidden = false;
  $('yvitrin').hidden = true;
  $('yigit').classList.remove('full');
  resizeYigit();
}
// Model, ayrıntı kartının üstündeki boş alana (ypreview) ya da tam vitrinin sahnesine (yvstage) yerleşir
export function resizeYigit() {
  const full = !$('yvitrin').hidden;
  U.book.resize(innerWidth, innerHeight, $(full ? 'yvstage' : 'ypreview').getBoundingClientRect());
  const c = Y.CARDS.find(x => x.id === sel), col = new THREE.Color(Y.RANK_COLOR[rankOf(c)]);
  U.book.scene.background = U.book.dark.clone().lerp(col, full ? 0.22 : 0.1); // nadirlik rengine çalan arka plan
}
export function closeYigit() {
  U.book.setRank(null);
  U.dressHero();
  $('yigit').hidden = true;
  U.toMenu();
}
const rankOf = c => Y.cardState(c.id)?.stars ?? c.stars;
let lastPrev = null;
// Vitrin: kostüm giydirilir, nadirlik ışığı yanar, yiğide özel bekleme duruşu; kart değişince giyinme parıltısı
function preview(c) {
  const a = U.book.actors.oguz, fx = Y.cardFx(c);
  applyCostume(a, Y.cardLook(c));
  a.parts.BowHand.visible = a.parts.ArrowNock.visible = false;
  U.book.setRank(Y.RANK_COLOR[rankOf(c)]);
  if (lastPrev !== c.id) {
    if (lastPrev) { U.book.transform(); U.sfx('flip', { gain: 0.5 }); }
    U.book.pose(fx.bekle, fx.bekle);
    lastPrev = c.id;
  }
}
// Sürükleyerek döndür
let dragX = null;
for (const id of ['ypreview', 'yvstage']) {
  const e = $(id);
  e.addEventListener('pointerdown', ev => { dragX = ev.clientX; e.setPointerCapture(ev.pointerId); });
  e.addEventListener('pointermove', ev => { if (dragX == null) return; U.book.dragBy(ev.clientX - dragX); dragX = ev.clientX; });
  e.addEventListener('pointerup', () => { dragX = null; });
}
function poseRow(c) {
  const fx = Y.cardFx(c), row = el('div', 'yposes');
  const sword = on => { const a = U.book.actors.oguz; a.parts.SwordHand.visible = on; a.parts.SwordSheath.visible = !on; };
  for (const [t, clip, sw] of [['BEKLE', fx.bekle, false], ['SALDIR', 'Sword_Heavy_Combo', true], ['ZAFER', fx.zafer, false]]) {
    const b = el('button', 'small', t);
    b.onclick = () => { sword(sw); U.book.pose(clip, fx.bekle); };
    row.append(b);
  }
  return row;
}
// ---- tam ekran vitrin ----
function sortedCards() { return [...Y.CARDS].filter(k => Y.visible(k)).sort((a, b) => (Y.owned(b.id) - Y.owned(a.id)) || (b.stars - a.stars)); }
export function openVitrin() { $('yvitrin').hidden = false; $('yigit').classList.add('full'); drawVitrin(); resizeYigit(); }
function closeVitrin() { $('yvitrin').hidden = true; $('yigit').classList.remove('full'); drawYigit(); resizeYigit(); }
function stepVitrin(d) { const L = sortedCards(), i = L.findIndex(k => k.id === sel); sel = L[(i + d + L.length) % L.length].id; drawVitrin(); resizeYigit(); }
function drawVitrin() {
  const c = Y.CARDS.find(x => x.id === sel), s = Y.cardState(sel), st = rankOf(c);
  preview(c);
  const box = $('yvitrin');
  box.className = RCLS[st];
  const head = el('div', 'yvhead');
  head.append(el('span', 'ystars', stars(st) + ' ' + Y.RANKS[st][0]), el('h2', 'ink', c.name), el('small', null, c.title));
  if (c.season) head.append(el('i', 'ytag bayram', 'BAYRAM'));
  const acts = el('div', 'yvacts');
  const btn = (t, fn, dis, cls = 'small') => { const b = el('button', cls, t); b.disabled = !!dis; b.onclick = fn; acts.append(b); };
  if (!s) {
    const p = Y.buyPrice(c), ok = Y.buyable(c);
    btn('▶ BİR KOŞU DENE', () => U.trial(c.id), false, 'big');
    if (ok) btn(p.kut != null ? `◆ ${p.kut} İLE AL` : `⬢ ${p.gd} İLE ÇAĞIR`, () => { if (Y.buy(c.id)) { U.book.transform(); afterChange(); drawVitrin(); } }, p.kut != null ? wallet.bank < p.kut : wallet.gokdemir < p.gd);
    else btn(Y.seasonText(c), () => {}, true);
  } else if (Y.leader().id !== c.id) btn('LİDER YAP', () => { Y.setLeader(c.id); afterChange(); drawVitrin(); }, SF.busyCards().includes(c.id), 'big');
  else acts.append(el('b', 'ink ylead', 'LİDER'));
  const nav = el('div', 'yvnav');
  const prev = el('button', 'small', '◀'), next = el('button', 'small', '▶'), close = el('button', 'small', '✕');
  prev.onclick = () => stepVitrin(-1); next.onclick = () => stepVitrin(1); close.onclick = closeVitrin;
  nav.append(prev, next, close);
  box.replaceChildren(head, $('yvstage'), poseRow(c), acts, nav);
}

export function drawYigit() {
  const c = Y.CARDS.find(x => x.id === sel), s = Y.cardState(sel), helpers = U.isUnlocked('ordu');
  preview(c);
  $('ydavul').textContent = `🥁 ${wallet.tuncdavul}`;
  // ordu: lider + 3 yardımcı ve güç çarpanı
  const army = $('yarmy');
  army.replaceChildren(el('small', null, 'ORDU'));
  const slot = (card, lead) => {
    const b = el('button', 'yslot' + (lead ? ' lead' : '') + (card ? ' ' + RCLS[Y.cardState(card.id).stars] : ''));
    b.append(el('b', null, card ? card.name.split(' ')[0] : '+'), el('span', null, card ? stars(Y.cardState(card.id).stars) : (helpers ? 'boş' : '🔒 12')));
    b.onclick = () => { if (card) { sel = card.id; drawYigit(); } else if (!helpers) U.locked('ordu'); };
    return b;
  };
  army.append(slot(Y.leader(), true));
  const tm = Y.team();
  for (let i = 0; i < 3; i++) army.append(slot(tm[i] || null, false));
  army.append(el('b', 'ymult', `GÜÇ ${Y.armyPower(helpers)} · ×${Y.armyMult(helpers).toFixed(1)}`));
  // kart listesi
  const list = $('ylist');
  list.replaceChildren();
  const busy = SF.busyCards();
  for (const k of sortedCards()) {
    const ks = Y.cardState(k.id), own = !!ks;
    const card = el('button', 'ycard ' + RCLS[own ? ks.stars : k.stars] + (own ? '' : ' none') + (k.id === sel ? ' on' : ''));
    if (splashUrl(k.id)) { card.classList.add('art'); card.style.backgroundImage = splashArka(k.id, '38%'); }
    card.append(el('span', 'ystars', stars(own ? ks.stars : k.stars)), el('b', null, k.name), el('small', null, own ? `Sv ${ks.lvl} · Güç ${Y.power(k.id)}` : 'KİLİTLİ'));
    if (k.id === Y.leader().id) card.append(el('i', 'ytag', 'LİDER'));
    else if (Y.team().includes(k)) card.append(el('i', 'ytag', 'ORDU'));
    else if (busy.includes(k.id)) card.append(el('i', 'ytag sefer', 'SEFERDE'));
    else if (k.season && !own) card.append(el('i', 'ytag bayram', k.season.name));
    card.onclick = () => { sel = k.id; drawYigit(); };
    list.append(card);
  }
  $('ypbtns').replaceChildren(poseRow(c), (() => { const b = el('button', 'small', '⛶ VİTRİN'); b.onclick = openVitrin; return b; })());
  // seçili kartın ayrıntısı
  const d = $('ydetail');
  const rk = Y.RANKS[s ? s.stars : c.stars];
  const kids = [el('div', 'yhead ' + RCLS[s ? s.stars : c.stars])];
  kids[0].append(el('span', 'ystars', stars(s ? s.stars : c.stars) + ' ' + rk[0]), el('h3', null, c.name), el('small', null, c.title));
  if (splashUrl(c.id)) { kids[0].classList.add('art'); kids[0].style.backgroundImage = splashArka(c.id, '10%'); }
  if (s) kids.push(el('p', 'ylvl', `Seviye ${s.lvl} / ${Y.maxLvl(c.id)} · Güç ${Y.power(c.id)}` + (s.copies ? ` · kopya ×${s.copies}` : '')));
  const ab = el('div', 'yab');
  c.ab.forEach((a, i) => { const on = i === 0 || (s && s.stars >= 5); ab.append(el('span', on ? 'on' : 'off', (on ? '✦ ' : '🔒 5★: ') + Y.ABILITY[a].text)); });
  kids.push(ab, el('p', 'ytext', c.text));
  const row = el('div', 'ybtns');
  const btn = (text, fn, dis) => { const b = el('button', 'small', text); b.disabled = !!dis; b.onclick = () => { fn(); afterChange(); }; row.append(b); };
  if (!s) {
    const p = Y.buyPrice(c);
    if (Y.buyable(c)) btn(p.kut != null ? `◆ ${p.kut} İLE AL` : `⬢ ${p.gd} İLE ÇAĞIR`, () => Y.buy(c.id), p.kut != null ? wallet.bank < p.kut : wallet.gokdemir < p.gd);
    else btn(Y.seasonText(c), () => {}, true);
    const t = el('button', 'small', '▶ DENE');
    t.onclick = () => U.trial(c.id);
    row.append(t);
  } else {
    const isBusy = busy.includes(c.id);
    if (Y.leader().id !== c.id) btn('LİDER YAP', () => Y.setLeader(c.id), isBusy);
    if (Y.leader().id !== c.id) btn(Y.team().includes(c) ? 'ORDUDAN ÇIKAR' : 'ORDUYA KAT', () => helpers ? Y.toggleTeam(c.id) : U.locked('ordu'), isBusy || (!Y.team().includes(c) && Y.team().length >= 3));
    btn(s.lvl >= Y.maxLvl(c.id) ? 'EN ÜST SEVİYE' : `SEVİYE ◆ ${Y.lvlCost(c.id)}`, () => Y.levelUp(c.id), s.lvl >= Y.maxLvl(c.id) || wallet.bank < Y.lvlCost(c.id));
    if (s.stars < 8) {
      if (s.copies) btn('RÜTBE (KOPYA)', () => Y.rankUp(c.id, false));
      btn(`RÜTBE ⬢ ${Y.rankCostGD(c.id)}`, () => Y.rankUp(c.id, true), wallet.gokdemir < Y.rankCostGD(c.id));
    }
  }
  kids.push(row);
  d.replaceChildren(...kids);
}
function afterChange() {
  for (const t of Y.checkTier()) U.toast(t.icon, `KADEME: ${t.name}!`, `⬢ ${t.reward.gd} Gök Demir · 🥁 ${t.reward.davul} Tunç Davul`);
  U.onCards();
  drawYigit();
}
export function drumRoll() {
  const r = Y.drum();
  if (!r) return U.toast('🥁', 'Tunç Davulun yok', 'Giriş armağanı, kademe ve seferlerden kazanılır; ya da 5 Gök Demir ile al.');
  const box = $('ydraw');
  box.replaceChildren(el('small', null, "KAM'IN DAVULU ÇALDI"), el('span', 'ystars', stars(r.card.stars) + ' ' + Y.RANKS[r.card.stars][0]), el('h2', 'ink', r.card.name), el('p', null, r.isNew ? 'YENİ YİĞİT!' : 'KOPYA +1 (rütbe için)'));
  const ok = el('button', 'big', 'TAMAM');
  ok.onclick = () => { box.hidden = true; };
  box.append(ok);
  box.className = RCLS[r.card.stars];
  sel = r.card.id;
  // önce videodaki gibi çekim gösterisi (ışık küresi -> girdap -> kart, yıldızlar tek tek), sonra ayrıntı kutusu
  drumReveal(r.card, Y.RANKS[r.card.stars][0], r.isNew, () => { box.hidden = false; afterChange(); }, (n, o) => U.sfx(n, o));
}
export function buyDrum() {
  if (!wallet.spendGD(5)) return U.toast('⬢', 'Gök Demir yetmiyor', 'Tunç Davul 5 Gök Demir.');
  wallet.addDavul(1);
  drawYigit();
}

// ================= KAĞANLIK KADEMESİ =================
export function openKademe() {
  U.setState('kademe');
  $('menu').hidden = true;
  const box = $('klist'), p = Y.top4(), t = Y.tier();
  box.replaceChildren();
  Y.TIERS.forEach((T, i) => {
    const step = el('div', 'kstep' + (i === t ? ' me' : i < t ? ' past' : ''));
    step.style.setProperty('--i', i);
    step.append(el('b', 'kicon', T.icon), el('strong', null, T.name), el('small', null, i ? `Güç ${T.need.toLocaleString('tr-TR')}` : 'Başlangıç'));
    if (T.reward) step.append(el('span', 'krew', `⬢ ${T.reward.gd} · 🥁 ${T.reward.davul}`));
    box.prepend(step); // aşağıdan yukarı
  });
  const next = Y.TIERS[t + 1];
  $('kpow').textContent = `En güçlü 4 yiğidin gücü: ${p.toLocaleString('tr-TR')}` + (next ? ` · ${next.name} için ${next.need.toLocaleString('tr-TR')}` : ' · EN ÜST KADEME');
  $('kademe').hidden = false;
}
export const tierBadge = () => { const T = Y.TIERS[Y.tier()]; return `${T.icon} ${T.name}`; };

// ================= AKIN SEFERLERİ =================
let pick = null, pickCards = [];
export function openSefer() {
  U.setState('sefer');
  $('menu').hidden = true;
  pick = null; pickCards = [];
  drawSefer();
  $('sefer').hidden = false;
}
function hm(ms) { const m = Math.ceil(ms / 60000), h = Math.floor(m / 60); return h ? `${h} sa ${m % 60} dk` : `${m} dk`; }
export function drawSefer() {
  const map = $('smap');
  map.replaceChildren(el('div', 'sotag', '⛺'));
  for (const S of SF.SEFERLER) {
    const a = SF.active().find(x => x.id === S.id);
    const m = el('button', 'smark' + (a ? (SF.isDone(a) ? ' done' : ' go') : ''), a ? (SF.isDone(a) ? '✓' : '⚑') : '✕');
    m.style.left = S.x + '%'; m.style.top = S.y + '%';
    m.title = S.name;
    m.onclick = () => { pick = S.id; pickCards = []; drawSefer(); };
    map.append(m);
  }
  const box = $('sinfo');
  box.replaceChildren();
  for (const a of SF.active()) { // süren seferler
    const S = SF.SEFERLER.find(s => s.id === a.id), row = el('div', 'srow');
    row.append(el('strong', null, S.name), el('small', null, a.cards.map(id => Y.CARDS.find(c => c.id === id).name).join(', ')));
    if (SF.isDone(a)) {
      const b = el('button', 'small', 'DÖNDÜLER! AL');
      b.onclick = () => {
        const r = SF.collect(a, U.missingArrow);
        U.levelUps(U.addXP(r.xp), U.levelBar);
        U.toast('⛺', 'Akıncıların döndü!', [`◆ ${r.kut}`, `${r.xp} XP`, r.davul && '🥁 Tunç Davul', r.relic && `🏹 ${r.relic}`].filter(Boolean).join(' · '));
        drawSefer();
      };
      row.append(b);
    } else {
      row.append(el('span', 'stime', hm(SF.remaining(a))));
      const b = el('button', 'small', `⬢ ${SF.rushCost(a)} HEMEN`);
      b.disabled = wallet.gokdemir < SF.rushCost(a);
      b.onclick = () => { if (SF.rush(a)) drawSefer(); };
      row.append(b);
    }
    box.append(row);
  }
  if (pick && !SF.active().some(a => a.id === pick)) { // yeni sefer: yiğit seç
    const S = SF.SEFERLER.find(s => s.id === pick), panel = el('div', 'spick');
    panel.append(el('h3', null, S.name), el('p', null, S.text), el('small', null, `${S.hours} saat · ◆ ${S.kut} · ${S.xp} XP` + (S.relic ? ' · bazen gümüş ok' : '') + (S.davul ? ' · bazen Tunç Davul' : '') + ' · her ek yiğit +%25'));
    const free = Y.CARDS.filter(c => Y.owned(c.id) && c.id !== Y.leader().id && !Y.team().includes(c) && !SF.busyCards().includes(c.id));
    const row = el('div', 'scards');
    if (!free.length) row.append(el('small', null, 'Boşta yiğit yok. Lider ve ordudakiler sefere gidemez; yeni yiğit için Tunç Davul çal.'));
    for (const c of free) {
      const b = el('button', 'small' + (pickCards.includes(c.id) ? ' on' : ''), c.name);
      b.onclick = () => { pickCards = pickCards.includes(c.id) ? pickCards.filter(x => x !== c.id) : pickCards.length < 3 ? [...pickCards, c.id] : pickCards; drawSefer(); };
      row.append(b);
    }
    const go = el('button', 'big', `YOLA ÇIKAR (${pickCards.length}/3)`);
    go.disabled = !pickCards.length || SF.active().length >= SF.MAX_ACTIVE;
    go.onclick = () => { if (SF.send(pick, pickCards)) { SF.scheduleNotice(); pick = null; pickCards = []; drawSefer(); } };
    panel.append(row, go);
    if (SF.active().length >= SF.MAX_ACTIVE) panel.append(el('small', null, 'Aynı anda en çok 3 sefer.'));
    box.append(panel);
  } else if (!SF.active().length) box.append(el('p', 'tnote', 'Haritadan bir yer seç, boştaki yiğitleri sefere gönder.'));
}
export const seferReady = () => SF.active().some(SF.isDone);

// ================= DESTAN KOLEKSİYONLARI =================
export function openKoleksiyon() {
  const box = $('kolist');
  box.replaceChildren();
  for (const S of KO.SETS) {
    const ms = S.members(), n = ms.filter(m => m[1]).length, done = KO.setDone(S.id);
    const sec = el('div', 'kset' + (done ? ' done' : ''));
    sec.append(el('h3', null, `${S.name} · ${n}/${ms.length}`), el('small', null, S.text + ` Ödül: ⬢ ${S.reward.gd} · unvan "${S.reward.title}"` + (S.reward.sword ? ' · altın çerçeveli Tanrı Kılıcı' : '')));
    const row = el('div', 'kmem');
    for (const [name, ok] of ms) row.append(el('span', ok ? 'ok' : '', name));
    sec.append(row);
    box.append(sec);
  }
  $('koleksiyon').hidden = false;
}
export function checkCollections() {
  for (const S of KO.checkSets()) U.toast('📜', `KOLEKSİYON: ${S.name}!`, `⬢ ${S.reward.gd} · unvan "${S.reward.title}"` + (S.reward.sword ? ' · altın Tanrı Kılıcı' : ''));
}
