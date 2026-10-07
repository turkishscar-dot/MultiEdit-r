// Animasyon inceleme: her klipten 8 kare, yandan (test-out/anim/<klip>_<i>.png). node tools/anim-sheet.mjs [klip ...]
import { chromium } from 'playwright';
import fs from 'node:fs';
const CLIPS = process.argv.slice(2).length ? process.argv.slice(2) : [
  'Sword_Regular_A', 'Sword_Regular_B', 'Sword_Regular_C', 'Sword_Attack', 'Sword_Stab', 'Sword_Dash', 'Sword_Heavy_Combo',
  'MX_GS_Slash1', 'MX_GS_Slash2', 'MX_GS_Slash3', 'MX_GS_Slash4', 'MX_GS_Slash5', 'MX_GS_Attack', 'MX_GS_Spin', 'MX_GS_JumpAttack',
  'MX_Stab1', 'MX_Stab2', 'MX_Stab3', 'MX_GS_Kick', 'MX_Kick',
  'Sprint_Loop', 'MX_GS_Run', 'MX_GS_Run2', 'MX_Running', 'MX_Run', 'MX_FastRun', 'MX_RunUnarmed', 'MX_BowRun', 'Jog_Fwd_Loop',
  'Bow_Shoot', 'MX_BowDraw', 'MX_BowRecoil', 'MX_BowOverdraw', 'MX_BowEquip',
  'MX_FrontFlip', 'MX_TwistFlip', 'MX_GS_Jump', 'NinjaJump_Start', 'NinjaJump_Idle_Loop', 'Roll', 'MX_Dive', 'MX_GS_Slide', 'Slide_Loop',
  'Hit_Chest', 'MX_GS_Impact', 'MX_GS_Impact2', 'MX_React', 'Death01', 'MX_Death1', 'MX_Death2', 'MX_DeathBack', 'MX_DeathFwd',
];
fs.mkdirSync('test-out/anim', { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const p = await b.newPage({ viewport: { width: 200, height: 250 } });
await p.goto('http://localhost:5173/');
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
await p.addStyleTag({ content: '.screen, #hud, #banner, #tap { display: none !important; }' });
await p.evaluate(() => { const g = window.__game; localStorage.setItem('oguz-test', '1'); g.toMenu(); g.cam = [3.4, 1.15, -0.3, 0, 1.0, -0.3]; });
for (const clip of CLIPS) {
  for (let i = 0; i < 8; i++) {
    await p.evaluate(([clip, i]) => {
      const h = window.__game.hero, bow = /Bow/.test(clip);
      h.parts.SwordHand.visible = !bow; h.parts.SwordSheath.visible = bow; h.parts.BowHand.visible = bow; h.parts.BowBack.visible = !bow;
      h.mixer.stopAllAction();
      const a = h.mixer.clipAction(h.clips[clip]);
      a.reset().play();
      a.time = h.clips[clip].duration * i / 8;
      a.paused = true; // menüde kahraman güncellenir ama klip bu karede durur
      h.mixer.update(0);
    }, [clip, i]);
    await p.waitForTimeout(90);
    await p.screenshot({ path: `test-out/anim/${clip}_${i}.png` });
  }
}
await b.close();
console.log('bitti', CLIPS.length);
