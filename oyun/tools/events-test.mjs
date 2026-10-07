// Olay testi: nadir olayları (kımız, kurt, ıslıklı ok, destan eşyası, Tanrı Kılıcı, yay, kalkan, darbe) elle yaratır, seslerini sayar.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const out = await p.evaluate(async () => {
  const g = window.__game, S = g.SOUND;
  await S._init().resume();
  g.frozen = true; g.norender = true;
  g.start('level', 1, true);
  const run = s => { for (let i = 0; i < s * 30; i++) g.tick(1 / 30); };
  const P = g.P;
  run(1);
  for (const k of ['kimiz', 'islik', 'gumus', 'yay', 'kilic']) { g.add(k, P.lane, P.z - 6, k === 'gumus' || k === 'yay' ? { fy: 0, ri: 0 } : {}); run(1.2); }
  run(3);
  g.setWeapon('bow'); g.act('tap'); run(0.5);
  const f = g.add('kormos', P.lane, P.z - 7, { variant: 'kalkanli' }); g.setWeapon('sword'); run(0.1); g.act('tap'); run(0.6);
  P.inv = 0; g.add('barricade', P.lane, P.z - 3); run(1);
  document.querySelector('#pause').click(); run(0.1);
  return S.played;
});
const want = ['kut', 'heal', 'whistle', 'gold', 'bowdraw', 'bowrelease', 'swing', 'shieldbreak', 'click']; // kurt ve at kaldırıldı (howl/neigh/gallop yok)
if (!out.hurt && !out.death) want.push('hurt'); // son darbe can bitirdiyse 'death' çalar
console.log(JSON.stringify(out));
console.log('EKSİK:', want.filter(w => !out[w]).join(', ') || 'yok', '| hata:', errs.length ? errs : 'yok');
await b.close();
