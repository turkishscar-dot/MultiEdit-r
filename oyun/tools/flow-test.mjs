// Akış testleri: Hayat Suyu (devam, 3 hak sınırı), Çarşı (satın al, raf, koşuda etkisi), Sonsuz Akın bitiş ekranı.
import { chromium } from 'playwright';
const which = process.argv[2] || 'all';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const mobile = process.argv[3] === 'mobile';
const p = await b.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('oguz-test', '1'); });
await p.reload();
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const H = `const g = window.__game; g.frozen = true; const run = (sec, fast = true) => { g.norender = fast; for (let i = 0; i < sec * 30; i++) g.tick(1 / 30); g.norender = false; }; const kill = () => { g.P.inv = 0; g.P.hp = 1; for (const o of g.objs) o.dead = true; run(0.05); g.add('barricade', g.P.lane, g.P.z - 4); run(2.2); };`;
const ev = async code => p.evaluate(new Function(H + code));
const shot = async n => { await ev('run(0.05, false);'); await p.waitForTimeout(1200); await p.screenshot({ path: `test-out/${n}.png` }); };
if (which === 'all' || which === 'revive') {
  console.log('revive1', await ev(`g.start('level', 1, true); run(2); kill(); return { state: g.state, gd: g.wallet.gokdemir };`));
  await shot('hayatsuyu-yok');
  console.log('revive2', await ev(`g.wallet.addGD(10); g.showRevive(); document.querySelector('#rvgo').click(); run(0.3); return { state: g.state, hp: g.P.hp, inv: g.P.inv.toFixed(1), gd: g.wallet.gokdemir, cont: g.continues };`));
  await shot('hayatsuyu-devam');
  console.log('revive3', await ev(`kill(); const s1 = g.state; document.querySelector('#rvgo').click(); run(0.3); kill(); document.querySelector('#rvgo').click(); run(0.3); kill(); return { s1, final: g.state, gd: g.wallet.gokdemir, cont: g.continues, title: document.querySelector('#over h1').textContent };`));
  console.log('timeout', await ev(`g.start('level', 1, true); run(2); kill(); run(5.5); return { state: g.state };`));
}
if (which === 'all' || which === 'shop') {
  await ev(`g.toMenu(); g.wallet.deposit(20000); g.wallet.addGD(5); g.openShop();`);
  await shot('carsi-takviye');
  console.log('buy', await ev(`for (const id of ['kimiz','kurt','bereket','nal','nazar','kilic']) g.shop.buyBoost(id); for (let i=0;i<3;i++) g.shop.buyUpg('at'); g.shop.buyUpg('miknatis'); return { inv: g.shop.inv, upg: g.shop.upg, bank: g.wallet.bank, gd: g.wallet.gokdemir };`));
  await ev(`document.querySelector('#stabs [data-tab=yukselt]').click();`);
  await shot('carsi-yukselt');
  await ev(`document.querySelector('#stabs [data-tab=gokdemir]').click();`);
  await shot('carsi-gokdemir');
  await ev(`g.toMenu(); g.openMap(); document.querySelector('.node').click();`);
  await ev(`for (const id of ['kimiz','kurt','nal']) g.shop.toggleRack(id); document.querySelector('#boyrack').replaceChildren(); document.querySelector('#boyback').click(); document.querySelector('.node').click();`);
  await shot('boy-raf');
  await ev(`document.querySelector('#boygo').click(); g.cine.skip();`);
  console.log('run', await ev(`run(0.5); return { state: g.state, hp: g.P.hp, ride: g.P.ride > 0, kurt: g.pow.kurt > 0, rack: g.shop.rack, inv: g.shop.inv };`));
}
if (which === 'all' || which === 'endless') {
  console.log('endless', await ev(`g.start('endless', 0, true); for (let i = 0; i < 40; i++) { g.P.inv = 2; run(1); } g.P.inv = 0; g.P.hp = 1; for (const o of g.objs) o.dead = true; run(0.05); g.add('barricade', g.P.lane, g.P.z - 4); run(2.2); document.querySelector('#rvno')?.click(); run(0.2); return { rec: localStorage.getItem('oguz-sonsuz'), state: g.state, rows: [...document.querySelectorAll('#final div')].map(d => d.textContent) };`));
  await shot('sonsuz-bitis');
}
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
