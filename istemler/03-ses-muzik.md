# 03 — Ses ve müzik

**Aşama:** Temel  
**Önce yapılmış olmalı:** 00

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Oğuz Kağan oyununa ses ve müzik ekle.

Kaynak: Ücretsiz ve ticari kullanıma uygun (CC0 ya da CC-BY) ses ve müzikler bul; her dosyanın kaynağını ve lisansını bana tablo halinde raporla. Ücretli bir şey gerekirse önce bana danış.

Müzik (döngülü): menü (kopuz/dombra, sakin), her bölge için koşu müziği (Ötüken: davul-zurna tempolu; Bataklık: karanlık, yankılı; Altay: boğazdan söyleme havası; Gök Yolu: rüzgârlı, ferah; Yeraltı: ağır davul; Çin: pentatonik; Karanlık Ülke: soğuk, kurt uluması), boss müziği (daha hızlı), zafer ve yenilgi kısa müzikleri.

Efektler: kılıç savurma ve isabet, ok çekme/bırakma/isabet, zıplama, kayma, takla, kut toplama (6'lı dizide perde yükselsin), at nalı dörtnala ve kişneme, kurt uluması, ıslıklı okun vızıltısı, kımız şifası, darbe alma, düşman ölümü, boss kükremesi, kalkan kırılması, menü tıklaması, kitap sayfası çevirme.

Teknik: src/sound.js adında küçük bir ses yöneticisi yaz (Web Audio API). Müzik ve efekt düzeyleri ayrı olsun ve localStorage'da saklansın. Sekme gizlenince sessize alsın. Mobilde ilk dokunuşta ses kilidini açsın. Ara sahne seslendirmesi (cine.js'teki vo/ sistemi) çalarken müziği kıssın.

Boyut: OYNA.html'e gömüleceği için dosyaları OGG/MP3 96 kbps yap; toplam 8 MB'ı geçmesin.

Test: Her olayın sesi çalıyor mu kontrol et, bot ile bir bölüm oynat, hata olmasın.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Bunu erken yapıyoruz ki sonraki özellikler (Geri Çalma, Altın Av, Hayat Suyu, seviye atlama vb.) kendi seslerini doğrudan `sound.js` üzerinden ekleyebilsin. Olay adlarını genişletilebilir tut (`play('parry')` gibi).
- Seslendirme düzeyi ayarı Ayarlar'da (18) istenecek. Şimdiden müzik, efekt ve seslendirme için üç ayrı düzey tut.
- Bölge müziği temaya göre seçilsin (`setTheme`). Boss müziği `startBoss`/`endBoss` ile değişsin.
