# Oğuz Kağan: Seslendirme Rehberi (ElevenLabs)

Oyundaki bilgisayar sesi kaldırıldı. Ara sahneler artık `vo/` klasöründeki MP3 dosyalarını çalıyor. Bir cümlenin dosyası yoksa sahne sessiz geçer ve yazı ekranda kalır. Yani kaydı parça parça ekleyebilirsin.

## 1. Ses seçimi: yaşlı, belgesel anlatan erkek sesi

**Yol A: Hazır ses (Voice Library)**
1. ElevenLabs'te **Voices → Voice Library** bölümüne gir.
2. Filtreleri şöyle ayarla:
   - **Language:** Turkish (bulamazsan English)
   - **Gender:** Male
   - **Age:** Old
   - **Use case:** Narrative & Story ya da Documentary
3. Aramaya *narrator*, *storyteller*, *documentary*, *deep* ya da *wise old man* yaz.
4. Birkaç sese şu cümleyi okutarak dinle, en tok ve ağır olanı seç: *"Çok eski zamanlarda, Ötüken'in bozkırlarında…"*

**Yol B: Sesi kendin tasarla (Voice Design)**
1. **Voices → Create a Voice → Voice Design** bölümüne gir.
2. Açıklama alanına şunu yapıştır (İngilizce açıklama daha iyi sonuç verir):

   > An elderly Turkish man in his seventies with a deep, warm, resonant and slightly raspy voice. He speaks slowly and solemnly, like a documentary narrator telling an ancient Turkic epic by a campfire. Clear, well-articulated standard Turkish (Istanbul accent), calm authority, dramatic pauses.

3. Örnek metin olarak Türkçe bir cümle yaz, üretilen sesleri dinle ve beğendiğini kaydet.

## 2. Ayarlar

| Ayar | Değer | Neden |
|---|---|---|
| Model | **Eleven Multilingual v2** | Türkçede en düzgün telaffuz. Daha duygulu anlatım istersen *Eleven v3* dene. |
| Stability (Kararlılık) | **%50–60** | Anlatıcı sesi tutarlı kalsın, yine de tekdüze olmasın. |
| Similarity (Benzerlik) | **%75** | Ses kimliği korunur. |
| Style Exaggeration (Üslup) | **%15–25** | Hafif destan havası verir. Fazlası abartılı olur. |
| Speaker Boost | **Açık** | Daha dolgun ses. |
| Speed (Hız) | **0.90** | Belgesel temposu. |
| Çıktı biçimi | **MP3, 44.1 kHz, 128 kbps** | Oyunun beklediği biçim. |

**İpuçları**
- Her cümleyi **ayrı ayrı** üret ve indir.
- Bir kelime yanlış okunursa yazılışını kolaylaştır: "Kağan" yerine "Kaan", "Ötüken" yerine "Ö-tü-ken" gibi.
- Dramatik bir durak için cümleye `...` ekleyebilirsin. Dosya adı ise **aşağıdaki listedeki gibi kalmalı**.

## 3. Dosyaları nereye koyacaksın?

- **Geliştirme için:** `oguzkhan/public/vo/` klasörü. Klasör yoksa oluştur.
- **Çift tıklanan `OYNA.html` için:** `OYNA.html`'in yanındaki `vo/` klasörü.

Dosya adları metinden üretilir. Bir cümleyi değiştirirsem dosya adı da değişir. Böylece eski kayıt yanlış yerde çalmaz. Liste güncel değilse `node tools/vo_list.mjs` komutu bu dosyayı yeniden yazar.

## 4. Okunacak metinler ({{SAYI}} cümle)
{{LISTE}}
