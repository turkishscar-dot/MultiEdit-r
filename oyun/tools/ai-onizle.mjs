// Yapay zekâ modellerinin önizleme görüntüsü: node tools/ai-onizle.mjs <çıktı.png> <açı> <yol1,yol2,...> [boy] [sütun]
import { chromium } from 'playwright';
const [out, aci, m, h = '2.2', c = '6'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1200, height: 640 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(`http://localhost:5173/tools/ai-onizle.html?m=${m}&h=${h}&c=${c}`);
await p.waitForFunction(() => window.ready, null, { timeout: 180000 });
await p.evaluate(a => spin(a), +aci);
await p.screenshot({ path: out });
if (errs.length) console.log('hata:', errs);
await b.close();
