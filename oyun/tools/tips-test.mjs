// İpucu testi: temiz kayıtla 1-0 düğümünü oynar (bot ipuçlarını kapatmadan), hangi ipuçları sırayla göründü, ekran görüntüleri
import { chromium } from 'playwright';
const dev = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: dev === 'mobile' ? { width: 390, height: 844 } : { width: 960, height: 540 }, hasTouch: dev === 'mobile', isMobile: dev === 'mobile' });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.addScriptTag({ path: new URL('./bot-brain.js', import.meta.url).pathname });
const shots = [];
let seenN = 0;
await p.evaluate(() => { window.__tipLog = []; const h = document.getElementById('hint'); new MutationObserver(() => { if (!h.hidden) window.__tipLog.push(h.textContent.slice(0, 40)); }).observe(h, { attributes: true, childList: true }); });
await p.evaluate(() => { const g = window.__game; g.nodeRun = g.nodes.find(n => n.id === '1-0'); g.hStore['1-0'] = { m: 1, best: 0 }; window.__bot.begin(1, false, true, null); });
for (let i = 0; i < 160; i++) {
  const r = await p.evaluate(n0 => { window.__bot.run(0.5); return [window.__tipLog.length > n0, window.__game.state, window.__tipLog.length]; }, seenN);
  seenN = r[2];
  if (r[0] && shots.length < 4) { await p.evaluate(() => { window.__game.norender = false; window.__game.tick(1 / 60); }); const f = `test-out/ipucu${dev ? '-m' : ''}-${shots.length}.png`; await p.screenshot({ path: f }); shots.push(f); }
  if (r[1] !== 'run') break;
}
console.log('ipuçları:', await p.evaluate(() => [...new Set(window.__tipLog)].join(' | ')));
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
