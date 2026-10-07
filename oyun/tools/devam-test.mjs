// "Koşuya devam et": görev bitince sonuç ekranından devam → altın skora varınca sonuç yeniden gelir; ölünce de gelir. node tools/devam-test.mjs
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => { try { localStorage.setItem('oguz-test', '1'); } catch {} });
import { fileURLToPath } from 'node:url';
await p.addScriptTag({ path: fileURLToPath(new globalThis.URL('./bot-brain.js', import.meta.url)) });
const ev = f => p.evaluate(f);
const run = sec => p.evaluate(sec => window.__bot.run(sec), sec);
const out = {};
// 1) kill görevi: g-gen1_0 (8 düşman); hedefe ulaştırıp sonuç ekranını bekle
await ev(() => { delete window.__game.hStore['g-gen1_0']; window.__bot.begin(1, false, true, 'g-gen1_0'); });
for (let i = 0; i < 40 && (await ev(() => window.__game.state)) !== 'result'; i++) await run(10);
out.sonuc1 = await ev(() => ({ state: window.__game.state, cont: !document.getElementById('rcont').hidden, m: window.__game.hStore['g-gen1_0']?.m }));
// 2) devam et
await ev(() => document.getElementById('rcont').click());
out.devam = await ev(() => ({ state: window.__game.state, hud: !document.getElementById('hud').hidden, goals: document.getElementById('goals').textContent }));
const s0 = await ev(() => window.__game.runStats && 0); 
await run(5);
out.ilerledi = await ev(() => ({ state: window.__game.state, goals: document.getElementById('goals').textContent }));
// 3) altın skora kadar: skoru eşiğe çek
await ev(() => { const g = window.__game; const need = g.thresholds ? g.thresholds(g.nodeRun)[2] : 99999; });
for (let i = 0; i < 60 && (await ev(() => window.__game.state)) === 'run'; i++) { await ev(() => { window.__game.score = 1e9; }); await run(5); }
out.son = await ev(() => ({ state: window.__game.state, m: window.__game.hStore['g-gen1_0']?.m, cont: !document.getElementById('rcont').hidden }));
// 4) devam edilen koşuda ölüm: can suyu sorulmaz, sonuç ekranı gelir
await ev(() => { delete window.__game.hStore['g-gen1_0']; window.__bot.begin(1, false, true, 'g-gen1_0'); });
for (let i = 0; i < 40 && (await ev(() => window.__game.state)) !== 'result'; i++) await run(10);
await ev(() => document.getElementById('rcont').click());
await ev(() => { const g = window.__game; g.P.inv = 0; g.P.hp = 1; for (const o of g.objs) o.dead = true; g.add('barricade', g.P.lane, g.P.z - 4); });
for (let i = 0; i < 12 && (await ev(() => window.__game.state)) !== 'result'; i++) await p.evaluate(() => { const g = window.__game; g.frozen = true; g.norender = true; for (let k = 0; k < 20; k++) g.tick(1 / 30); });
out.olum = await ev(() => ({ state: window.__game.state, revive: !document.getElementById('revive').hidden, cont: !document.getElementById('rcont').hidden }));
console.log(JSON.stringify(out, null, 1), 'hata:', errs.length ? errs : 'yok');
await b.close();
