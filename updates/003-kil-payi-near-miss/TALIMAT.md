# 003 — Kıl Payı: Ucundan Kaçış Bonusu

**SMU karşılığı:** Near-miss ödülü — bir tehlikenin çok yakınından, ona çarpmadan geçince ekstra puan ve
görsel geri bildirim verilir. Küçük bir özellik ama "az kalsın!" hissini oyuna ekleyip akışı zenginleştirir.

**Neden eksik:** Şu anki çarpışma sistemi (`updateObj()` içindeki `reach`/`Math.abs(...)` kontrolleri)
sadece **çarpma** anını değerlendiriyor (`hurt()` ya da `pickup()`). Yakınından geçilen ama çarpılmayan
engeller için hiçbir geri bildirim yok — oyuncu risk alıp tam zamanında zıpladığını/kaydığını fark etmiyor
bile.

## Tasarım

Bir engelin (`o.def.hit` olan, yani `barricade`, `beam`, `rope`, `boulder`, düşman saldırıları vb.)
**tam çarpışma eşiğinin hemen dışında** geçildiği anı yakala:

- "Kıl payı" sayılacak koşul: `o.def.hit` var, `o.done` henüz `false` (yani hurt/pickup tetiklenmedi),
  oyuncu engeli geçti (`P.z - o.z` pozitiften negatife döndü, yani `ahead` işareti değişti) **ve** o anki
  kaçış gerçekten "riskli" bir zamanlamaydı — ör. `hit === 'low'` (üstünden atlanması gereken rope/lowgate)
  için atlama anında `P.y` değerinin belirli bir eşiğin altında olması (çok az farkla geçildi), ya da
  `hit === 'high'` (altından kayılması gereken beam/spear) için kayma bitişine (`P.slide`) çok az kala
  geçilmesi.
- Basitleştirilmiş, uygulaması kolay bir yaklaşım: `dodged(o.def.hit)` fonksiyonu zaten var
  (`main.js` satır ~1006: `const dodged = hit => (hit === 'low' ? P.y > 0.6 : hit === 'high' ? P.slide > 0
  : false);`). Bir engel `updateObj()` içinde `ahead` aralığından çıkarken (`ahead < -0.9` gibi, yani
  tam o anda "geçti" dediğimiz sınır) eğer `dodged(o.def.hit)` doğruysa **ve** kaçış marjı dar ise
  (`hit === 'low'` için `P.y < 1.0`, `hit === 'high'` için `P.slide < 0.25`) → kıl payı say.

## Nereye eklenecek (main.js)

`updateObj(o, dt)` fonksiyonu içinde, mevcut çarpışma bloğunun hemen altına (satır ~1105-1115 civarı,
`if (ahead < -8) o.dead = true;` satırından önce) yeni bir blok ekle:

```js
if (!o.done && !o.nearMissed && o.def.hit && !o.def.foe && Math.abs(o.x - P.x) < 1.1) {
  const justPassed = ahead < -0.6 && ahead > -1.6; // engel yeni geçildi
  if (justPassed) {
    o.nearMissed = true;
    const tight = (o.def.hit === 'low' && P.y < 1.0 && P.y > 0) ||
                  (o.def.hit === 'high' && P.slide > 0 && P.slide < 0.25);
    if (tight) {
      score += 30 * mult();
      pop('KIL PAYI!', o.mesh.position);
      sparks.emit(o.x, o.y + 0.5, o.z, 12, 0xffd23f, 4, 2);
    }
  }
}
```

`o.nearMissed` bayrağı olmadan bu blok her frame tekrar tetiklenir — mutlaka bir kerelik bayrak koy
(nesne `add()` ile oluşturulurken otomatik `undefined` olacağı için ekstra bir tanım gerekmez).

## Denge notları
- Skor ödülü (`30 * mult()`) küçük tutuldu — amaç ekonomik bir avantaj değil, geri bildirim/heyecan.
  İstenirse `combo` sistemine de küçük bir katkı düşünülebilir (`combo++` YAPMA — kombo düşmanla ilgili
  kalmalı, karıştırma).
- `hit === 'block'` olan engeller (barricade, crates, boulder) için "kıl payı" tanımlanmadı çünkü onlar
  zaten şerit değiştirerek kaçılıyor — şerit değişimi doğal olarak "dar kaçış" hissi vermiyor, bu yüzden
  kapsam dışında bırakıldı. İstenirse ileride şerit değiştirme zamanlamasına göre de eklenebilir ama ilk
  sürümde `low`/`high` (atlama/kayma) engelleriyle sınırlı tutmak daha net bir his verir.
- Düşman saldırıları (`o.def.foe`) bu ilk sürümde kapsam dışı bırakıldı (kod net olsun diye); istenirse
  ikinci iterasyonda `okcu`/`mizrakci` gibi menzilli düşmanların oklarına karşı da aynı mantık eklenebilir.

## Test
- Bir `rope` (hit: 'low') engelinin tam üstünden, yere değmeden hemen önce geçildiğinde "KIL PAYI!"
  görünmeli.
- Aynı engelin çok yüksekten (`P.y` büyükken) atlanmasında **görünmemeli** (bu "rahat" bir geçiş, dar
  değil).
- Aynı nesneye iki kez tetiklenmemeli (`o.nearMissed` bayrağı kontrol edilsin).
