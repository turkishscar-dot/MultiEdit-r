// Telefon benzetimi: dokunmatik, dikey ekran. node tools/mobil-test.mjs [adres]
import { chromium, devices } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4180/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ ...devices['Pixel 7'] });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /Couldn't load|Yüklenemedi|Content Security/.test(m.text())) errs.push('konsol: ' + m.text().slice(0, 160)); }); p.on('requestfailed', r => { if (!/fonts\.g|\/vo\//.test(r.url())) errs.push('istek: ' + r.url().split('/').pop()); });
await p.goto(URL);
await p.waitForFunction(() => window.__game?.state === 'gate' || /Yüklenemedi/.test(document.body.innerText), null, { timeout: 180000 });
await p.screenshot({ path: 'test-out/mobil-1.png' });
if (/Yüklenemedi/.test(await p.evaluate(() => document.body.innerText))) { console.log('YÜKLENEMEDİ', errs.slice(0, 4)); process.exit(1); }
const tex = await p.evaluate(() => { let n = 0, m = 0; window.__game.hero.root.traverse(o => { if (o.isMesh) for (const x of [].concat(o.material)) { if (x.map) { n++; if (x.map.image) m++; } } }); return [n, m]; });
await p.touchscreen.tap(200, 400);
await p.waitForTimeout(1500);
const st = await p.evaluate(() => window.__game.state);
await p.screenshot({ path: 'test-out/mobil-2.png' });
// menüden başla → harita → ilk düğüm
await p.evaluate(() => { localStorage.setItem('oguz-test', '1'); window.__game.toMenu(); });
await p.tap('#start'); await p.waitForTimeout(800);
await p.screenshot({ path: 'test-out/mobil-3.png' });
await p.tap('.mnode'); await p.waitForTimeout(500);
await p.tap('#mapdetail .big'); await p.waitForTimeout(2500);
for (let i = 0; i < 3; i++) { const s = await p.evaluate(() => window.__game.state); if (s === 'cine') await p.evaluate(() => window.__game.cine.skip()); if (s === 'dialog') await p.tap('#dskip'); await p.waitForTimeout(800); }
// kaydırma: sola ve yukarı
const lane0 = await p.evaluate(() => window.__game.P.lane);
const swipe = async (x0, y0, x1, y1) => { const c = await p.context().newCDPSession(p); await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] }); for (let k = 1; k <= 5; k++) await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * k / 5, y: y0 + (y1 - y0) * k / 5 }] }); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
await swipe(250, 500, 80, 500); await p.waitForTimeout(300);
const lane1 = await p.evaluate(() => window.__game.P.lane);
const j0 = await p.evaluate(() => window.__game.P.jumpAt ?? -1);
await swipe(200, 600, 200, 350); await p.waitForTimeout(400);
const y = await p.evaluate(j0 => (window.__game.P.jumpAt ?? -1) > j0 ? 1 : 0, j0);
await p.screenshot({ path: 'test-out/mobil-4.png' });
// diyalog portresi (canvas; data: resmi yok)
const dlg = await p.evaluate(() => new Promise(res => { const g = window.__game, k = Object.keys(g.DLG.DIALOGS)[0]; g.DLG.play(g.DLG.DIALOGS[k], g.portraits, null, () => {}); setTimeout(() => { const c = document.querySelector('#dpage .dport'); let dolu = 0; if (c) { const d = c.getContext('2d').getImageData(0, 0, 256, 256).data; for (let i = 3; i < d.length; i += 4000) dolu += d[i] > 0 ? 1 : 0; } document.getElementById('dskip')?.click(); res(dolu); }, 400); }));
await p.screenshot({ path: 'test-out/mobil-5.png' });
const snd = await p.evaluate(() => Object.keys(window.__game.SOUND.played || {}).length);
console.log(JSON.stringify({ doku: tex, ilk: st, durum: await p.evaluate(() => window.__game.state), serit: [lane0, lane1], zipla: +y.toFixed(2), sesCalindi: snd, portre: dlg }), 'hata:', errs.length ? errs.slice(0, 6) : 'yok');
await b.close();
