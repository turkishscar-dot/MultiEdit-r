# 006 — Kovalamaca: Senaryolu Takip Sahnesi

**SMU karşılığı:** Scripted chase set-piece'leri (ör. Green Goblin'in planörle arkadan kovalaması) —
koşu durmadan, arkadan gelen bir düşmanın saldırılarını zamanlamalı hamlelerle savuşturduğun bölümler.
Normal boss dövüşünden farkı: **boss meydanda durup beklemiyor, koşuyla birlikte akıyor.**

**Neden eksik:** Şu anki tüm boss dövüşleri (`bosses.js`) `startBoss()` ile tetiklenip dünya akışını
büyük ölçüde durduruyor (`holdTarget` genelde 0'a çekiliyor, `B.hold(true)` ile). "Sect" bölümleri
(`SECTS`: dive/kartal/sal/buz) ise düşmansız, sadece traversal/duruş değiştiren pasaj setleri. İkisinin
ortasında bir şey yok: **koşarken, arkadan/yandan gelen isimli bir düşmanın saldırılarını kaçarak
savuşturduğun ama koşunun durmadığı bir sahne.** Bu, en yüksek efor gerektiren pakettir — en sona
bırakılması önerilir (bkz. REPORT.md §4).

## Tasarım

Yeni bir mekanizma: **kovalamaca** — `SECTS` ile aynı aileden ama düşman içeren bir sect türü.

- **Kim kovalar:** Tema bazlı bir "rakip" düşman modeli — mevcut düşman modellerinden biri (ör.
  `itbarak`/`kormos`/`cinli`, `FOE` tablosundaki uygun bir varyant) büyütülmüş ölçekte (`BOSS_SCALE`'den
  küçük, ör. 1.4x), oyuncunun birkaç metre gerisinde sabit kalır (`P.z + sabitMesafe`).
- **Saldırı döngüsü:** `bosses.js`'teki mevcut QTE desenini birebir kullan — `general` boss'unun
  "▲ ZIPLA / ▼ EĞİL" mekaniği (satır ~432-464, `duel`/`windup`/`open` state makinesi) ya da Yelbegen'in
  `swipe(B, b, dir)` deseni (satır ~257) doğrudan örnek alınabilir. Periyodik olarak (ör. her 2.5-4
  saniyede bir) `B.tap('▲ ZIPLA!')` ya da `B.warn(lane, ...)` ile hangi şeride/hangi yönde saldıracağı
  gösterilir, oyuncu doğru hamleyi (zıpla/eğil/şerit değiştir) zamanında yaparsa `B.hurt()` çağrılmaz,
  yanlış/geç yaparsa mevcut `hurt()` normal şekilde çalışır.
- **Koşu durmaz:** `P.speed`, `nextZ`/`spawnRow` mekanizması normal çalışmaya devam eder — kovalayan
  düşman `objs` listesine girmez, ayrı bir `chaser` değişkeninde tutulur (aynı `boss` değişkeni deseni
  ama `holdTarget`'ı 1'de bırakır, akışı durdurmaz).
- **Bitiş:** Sabit bir mesafe/süre sonunda (ör. 25 saniye ya da `dist()` bazlı) kovalayan ya "yenilir"
  (birkaç başarılı savuşturmadan sonra `B.slashBoss()` benzeri bir final vuruşuyla düşer, `killFoe`
  değil özel bir `endChase()`) ya da sahneyi terk eder (senaryoya göre — bazı SMU kovalamacaları
  "kazanılmaz", sadece atlatılır).

## Nereye eklenecek

1. **Yeni state:** `main.js`'te `SECTS` tanımının yanına (satır ~291-296), üçüncü bir kategori olarak
   `CHASES` objesi tanımla:
   ```js
   const CHASES = {
     korbasi_takip: { name: 'KORBAŞI KOVALIYOR!', dur: 22, model: 'kormos', variant: 'baltaci', scale: 1.4,
       pattern: ['low', 'high', 'lane'] }, // sırayla hangi tehlike türü gelecek
   };
   ```
2. **Başlatma:** `startSect()`'in yanına benzer bir `startChase(kind)` fonksiyonu; `sect`
   değişkeninin deseniyle aynı şekilde bir `chase = { kind, C, t: 0, nextAtk: rand(2,3), phase: 'run' }`
   nesnesi. `foe(i, variant, model)` (mevcut `ctx.foe` / `pool(model)` deseni) ile aktörü oluştur,
   `P.z + 4` gibi sabit bir arkadan-gelme mesafesinde tut (`updateChase(dt)` fonksiyonunda her frame
   `chaser.actor.root.position.set(...)`).
3. **Saldırı QTE'si:** `bosses.js`'teki `general` boss'unun `duel`/`windup`/`open` durum makinesini
   referans alarak (satır ~432-464) benzer bir 3 fazlı döngü yaz: `warn` (B.warn ile hangi şeritte/ne
   tehlike geleceği gösterilir, ~0.8sn) → `strike` (oyuncunun doğru hamleyi yapması gereken pencere,
   ~0.5sn, `act()` fonksiyonundaki mevcut zıplama/kayma/şerit değiştirme hareketleri zaten bunu
   karşılıyor — ayrı bir input eklemeye gerek yok, sadece o pencerede `dodged()`/`P.lane` kontrolü
   yapılıyor) → `resolve` (başarılıysa `pop('KAÇTI!', ...)`, başarısızsa `hurt()`).
4. **Bitiş:** `endSect()` deseniyle aynı şekilde `endChase()`, `chase = null`, tema eski haline döner.
5. **Tetikleme:** `sectTick(dt)`'nin yanına, bir bölümün belirli bir mesafesinde (`LEVELS` tablosundaki
   bir `floor`'a `chase: 'korbasi_takip'` alanı eklenebilir, `SECTS`'teki `sect: ['kartal', 200]`
   deseniyle birebir aynı yapı: `chaseAt: ['korbasi_takip', 300]`).

## index.html

Yeni bir görsel öğeye gerek yok — mevcut `#tap`, `#warn` (3B sahne içi `warn` mesh'i, zaten `W.makeWarn()`
ile var), `#banner` bileşenleri yeniden kullanılabilir. İsteğe bağlı: kovalayan düşmanın ne kadar
"öfkelendiğini" gösteren küçük bir mesafe/öfke barı (`#bossbar` deseniyle aynı stil) eklenebilir ama
zorunlu değil.

## Denge notları
- Bu paket **en riskli** olanı — mevcut boss state-makinesi (`boss`/`fin`/`state`) ile çakışmaması için
  `chase` bir boss **değil**, `sect` gibi ayrı bir katman olarak tasarlandı; `boss && ...` kontrollerinin
  geçtiği her yerde (`update(dt)` içindeki `if (!boss && !sect && dist() > bossAt ...)` gibi) yeni
  `chase` değişkeni de dışlanmalı (`!boss && !sect && !chase`).
- İlk sürümde tek bir kovalamaca senaryosu (`korbasi_takip`) yeterli; sistem oturduktan sonra her ana
  bölüme özel bir kovalamaca (İt-Barak, Çin süvarisi, Erlik'in kulu vb.) eklenebilir.
- Uygulamadan önce `bosses.js`'i tam olarak oku — QTE state-makinesi deseni (`setState`, `b.state`,
  `b.next`, `b.t`) tüm boss'larda tekrarlanan bir kalıp, kovalamaca da aynı kalıbı taklit etmeli ki kod
  tabanıyla tutarlı kalsın.
