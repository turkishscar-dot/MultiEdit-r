// Boss savaşı ekran görüntüleri: node tools/boss-shots.mjs [bölüm] [kısım]
import { chromium } from 'playwright';
const [lv = 1, fl = 2] = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const shot = async (n, code) => { const r = await p.evaluate(code); await p.screenshot({ path: `test-out/boss-${lv}-${n}.png` }); console.log(n, JSON.stringify(r)); };
await p.evaluate(([lv, fl]) => {
  localStorage.setItem('oguz-test', '1');
  const g = window.__game; g.frozen = true;
  g.start('level', lv, true);
  for (let i = 0; i < 30; i++) g.tick(1 / 30);
  for (let f = 0; f < fl; f++) { g.nextFloor(); for (let i = 0; i < 150; i++) { if (g.state === 'cine') g.cine.skip(); if (g.sect) break; g.tick(1 / 30); } }
  for (const o of g.objs) o.dead = true;
  g.startBoss();
  window.run = s => { for (let i = 0; i < s * 30; i++) { g.P.inv = 1; g.tick(1 / 30); } };
}, [lv, fl]);
await shot('kosu', () => { run(4); const b = window.__game.boss; return { kind: b.kind, st: b.state, off: +b.off.toFixed(1), hp: b.hp }; });
await shot('don', () => { const g = window.__game; for (let i = 0; i < 200; i++) { run(1 / 30); if (g.boss.state === 'windup' && g.boss.t > 0.3) break; } return { st: g.boss.state, atk: g.boss.atk }; });
await shot('kure', () => { const g = window.__game; run(0.6); const o = g.add('yada', g.P.lane, g.P.z - 7); run(0.1); return { orb: !!o }; });
await shot('vur', () => { const g = window.__game; for (let i = 0; i < 30; i++) { if (g.tryOrb()) break; run(1 / 30); } run(0.25); return { hp: g.boss.hp }; });
await shot('fin1', () => { const g = window.__game; g.boss.hp = 1; const o = g.add('yada', g.P.lane, g.P.z - 3); run(0.05); g.tryOrb(); for (let i = 0; i < 60 && !g.fin; i++) run(1 / 30); run(0.62); return { fin: !!g.fin }; });
await shot('fin2', () => { run(0.85); return { t: window.__game.fin?.t }; });
await shot('fin3', () => { run(0.95); return { t: window.__game.fin?.t }; });
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
