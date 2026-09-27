# 16 — Uluğ Türük diyalogları

**Aşama:** Sunum  
**Önce yapılmış olmalı:** 03 (seslendirme kısma)

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Görev öncesi ve sonrası konuşma balonlu kısa diyaloglar ekle (Spider-Man Unlimited'daki Nick Fury sahneleri gibi).

Akıl hocası: Uluğ Türük, Oğuz'un ak sakallı, gri saçlı veziri; Uygurca Oğuz Destanı'nda altın yay rüyasını yorumlar. build_chars.py ile modelini yap: yaşlı, uzun ak sakal, sarık ya da börk, uzun kaftan, asa.

Her kısmın başında 2-4 panellik diyalog olsun: Uluğ Türük görevi verir, Oğuz cevap verir, bazen boss'lar alay eder (Tepegöz, Erlik...). Panelde karakterler oyundaki modellerle, ağızlarından çıkan konuşma balonları, sağ altta İLERİ ve sol altta ATLA (comic.js'teki çizgi roman düzeni temel alınabilir).

Diyalogları bölümlere göre, destanlara ve oyunun hikâyesine uygun yaz. Tüm cümleleri SESLENDIRME.md listesine ekle (tools/vo_list.mjs). Ekran görüntüleriyle doğrula.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Uluğ Türük, oyunda zaten Rüyanın Yayı (gümüş ok + altın yay) mekaniğinin kaynağı olarak geçiyor (`planRelics`). Diyaloglar bu bağı kullanabilir.
- Şu anki bölüm girişi sinematikleri (`levelIntro`) korunmalı. Diyalog onlardan sonra, koşudan önce gelsin.
- `cine.js`'teki `voId` metinden dosya adı üretiyor. Cümleleri kesinleştirdikten sonra `node tools/vo_list.mjs` çalıştır.
