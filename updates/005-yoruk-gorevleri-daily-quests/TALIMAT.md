# 005 — Yörük Görevleri: Günlük Görevler

**SMU karşılığı:** Daily missions — her gün yenilenen, tamamlanınca ödül veren küçük hedefler. Oyuncuyu
her gün geri getiren en güçlü retention katmanı.

**Ön koşul:** Bu paket, **004 (Alplik Unvanları)**'ndaki `stats`/`bump` altyapısını temel alır — aynı
sayaç noktalarını kullanır, o yüzden 004'ten sonra uygulanmalı.

**Tema uyumu:** "Yörük" (göçebe, konar-göçer Türk toplulukları) adı, "her akına yeni bir görevle çıkma"
fikrini destana uygun şekilde çerçeveliyor.

## Tasarım

**Veri modeli** — yeni bir `src/quests.js`:

```js
// Yörük Görevleri: her gün yenilenen 3 görev. Görev havuzundan tarihe göre deterministik seçilir
// (aynı gün içinde sayfa yenilense bile aynı 3 görev çıksın diye rastgele değil, tarih tohumlu).
const POOL = [
  { id: 'kill10', desc: '5 düşman öldür', stat: 'runKills', n: 5, reward: 40 },
  { id: 'kill25', desc: '20 düşman öldür', stat: 'runKills', n: 20, reward: 80 },
  { id: 'kut200', desc: '200 kut topla', stat: 'runKut', n: 200, reward: 50 },
  { id: 'kut500', desc: '500 kut topla', stat: 'runKut', n: 500, reward: 100 },
  { id: 'combo10', desc: 'Tek koşuda 10 kombo yap', stat: 'runCombo', n: 10, reward: 60 },
  { id: 'dist800', desc: 'Tek koşuda 800 metre koş', stat: 'runDist', n: 800, reward: 60 },
  { id: 'boss1', desc: '1 boss yen', stat: 'runBoss', n: 1, reward: 90 },
  { id: 'esir5', desc: '5 esir kurtar', stat: 'runEsir', n: 5, reward: 70 },
  { id: 'hoop10', desc: 'Uçuşta 10 halkadan geç', stat: 'runHoop', n: 10, reward: 60 },
  { id: 'atlibin', desc: 'Ata bin', stat: 'runMount', n: 1, reward: 30 },
];

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function todaySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function seededPick(seed, n) { // basit deterministik karıştırma
  const arr = [...POOL];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, n);
}

function load_or_reset() {
  const seed = todaySeed();
  let d = load('oguz-daily', null);
  if (!d || d.seed !== seed) { d = { seed, picks: seededPick(seed, 3).map(q => q.id), progress: {}, claimed: [] }; save('oguz-daily', d); }
  return d;
}
export const daily = load_or_reset();
export const dailyQuests = () => daily.picks.map(id => POOL.find(q => q.id === id));

export function bumpQuest(stat, n = 1) {
  for (const id of daily.picks) {
    const q = POOL.find(x => x.id === id);
    if (q.stat !== stat) continue;
    daily.progress[id] = (daily.progress[id] || 0) + n;
  }
  save('oguz-daily', daily);
}
export function setMaxQuest(stat, n) {
  for (const id of daily.picks) {
    const q = POOL.find(x => x.id === id);
    if (q.stat !== stat) continue;
    daily.progress[id] = Math.max(daily.progress[id] || 0, n);
  }
  save('oguz-daily', daily);
}
export function claimable() {
  return daily.picks.filter(id => {
    const q = POOL.find(x => x.id === id);
    return !daily.claimed.includes(id) && (daily.progress[id] || 0) >= q.n;
  });
}
export function claim(id) {
  if (daily.claimed.includes(id) || !claimable().includes(id)) return 0;
  daily.claimed.push(id);
  save('oguz-daily', daily);
  return POOL.find(q => q.id === id).reward;
}
```

## main.js entegrasyonu

`import { dailyQuests, bumpQuest, setMaxQuest, claimable, claim } from './quests.js';`

**Önemli fark ile 004'ten:** buradaki sayaçlar **koşu-bazlı** (`runKills`, `runKut`, ...), tüm-zaman
toplamı değil. `start()` fonksiyonunda `time = kut = score = combo = kills = ...` sıfırlandığı satırın
yanına görev sayaçlarını da bu isimlerle takip edebilmek için mevcut `kills`/`kut`/`combo`/`esirs`/
`hoops`/`dist()` zaten koşu içi tutulan değerler — ekstra state gerekmez, doğrudan bu değerleri kullan:

- `killFoe` içinde `kills++`'ın yanına: `bumpQuest('runKills', 1);`
- `pickup()`'ın `case 'kut':` içinde: `bumpQuest('runKut', n);`
- `update(dt)` içinde `maxCombo` güncellendiğinde (zaten `killFoe`'da `maxCombo = Math.max(maxCombo,
  combo);` var) yanına: `setMaxQuest('runCombo', maxCombo);`
- `update(dt)`'de `dist()` her arttığında: `setMaxQuest('runDist', dist());` (her frame çağırmak
  sorun değil, `setMaxQuest` zaten sadece maksimumu tutuyor)
- `finishDone(b)` içinde: `bumpQuest('runBoss', 1);`
- `freeEsir(o)` içinde: `bumpQuest('runEsir', 1);`
- `pickup()`'ın `case 'hoop':` içinde (satır ~1127): `bumpQuest('runHoop', 1);`
- `mount()` fonksiyonunun başına: `bumpQuest('runMount', 1);`

## Ödül alma akışı

Görevler koşu **bitince** (win/gameOver ekranlarında) ya da menüde bir "GÖREVLER" ekranında toplanabilir
— en basiti: `toMenu()` çağrıldığında (her koşu sonu zaten oraya döner) `claimable()` kontrol edilip
otomatik `claim()` edilir ve toplam ödül `wallet.deposit(...)` ile eklenir + bir banner/popup gösterilir.
Böylece ekstra bir "topla" butonuna gerek kalmaz, basit ve SMU'nun "run sonunda özet ekranı" hissine
yakın durur:

```js
function claimDailyRewards() {
  let total = 0, names = [];
  for (const id of claimable()) { total += claim(id); }
  if (total > 0) { wallet.deposit(total); banner('GÖREV TAMAM! +' + total + ' KUT'); }
}
```
`toMenu()` içinde en sona, `$('menu').hidden = false;` satırından hemen önce `claimDailyRewards();` çağır.

## Yeni menü paneli

Menü ekranına (`#menu`), `.kilim` altına, küçük bir "BUGÜNKÜ GÖREVLER" kutusu ekle (yeni `#dailybox`):
`dailyQuests()` listesinden her görev için açıklama + ilerleme (`daily.progress[id] || 0` / `q.n`) +
tamamlandıysa ✓ işareti. `openMap`/`drawWardrobe` desenindeki gibi `replaceChildren(...)` ile DOM
oluştur.

## Denge notları
- Görev havuzu gün değişince (`todaySeed()` değişince) otomatik yenilenir; oyuncu ödül almadan gün
  değişirse o günün görevleri kaybolur (SMU'daki gibi — bu kasıtlı bir aciliyet/geri dönüş sebebi).
- 3 günlük görevin toplam ödülü (~ortalama 180-200 kut) bir ucuz kostüm (`akoglan`, 250 kut) almaya
  yaklaşık 1-2 gün yeter — makul bir tempo.
