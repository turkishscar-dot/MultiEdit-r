# 002 — Umay Ana'nın Bağışı: Kut ile Canlanma

**SMU karşılığı:** "Continue?" ekranı — oyuncu ölünce, biriktirdiği para/currency ile koşuya kaldığı
yerden devam edebilir.

**Neden eksik:** Şu anda `die()` fonksiyonunda tek istisna `has('cepni')` (Çepni boyu) perk'i: seçiliyse
bir kez ücretsiz canlanma oluyor. Ama bu (a) boy seçimine bağlı, (b) ücretsiz/koşulsuz. SMU'daki asıl
mekanik **herkesin** kullanabildiği, **birikimle** (kut) satın alınan bir ikinci şans. Bu hem oyuncunun
elindeki kut'a bir anlam daha katar hem de "az kalsın bitiyordu, devam edeyim" anını oyuna ekler.

**Tema uyumu:** Umay Ana, eski Türk inanışında savaşçıları ve yeni doğanları koruyan ana ruh/tanrıçadır —
"Umay Ana'nın bağışı" ifadesi hem mitolojik hem de oyunun diline (Bangers font, destan anlatımı) uygun.

## Tasarım

1. Oyuncu ölünce (`die()` tetiklendiğinde, `has('cepni') && !reviveUsed` koşulu **başarısız** olursa,
   yani ücretsiz canlanma hakkı yoksa), doğrudan `state = 'dying'` yerine önce yeni bir ekran gösterilir:
   **"UMAY ANA'NIN BAĞIŞI"** — "◆ {fiyat} kut karşılığında kaldığın yerden devam et" + iki buton:
   **CANLAN** ve **VAZGEÇ**.
2. Fiyat, o koşuda toplanan `kut` miktarına göre ölçeklenmeli (sabit bir sayı yerine), örn:
   ```js
   const reviveCost = () => Math.max(50, Math.round(kut * 0.6));
   ```
   Böylece hep "elindekinin çoğunu ama hepsini değil" harcatır — SMU'nun fiyatlandırma hissi budur.
3. **CANLAN**'a basılırsa: `kut -= reviveCost()`, `P.hp = 1`, `P.inv = 2.5` (var olan `die()`'daki Hüma
   kuşu mantığıyla birebir aynı desen, satır ~1027-1035'teki `has('cepni')` bloğunu örnek al), oyun
   `state = 'run'`'a devam eder. **Koşu boyunca bir kez** kullanılabilir (yeni bir `reviveUsed`-benzeri
   bayrak; mevcut `reviveUsed` değişkenini karıştırmamak için ayrı bir `umayUsed` bayrağı kullan, çünkü
   Çepni'nin ücretsiz hakkı ile bu ikisi **art arda** da kullanılabilmeli: önce Çepni'nin ücretsiz hakkı,
   biterse Umay Ana'nın ücretli hakkı).
4. **VAZGEÇ**'e basılırsa ya da kut yetmiyorsa: mevcut `die()` akışı olduğu gibi devam eder
   (`state = 'dying'`, ölüm animasyonu, `gameOver()`).
5. Kut yetersizse CANLAN butonu `disabled` olur, altında "yetersiz kut" yazar (mevcut `wardrobe`
   ekranındaki satın alma butonu deseniyle aynı — `b.disabled = ... wallet.bank < c.price` satırına bak,
   `costumes.js`/`main.js` `drawWardrobe()`).

## Nereye eklenecek (main.js)

1. `die()` fonksiyonunu ikiye ayır: mevcut gövdesini `actuallyDie()` yap, yeni `die()` şöyle olsun:
   ```js
   function die() {
     if (has('cepni') && !reviveUsed) { /* mevcut kod aynen kalır */ return; }
     if (!umayUsed && kut >= 50) return showUmayOffer();
     actuallyDie();
   }
   function actuallyDie() {
     P.dead = true;
     state = 'dying';
     overT = 1.6;
     timed(hero, pick(DEATHS), 1.5, { fade: 0.1 });
   }
   function showUmayOffer() {
     state = 'umay'; // yeni bir durum; update() döngüsünde 'menu' gibi sadece hero.update(dt) yapılsın
     const cost = Math.max(50, Math.round(kut * 0.6));
     $('umaycost').textContent = '◆ ' + cost;
     $('umayrevive').disabled = kut < cost;
     $('umay').hidden = false;
   }
   ```
   `update(dt)` fonksiyonunun state kontrol zincirine (satır ~1922 civarı,
   `if (state === 'menu' || ...)`) `'umay'` durumunu da `hero.update(dt)` ile aynı satıra ekle ki
   arka planda hero donmuş kalmasın.
2. Yeni fonksiyonlar:
   ```js
   function umayRevive() {
     const cost = Math.max(50, Math.round(kut * 0.6));
     if (kut < cost) return;
     kut -= cost;
     umayUsed = true;
     $('umay').hidden = true;
     state = 'run';
     P.dead = false;
     P.hp = 1; P.inv = 2.5;
     hearts();
     banner('UMAY ANA BAĞIŞLADI!');
     sparks.emit(P.x, 1.6, P.z, 60, 0xffe07a, 7, 4);
     hero.play('Idle_Loop', { fade: 0.2 }); // sonra heroAnim() normale döndürür
   }
   function umayDecline() { $('umay').hidden = true; actuallyDie(); }
   ```
3. `start()` fonksiyonunda diğer bayrakların sıfırlandığı yere (`reviveUsed = smashUsed = false;`
   satırının yanına) `umayUsed = false;` ekle. Değişkeni `reviveUsed`'ın tanımlandığı yerde
   (`let ... reviveUsed = false, smashUsed = false, ...`) `umayUsed = false` olarak birlikte tanımla.
4. Butonları bağla (diğer `$('...').onclick = ...` satırlarının yanına):
   ```js
   $('umayrevive').onclick = umayRevive;
   $('umaydecline').onclick = umayDecline;
   ```

## index.html'e eklenecek

`#over` ekranının hemen üstüne, aynı `.screen` deseniyle yeni bir blok:

```html
<div id="umay" class="screen" hidden>
  <h1 class="ink">UMAY ANA'NIN BAĞIŞI</h1>
  <div class="kilim"></div>
  <p class="ink">Ana ruh seni bir kez daha bu dünyaya bağışlayabilir.<br>Karşılığında: <span id="umaycost">◆ 0</span></p>
  <div class="menu-buttons">
    <button id="umayrevive" class="big">CANLAN</button>
    <button id="umaydecline" class="small">VAZGEÇ</button>
  </div>
</div>
```

## Denge notları
- `Math.max(50, Math.round(kut * 0.6))` formülü, kut çok azsa (ör. koşunun hemen başında ölünürse)
  bile makul bir taban fiyat (50) koyar — bu, "her ölümde bedava devam" hissini önler.
- Bu mekanik boss dövüşü ortasında da tetiklenebilir (`die()` boss savaşında da çağrılıyor) — Umay
  ekranından dönünce boss state'inin bozulmadığından emin ol (boss `objs`'ten ayrı tutulduğu için P.hp/P.dead
  sıfırlamak yeterli olmalı, boss kendi `update(dt)` akışına devam eder).
