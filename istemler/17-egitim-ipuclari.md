# 17 — Eğitim ipuçları

**Aşama:** Sunum  
**Önce yapılmış olmalı:** 04, 05, 06, 11 (ipuçları bu mekanikleri de anlatsın)

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Yeni oyuncular için eğitim ipuçları ekle.

İlk kez karşılaşılan her şeyde oyunu 0.6 saniye ağır çekime al ve ekranın ortasında sarı bir ipucu kutusu göster (çizgi roman stilinde, index.html'deki #tap gibi): şerit değiştir (kaydırma animasyonu), zıpla, kay, kılıçla vur, ⚔/🏹 ile yaya geç, kut topla, at nalı, şifalı kımız, destan eşyası (zıplayarak al), pusu uyarısı (!), Gök Yeleli Kurt, Ak Geyik, boss düellosu (EĞİL/ZIPLA/KAÇ), görev hedefleri.

Her ipucu bir kez gösterilsin (localStorage). Ayarlarda "ipuçlarını sıfırla" olsun. Mobilde el hareketi simgesi çıksın, masaüstünde klavye tuşu. 1. bölümün ilk kısmında ipuçları sırayla ve güvenli anlarda gelsin.

Ekran görüntüleriyle doğrula.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Bunu sona yakın yapıyoruz ki önceki adımlarda gelen mekaniklerin de ipucu olsun: kıl payı, isabet halkası, kaçış çubuğu, geri çalma (05'teki geçici ipucunu buraya taşı), altın düşman, kırılan engel, Hayat Suyu.
- `slowmo()` zaten var, onu kullan.
- "İpuçlarını sıfırla" düğmesi 18'deki Ayarlar ekranına gidecek. O gelene kadar menüde geçici bir yerde dursun.
- Bot ipuçlarında takılmasın. 02'deki test anahtarıyla ipuçları kapatılabilsin.
