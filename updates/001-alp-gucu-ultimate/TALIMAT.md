# 001 — Alp Gücü: Beceriyle Dolan Özel Yetenek Ölçeği

**SMU karşılığı:** Team-Up / Special meter — kombo yaparak doldurulan, oyuncunun kendi seçtiği anda
patlattığı ekran-temizleyici özel saldırı.

**Neden eksik:** Şu anki oyunda "güçlü an" hep şansa bağlı: `kilic` (Tanrı Kılıcı), `islik` (Islıklı Ok
yağmuru), `kurt` (Gök Yeleli Kurt rehberi) hepsi **rastgele düşen pickup'lar** (`spawnRow()` içindeki
`Math.random() < 0.012` gibi olasılıklarla). Oyuncunun performansıyla kazandığı, kendi kontrol ettiği bir
"ben bunu hak ettim, şimdi patlatıyorum" anı yok. SMU'nun bağımlılık yapan asıl döngüsü bu.

## Tasarım

Yeni bir kaynak: **Alp Gücü** (0–100 arası bar, HUD'da `#powers`'ın üstünde yeni bir gösterge).

- **Nasıl dolar:** Her düşman öldürmede (`killFoe` içinde `how` sword/arrow/rain iken) +Alp Gücü.
  Hasar yemeden art arda öldürmede (yani `combo` sıfırlanmadan) katsayı artar — mevcut `mult()`
  fonksiyonundaki gibi `combo`'ya bağlı bir çarpan kullan. Boss'a vurmak da doldurur (`hitBoss()`).
- **Hasar alınca:** `hurt()` çağrıldığında bar bir miktar azalır (ör. %20) — SMU'daki gibi "temiz oyun"
  ödüllendirilsin, hata cezalandırılsın.
- **Dolunca:** HUD'da yeni bir buton/ikon parlar ("⚡ HAZIR!" gibi). Oyuncu bu butona basınca (ya da
  yukarı+aşağı gibi özel bir jest yerine ayrı bir buton — mobilde net olsun) **Bozkurt Saldırısı**
  tetiklenir:
  - Ekrandaki (görünür mesafedeki, `objs` içinde `P.z - o.z` küçük olan) tüm `o.def.foe` düşmanları
    `killFoe(o, 'ultimate')` ile öldürülür (yeni bir `how` değeri; `score` çarpanı normalden düşük
    tutulabilir ki oyuncular sadece skor için spam'lemesin).
  - Görsel: `wolf` aktörünü (zaten `main.js`'te var, `pow.kurt` mekanizmasındaki gibi) ekranın önünde
    hızla geçiren kısa bir efekt; `sparks.emit(...)` ile geniş bir patlama.
  - `slowmo(0.3, 0.5)` ile kısa ağır çekim, `banner('BOZKURT SALDIRISI!')`.
  - Bar sıfırlanır.

## Nereye eklenecek (main.js)

1. **State:** `P` objesinin yanına ya da yeni bir `let alpGucu = 0;` global (diğer `pow` benzeri
   değişkenlerin yanına, satır ~334-336 civarı, `pow` tanımının yanına).
2. **Doldurma:** `killFoe(o, how)` içinde, `kills++` satırının hemen altına:
   ```js
   if (how) alpGucu = Math.min(100, alpGucu + 6 * (1 + Math.min(combo, 10) * 0.05));
   ```
   `hitBoss()` içinde de benzer, daha küçük bir artış ekle (boss vuruşu daha seyrek olduğu için biraz
   daha yüksek katsayı verilebilir).
3. **Azaltma:** `hurt()` fonksiyonunun başına (P.hp-- satırından önce):
   ```js
   alpGucu = Math.max(0, alpGucu - 20);
   ```
4. **Tetikleme fonksiyonu:**
   ```js
   function ultimateReady() { return alpGucu >= 100; }
   function useUltimate() {
     if (!ultimateReady() || P.dead || fin) return;
     alpGucu = 0;
     slowmo(0.3, 0.5);
     banner('BOZKURT SALDIRISI!');
     const targets = objs.filter(o => o.def.foe && !o.dying && P.z - o.z > -2 && P.z - o.z < 30);
     for (const o of targets) killFoe(o, 'ultimate');
     sparks.emit(P.x, 1.4, P.z, 80, 0x6ab8ff, 9, 5);
     shake = 0.35;
   }
   ```
   `killFoe`'nun `how` parametresine göre skor hesaplayan satırı kontrol et (`score += (how === 'horse'
   ? 50 : 100) * mult();`) — `'ultimate'` için ayrı, daha düşük bir sabit ekle ki oyuncular bar dolar
   dolmaz köşeye sıkışıp spam yapmasın.
5. **Girdi:** `act()` fonksiyonuna yeni bir `a === 'ultimate'` kolu ekle; `index.html`'e `#weapon`
   butonunun yanına yeni bir `#ultimate` butonu koy (bar dolmadan `hidden`/soluk, dolunca parlak).
   Klavye: `KEYS` tablosuna `f: 'ultimate'` gibi bir tuş ekle.
6. **HUD:** `index.html`'de `#powers` yakınına yeni bir bar (`#alpbar`, `#ride`'daki `<div><i></i></div>`
   deseniyle aynı yapı) ve `update(dt)` sonunda `$('alpbar').style.width = alpGucu + '%';` satırı.

## Denge notları
- Alp Gücü'nün bar dolumu ~15-20 saniyelik iyi oyunda bir kez dolacak şekilde ayarlanmalı (çok sık
  olursa özel hissini kaybeder).
- `has('becene')` (Beçene boyu: boss'a çift vuruş) gibi mevcut boy perklerinden biri Alp Gücü doldurma
  hızını da etkileyebilir — opsiyonel, ileride yeni bir boy eklenirse düşünülebilir.

## Test
- Bar dolduktan sonra `useUltimate()` ekrandaki tüm normal düşmanları temizlemeli, boss'u etkilememeli
  (boss `objs` listesinde değil, ayrı `boss` değişkeninde tutuluyor — otomatik olarak etkilenmez, kontrol
  et).
- Ölüm/`toMenu()`/`start()` sırasında `alpGucu = 0` sıfırlanmalı (yeni koşu temiz başlasın).
