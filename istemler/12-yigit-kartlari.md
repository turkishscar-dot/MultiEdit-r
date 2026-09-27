# 12 — Yiğit Kartları

**Aşama:** Koleksiyon  
**Önce yapılmış olmalı:** 01, 02, 04, 11

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Spider-Man Unlimited'ın kahraman kartı sistemini "Yiğit Kartları" olarak uyarla.

Hikâye: Ölümsüz Oğuz, Kam'ın davuluyla farklı çağların Türk yiğitlerinin ruhlarını çağırır; koşan yiğit onların görünüşüne ve gücüne bürünür.

Kartlar (gerçek tarihî/destanî bilgiler, arkasında kısa tanıtım; doğruluğunu kontrol et): Oğuz Kağan, Gün/Ay/Yıldız/Gök/Dağ/Deniz Han, Mete Han, Bumin Kağan, Bilge Kağan, Kül Tigin, Tonyukuk, Alp Er Tunga, Tomris Hatun, Attila, Basat, Bamsı Beyrek, Deli Dumrul, Banu Çiçek, Manas, Er-Sogotoh, Altın Elbiseli Adam, Fatih Sultan Mehmet, Babür Şah, Şah İsmail... Mevcut 13 kostüm (src/costumes.js) bu kartların görünüşü olsun; yeni kartlar için build_chars.py'deki costume_parts ile yeni başlık ve renkler ekle.

Nadirlik: Er (3★, en çok 30. seviye), Alp (4★, 50), Bey (5★, 70), Kahraman (6★, 90), Efsane (7★, 100), Destan (8★, 110; SMU'daki Titan karşılığı). 5★'da ikinci yetenek açılsın.

Yetenekler: "+2 kıl payı", "+%50 kombo puanı", "Boss'a %65 fazla puan", "Kut %30 fazla", "Kombo süresi +7 sn", "Düşmanlar iki kat kut düşürür"...

Ordu: 1 lider (koşan) + 3 yardımcı; toplam güç koşu puanı çarpanı olsun (SMU'daki Team Power gibi, sağ üstte ×2.2).

Gelişim: seviye kut ile, rütbe aynı karttan ya da Gök Demir ile.

Ekran: çizgi roman çerçeveli kart tasarımı; yıldız, seviye, güç, yetenek, 3B önizleme (Kostümler ekranı temel alınabilir). Mobil uyumlu olsun, ekran görüntüleriyle doğrula.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- En büyük adım bu. Gerekirse iki oturuma böl: (a) veri modeli, kartlar ve Ordu çarpanı; (b) ekran ve yeni kostüm modelleri.
- Kostümler ekranı ve `wallet.owned` kartlara dönüşecek. Kostüm satın almış oyuncular kartlarını kaybetmesin.
- Yetenekler 04'te kurulan bonus yapısını kullansın.
- Tunç Davul (01'de sayacı eklendi) yiğit çağırma eşyası olsun. Kam'ın davulu hikâyesine uyuyor. Nasıl kart verdiğini (rastgele mi, seçmeli mi) raporla. Gerçek parayla şans kutusu yapma.
- Kostümlerdeki yazıların bir kısmı karta taşınacak. Tarihî bilgileri (tarihler, unvanlar) kontrol et.
