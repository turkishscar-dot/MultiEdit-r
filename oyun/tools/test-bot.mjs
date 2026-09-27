// Test botu: oyunu başsız Chromium'da açar, window.__game ile kare kare ilerletir ve oynar.
// Kullanım: node tools/test-bot.mjs [--level 1] [--endless] [--seconds 240] [--god] [--shot ad]
// (tools/bot.js'in yerine geçmez; bu oturumda yazılan bağımsız bir test aracıdır.)
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const URL = opt('url', 'http://localhost:5173/');
const LEVEL = +opt('level', 1), SECONDS = +opt('seconds', 240), GOD = !!opt('god', false), ENDLESS = !!opt('endless', false);
const SHOT = opt('shot', null), OUT = opt('out', 'test-out'), NODE = opt('node', null);

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', m => { if (m.type() === 'error' && !/vo\/|ses\/|404|Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(URL);
await page.waitForFunction(() => window.__game && window.__game.state === 'gate', null, { timeout: 120000 });
await page.evaluate(() => { try { localStorage.setItem('oguz-test', '1'); } catch {} });
await page.addScriptTag({ path: new globalThis.URL('./bot-brain.js', import.meta.url).pathname });
if (opt('bow', false)) await page.evaluate(() => { window.__botHook = G => { if (G.weapon !== 'bow' && G.state === 'run') G.setWeapon('bow'); }; });
await page.evaluate(([lv, endless, god, node]) => window.__bot.begin(lv, endless, god, node), [LEVEL, ENDLESS, GOD, NODE]);

const t0 = Date.now();
let last = null;
for (let sec = 0; sec < SECONDS; sec += 5) {
  last = await page.evaluate(() => window.__bot.run(5));
  if (last.done) break;
}
if (SHOT) await page.evaluate(() => { window.__game.norender = false; window.__game.tick(1 / 60); }), await page.screenshot({ path: `${OUT}/${SHOT}.png` });
const played = await page.evaluate(() => window.__game.SOUND?.played || {});
if (opt('sounds', false)) console.log('sesler:', JSON.stringify(played));
console.log(JSON.stringify({ ...last, wall: Math.round((Date.now() - t0) / 1000) + 's', errors: errors.length }, null, 0));
for (const e of errors.slice(0, 10)) console.log(e);
await browser.close();
process.exit(errors.length ? 1 : 0);
