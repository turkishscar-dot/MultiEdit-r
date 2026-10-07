// Kostüm parçalarını tek tek görmek için: her yiğidin vitrininden önden, arkadan ve yüzü yakından çeker
// (test-out/parca-<yiğit>-1.png, -2.png, -yuz.png). node tools/parca-shots.mjs [oguz altin ...]
import { chromium } from 'playwright';
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : ['oguz', 'akoglan', 'altin', 'basat', 'beyrek', 'bumin', 'gokhan', 'babur', 'tonyukuk', 'geyiksaman'];
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
const body = { x: 280, y: 90, width: 400, height: 330 }, face = { x: 440, y: 150, width: 100, height: 110 };
for (const id of ids) {
  await p.evaluate(id => window.__game.EK.openYigit(id), id);
  await p.waitForTimeout(600);
  await p.click('#ypbtns > button');
  await p.waitForTimeout(900);
  await p.screenshot({ path: `test-out/parca-${id}-1.png`, clip: body });
  await p.screenshot({ path: `test-out/parca-${id}-yuz.png`, clip: face });
  await p.evaluate(() => window.__game.book.dragBy(220)); // arkadan
  await p.waitForTimeout(400);
  await p.screenshot({ path: `test-out/parca-${id}-2.png`, clip: body });
  await p.evaluate(() => window.__game.toMenu());
  await p.waitForTimeout(300);
}
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
