// Bölüm turu: her bölümden koşu, boss ve bitiriş kareleri tek sayfada. node tools/tur.mjs 3 4 5 6 7
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
const lvs = process.argv.slice(2).map(Number);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 640, height: 360 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.evaluate(() => localStorage.setItem('oguz-test', '1'));
const files = [], info = [];
for (const lv of lvs) {
  const L = await p.evaluate(lv => window.__game.LEVELS[lv].floors.length, lv);
  for (let fl = 0; fl < L; fl++) {
    const r = await p.evaluate(([lv, fl]) => {
      const g = window.__game; g.frozen = true;
      g.start('level', lv, true);
      const run = s => { for (let i = 0; i < s * 30; i++) { if (g.state === 'cine') g.cine.skip(); if (g.state === 'dialog') document.getElementById('dskip').click(); g.P.hp = 3; g.tick(1 / 30); } };
      for (let f = 0; f < fl; f++) { g.nextFloor(); run(5); }
      run(6);
      return { th: g.theme, st: g.state, boss: g.LEVELS[lv].floors[fl].boss };
    }, [lv, fl]);
    let f = `/tmp/claude-0/tur-${files.length}.png`; await p.screenshot({ path: f }); files.push(f); info.push(`${lv}-${fl} ${r.th} koşu`);
    if (r.boss) {
      await p.evaluate(() => { const g = window.__game; for (const o of g.objs) o.dead = true; g.startBoss(); for (let i = 0; i < 150; i++) { g.P.hp = 3; g.tick(1 / 30); } });
      f = `/tmp/claude-0/tur-${files.length}.png`; await p.screenshot({ path: f }); files.push(f); info.push(`${lv}-${fl} boss ${r.boss}`);
      await p.evaluate(() => { const g = window.__game; for (let i = 0; i < 200; i++) { g.P.hp = 3; g.tick(1 / 30); if (g.boss?.state === 'windup' && g.boss.t > 0.35) break; } });
      f = `/tmp/claude-0/tur-${files.length}.png`; await p.screenshot({ path: f }); files.push(f); info.push(`${lv}-${fl} boss saldırı`);
      await p.evaluate(() => { const g = window.__game; if (!g.boss) return; g.boss.hp = 1; g.add('yada', g.P.lane, g.P.z - 3); g.tick(1 / 30); g.tryOrb(); for (let i = 0; i < 90 && !g.fin; i++) g.tick(1 / 30); for (let i = 0; i < 40; i++) g.tick(1 / 30); });
      f = `/tmp/claude-0/tur-${files.length}.png`; await p.screenshot({ path: f }); files.push(f); info.push(`${lv}-${fl} bitiriş`);
    }
  }
}
await b.close();
execFileSync('python3', ['-c', `
import sys, json
from PIL import Image, ImageDraw
fs=sys.argv[1:-2]; names=json.loads(sys.argv[-2]); out=sys.argv[-1]
ims=[Image.open(f).resize((320,180)) for f in fs]
cols=4; rows=(len(ims)+cols-1)//cols
W=Image.new('RGB',(320*cols,180*rows),'white'); d=ImageDraw.Draw(W)
for i,im in enumerate(ims): W.paste(im,((i%cols)*320,(i//cols)*180)); d.rectangle(((i%cols)*320,(i//cols)*180,(i%cols)*320+170,(i//cols)*180+14),fill=(0,0,0)); d.text(((i%cols)*320+3,(i//cols)*180+2),names[i],fill=(255,220,80))
W.save(out)`, ...files, JSON.stringify(info), `test-out/tur-${lvs.join('')}.png`]);
console.log(info.length, 'kare · hata:', errs.length ? errs.slice(0, 5) : 'yok');
