// Diyalog testi: bütün düğümlerin diyaloglarını açar, portreleri çizer, ekran görüntüsü alır
import { chromium } from 'playwright';
const dev = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: dev === 'mobile' ? { width: 390, height: 844 } : { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const n = await p.evaluate(() => { const g = window.__game; g.toMenu(); let n = 0; for (const [k, lines] of Object.entries(g.DLG.DIALOGS)) for (const [sp] of lines) { g.portraits.get(sp); n++; } return n; });
console.log('portre çizilen satır:', n);
await p.evaluate(() => { const g = window.__game; g.showDialog(g.DLG.DIALOGS['1-2'], () => { window.__dlgDone = true; }); });
for (let i = 0; i < 3; i++) { await p.waitForTimeout(1500); await p.click('#dnext'); }
await p.waitForTimeout(1500);
await p.screenshot({ path: `test-out/diyalog${dev ? '-m' : ''}.png` });
await p.click('#dskip');
console.log('bitti:', await p.evaluate(() => !!window.__dlgDone), 'hata:', errs.length ? errs : 'yok');
await b.close();
