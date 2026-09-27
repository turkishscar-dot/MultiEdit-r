// Töre Defteri testi: günlük görev ilerlemesi ve ödülü, tarihi ileri alarak yenilenme, giriş takvimi, başarım açılışı.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://localhost:5173/');
await p.evaluate(() => { localStorage.clear(); localStorage.setItem('oguz-test', '1'); });
await p.reload();
await p.waitForFunction(() => window.__game?.state === 'gate', null, { timeout: 120000 });
const r = await p.evaluate(() => {
  const g = window.__game, T = g.TORE, out = {};
  g.toMenu();
  const d1 = T.daily(); out.day1 = d1.date + ' ' + d1.quests.map(q => q.id).join(',');
  const q = d1.quests[0];
  T.rec(q.key, q.n); // ilk görevi tamamla
  out.claimable = T.dailyClaimable().map(x => x.id).join(',');
  const kut0 = g.wallet.bank; out.claim = JSON.stringify(T.claimDaily(q.id)); out.kutGain = g.wallet.bank - kut0;
  out.claimAgain = T.claimDaily(q.id);
  T.clock.offsetDays = 1; const d2 = T.daily(); out.day2 = d2.date + ' ' + d2.quests.map(q => q.id).join(',') + ' claimedReset=' + !d2.quests[0].claimed;
  // giriş takvimi: 1. gün, aynı gün tekrar, gün atla (3 gün sonra) -> 2. gün olmalı
  T.clock.offsetDays = 0; out.l1 = JSON.stringify(T.claimLogin()); out.l1again = T.claimLogin();
  T.clock.offsetDays = 3; out.l2 = JSON.stringify(T.claimLogin());
  for (let i = 4; i <= 9; i++) { T.clock.offsetDays = i; T.claimLogin(); }
  out.after7 = JSON.stringify(T.loginState()) + ' davul=' + g.wallet.tuncdavul;
  // başarım: 50 düşman -> Kılıç Ustası I
  T.rec('kill', 60);
  out.ach = T.achTier('kilic') + ' claimable=' + T.achClaimable().map(a => a.id).join(',');
  out.achClaim = JSON.stringify(T.claimAch('kilic'));
  out.badge = T.toreBadge();
  return out;
});
for (const [k, v] of Object.entries(r)) console.log(k.padEnd(12), v);
await p.evaluate(() => { const g = window.__game; g.TORE.clock.offsetDays = 0; g.openTore(); document.querySelector('#ttabs [data-tab=basarim]').click(); });
await p.waitForTimeout(3500);
await p.screenshot({ path: 'test-out/tore-basarim.png' });
await p.evaluate(() => document.querySelector('#ttabs [data-tab=giris]').click());
await p.waitForTimeout(300);
await p.screenshot({ path: 'test-out/tore-armagan.png' });
console.log('hata:', errs.length ? errs : 'yok');
await b.close();
