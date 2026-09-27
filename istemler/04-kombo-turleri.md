# 04 — Dört kombo türü

**Aşama:** Oynanış  
**Önce yapılmış olmalı:** 03 (ses olayları için)

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Spider-Man Unlimited'daki dört kombo türünü Oğuz Kağan'a uyarla. Şu an kombo sadece düşman öldürünce artıyor (src/main.js: killFoe).

1) VURUŞ: şimdiki gibi (düşman öldürme).
2) KIL PAYI: yan şeritteki bir engelin yanından 0.6 m'den az farkla geçince, ya da alçak/yüksek bir engeli son 0.25 saniyede zıplayıp/kayarak atlatınca +1 kombo ve "KIL PAYI!" yazısı.
3) İSABET: yolda arada bir altın "tamga halkaları" çıksın (uçuştaki hoop gibi, dikey halka). İçinden geçince "İSABET!" ve +1 kombo.
4) KALKAN: kalkanlı düşmanın kalkanını kırmak +1 kombo.

Sayaç: sol alttaki kombo sayacının altında tür etiketi (KIL PAYI / İSABET / VURUŞ / KALKAN) ve +puan yazısı çıksın. 5 saniye yeni hareket gelmezse kombo sönsün; sayacın çevresinde azalan bir süre halkası görünsün. Puan çarpanı 40 komboya kadar artsın, sonra sabit kalsın.

Boy güçleri (src/boylar.js) ileride "kıl payı +2", "kombo süresi +3 sn" gibi bonuslar verebilecek yapıda olsun.

Test: Bir bölümü bot ile oynat (tools/bot.js), hata olmasın. Kıl payını ekran görüntüsüyle göster.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Şu an `mult()` komboyu 20'de kesiyor (`Math.min(combo, 20)`). İstem 40 diyor, bunu güncelle.
- Boy güçleri için kurulacak bonus yapısı Yiğit Kartları'nın (12) yetenekleri tarafından da kullanılacak ("+2 kıl payı", "Kombo süresi +7 sn"). Bonusları tek bir yerden toplayan bir fonksiyon yaz, kaynağı boy ya da kart olabilsin.
- Kıl payı sayısını koşu istatistiği olarak tut. Akın Haritası (11) ve Töre Defteri (10) bunu kullanacak.
