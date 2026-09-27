# 06 — Altın Düşman ve Kırılan Engeller

**Aşama:** Oynanış  
**Önce yapılmış olmalı:** 01, 03, 04

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

İki küçük ödül mekaniği ekle.

1) ALTIN DÜŞMAN: Her koşuda rastgele 1-3 kez, o bölgenin düşman modelinin altın zırhlı, parlayan bir sürümü çıksın (Körmös, Sulu, Almas, Tang askeri, İt-Barak...). Materyali altına boya, üstüne altın parıltı ve "!" ekle. Öldürülünce "Gök Demir" (değerli ikinci para; ayrı istemle eklenecek, yoksa şimdilik 25 kut) düşürsün, "ALTIN AV!" yazısı çıksın. Koşarak kaçmaya çalışsın (sana doğru değil, önden uzaklaşsın), yakalamak zor olsun.

2) KIRILAN ENGELLER: Sandık, küp, fıçı, erzak arabası, tahta çit gibi ahşap engeller kılıçla vurulunca parçalanıp 3-5 kut saçsın. Taş duvar, kaya, kafes gibileri kırılmaz. Kırılabilir olanlar çatlaklı bir dokuyla belli olsun. Parçalanma efekti ve "ÇAT!" yazısı ekle.

bot.js ile test et, ekran görüntüsü al.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Gök Demir 01'de eklendi. Altın düşman doğrudan Gök Demir düşürsün (25 kut yedeği gereksiz).
- Düşman modelleri havuzda paylaşılıyor (`pool(model)`) ve malzemeler aktörler arasında ortak olabilir. Altına boyarken malzemeyi kopyala, yoksa aynı modeldeki bütün düşmanlar altın olur.
- Kalkan kırma zaten +1 kombo veriyor (04). Kırılan engel kombo vermesin, sadece kut versin (istemde yok).
