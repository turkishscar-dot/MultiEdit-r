// Menü ve ekranların ekran görüntüsü: node tools/shot-menu.mjs <ad> [mobile] [js]
import { chromium } from 'playwright';
const [name, dev, js] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const vp = dev === 'mobile' ? { width: 390, height: 844 } : { width: 960, height: 540 };
const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => window.__game.toMenu());
if (js) await p.evaluate(js);
await p.waitForTimeout(900);
await p.screenshot({ path: `test-out/${name}.png` });
if (errs.length) console.log('ERR', errs);
await b.close();
