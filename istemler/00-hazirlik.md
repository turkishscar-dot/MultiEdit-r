# 00 — Hazırlık ve doğrulama

**Aşama:** —  
**Önce yapılmış olmalı:** Yok. İlk bu yapılır.

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Bu projede sırayla birçok büyük özellik eklenecek. Başlamadan önce:

1. Proje klasörü git ile izlenmiyorsa `git init` yap ve şu anki hâlini ilk commit olarak kaydet. `node_modules/`, `dist/`, `video/kareler/` ve derlenmiş `OYNA.html` için `.gitignore` ekle. Her özellikten sonra ayrı bir commit atılacak; bir şey bozulursa geri dönülebilsin.
2. `tools/bot.js`'in şu anki hâliyle bir bölümü baştan sona hatasız oynadığını doğrula. Oynamıyorsa önce onu düzelt.
3. Koşu içi bölümler (Uçurumdan İniş, Kartal Taşıması, Sal, Buzda Kayma) ve telefonu eğerek yönlendirme `src/main.js`'teki `SECTS`, `startSect`, `endSect`, `sectView` ile zaten yazılmış durumda. Yeraltı kat geçişleri de `nextFloor` içinde `startSect('dive')` ile oynanabilir. Bunları yeniden yazma; sadece şunları doğrula ve eksik kalanı tamamla:
   - Her bölüm 10–20 saniye sürüyor ve geçişte kamera hareketi var (`camMark`).
   - Kartal Taşıması'nda altın halkalar ve kut var, sonunda kartal bırakıyor.
   - Sal bölümünde kıyıdan İt-Barak okçuları ok atıyor, kılıç ve yay çalışıyor.
   - Buzda kaymada şerit değiştirme gecikmeli oturuyor, çatlak buzlardan zıplanıyor.
   - Eğerek yönlendirme varsayılan kapalı, ayarlardan açılıyor.
   - Her bölümü ekran görüntüsüyle doğrula ve bot ile test et.
