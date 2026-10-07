// FPS ölçümü: her grafik düzeyinde gerçek zamanlı koşu (telefon boyutunda, isteğe bağlı CPU yavaşlatma).
// Not: başsız Chromium SwiftShader (yazılım GPU) kullanır; sonuçlar gerçek telefondan düşük ve yalnızca karşılaştırma içindir.
import { chromium } from 'playwright';
const throttle = +(process.argv[2] || 1);
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const cdp = await p.context().newCDPSession(p);
await p.goto('http://localhost:5173/');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('oguz-test', '1'); });
await p.reload();
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
if (throttle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
const out = {};
for (const lv of ['yuksek', 'orta', 'dusuk']) {
  out[lv] = await p.evaluate(async lv => {
    const g = window.__game;
    g.applyGfx(lv);
    g.start('level', 1, true);
    const inv = setInterval(() => { g.P.inv = 5; }, 100);
    await new Promise(r => setTimeout(r, 1500));
    let n = 0; const t0 = performance.now();
    await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    clearInterval(inv);
    g.toMenu();
    return Math.round(n / ((performance.now() - t0) / 1000) * 10) / 10;
  }, lv);
}
const auto = await p.evaluate(() => ({ fps: window.__game.fps.fps, secilen: window.__game.AY.cfg.gfx }));
console.log(`CPU yavaşlatma x${throttle} · 390x844 @2x:`, JSON.stringify(out), '· açılış ölçümü:', JSON.stringify({ fps: auto.fps && Math.round(auto.fps), secilen: auto.secilen }));
await b.close();
