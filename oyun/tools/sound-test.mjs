// Ses testi: her efekti ve müzik parçasını çalar, çıkışta ses (RMS) var mı ölçer; sonra botla bir bölümde hangi efektlerin tetiklendiğini sayar.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const res = await p.evaluate(async () => {
  const S = window.__game.SOUND;
  const ctx = S._init(); await ctx.resume();
  const an = S._analyser(), buf = new Float32Array(an.fftSize);
  const rms = () => { an.getFloatTimeDomainData(buf); let s = 0, pk = 0; for (const v of buf) { s += v * v; pk = Math.max(pk, Math.abs(v)); } return [Math.sqrt(s / buf.length), pk]; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  for (const n of S.NAMES.sfx) { S.sfx(n, { gap: 0 }); let m = 0, pk = 0; for (let i = 0; i < 8; i++) { await wait(25); const [r, k] = rms(); m = Math.max(m, r); pk = Math.max(pk, k); } out['sfx:' + n] = [+m.toFixed(3), +pk.toFixed(2)]; await wait(150); }
  for (const n of S.NAMES.music) { S.music(n); let m = 0, pk = 0; for (let i = 0; i < 40; i++) { await wait(50); const [r, k] = rms(); m = Math.max(m, r); pk = Math.max(pk, k); } out['music:' + n] = [+m.toFixed(3), +pk.toFixed(2)]; }
  S.music(null); await wait(600);
  for (const n of S.NAMES.stings) { S.sting(n); let m = 0; for (let i = 0; i < 30; i++) { await wait(50); m = Math.max(m, rms()[0]); } out['sting:' + n] = [+m.toFixed(3)]; await wait(800); }
  return out;
});
const silent = Object.entries(res).filter(([, v]) => v[0] < 0.003);
const clip = Object.entries(res).filter(([, v]) => v[1] >= 0.99);
console.log(Object.entries(res).map(([k, v]) => k + '=' + v.join('/')).join('  '));
console.log('SESSİZ:', silent.map(x => x[0]).join(', ') || 'yok', '| KESİLME:', clip.map(x => x[0]).join(', ') || 'yok', '| hata:', errs.length ? errs : 'yok');
await b.close();
