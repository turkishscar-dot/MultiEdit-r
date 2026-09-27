# 01 — Gök Demir (ikinci para birimi)

**Aşama:** Temel  
**Önce yapılmış olmalı:** 00

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

İkinci para birimi "Gök Demir" ekle (gökten düşen meteor demiri; mor-mavi parlayan taş simgesi).

Kazanma: altın düşmanlar, günlük görevlerin altın ödülü, bir bölümü ilk kez 3 yıldızla bitirme, başarımlar, giriş armağanı. Satın alma paketleri ileride telefon sürümünde (şimdilik "YAKINDA").

Harcama: devam et, Akın Seferi hızlandırma, nadir kostüm ya da yiğit, Tunç Davul, bazı Çarşı takviyeleri.

src/costumes.js'teki wallet'a gokdemir alanı ekle, localStorage'da sakla. Menüde, Kostümler'de ve bitiş ekranında kut ve Gök Demir sayaçları yan yana dursun. Kazanıldığında sayaç zıplasın. Test: kazan-harca akışını dene.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Kazanma ve harcama yerlerinin çoğu (altın düşman, günlük görev, başarım, Çarşı, seferler) sonraki adımlarda eklenecek. Bu adımda sadece para biriminin kendisini, wallet'taki alanı, sayaçları ve "ilk kez 3 yıldız" ödülünü kur. Diğer adımlar `wallet.gokdemir` alanını kullanacak.
- "Tunç Davul" birçok ödülde geçiyor ama henüz tanımlı değil. Yiğit Kartları'nda (12) yiğit çağırma eşyası olacak. Şimdilik wallet'a `tuncdavul` sayacı ekle ki ödüller birikebilsin.
