# 09 — Çarşı

**Aşama:** Meta  
**Önce yapılmış olmalı:** 01, 02

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

"Çarşı" ekranı ekle.

a) KOŞU ÖNCESİ TAKVİYELER (kut ile, tek kullanımlık): "Kımız Tulumu" (+1 can), "Kurt Çağrısı" (koşuya Gök Yeleli Kurt ile başla), "Bereket Muskası" (ilk 3 dakika 2x kut), "Hız Nalı" (atla başla), "Nazar Boncuğu" (ilk darbe işlemez). Koşu öncesindeki Boy Seçimi ekranına küçük bir takviye rafı ekle; en çok 3 takviye seçilsin.

b) KALICI YÜKSELTMELER (5 kademe, artan fiyat): At süresi, Kurt süresi, Tanrı Kılıcı süresi, Islıklı Ok yağmurunun genişliği, kımız çıkma şansı, kut mıknatısı menzili. Oyun içinde bu değerler main.js'te (rideTime, pow.kurt, pow.kilic, updateRain vb.) yükseltmeye göre ayarlansın.

c) GÖK DEMİR PAKETLERİ: telefon sürümüne kadar "YAKINDA".

Çarşı, çizgi roman stilinde bir otağ tezgâhı gibi görünsün. Satın alma ve kullanma akışını test et.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Çarşı, 02'deki kurala göre Akıncı Seviyesi 5'te açılır.
- 08'deki "Çarşı'ya git" düğmesini bu ekrana bağla.
- "Nazar Boncuğu" ile Kara-evli boyunun kalkanı (`shield`) aynı etkiyi veriyor. Birlikte seçilirse toplanıp toplanmayacağına karar ver (ör. 2 kalkan).
- Boy Seçimi 02'ye göre Akıncı Seviyesi 3'te açılıyor. Daha düşük seviyede takviye rafı nerede duracak, bunu da çöz.
