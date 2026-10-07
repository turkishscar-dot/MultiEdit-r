// Oyunu otomatik oynayan duman testi. Geliştirme sunucusu açıkken tarayıcı konsolunda:
//   const { run } = await import('/tools/bot.js'); __game.start('level', 2, true); run(3000)
// Engellerden kaçar, düşmanlara saldırır, boss mekaniklerini oynar; olay günlüğü ve hata döndürür.
export function run(frames, g = window.__game) {
  const log = [];
  let prev = '', hp = g.P.hp;
  const H = [1, 3.5, 6];
  const near = (o, P) => P.z - o.z > 0 && P.z - o.z < 14;
  const threat = (l, row) => g.objs.filter(o => o.def.hit && !o.done && !o.dying && (o.ready ?? true) && o.lane === l && near(o, g.P) &&
    (!g.flying || o.row === row) && (o.kind !== 'pillar' || g.P.z - o.z < 12)).sort((a, b) => b.z - a.z); // en yakın önce
  for (let i = 0; i < frames && (g.state === 'run' || g.state === 'cine'); i++) {
    try { g.tick(1 / 60); } catch (e) { log.push('HATA ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); break; }
    if (g.state !== 'run') continue;
    const P = g.P, b = g.boss2;
    if (P.hp < hp) log.push(`HASAR ${(i / 60).toFixed(1)}s d=${Math.round(-P.z)} ${b?.state || ''}`);
    hp = P.hp;
    const s = (g.fin ? 'BİTİRİŞ ' : '') + (b ? b.state + ' can' + b.hp : '') + (P.ride > 0 ? ' ATLI' : '');
    if (s !== prev) { log.push(`${(i / 60).toFixed(1)}s d=${Math.round(-P.z)} ${s || 'koşu'}`); prev = s; }
    if (g.fin) continue;
    // boss mekanikleri
    if (b) {
      if (b.state === 'qte' && b.t > 0.2) { g.act(b.want); continue; }
      if (b.state === 'mash') { g.act('tap'); continue; }
      if (['stun', 'stuck', 'open'].includes(b.state) && b.kind !== 'general' && i % 10 === 0) g.act('tap');
      if (b.kind === 'demirhane' && b.heat > 0 && i % 10 === 0) g.act('tap');
      if (b.kind === 'boyali' && b.state === 'flee') {
        const lane = [-2.5, 0, 2.5].indexOf([-2.5, 0, 2.5].reduce((a, c) => Math.abs(c - b.x) < Math.abs(a - b.x) ? c : a));
        if (P.lane !== lane) { g.act(P.lane < lane ? 'right' : 'left'); continue; }
        if (i % 10 === 0) g.act('tap');
      }
      const danger = b.state === 'turn' || b.state === 'crouch' ? b.lane : b.state === 'bite' ? b.bites[b.bi] : null;
      if (danger != null && P.lane === danger) { g.act(P.lane === 0 ? 'right' : 'left'); continue; }
      if (b.kind === 'albasti' && (b.state === 'triple' || b.state === 'exposed')) {
        const lane = [-2.5, 0, 2.5].indexOf([-2.5, 0, 2.5].reduce((a, c) => Math.abs(c - b.x) < Math.abs(a - b.x) ? c : a));
        if (P.lane !== lane && b.state === 'exposed') { g.act(P.lane < lane ? 'right' : 'left'); continue; }
        if (b.state === 'triple' && i % 12 === 0) g.act('tap');
        if (b.state === 'exposed' && i % 8 === 0) g.act('tap');
      }
      if (b.kind === 'albasti' && b.state === 'lunge' && Math.abs(b.x - P.x) < 1.3) { g.act(P.lane === 0 ? 'right' : 'left'); continue; }
      if (b.kind === 'karakus' && b.state === 'screech' && i % 8 === 0) g.act('tap');
      if (b.kind === 'general' || b.atk) { // savuştur, sonra vur (general ve kısım başbuğları)
        if (b.state === 'windup' && b.t > 0.3 && P.y === 0 && P.slide <= 0) g.act(b.atk === 'low' ? 'up' : 'down');
        if (b.state === 'open' && i % 8 === 0) g.act('tap');
        if (['guard', 'duel', 'windup', 'open'].includes(b.state)) continue;
      }
    }
    const row = g.flying ? P.row : 0;
    const t = threat(P.lane, row)[0];
    if (!t) continue;
    const d = P.z - t.z;
    if (t.def.foe && !P.ride) { if (i % 8 === 0) g.act('tap'); if (d > 3) continue; }
    if (t.def.flyfoe && i % 8 === 0) { g.act('tap'); if (d > 6) continue; }
    if (P.ride) continue; // atlıyken her şey ezilir
    if (g.flying) { // boş hücreye geç: önce aynı yükseklikte yan şerit, sonra yükseklik
      const opts = [[P.lane - 1, row], [P.lane + 1, row], [P.lane, row + 1], [P.lane, row - 1]].filter(([l, r]) => l >= 0 && l < 3 && r >= 0 && r < 3 && !threat(l, r).length);
      if (opts.length) { const [l, r] = opts[0]; g.act(l < P.lane ? 'left' : l > P.lane ? 'right' : r > row ? 'up' : 'down'); }
      continue;
    }
    const safe = [0, 1, 2].filter(l => Math.abs(l - P.lane) === 1 && threat(l, 0).length === 0);
    if (t.def.hit === 'block' || t.def.hit === 'fire') { if (safe.length) g.act(safe[0] < P.lane ? 'left' : 'right'); }
    else if (t.def.hit === 'low' && d < 4 && P.y === 0) g.act('up');
    else if (t.def.hit === 'high' && d < 5 && P.slide === 0) g.act('down');
  }
  return { state: g.state, hp: g.P.hp, dist: Math.round(-g.P.z), log: log.slice(-40) };
}
