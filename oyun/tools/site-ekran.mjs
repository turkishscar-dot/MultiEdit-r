// Tanıtım sitesi için gerçek oyun ekranları. node tools/site-ekran.mjs -> ai-kaynak/site/ekran-*.png
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const DIR = 'ai-kaynak/site'; mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.applyGfx('yuksek'); });
const BOL = process.argv.slice(2).length ? process.argv.slice(2).map(a => a.split(":").map(Number)) : [[1, 260], [2, 300], [3, 420], [4, 300], [5, 260], [6, 340], [7, 300]];
for (const [lv, kare] of BOL) {
  await p.evaluate(([lv, kare]) => { const g = window.__game; g.toMenu(); g.start('level', lv, true); g.frozen = true; for (let i = 0; i < kare; i++) { g.P.inv = 9; g.tick(1 / 30); } g.P.inv = 0; g.tick(1 / 30); }, [lv, kare]);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${DIR}/ekran-b${lv}.png` });
}
if (!process.argv[2]) await p.evaluate(() => { const g = window.__game; g.toMenu(); g.EK.openYigit('attila'); });
if (!process.argv[2]) { await p.waitForTimeout(2500); await p.screenshot({ path: `${DIR}/ekran-yigitler.png` }); }
await b.close();
