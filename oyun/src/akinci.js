// Akıncı Seviyesi: koşulardan gelen XP ile seviye, Göktürk unvanları ve menü açılımları.
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Seviye unvanları (en yüksek eşikten aşağı)
const TITLES = [[40, 'KAĞAN'], [30, 'YABGU'], [20, 'ŞAD'], [15, 'TUDUN'], [10, 'TARKAN'], [5, 'ALP'], [1, 'ER']];
export const title = L => TITLES.find(([n]) => L >= n)[1];

// Menü açılımları: hangi seviyede açılır
export const UNLOCKS = { boylar: 3, carsi: 5, seferler: 8, endless: 10, ordu: 12, etkinlik: 15 };
export const UNLOCK_NAMES = { boylar: 'Boy Seçimi', carsi: 'Çarşı', seferler: 'Akın Seferleri', endless: 'Sonsuz Akın', ordu: 'Yiğit Ordusu', etkinlik: 'Etkinlikler' };

// XP kaynakları (koşu sonunda hesaplanır)
export const XP = { perMeters: 10, kill: 2, boss: 50 };

// L. seviyeden L+1'e geçmek için gereken XP
export const need = L => 100 + 60 * (L - 1);

// İlk açılışta eski oyuncuya bölüm yıldızlarından XP verilir (açılımlar kilitlenip ilerlemesi boşa gitmesin)
function initialXP() {
  const prog = load('oguz-levels', {});
  return Object.values(prog).reduce((s, v) => s + v * 150, 0);
}
const st = { xp: load('oguz-xp', null) ?? initialXP() };
save('oguz-xp', st.xp);

export function levelOf(xp = st.xp) {
  let L = 1, rest = xp;
  while (rest >= need(L)) { rest -= need(L); L++; }
  return { level: L, into: rest, need: need(L), xp };
}
export const level = () => levelOf().level;
export const totalXP = () => st.xp;

// Test anahtarı (localStorage 'oguz-test' = '1' ya da __game.unlockAll()) bütün açılımları açar
let testAll = (() => { try { return localStorage.getItem('oguz-test') === '1'; } catch { return false; } })();
export function unlockAll(on = true) { testAll = on; }
export const isUnlocked = key => testAll || level() >= (UNLOCKS[key] ?? 0);

// Seviye ödülü: her seviyede kut; unvan değişiminde Gök Demir
function reward(L, newTitle) { return { kut: 50 * L, gd: newTitle ? 3 : 0 }; }

// XP ekler; atlanan her seviye için { level, title, newTitle, reward, unlocks } döner
export function addXP(n) {
  n = Math.max(0, Math.round(n));
  if (!n) return [];
  const before = level();
  st.xp += n;
  save('oguz-xp', st.xp);
  const after = level(), ups = [];
  for (let L = before + 1; L <= after; L++) {
    const t = title(L), newTitle = t !== title(L - 1);
    ups.push({ level: L, title: t, newTitle, reward: reward(L, newTitle), unlocks: Object.keys(UNLOCKS).filter(k => UNLOCKS[k] === L) });
  }
  return ups;
}
