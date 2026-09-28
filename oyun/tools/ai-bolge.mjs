// Bölge ekran görüntüleri (yapay zekâ modelleri/dokuları oyun içinde): node tools/ai-bolge.mjs <önek> [bölüm...]
import { chromium } from 'playwright';
const [on = 'ai', ...lvs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errs.push(m.text()));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
for (const lv of (lvs.length ? lvs : ['1', '2', '3', '4', '5', '6', '7']).map(Number)) {
  const th = await p.evaluate(lv => { const g = window.__game; localStorage.setItem('oguz-test', '1'); g.start('level', lv, true); g.frozen = true; for (let i = 0; i < 150; i++) { g.P.inv = 9; g.tick(1 / 30); } return g.theme; }, lv);
  await p.waitForTimeout(400);
  await p.evaluate(() => window.__game.tick(1 / 30));
  await p.screenshot({ path: `test-out/${on}-bolum${lv}.png` });
  console.log('bölüm', lv, th);
}
console.log('hata:', errs.length ? errs.slice(0, 5) : 'yok');
await b.close();
