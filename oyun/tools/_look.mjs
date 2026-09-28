import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
const [W, H] = (process.env.VP || '960x540').split('x').map(Number);
const p = await b.newPage({ viewport: { width: W, height: H } });
p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const steps = JSON.parse(process.argv[2]);
for (const [name, code, wait] of steps) {
  await p.evaluate(code => { const g = window.__game; const run = (sec) => { for (let i = 0; i < sec * 30; i++) g.tick(1 / 30); }; return eval(code); }, code);
  await p.waitForTimeout(wait ?? 800);
  await p.screenshot({ path: `test-out/look-${name}.png` });
}
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
