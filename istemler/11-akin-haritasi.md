# 11 — Düğümlü Akın Haritası ve bitiş ekranı

**Aşama:** Meta  
**Önce yapılmış olmalı:** 01, 02, 04

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

AKIN HARİTASI'nı düz listeden, çizgi roman stilinde düğümlü bir Türk dünyası haritasına çevir.

Harita: parşömen üstüne mürekkeple çizilmiş gibi (Ötüken, Kara Bataklık, Altay, Gök Yolu, Yeraltı, Çin, Karanlık Ülke; kaydırılabilir). Her bölümün kısımları (main.js'teki LEVELS.floors) yol üstünde düğümler olsun. Aralara kısa ek görev düğümleri koy: "Kıl payı 20 kez", "Atla 1000 m git", "Hiç darbe almadan 500 m", "Sadece yayla 15 düşman".

Her düğümde: tür simgesi, ad, 0-3 madalya (skor eşiği bronz/gümüş/altın), ödül (kut, Gök Demir, XP), kilit. Bazı ek görevler belli bir kostüm ya da boy ister ("Bu görev Kayı boyundan bir yiğit ister").

Bitiş ekranı SMU'daki gibi olsun: "GÖREV TAMAM", 3 madalya sırayla dolsun, skor, kombo, kut, XP, Gök Demir, "YENİ REKOR" damgası, "TEKRAR / SONRAKİ" düğmeleri.

İlerleme localStorage'da. Mobilde dikey ve yatay ekranda düzgün görünsün; ekran görüntüleriyle doğrula.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Şu an bölümler yıldızla tutuluyor (`progress`, `oguz-levels`). Madalyaya geçerken eski kayıtları kaybettirme, dönüştür.
- Kısımlar şu an tek koşuda art arda oynanıyor (`nextFloor`). Düğümler tek tek mi oynanacak, yoksa bölüm yine tek koşu mu olacak? Karar ver ve raporla. Önerim: bölüm tek koşu olarak kalsın, düğümler ilerlemeyi göstersin.
- Ek görev düğümleri (kıl payı, yalnız yay, darbesiz mesafe) 04'teki istatistikleri kullanır.
- "Kayı boyundan bir yiğit ister": 12'den önce boy seçimiyle kontrol et. Yiğit Kartları gelince kart şartına genişlet.
- Madalya ve ek görevlerin XP'sini 02'ye bağla.
