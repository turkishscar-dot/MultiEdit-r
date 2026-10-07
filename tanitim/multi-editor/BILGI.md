# Multi Editor — tanıtım bilgileri / product brief

> Bu dosya Multi Editor'ün tanıtımı için toplanmış bilgidir. Yazılımın hız
> sayıları ölçümdür; elle kurguyla karşılaştırma kanal sahibinin kendi
> beyanıdır.
> Görseller ve demo video, telifli içerik kullanmamak için **sentetik demo
> klipleriyle** üretildi (gerçek projeler Disney dublajlarıyla çalışıyor).

---

## 🇹🇷 Türkçe

### Ad ve tek cümlelik tanım

**Multi Editor** — Bir film sahnesinin onlarca dildeki resmi dublajını tek bir
"multilanguage" YouTube videosuna otomatik olarak dönüştüren masaüstü kurgu
stüdyosu.

### Ne yapıyor

Scar Edits YouTube kanalı, aynı sahnenin farklı dillerdeki dublajlarını arka
arkaya gösteren "multilanguage" videolar yayınlıyor; bu iş önceden CapCut'ta
her dil için elle kesip, bayrak ve dil adı ekleyip, sesleri hizalayarak
yapılıyordu. Multi Editor bu süreci baştan sona otomatikleştirir: filmdeki
gömülü ses parçalarından her dilin klibini çıkarır, her dilin sesini
referans dile göre ölçüp senkronlar, her klibe bayrak, çerçeve, dil adı ve
kanal filigranı ekler ve hepsini geçişlerle tek videoda birleştirir. Bir
projede 36–48 dil işlendi (ölçülen projeler: 41, 36 ve 48 dil). Aynı
kaynaktan Shorts (9:16), şarkının tam hali (Full Song), karaoke/enstrümantal
ve "ranking" videoları da üretilebilir; sonuç istenirse CapCut taslağı
olarak da açılır.

### Ana özellikler

- **Sahne Çıkartıcı:** filmden sahneyi kare kare işaretleyip her dilin
  klibini tek tıkla çıkarma (gömülü çok dublajlı dosyalardan)
- **One Line Multi / ALL VERSIONS:** diller arka arkaya; bayrak, çerçeve
  (37 tür), dil adı, filigran, 73 geçiş efekti, giriş/çıkış animasyonları
- **Otomatik senkron kontrolü:** her dublajın sesi referans dille
  karşılaştırılıp kayma ölçülür ve render sırasında düzeltilir
- **Senkron bekçisi:** birleştirmeden sonra her dilin sesinin final videoda
  doğru yerde olduğu otomatik doğrulanır
- **Ön kontrol:** render'dan önce sessiz klip, iki dilde aynı ses (yanlış
  ses akışı), siyah/donuk kare ve yanlış kesim taranır; küçük resimli
  kontrol kağıdı üretilir
- **Render planı:** hangi dilin neden yeniden render edileceği ve tahmini
  süre; akıllı önbellek (yalnızca değişen diller yeniden render edilir)
- **Full Song Multi:** şarkı dillere paylaştırılır, kesimler vokalin sustuğu
  anlara konur; vokal/enstrümantal ayrımı (stem)
- **Karaoke / Enstrümantal:** sözler Whisper ile çıkarılır, izole vokale
  kelime kelime hizalanır; temalı görseller ve dönen plak animasyonu
- **Shorts Multi (9:16)**, **Ranking videosu**, **Zaman Çizelgesi**
  (CapCut benzeri serbest kurgu: anahtar kare, PIP, maske, alt yazı)
- **CapCut'a gönderme:** proje CapCut 9.5 taslağı olarak yazılır
- **Araçlar:** iş kuyruğu, dublaj kütüphanesi, senkron odası, kanal kiti,
  sürüm geçmişi, önbellek temizleyici, hata raporu, bildirimler
- Türkçe / İngilizce arayüz; NVIDIA GPU ile hızlı kodlama (NVENC)

### Teknolojiler

- **Dil:** Python 3.14 (ana uygulama), Python 3.12 (yapay zekâ modelleri
  için ayrı ortam)
- **Arayüz:** Tkinter (ttk), Pillow ile çizilen simgeler ve görseller
- **Video/ses:** FFmpeg 8.1 (tek filtre grafiğiyle kompozit render, xfade
  geçişleri, NVENC GPU kodlama), mpv (gerçek zamanlı önizleme)
- **Sinyal işleme:** NumPy, librosa (onset + chroma ile senkron ölçümü)
- **Yapay zekâ (hepsi yerel, bilgisayarda çalışır):**
  - faster-whisper / Whisper large-v3 — şarkı sözü ve konuşma tanıma
  - audio-separator — BS-Roformer / MelBand-Roformer vokal ayrımı (GPU)
  - torchaudio MMS_FA — sözlerin vokale kelime kelime hizalanması
  - rembg ve torchvision DeepLabV3 — arka plan silme
- **Dış servis:** X-Minus Pro (isteğe bağlı, stem ayrımı için elle
  kullanılıyor). **Çeviri servisi yok** — videolar resmi dublajları kullanır.
- **Yapay zekâ ile geliştirme:** Claude (Cowork ve Claude Code)

### Claude Code ile nasıl geliştirildi

Proje Claude oturumlarıyla geliştirildi: önce Claude Cowork (bağlı
klasörlerle), ardından Claude Code (masaüstü uygulaması). Proje klasöründeki
`CLAUDE.md` Claude oturumları için çalışma kurallarını ve bozulmaması
gereken teknik kararları içeriyor; her tur sonunda ölçümler ve düzeltilen
hatalar bir Obsidian "ikinci beyin" kasasına yazılıyor.

Bu kayıtlara göre Claude oturumlarında yazılan / düzeltilen başlıca kısımlar:
render motoru (`multi_edit.py`) ve ses senkron zinciri, birikimli ses
kaymasının kök neden düzeltmesi (48 dilde +4,31 sn → 0,000 sn), zaman
çizelgesi kurgu penceresi, CapCut taslak yazıcısı, karaoke ve kelime
hizalama, ön kontrol / render planı / senkron bekçisi, GPU kodlamaya geçiş.

- **Kodun tamamını Claude yazdı.** Kanal sahibi ne istediğini, neyin yanlış
  gittiğini ve sonucu nasıl beğendiğini anlattı; Claude tasarladı, yazdı,
  ölçtü ve düzeltti.
- Geliştirme başlangıcı: **Eylül 2026** (klasördeki en eski dosya
  3 Eylül 2026)

### Kazandırdığı zaman (yalnız gerçek ölçümler)

Ölçülmüş olanlar (yazılımın kendi hızı):

- 12 dillik bir sahneyi sıfırdan render + birleştirme: **435,6 sn → 156,1 sn**
  (GPU kodlama ve filtre optimizasyonu sonrası, 2,8 kat; 23 Eyl 2026)
- 4 dil aynı anda render: x264'te 0,82× gerçek zaman, NVENC ile 2,86×
- Dil başına render önbelleği: yalnızca değişen diller yeniden üretilir
  (tamamı önbellekte olan 4 dillik proje: 10,9 sn)
- Karaoke alt yazı senkronu: "vokal var ama ekranda yazı yok" süresi
  26,19 sn → 0,74 sn (136 sn'lik şarkı)

**Elle kurguyla karşılaştırma (kanal sahibinin beyanı):** bir
multilanguage videosu eskiden yaklaşık **2 saat** sürüyordu, Multi Editor ile
**30 dakikada** yapılabiliyor — **4 kat** daha hızlı.

### Kod tarihi ve boyutu

- İlk commit: **yok** — proje bir git deposu değil (`git log` çalışmıyor).
  En eski dosya tarihi: 3 Eylül 2026.
- Boyut (7 Ekim 2026): **55 Python dosyası, ~39.600 satır**. En büyükleri:
  `kurgu.py` 5.242, `multi_edit.py` 4.392, `multi_studio.py` 4.094,
  `ranking.py` 2.009 satır. Ayrıca 115 font, 64 bayrak görseli, 73 geçiş (57 FFmpeg + 16 özel), 37 çerçeve.

### Kimler kullanıyor

**Yalnızca kanal sahibi** (Scar Edits) kullanıyor. Ürün dağıtılmıyor,
sahibinin bilgisayarında çalışıyor.

---

## 🇬🇧 English

### Name and one-line description

**Multi Editor** — a desktop editing studio that automatically turns the
official dubs of a film scene in dozens of languages into a single
"multilanguage" YouTube video.

### What it does

The Scar Edits YouTube channel publishes "multilanguage" videos that play the
same scene in many dubbed languages back to back; this used to be done by
hand in CapCut, cutting each language, adding flags and language names, and
lining up the audio. Multi Editor automates the whole pipeline: it extracts
each language's clip from the film's embedded audio tracks, measures and
corrects each dub's audio sync against a reference language, composites a
flag, frame, language name and channel watermark onto every clip, and joins
them with transitions into one video. Projects have handled 36–48 languages
(measured projects: 41, 36 and 48 languages). The same source can also
produce Shorts (9:16), full-song videos, karaoke/instrumental videos and
"ranking" videos, and the result can be opened as a CapCut draft.

### Key features

- **Scene Extractor:** mark a scene frame by frame and extract every
  language's clip in one click (from multi-dub files)
- **One Line Multi / ALL VERSIONS:** languages back to back with flag,
  frame (37 styles), language name, watermark, 73 transitions, intro/outro
  animations
- **Automatic sync check:** each dub is compared with the reference
  language; drift is measured and corrected during render
- **Sync watchdog:** after merging, every language's audio is verified to
  sit in the right place in the final video
- **Pre-flight check:** before rendering, scans for silent clips, identical
  audio in two languages (wrong audio stream), black/frozen frames and bad
  cuts; produces a thumbnail contact sheet
- **Render plan:** which languages will re-render and why, with a time
  estimate; smart per-language cache
- **Full Song Multi:** the song is shared between languages with cuts at
  vocal pauses; vocal/instrumental stem separation
- **Karaoke / Instrumental:** lyrics transcribed with Whisper and
  force-aligned word by word to the isolated vocal; themed visuals and a
  spinning-record animation
- **Shorts Multi (9:16)**, **Ranking video**, **Timeline** (CapCut-like
  free editing: keyframes, PIP, masks, subtitles)
- **Send to CapCut:** the project is written as a CapCut 9.5 draft
- **Tools:** job queue, dub library, sync room, channel kit, version
  history, cache cleaner, error report, notifications
- Turkish / English UI; fast NVIDIA GPU encoding (NVENC)

### Technology

- **Language:** Python 3.14 (app), Python 3.12 (separate env for AI models)
- **UI:** Tkinter (ttk), icons and visuals drawn with Pillow
- **Video/audio:** FFmpeg 8.1 (single-filter-graph compositing, xfade
  transitions, NVENC GPU encoding), mpv (real-time preview)
- **Signal processing:** NumPy, librosa (onset + chroma sync measurement)
- **AI (all local, runs on the user's machine):**
  - faster-whisper / Whisper large-v3 — lyrics and speech recognition
  - audio-separator — BS-Roformer / MelBand-Roformer vocal separation (GPU)
  - torchaudio MMS_FA — word-level forced alignment of lyrics to vocals
  - rembg and torchvision DeepLabV3 — background removal
- **External service:** X-Minus Pro (optional, used manually for stems).
  **No translation service** — the videos use official dubs.
- **AI-assisted development:** Claude (Cowork and Claude Code)

### How it was built with Claude Code

The project was developed in Claude sessions: first Claude Cowork (with
mounted folders), then Claude Code (desktop app). A `CLAUDE.md` in the
project holds working rules for Claude sessions and the technical decisions
that must not be broken; after every round, measurements and fixed bugs are
written to an Obsidian "second brain" vault.

According to those records, the main parts written or fixed in Claude
sessions: the render engine (`multi_edit.py`) and audio sync chain, the root
fix for cumulative audio drift (+4.31 s over 48 languages → 0.000 s), the
timeline editor, the CapCut draft writer, karaoke and word alignment,
pre-flight check / render plan / sync watchdog, and the move to GPU encoding.

- **All of the code was written by Claude.** The channel owner described
  what they wanted, what was going wrong and whether they liked the result;
  Claude designed, wrote, measured and fixed it.
- Development start: **September 2026** (oldest file in the folder: 3 Sep 2026)

### Time saved (real measurements only)

Measured (the software's own speed):

- Rendering + merging a 12-language scene from scratch: **435.6 s → 156.1 s**
  (after GPU encoding and filter optimisation, 2.8×; 23 Sep 2026)
- 4 languages rendered in parallel: 0.82× real time with x264, 2.86× with NVENC
- Per-language render cache: only changed languages are re-rendered (a fully
  cached 4-language project: 10.9 s)
- Karaoke subtitle sync: "vocal present but no lyric on screen" time
  26.19 s → 0.74 s (136-second song)

**Compared with manual editing (channel owner's own estimate):** a
multilanguage video used to take about **2 hours**; with Multi Editor it can
be done in **30 minutes** — **4× faster**.

### Code history and size

- First commit: **none** — the project is not a git repository. Oldest file
  date: 3 Sep 2026.
- Size (7 Oct 2026): **55 Python files, ~39,600 lines**. Largest: `kurgu.py`
  5,242, `multi_edit.py` 4,392, `multi_studio.py` 4,094, `ranking.py` 2,009.
  Plus 115 fonts, 64 flag images, 73 transitions (57 FFmpeg + 16 custom), 37 frames.

### Who uses it

**Only the channel owner** (Scar Edits) uses it. The product is not
distributed; it runs on the owner's computer.

---

## Görseller / Assets

| dosya | içerik |
|---|---|
| `ekran-1.png` | Başlangıç ekranı — tüm çalışma kipleri ve araçlar (1500×820) / Start screen |
| `ekran-2.png` | One Line görünüm ayarları + canlı önizleme ve hızlı işlemler (1700×1000) / Look settings + live preview |
| `ekran-3.png` | Çıktı karesi: çerçeve, arka planda bayrak, dil adı (1920×1080) / Output frame |
| `ekran-4.png` | Ön kontrol kağıdı (1332×310) / Pre-flight contact sheet |
| `demo.mp4` | 25 sn, 4 dil, geçişlerle gerçek render çıktısı, sessiz, 1280×720, 2,2 MB / 25 s real render output |

Demo ve ekran görüntülerindeki klipler sentetik ("DEMO SCENE"); bayraklar ve
düzen uygulamanın gerçek çıktısıdır. Ekranlarda kişisel dosya yolu, proje
adı veya başkasına ait görüntü yoktur.
