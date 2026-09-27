// Test botunun sayfa içi beyni (tools/test-bot.mjs yükler). window.__game üzerinden oyunu kare kare oynatır.
(() => {
  const DT = 1 / 30;
  const g = () => window.__game;
  let cd = 0, god = false, stats = { hits: 0, jumps: 0, slides: 0, taps: 0, bosses: 0, floors: 0, maxDist: 0, events: {} };
  let lastHp = 3, lastFloor = 0, sawBoss = null, bossT0 = 0;
  stats.bossLog = [];
  const ev = k => (stats.events[k] = (stats.events[k] || 0) + 1);

  function act(a) { g().act(a); cd = 0.12; }
  function laneTo(t) { const P = g().P; if (t < P.lane) act('left'); else if (t > P.lane) act('right'); }

  // Geri çalma: altın parlayan mermi şeritte ve 0.3 sn'den az kaldıysa kılıçla vur
  function parryThink() {
    const G = g(), P = G.P;
    const o = G.objs.find(o => o.parry && !o.parried && !o.done && !o.dead && Math.abs(o.x - P.x) < 1.3 && (o.row == null || o.row === P.row)
      && P.z - o.z > 0 && (P.z - o.z) / Math.max(1, o.vz + P.vz) <= 0.22);
    if (!o) return false;
    if (G.weapon !== 'sword' && !G.flying) G.act('weapon');
    G.act('tap'); cd = 0.15; stats.parryTry = (stats.parryTry || 0) + 1;
    return true;
  }
  // SMU'dan gelenler: uçurum, kam ışını, ▲ kanatlı kul
  function smuThink() {
    const G = g(), P = G.P, v = Math.max(1, P.vz);
    if (G.yada > 0 && cd <= 0 && G.boss) { G.act('yada'); ev('yada'); }
    if (P.y !== 0 && !G.overPit) return false;
    const pit = G.terr.find(t => t.kind === 'pit' && t.z0 < P.z + 0.5 && P.z - t.z0 < 12);
    if (pit && P.y === 0) {
      const d = P.z - pit.z0, len = pit.z0 - pit.z1;
      if (d <= Math.max(1.2, v * 0.62 - len - 1.5)) { act('up'); stats.jumps++; ev('pitjump'); return true; }
      return false;
    }
    const beam = G.objs.find(o => o.def.beam && !o.done && P.z - o.z > 0 && P.z - o.z < 20);
    if (beam) {
      const t = (P.z - beam.z) / v;
      if (beam.def.thick && t <= 0.3 && P.y === 0) { act('up'); stats.jumps++; ev('beamjump'); return true; }
      if (!beam.def.thick && t <= 0.35 && P.slide <= 0 && P.y === 0) { act('down'); stats.slides++; ev('beamslide'); return true; }
    }
    if (G.objs.some(o => o.phase === 'mark' && !o.dying) && P.y === 0) { act('up'); ev('skystrike'); return true; }
    return false;
  }
  function groundThink() {
    const G = g(), P = G.P, objs = G.objs;
    if (smuThink()) return;
    const react = P.speed * 0.3 + 1.2;
    const look = 12 + P.speed * 0.5;
    const danger = [0, 0, 0], gain = [0, 0, 0];
    for (const o of objs) {
      if (o.dead || o.dying || o.done) continue;
      const a = P.z - o.z;
      if (a < -0.5 || a > look) continue;
      if (o.parry && G.boss && !o.parried) continue; // geri çalınacak: kaçma, bekle
      if (o.def.hit === 'block' && !o.def.foe) danger[o.lane] += 10 / Math.max(1, a);
      if (o.def.foe && !o.bank) danger[o.lane] += 1 / Math.max(1, a);
      if (o.kind === 'kut' || o.kind === 'nal' || o.kind === 'kimiz' || o.esir) gain[o.lane] += 0.2;
      if (o.kind === 'yada') gain[o.lane] += 2;
    }
    const wl = G.warnLane;
    if (wl >= 0) danger[wl] += 50;
    // şu anki şeritte yakın engel
    const here = objs.filter(o => !o.dead && !o.dying && !o.done && !o.parry && o.lane === P.lane && P.z - o.z > 0 && P.z - o.z < react && o.def.hit);
    for (const o of here) {
      if (o.def.foe && o.cfg?.icon === 'kay' && !o.shieldBroken) { if (P.slide <= 0 && cd <= 0) { act('down'); stats.slides++; ev('slidekill'); } return; }
      if (o.def.foe && o.ready !== false) { if (cd <= 0) { act('tap'); stats.taps++; } continue; }
      const tt = (P.z - o.z) / Math.max(1, P.vz); // çarpmaya kalan süre: yakınsa bekleme süresine bakma
      if (o.def.hit === 'low' && P.y === 0 && (cd <= 0 || tt < 0.25)) { act('up'); stats.jumps++; return; }
      if (o.def.hit === 'high' && P.slide <= 0 && (cd <= 0 || tt < 0.3)) { act('down'); stats.slides++; return; }
    }
    // çatlak sandık: kır
    const crate = objs.find(o => o.def.brk && !o.dead && !o.done && o.lane === P.lane && P.z - o.z > 0.5 && P.z - o.z < 4);
    if (crate && cd <= 0 && G.weapon === 'sword') { act('tap'); stats.taps++; return; }
    // altın düşman: şeridine geç, yetişince vur
    const gold = objs.find(o => o.gold && !o.dying && !o.dead && P.z - o.z > 0 && P.z - o.z < 30);
    if (gold && cd <= 0) {
      if (gold.lane !== P.lane && danger[gold.lane] < 0.4) { laneTo(gold.lane); return; }
      if (gold.lane === P.lane && P.z - gold.z < 8.5) { act('tap'); return; }
    }
    // yakın düşmana saldır
    const foe = objs.find(o => o.def.foe && !o.dying && o.ready && Math.abs(o.x - P.x) < 1.3 && P.z - o.z > 0 && P.z - o.z < 8);
    if (foe && cd <= 0) { act('tap'); stats.taps++; }
    if (objs.some(o => o.bank && !o.dying && P.z - o.z > 6 && P.z - o.z < 35) && cd <= 0 && Math.random() < 0.2) act('tap');
    if (cd > 0) return;
    const score = [0, 1, 2].map(l => -danger[l] * 3 + gain[l] - Math.abs(l - P.lane) * 0.3);
    const best = score.indexOf(Math.max(...score));
    if (best !== P.lane && danger[P.lane] > 0.4) laneTo(best);
    else if (best !== P.lane && danger[best] === 0 && gain[best] > gain[P.lane] + 0.5) laneTo(best);
  }

  function skyThink() {
    const G = g(), P = G.P;
    if (cd > 0) return;
    const look = 10 + P.speed * 0.8;
    const bad = new Set();
    let near = Infinity;
    for (const o of G.objs) {
      if (o.dead || o.row == null || !o.def.hit) continue;
      const a = P.z - o.z;
      if (a < -1 || a > look) continue;
      near = Math.min(near, a);
    }
    for (const o of G.objs) {
      if (o.dead || o.row == null || !o.def.hit) continue;
      const a = P.z - o.z;
      if (a >= -1 && a <= near + 3) bad.add(o.lane + ',' + o.row);
    }
    const birds = G.objs.find(o => o.def.flyfoe && !o.dead && P.z - o.z > 4 && P.z - o.z < 30 && Math.abs(o.x - P.x) < 1.5);
    if (birds) act('tap');
    if (!bad.has(P.lane + ',' + P.row)) {
      const hoop = G.objs.find(o => o.kind === 'hoop' && o.mesh.visible && P.z - o.z > 2 && P.z - o.z < look);
      if (hoop && !bad.has(hoop.lane + ',' + hoop.row)) { if (hoop.lane !== P.lane) laneTo(hoop.lane); else if (hoop.row !== P.row) act(hoop.row > P.row ? 'up' : 'down'); }
      return;
    }
    let best = null, bd = 99;
    for (let l = 0; l < 3; l++) for (let r = 0; r < 3; r++) {
      if (bad.has(l + ',' + r)) continue;
      const d = Math.abs(l - P.lane) + Math.abs(r - P.row);
      if (d < bd) { bd = d; best = [l, r]; }
    }
    if (!best) return;
    if (best[0] !== P.lane) laneTo(best[0]);
    else if (best[1] !== P.row) act(best[1] > P.row ? 'up' : 'down');
  }

  function bossThink() {
    const G = g(), P = G.P, b = G.boss;
    const tap = document.getElementById('tap');
    const txt = tap && !tap.hidden ? tap.textContent : '';
    const mash = document.getElementById('mash');
    if (mash && !mash.hidden) { act('tap'); cd = 0; return true; }
    if (b.blob && b.blob.visible !== false && cd <= 0) {
      const lane = [-2.5, 0, 2.5].reduce((bi, x, i, a) => Math.abs(x - b.blob.position.x) < Math.abs(a[bi] - b.blob.position.x) ? i : bi, 0);
      if (lane !== P.lane) { laneTo(lane); return true; }
    }
    if (!txt) return false;
    if (cd > 0) return true;
    if (/ZIPLA/.test(txt)) { act('up'); return true; }
    if (/EĞİL/.test(txt)) { act('down'); return true; }
    if (/◀ KAYDIR/.test(txt)) { act('left'); return true; }
    if (/KAYDIR! ▶/.test(txt)) { act('right'); return true; }
    if (/▲ KAYDIR/.test(txt)) { act('up'); return true; }
    if (/YANA KAÇ/.test(txt)) { laneTo(P.lane === 1 ? 0 : 1); return true; }
    if (/BEKLE/.test(txt)) return true;
    if (/VUR|OKLA|DOKUN|GERİ ÇAL/.test(txt)) { act('tap'); stats.taps++; return true; }
    return false;
  }

  function logBoss() {
    const b = sawBoss;
    stats.bossLog.push({ boss: b.kind, sure: Math.round(g().time - bossT0), kacis: b.escMax, kalan: Math.round(b.minEsc ?? 0), hp: b.hp, kacti: b.esc <= 0 });
  }
  window.__bot = {
    stats,
    begin(lv, endless, gd, node) {
      god = gd;
      const G = g();
      G.frozen = true; G.norender = true;
      if (node) { const n = G.nodes.find(x => x.id === node); G.nodeRun = n; lv = n.lv; }
      G.start(endless ? 'endless' : 'level', lv, true);
    },
    run(sec) {
      const G = g();
      for (let i = 0; i < sec / DT; i++) {
        const st = G.state;
        if (st === 'cine') { G.cine.skip(); ev('cine'); }
        if (st === 'dialog') { document.getElementById('dskip').click(); ev('dialog'); }
        if (st === 'win' || st === 'over' || st === 'result') break;
        if (window.__botHook) window.__botHook(G);
        if (st === 'run' && !G.fin) {
          cd -= DT;
          if (god) G.P.inv = Math.max(G.P.inv, 0.5);
          if (G.boss) {
            if (G.boss !== sawBoss) { if (sawBoss) logBoss(); sawBoss = G.boss; bossT0 = G.time; stats.bosses++; ev('boss:' + G.boss.kind); }
            sawBoss.minEsc = Math.min(sawBoss.minEsc ?? 999, G.boss.esc);
            if (G.yada > 0 && !G.fin) { G.act('yada'); ev('yada'); }
            if (!(cd <= 0 && parryThink()) && !bossThink()) (G.flying ? skyThink : groundThink)();
          } else if (sawBoss) { logBoss(); sawBoss = null; }
          else if (G.flying) skyThink();
          else groundThink();
          if (G.P.hp < lastHp) {
            stats.hits++;
            (stats.hitLog ??= []).push({ d: G.dist, lane: G.P.lane, y: +G.P.y.toFixed(2), sl: +G.P.slide.toFixed(2), boss: G.boss?.kind, pit: G.overPit,
              near: G.objs.filter(o => Math.abs(G.P.z - o.z) < 3 && o.def.hit).map(o => (o.variant || o.kind) + '@' + o.lane + ':' + (G.P.z - o.z).toFixed(1)).join(' ') });
          }
          lastHp = G.P.hp;
          if (G.floor !== lastFloor) { lastFloor = G.floor; stats.floors++; }
          stats.maxDist = Math.max(stats.maxDist, G.dist);
        }
        G.tick(DT);
      }
      const st = G.state;
      if (st === 'win' || st === 'over' || st === 'result') { if (sawBoss) { logBoss(); sawBoss = null; } }
      return { combos: { ...G.runCounts }, run: G.runStats, state: st, done: st === 'win' || st === 'over' || st === 'result', medals: G.nodeRun ? (G.hStore[G.nodeRun.id]?.m || 0) : null, level: G.level, floor: G.floor, dist: G.dist, hp: G.P.hp, kills: G.kills, score: Math.floor(G.score), kut: G.kut, t: Math.round(G.time), ...stats };
    },
  };
})();
