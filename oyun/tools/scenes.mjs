// Sahne ekran görüntüleri: belirli olayları elle kurar, olay anını çizip kaydeder.
// node tools/scenes.mjs kilpayi isabet altin kirik parry kacis
import { chromium } from 'playwright';
const want = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); });
const SC = {
  // alçak ipi son anda zıplayarak aş
  kilpayi: `g.start('level', 1, true); run(3, true); clear(); g.add('rope', g.P.lane, g.P.z - g.P.speed * 0.22); g.act('up'); run(0.35, false);`,
  isabet: `g.start('level', 1, true); run(3, true); clear(); g.add('tamga', g.P.lane, g.P.z - 16); run(0.7, false);`,
  altin: `g.start('level', 1, true); run(3, true); clear(); g.spawnGold(g.P.z - 40); run(2.4, false);`,
  kirik: `g.start('level', 6, true); run(3, true); clear(); g.add('crates', g.P.lane, g.P.z - 2.6); g.add('jars', (g.P.lane + 1) % 3, g.P.z - 12); run(0.05, false); g.act('tap'); run(0.25, false);`,
  parry: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); g.boss.state = 'run'; run(0.5, true); g.add('boulder', g.P.lane, g.P.z - 6, { vz: 10, parry: true }); run(0.2, false); for (let i = 0; i < 30; i++) { const o = g.objs.find(o => o.parry); if (o && (g.P.z - o.z) / (o.vz + g.P.vz) < 0.2) { g.act('tap'); break; } run(1/30, false); } run(0.15, false);`,
  kacis: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(3, true); g.boss.esc = 0.3; run(0.6, false);`,
  kacis2: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(1, true); g.boss.esc = 0.2; run(4, true);`,
};
for (const name of want) {
  const res = await p.evaluate(code => {
    const g = window.__game;
    g.frozen = true;
    const run = (sec, fast) => { g.norender = !!fast; for (let i = 0; i < sec * 30; i++) g.tick(1 / 30); g.norender = false; };
    const clear = () => { for (const o of g.objs) o.dead = true; g.tick(1 / 30); };
    eval(code);
    return { state: g.state, boss: !!g.boss, h1: document.querySelector('#over h1').textContent, counts: g.runCounts, run: g.runStats, gd: g.wallet.gokdemir };
  }, SC[name]);
  if (name === 'kacis2') await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 120; i++) g.tick(1 / 30); });
  await p.screenshot({ path: `test-out/sahne-${name}.png` });
  console.log(name, JSON.stringify(res));
}
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
