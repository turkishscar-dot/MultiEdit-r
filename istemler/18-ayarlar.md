# 18 — Ayarlar

**Aşama:** Sunum  
**Önce yapılmış olmalı:** 03, 17

PC'deki Claude'a: önce `istemler/README.md`'deki genel kuralları oku, sonra aşağıdaki istemi uygula.

## İstem

Menüye dişli simgeli "Ayarlar" ekle.

İçerik:
- Müzik, efekt ve seslendirme düzeyi.
- Grafik: Yüksek (bloom, gölge, mürekkep çizgisi) / Orta / Düşük (gölgesiz, bloomsuz, düşük çözünürlük). Varsayılanı açılışta FPS ölçerek kendiliğinden seç.
- Titreşim (telefonda).
- Eğerek yönlendirme (özel bölümler için).
- İpuçlarını sıfırla.
- Ara sahneler galerisi: jenerik, çizgi roman prolog, bölüm girişleri ve bölüm sonları.
- Emeği geçenler: Quaternius (CC0), Mixamo, Three.js, Blender; kaynakça (Bahaeddin Ögel, Türk Mitolojisi I).
- Dil (şimdilik Türkçe; ileride İngilizce).

Ayarlar localStorage'da saklansın. Düşük grafikte mobilde FPS'i ölç ve raporla.

## Uygulayan için notlar

Bu notlar yukarıdaki istemi projenin şu anki koduna ve önceki adımlara bağlar. Çelişki varsa istem geçerlidir, ama çelişkiyi raporla.

- Eğerek yönlendirme şu an menü ve mola ekranında `.tiltbtn` olarak duruyor. Ayarlar'a taşı.
- Emeği geçenler listesine 03'te raporlanan ses/müzik kaynaklarını ve lisanslarını da ekle (CC-BY lisansı bunu zorunlu kılar).
- Grafik düzeyi: `OutlineEffect`, `UnrealBloomPass`, `renderer.shadowMap`, `setPixelRatio` ayarlanabilir.
- "Bölüm sonları" için `EPILOG` metinleri şu an yalnızca bitiş ekranında yazı olarak duruyor. Galeride nasıl oynatılacağına karar ver.
