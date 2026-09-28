// Yapay zekâ paketinin önce/sonra görüntüleri: aynı bölümde yeni paket (dunya.glb) ve dokular kapalı / açık.
// node tools/ai-oncesonra.mjs <boş.glb> [bölüm...]  -> test-out/oncesonra-<bölüm>.png
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const [bos, ...lvs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function cek(eski, lv) {
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  if (eski) {
    await p.route('**/dunya.glb*', r => (r.request().url().includes('?') ? r.continue() : r.fulfill({ body: readFileSync(bos), contentType: 'model/gltf-binary' })));
    await p.route('**/assets/doku/*', r => (r.request().url().includes('?') ? r.continue() : r.abort()));
  }
  await p.goto('http://localhost:5173/');
  await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
  await p.evaluate(lv => { const g = window.__game; localStorage.setItem('oguz-test', '1'); Math.random = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42); g.start('level', lv, true); g.frozen = true; for (let i = 0; i < 150; i++) { g.P.inv = 9; g.tick(1 / 30); } }, lv);
  await p.waitForTimeout(500); await p.evaluate(() => window.__game.tick(1 / 30));
  const yol = `test-out/os-${eski ? 'once' : 'sonra'}-${lv}.png`; await p.screenshot({ path: yol }); await p.close(); return yol;
}
for (const lv of lvs.map(Number)) { await cek(true, lv); await cek(false, lv); console.log('bölüm', lv); }
await b.close();
