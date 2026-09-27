# 10 — Töre Defteri (günlük görev, başarım, giriş armağanı)

**Aşama:** Meta  
**Önce yapılmış olmalı:** 01, 02, 04

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

"Töre Defteri" ekranı ekle (menüde kupa simgesi).

a) GÜNLÜK GÖREVLER: Her gün 3 görev (kolay/orta/zor); ödüller bronz 200 kut, gümüş 500 kut, altın 3 Gök Demir. Örnekler: "40 düşman biç", "5 kıl payı", "Tepegöz'ü yen", "Atla 800 m git", "Yayla 20 düşman", "Bir destan eşyası bul". Gece yarısı yenilensin, ödül menüden alınsın.

b) BAŞARIMLAR: En az 40 başarım, her biri 3 kademeli (ör. "Akıncı: 1/5/25 km", "Dev Avcısı: her boss'u yen", "Kıl Payı Ustası", "Koleksiyoncu: 5/10/13 kostüm", "Rüyanın Yayı: 7 altın yay", "Boybeyi: her boydan birini seç"). Açılınca alttan kayan bildirim.

c) GİRİŞ ARMAĞANI: 7 günlük takvim; 7. gün nadir ödül (Tunç Davul ya da kostüm parçası). Gün kaçırılırsa takvim sıfırlanmasın, kaldığı yerden devam etsin (oyuncu dostu).

Hepsi localStorage ile çalışsın, ileride sunucuya taşınabilir yapıda olsun. Test: tarihi değiştirerek günlük yenilemeyi dene.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Alttan kayan bildirim kartı 02'de kuruldu, onu kullan.
- Günlük görev XP'sini 02'deki XP fonksiyonuna bağla.
- Kıl payı istatistiği 04'te tutuluyor.
- "Rüyanın Yayı: 7 altın yay" için şu an oynanabilir 7 bölüm var (1–7). Yeni bölüm eklenirse bu sayı güncellenmeli.
- Tunç Davul sayacı 01'de wallet'a eklendi.
- Bu adım, önceki 004, 005 ve 007 paketlerinin yerine geçer (onlar iptal edildi).
