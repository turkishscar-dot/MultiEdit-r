// Yiğit poz incelemesi: vitrinde her yiğidi verilen kliplerin ortasında dondurur, önden/yandan/arkadan çeker.
//   node tools/yigit-poz.mjs <cikti-klasor> <id,id...> [klip,klip...]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [OUT, IDS, CL] = process.argv.slice(2);
const CLIPS = (CL || 'MX_GS_Idle3,MX_Run,Sword_Heavy_Combo').split(',');
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 180000 });
await p.evaluate(() => { const g = window.__game; localStorage.setItem('oguz-test', '1'); g.unlockAll?.(); g.toMenu(); });
await p.addStyleTag({ content: '#yvitrin > *:not(#yvstage), #yigit > *:not(#yvitrin) { visibility: hidden !important; }' });
for (const id of IDS.split(',')) {
  await p.evaluate(id => { const g = window.__game; g.EK.openYigit(id); [...document.querySelectorAll('#yigit button')].find(b => /VİTRİN/i.test(b.textContent))?.click(); }, id);
  await p.waitForTimeout(2500);
  for (const clip of CLIPS) for (const [v, d] of [['on', 0], ['yan', 1], ['arka', 2]]) {
    await p.evaluate(([clip, d]) => {
      const bk = window.__game.book, h = bk.actors.oguz;
      h.mixer.stopAllAction();
      const a = h.mixer.clipAction(h.clips[clip]); a.reset().play(); a.time = h.clips[clip].duration * 0.4; a.paused = true; h.mixer.update(0);
      h.root.rotation.y = d * Math.PI / 2 * (d === 1 ? -1 : 1);
      bk.setRank?.(null);
    }, [clip, d]);
    await p.waitForTimeout(150);
    await p.screenshot({ path: `${OUT}/${id}_${clip}_${v}.png`, clip: { x: 270, y: 170, width: 400, height: 600 } });
  }
}
await b.close();
console.log('bitti');
