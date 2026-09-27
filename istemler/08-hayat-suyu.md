# 08 — Hayat Suyu ile devam

**Aşama:** Oynanış  
**Önce yapılmış olmalı:** 01, 03

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Ölünce "HAYAT SUYU İLE DEVAM ET" ekranı ekle.

- 5 saniyelik geri sayım halkası; süre bitince normal bitiş ekranı.
- Fiyat Gök Demir ile: 1 → 2 → 4; koşu başına en çok 3 kez. Gök Demir yoksa düğme soluk olsun ve Çarşı'ya yönlendirsin.
- Önce Çepni boyunun Hüma dirilişi (varsa) kendiliğinden kullanılsın.
- Devam edince Oğuz 2 saniye yenilmez olsun, önündeki 20 m temizlensin, "HAYAT SUYU!" yazısı ve yeşil ışık efekti çıksın.
- Telefonda reklam izleyerek devam için yer ayır (şimdilik kapalı).

Destanda hayat suyu Er-Sogotoh'u dirilten sudur (Ögel, s.99). Ekranda altın kase içinde parlayan su görseli olsun.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- `die()` fonksiyonundaki mevcut Çepni/Hüma bloğunu koru, Hayat Suyu ondan sonra devreye girsin.
- Boss savaşı sırasında ölüp devam edilirse boss'un durumu bozulmamalı. Kaçış çubuğu (05) devam ederken de doğru işlemeli.
- Çarşı 09'da eklenecek. O zamana kadar "Çarşı'ya git" düğmesi "YAKINDA" göstersin, 09'da bağlanacak.
- Bu, önceki "Umay Ana'nın Bağışı" paketinin yerine geçer (o paket iptal edildi).
