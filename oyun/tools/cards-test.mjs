// Yiğit Kartları, Kademe, Seferler, Koleksiyon akış testi
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('oguz-test', '1'); localStorage.setItem('oguz-owned', JSON.stringify(['oguz', 'manas', 'attila'])); localStorage.setItem('oguz-costume', JSON.stringify('manas')); });
await p.reload();
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const r = await p.evaluate(() => {
  const g = window.__game, Y = g.Y, out = {};
  g.toMenu();
  out.migrate = Object.keys(JSON.parse(localStorage.getItem('oguz-yigit')).cards).join(',') + ' lider=' + Y.leader().id;
  g.wallet.deposit(100000); g.wallet.addGD(500); g.wallet.addDavul(40);
  let draws = {}; for (let i = 0; i < 40; i++) { const d = Y.drum(); draws[d.card.stars] = (draws[d.card.stars] || 0) + 1; }
  out.draws = JSON.stringify(draws) + ' kart=' + Y.ownedCount();
  for (let i = 0; i < 29; i++) Y.levelUp('manas');
  out.lvl = JSON.stringify(Y.cardState('manas')) + ' güç=' + Y.power('manas');
  out.rank = Y.rankUp('manas', true) + ' ' + JSON.stringify(Y.cardState('manas'));
  const owned = Y.CARDS.filter(c => Y.owned(c.id) && c.id !== 'manas').slice(0, 3);
  for (const c of owned) Y.toggleTeam(c.id);
  out.army = Y.team().map(c => c.id).join(',') + ' güç=' + Y.armyPower() + ' ×' + Y.armyMult();
  out.tier = JSON.stringify(Y.checkTier().map(t => t.name)) + ' kademe=' + Y.tier();
  // koşuda: liderin yeteneği ve ordu çarpanı
  Y.setLeader('tonyukuk'); g.start('level', 1, true);
  out.run = 'kombo süresi bonusu=' + g.bonus.comboTime + ' puan çarpanı bonusu=' + g.bonus.scoreMult.toFixed(2) + ' HUD=' + document.querySelector('#armym').textContent;
  g.toMenu();
  // sefer: gönder, saati ileri al, al
  const free = Y.CARDS.filter(c => Y.owned(c.id) && c.id !== Y.leader().id && !Y.team().includes(c)).slice(0, 2).map(c => c.id);
  const SF = g.EK; void SF;
  return out;
});
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(8), v);
// sefer akışı arayüzden
await p.evaluate(() => { window.__game.EK.openSefer(); document.querySelector('.smark').click(); });
await p.evaluate(() => { for (const b of [...document.querySelectorAll('.scards button')].slice(0, 2)) b.click(); });
await p.evaluate(() => { document.querySelector('.spick .big').click(); });
const s1 = await p.evaluate(() => [...document.querySelectorAll('.srow')].map(r => r.textContent).join(' | '));
console.log('sefer   ', s1);
await p.screenshot({ path: 'test-out/sefer.png' });
await p.evaluate(() => { window.__game.TORE.clock.offsetDays = 0.05; window.__game.EK.drawSefer(); }); // 1.2 saat sonra
const s2 = await p.evaluate(() => { const b = document.querySelector('.srow button'); const t = b.textContent; b.click(); return t + ' -> ' + document.querySelectorAll('.srow').length + ' sefer kaldı'; });
console.log('dönüş  ', s2);
await p.evaluate(() => { window.__game.toMenu(); window.__game.EK.openKademe(); });
await p.waitForTimeout(400);
await p.screenshot({ path: 'test-out/kademe.png' });
await p.evaluate(() => { window.__game.toMenu(); window.__game.openBook(); document.querySelector('#cover').click(); });
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('#kolbtn').click());
await p.waitForTimeout(300);
await p.screenshot({ path: 'test-out/koleksiyon.png' });
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
