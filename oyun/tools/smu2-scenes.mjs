// SMU'dan gelen yeni özelliklerin ekran görüntüleri: node tools/smu2-scenes.mjs kalkan kanatli rampa ...
import { chromium } from 'playwright';
const want = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); });
const SC = {
  kalkan: `g.start('level', 1, true); run(3, true); clear(); g.add('kormos', g.P.lane, g.P.z - 22, { variant: 'ikikalkan' }); g.add('kormos', (g.P.lane + 1) % 3, g.P.z - 26, { variant: 'kalkanli' }); run(0.5, false);`,
  yakinkalkan: `g.start('level', 1, true); run(3, true); clear(); g.add('kormos', 1, g.P.z - 9, { variant: 'ikikalkan' }); g.P.lane = 1; run(0.1, false); g.frozen = true; g.cam = [2.5, 2.2, -4.5, 0, 1.2, -9]; run(1/30, false);`,
  yakinkanat: `g.start('level', 1, true); run(3, true); clear(); const o = g.add('kormos', 1, g.P.z - 9, { variant: 'kanatli' }); o.phase = 'x'; g.P.lane = 1; run(0.1, false); g.cam = [2.5, 3.6, -4, 0, 3.2, -9]; run(1/30, false);`,
  kalkankay: `g.start('level', 1, true); run(3, true); clear(); g.add('kormos', g.P.lane, g.P.z - 12, { variant: 'ikikalkan' }); run(0.4, false); g.act('down'); run(0.35, false);`,
  kanatli: `g.start('level', 1, true); run(3, true); clear(); g.add('kormos', 2, g.P.z - 30, { variant: 'kanatli' }); run(1.2, false);`,
  kanatlivur: `g.start('level', 1, true); run(3, true); clear(); g.add('kormos', 2, g.P.z - 30, { variant: 'kanatli' }); for (let i = 0; i < 90; i++) { run(1/30, false); if (g.objs.some(o => o.phase === 'mark')) break; } g.act('up'); run(0.3, false);`,
  rampa: `g.start('level', 1, true); run(3, true); clear(); g.clearTerrain(); g.buildTerrain(g.P.z - 8); run(0.5, false);`,
  sur: `g.start('level', 1, true); run(3, true); clear(); g.clearTerrain(); g.buildTerrain(g.P.z - 8); run(2.2, false);`,
  ucurum: `g.start('level', 1, true); run(3, true); clear(); g.clearTerrain(); g.buildTerrain(g.P.z - 8); const pit = g.terr.find(t => t.kind === 'pit'); if (pit) { while (g.P.z - pit.z0 > 7) run(1/30, false); } else run(2, false);`,
  yerucurum: `g.start('level', 3, true); run(3, true); clear(); g.clearTerrain(); g.terr.length = 0; let z = g.P.z - 20; g.buildTerrain(z); let pit = g.terr.find(t => t.kind === 'pit'); let n = 0; while ((pit?.h0 !== 0) && n++ < 30) { g.clearTerrain(); g.buildTerrain(z); pit = g.terr.find(t => t.kind === 'pit'); } while (g.P.z - pit.z0 > 9) run(1/30, false);`,
  ucurum2: `g.start('level', 1, true); run(3, true); clear(); g.clearTerrain(); let n = 0; do { g.clearTerrain(); g.buildTerrain(g.P.z - 8); } while (!(g.terr.find(t => t.kind === 'pit')?.h0 > 0) && n++ < 30); const pit = g.terr.find(t => t.kind === 'pit'); while (g.P.z - pit.z0 > 6) run(1/30, false);`,
  dus: `g.start('level', 1, true); run(3, true); clear(); g.clearTerrain(); let n = 0; do { g.clearTerrain(); g.buildTerrain(g.P.z - 8); } while (!(g.terr.find(t => t.kind === 'pit')?.h0 > 0) && n++ < 30); const pit = g.terr.find(t => t.kind === 'pit'); while (g.P.z - pit.z0 > -1.5) run(1/30, false); run(0.15, false);`,
  isin: `g.start('level', 1, true); run(3, true); clear(); g.add('isin', 1, g.P.z - 22); run(0.3, false);`,
  kalinisin: `g.start('level', 5, true); run(3, true); clear(); g.add('kalinisin', 1, g.P.z - 20); run(0.3, false);`,
  isinzipla: `g.start('level', 3, true); run(3, true); clear(); g.add('kalinisin', 1, g.P.z - 12); run(0.25, false); g.act('up'); run(0.3, false);`,
  yada: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(3, true); g.yada = 2; run(0.1, false);`,
  yadaat: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(3, true); g.yada = 2; g.act('yada'); run(0.58, false);`,
  bitir: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(3, true); g.boss.hp = 1; g.yada = 1; g.act('yada'); run(2.2, false);`,
  bossrow: `g.start('level', 1, true); run(2, true); clear(); g.startBoss(); run(6, true);`,
};
for (const name of want) {
  const res = await p.evaluate(code => {
    const g = window.__game;
    g.frozen = true;
    const run = (sec, fast) => { g.norender = !!fast; for (let i = 0; i < sec * 30; i++) { g.P.inv = Math.max(g.P.inv, 0); g.tick(1 / 30); } g.norender = false; };
    const clear = () => { for (const o of g.objs) o.dead = true; g.tick(1 / 30); };
    eval(code);
    return { state: g.state, hp: g.P.hp, gy: g.P.gy, y: +g.P.y.toFixed(2), kills: g.kills, yada: g.yada, bossHp: g.boss?.hp, terr: g.terr.map(t => t.kind).join(',') };
  }, SC[name]);
  await p.screenshot({ path: `test-out/smu2-${name}.png` });
  console.log(name, JSON.stringify(res));
}
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
