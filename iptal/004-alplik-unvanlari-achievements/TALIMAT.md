# 004 — Alplik Unvanları: Başarım Sistemi

**SMU karşılığı:** Trophy/achievement sistemi — tüm koşulardan biriken, kalıcı meta-hedefler.

**Neden eksik:** Şu anda ilerleme sadece iki yerde tutuluyor: `progress` (her bölümün en iyi yıldız
sayısı, `oguz-levels`) ve `relicSave` (röliklerin toplanma durumu). Bunların ikisi de **bölüm bazlı**.
Oyuncunun genel oynayış davranışını ödüllendiren (toplam öldürme, toplam mesafe, boss sayısı gibi)
hiçbir kalıcı hedef yok — SMU'nun "trophy" katmanı budur ve oyuncuyu "bir tane daha unvan için" tekrar
oynatan asıl motordur.

## Tasarım

**Veri modeli** — yeni bir `src/achievements.js` dosyası (mevcut `boylar.js`'in deseniyle birebir aynı
şekilde, `load`/`save` yardımcıları kopyalanabilir):

```js
// Alplik Unvanları: tüm koşulardan biriken kalıcı başarımlar.
export const ACHIEVEMENTS = [
  { id: 'ilk_kan', name: 'İlk Kan', desc: '1 düşman öldür', stat: 'kills', n: 1, reward: 20 },
  { id: 'yuz_kirim', name: 'Yüz Kırım', desc: '100 düşman öldür', stat: 'kills', n: 100, reward: 100 },
  { id: 'alp_eren', name: 'Alp Eren', desc: '1000 düşman öldür', stat: 'kills', n: 1000, reward: 500 },
  { id: 'ilk_zafer', name: 'İlk Zafer', desc: 'İlk boss\'unu yen', stat: 'bosses', n: 1, reward: 30 },
  { id: 'bozkurt_soyu', name: 'Bozkurt Soyu', desc: '10 boss yen', stat: 'bosses', n: 10, reward: 300 },
  { id: 'akinci', name: 'Akıncı', desc: 'Toplam 10.000 metre koş', stat: 'dist', n: 10000, reward: 100 },
  { id: 'destan_yolu', name: 'Destan Yolu', desc: 'Toplam 100.000 metre koş', stat: 'dist', n: 100000, reward: 600 },
  { id: 'kut_biriktiren', name: 'Kut Biriktiren', desc: 'Toplam 5000 kut topla', stat: 'kutTotal', n: 5000, reward: 150 },
  { id: 'kombo_ustasi', name: 'Kombo Ustası', desc: 'Tek koşuda 20 kombo yap', stat: 'bestCombo', n: 20, reward: 120 },
  { id: 'kurtarici', name: 'Kurtarıcı', desc: 'Toplam 50 esir kurtar', stat: 'esirTotal', n: 50, reward: 150 },
  { id: 'terzi', name: 'Terzi', desc: '5 kostüm satın al', stat: 'costumes', n: 5, reward: 200 },
  { id: 'bahadir', name: 'Bahadır', desc: 'Hiç can kaybetmeden bir bölümü bitir', stat: 'flawless', n: 1, reward: 250 },
];

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// stats: tüm koşulardan birikmiş toplamlar. unlocked: açılmış unvan id'leri.
export const stats = load('oguz-stats', { kills: 0, bosses: 0, dist: 0, kutTotal: 0, esirTotal: 0, bestCombo: 0, costumes: 1 });
export const unlocked = load('oguz-unvan', []);
export function bump(key, n = 1) { stats[key] = (stats[key] || 0) + n; save('oguz-stats', stats); }
export function setMax(key, n) { if (n > (stats[key] || 0)) { stats[key] = n; save('oguz-stats', stats); } }
// Her değişimden sonra çağrılır; yeni açılan unvanları döner (main.js banner göstermek için kullanır).
export function checkUnlocks() {
  const gained = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.includes(a.id)) continue;
    const v = a.stat === 'flawless' ? stats.flawless || 0 : stats[a.stat] || 0;
    if (v >= a.n) { unlocked.push(a.id); gained.push(a); }
  }
  if (gained.length) save('oguz-unvan', unlocked);
  return gained;
}
```

## main.js entegrasyonu

`import { stats, unlocked, bump, setMax, checkUnlocks, ACHIEVEMENTS } from './achievements.js';` ekle.

Sayaçları besleyecek noktalar (hepsi zaten var olan fonksiyonlarda, sadece bir satır ekleniyor):

- `killFoe(o, how)` içinde `kills++` satırının yanına: `bump('kills');`
- `finishDone(b)` içinde: `bump('bosses');`
- `freeEsir(o)` içinde `esirs++` yanına: `bump('esirTotal');`
- `pickup(o)`'nun `case 'kut':` kolunda `kut += n;` yanına: `bump('kutTotal', n);`
- `wallet.buy(c)` başarılı olduğunda (bkz. `drawWardrobe()`'daki `if (!owned && !wallet.buy(c)) return;`
  satırının hemen altına) `setMax('costumes', wallet.owned.length);`
- `update(dt)` içinde her frame `setMax('bestCombo', maxCombo);` (zaten `maxCombo` her koşuda tutuluyor)
- `update(dt)` içinde `score += dz * mult();` satırının yanına, mesafe artışını da ekle:
  `bump('dist', dz);` (dikkat: bu her frame küçük parçalar halinde eklenir, `dz` zaten `P.z -= dz` ile
  hesaplanıyor, aynı `dz` değişkenini kullan).
- `win()` fonksiyonunda, `P.hp === 3` ise (hiç can kaybetmeden bitti) `stats.flawless = 1; save`
  mantığıyla `bump('flawless', 1)` çağır (ama bu istatistiğin `n: 1` eşiğiyle sadece bir kez sayılması
  yeterli, `bump` toplama yaptığı için `stats.flawless` zaten 1'den büyük olabilir — sorun değil, kontrol
  `v >= a.n` olduğu için çalışır).

Her sayaç güncellemesinden sonra (en pratik yer: `update(dt)`'nin sonunda, HUD güncellemelerinin
yanına, ama çok sık çağrılmasın diye örneğin sadece `kills`/`bosses`/`esirTotal` değiştiğinde) şunu çağır:

```js
const gained = checkUnlocks();
for (const a of gained) { kut += a.reward; banner('UNVAN: ' + a.name + '!'); }
```

En kolay entegrasyon noktası: `killFoe`, `finishDone`, `freeEsir`, `win()` gibi sayaç artıran her
fonksiyonun sonuna `for (const a of checkUnlocks()) { kut += a.reward; banner('UNVAN: ' + a.name + '!'); }`
eklemek (tekrarı azaltmak istersen ortak bir `announceUnlocks()` yardımcı fonksiyonu yaz).

## Yeni ekran: UNVANLAR

`openMap()`/`openBook()` deseniyle aynı şekilde bir `openAchievements()` fonksiyonu ve menüye yeni bir
buton (`#achbtn`, mevcut `#bookbtn` yanına). Liste: `ACHIEVEMENTS.map(a => ...)`, her satırda ad, açıklama,
ödül, ve `unlocked.includes(a.id)` ise "✓ AÇILDI" rozeti, değilse ilerleme çubuğu
(`stats[a.stat] || 0` / `a.n`).

## index.html

`#map` ekranının deseniyle (`.screen`, liste düzeni) yeni bir `#achscreen` bloğu; `.node` sınıfını
tekrar kullanabilirsin (kilitli/açık görünüm zaten orada tanımlı).

## Denge notları
- Ödüller (`reward`) toplamı dengeli tutuldu; en pahalı kostüm 2500 kut olduğu için toplam unvan
  ödülü (~2370 kut) tek başına en pahalı kostümü almaya yetmemeli — bu bilinçli, unvanlar "bonus" olsun,
  "ana kut kaynağı" olmasın.
