# 07 — Sonsuz Akın (Unlimited modu)

**Aşama:** Oynanış  
**Önce yapılmış olmalı:** 02, 05

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

SONSUZ AKIN modunu Spider-Man Unlimited'ın Unlimited modu gibi yap.

Her ~1500 metrede bölge değişsin: Ötüken → Kara Bataklık → Altay → Gök Yolu (uçuş) → Yeraltı → Çin → Karanlık Ülke → (baştan, daha hızlı). Her bölgenin sonunda o bölgenin boss'u gelsin (Tepegöz, Albastı, Yelbegen, Kara Kuş, Erlik, General, Pehlivan). Geçişte kısa sinematik ve beyaz parlama (main.js'teki nextFloor/runShot kullanılabilir). Görev yok; mesafe ve puan esas. Hız her turda artsın.

Kaydet: en iyi skor, en uzun mesafe, yenilen boss sayısı. Bitiş ekranında "Bugünün en iyisi" ve "Tüm zamanların en iyisi" göster. Günlük en iyi skor gece yarısı sıfırlansın (ileride çevrim içi sıralamaya bağlanacak).

Boy seçimi ve destan eşyaları burada da çalışsın. Bot ile en az 3 bölge boyunca test et.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Şu anki Sonsuz Akın `LEVELS[0]` ile yalnız Ötüken ve Tepegöz'den oluşuyor. `LEVELS` ve `THEMES` yapısını yeniden kullan.
- Gök Yolu bir uçuş bölgesi (`flying`). Uçuşa giriş ve çıkış geçişini dikkatle test et.
- 05'teki kural: Sonsuz Akın'da boss kaçarsa koşu sürer, sadece boss ödülü alınmaz. Bunu burada doğrula.
- Günlük en iyi skoru, Kurultay Sıralaması'na (19) taşınabilecek bir yapıda sakla (tarih + skor + koşu özeti).
- Sonsuz Akın, 02'deki kurala göre Akıncı Seviyesi 10'da açılıyor.
