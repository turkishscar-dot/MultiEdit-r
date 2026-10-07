// Her bölümün (ve kısmın) oyun içi görüntüsü: node tools/seviye-shots.mjs [çıktı klasörü]  → harita zeminleriyle karşılaştırmak için
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || 'test-out/seviye';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
for (const lv of [1, 2, 3, 4, 5, 6, 7]) {
  await p.evaluate(lv => {
    const g = window.__game; g.frozen = true;
    g.start('level', lv, true);
    g.norender = true; for (let i = 0; i < 150; i++) { g.P.inv = Math.max(g.P.inv, 0); g.tick(1 / 30); } g.norender = false; g.tick(1 / 30);
  }, lv);
  await p.screenshot({ path: `${out}/lv${lv}.png` });
  console.log('lv', lv);
}
await b.close();
