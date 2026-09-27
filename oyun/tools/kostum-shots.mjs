// Kostüm vitrini ve deneme koşusu ekran görüntüleri: node tools/kostum-shots.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
async function page(w, h) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto('http://localhost:5173/');
  await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
  await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
  return p;
}
const p = await page(960, 540);
await p.evaluate(() => window.__game.EK.openYigit('altin'));
await p.waitForTimeout(1200);
await p.screenshot({ path: 'test-out/kostum-yigit.png' });
await p.click('#ypbtns > button');
await p.waitForTimeout(1200);
await p.screenshot({ path: 'test-out/kostum-vitrin.png' });
await p.click('.yvnav button:nth-child(2)');
await p.waitForTimeout(250);
await p.screenshot({ path: 'test-out/kostum-giyinme.png' });
await p.waitForTimeout(1200);
await p.screenshot({ path: 'test-out/kostum-vitrin2.png' });
// deneme koşusu
const r = await p.evaluate(() => {
  const g = window.__game;
  g.frozen = true;
  [...document.querySelectorAll('.yvacts button')].find(x => /DENE/.test(x.textContent)).click();
  const st0 = g.state, gd0 = g.wallet.gokdemir, bank0 = g.wallet.bank;
  for (let i = 0; i < 60; i++) { g.P.inv = 1; g.tick(1 / 30); }
  return { st0, gd0, bank0, trialtag: document.getElementById('trialtag').textContent };
});
await p.screenshot({ path: 'test-out/kostum-deneme.png' });
const r2 = await p.evaluate(() => {
  const g = window.__game;
  g.norender = true;
  for (let i = 0; i < 30 * 90 && g.state === 'run'; i++) { g.P.inv = 1; g.tick(1 / 30); }
  g.norender = false;
  for (let i = 0; i < 40; i++) g.tick(1 / 30);
  return { state: g.state, dist: g.dist, bank: g.wallet.bank, gd: g.wallet.gokdemir, end: !document.getElementById('trialend').hidden, btn: document.getElementById('trbuy').textContent };
});
await p.screenshot({ path: 'test-out/kostum-deneme-son.png' });
await p.click('#trback');
await p.waitForTimeout(800);
const r3 = await p.evaluate(() => ({ state: window.__game.state }));
console.log(JSON.stringify({ r, r2, r3 }));
const q = await page(390, 844);
await q.evaluate(() => window.__game.EK.openYigit('fatih'));
await q.waitForTimeout(1200);
await q.screenshot({ path: 'test-out/kostum-yigit-tel.png' });
await q.click('#ypbtns > button');
await q.waitForTimeout(1200);
await q.screenshot({ path: 'test-out/kostum-vitrin-tel.png' });
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
