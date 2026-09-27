# Bilgisayardaki Oyuna Aktarma

Bu klasördeki kod, 27 Eylül 2026'da Drive'dan alınan `oguzkhan` zip'inin üstüne yazıldı. `istemler/` klasöründeki 16 istemin hepsi burada kodlandı ve test edildi (19. adımda yalnızca karşılaştırma yapıldı; kurulum hesap açılınca).

## PC'deki Claude'a ne diyeceksin

> `MultiEdit-r` reposunun `claude/serene-wright-uo3dxg` dalındaki `oyun/UYGULAMA.md` dosyasını oku ve uygula.

## Aktarma adımları (PC'deki Claude için)

1. Oyun klasöründe `git status`. Git yoksa önce `git init` ve mevcut hâli commit et.
2. **Çakışma kontrolü:** Bu repodaki ilk "baseline" commit'i (`Add working copy of the game source`), zip'teki hâldir. PC'deki `src/main.js`, `index.html`, `src/bosses.js`, `src/world.js`, `src/costumes.js`, `src/boylar.js`, `src/cine.js` o tarihten sonra değiştiyse, dosyaları üstüne yazma. Önce farkı çıkar (`git diff <baseline> -- oyun/src/main.js`) ve değişiklikleri birleştir.
3. Değişmediyse şunları olduğu gibi kopyala:
   - **Değişen:** `index.html`, `src/main.js`, `src/bosses.js`, `src/world.js`, `src/costumes.js`, `src/boylar.js`, `src/cine.js`, `SESLENDIRME.md`
   - **Yeni kaynak:** `src/akinci.js`, `ui.js`, `sound.js`, `bonus.js`, `tips.js`, `carsi.js`, `tore.js`, `harita.js`, `yigit.js`, `seferler.js`, `koleksiyon.js`, `ekranlar.js`, `diyalog.js`, `diyalog-metin.js`, `ayarlar.js`, `online.js`
   - **Belgeler:** `SES-KAYNAKLARI.md`, `CEVRIMICI.md`, `UYGULAMA.md`
   - **Test araçları** (`tools/` içine; mevcut `bot.js`, `build_chars.py`, `vo_list.mjs` dosyalarının üstüne yazılmaz, adları farklı): `test-bot.mjs`, `bot-brain.js`, `regresyon.sh`, `flow-test.mjs`, `tore-test.mjs`, `cards-test.mjs`, `dialog-test.mjs`, `tips-test.mjs`, `sound-test.mjs`, `events-test.mjs`, `scenes.mjs`, `shot-menu.mjs`, `ui-test.mjs`, `fps-test.mjs`, `vo_dialog.mjs`
4. `npm run dev`, sonra `tools/regresyon.sh` (Playwright gerekir: `npm i -D playwright`). Hepsi "tamam" çıkmalı.
5. `npm run build` ile `OYNA.html`'i yeniden üret.
6. `node tools/vo_list.mjs` çalıştırılırsa SESLENDIRME.md'nin eski bölümü yeniden yazılır. Diyalog bölümü `<!-- diyaloglar -->` işaretleri arasında durur. Silinirse `node tools/vo_dialog.mjs` ile geri gelir.

## Burada yapılamayanlar (PC tarafında yapılmalı)

| Konu | Neden | Ne yapılmalı |
|---|---|---|
| Uluğ Türük ve yeni kartların kendi modelleri | Bu ortamda Blender yok | `build_chars.py` ile Uluğ Türük (ak sakal, sarık/börk, uzun kaftan, asa) ve yeni kartlara özel başlıklar. Şimdilik Oğuz modelinden kuruluyor: ak saç-sakal, sarık, açık kaftan, kodla eklenen asa. Kadın yiğitler (Tomris, Banu Çiçek) için de ayrı model iyi olur, şu an sakalsız Oğuz modeli kullanılıyor |
| Gerçek ses dosyaları | Ses sitelerine erişim kapalıydı | Sesler kodla üretiliyor (lisans sorunu yok, 0 MB). İstersen `public/ses/manifest.json` ile gerçek CC0 dosyaları eklenir, bkz. SES-KAYNAKLARI.md |
| `tools/bot.js`'e geri çalmayı öğretmek | `tools/` zip'te yoktu | Burada ayrı bir bot yazıldı (`test-bot.mjs` + `bot-brain.js`) ve geri çalmayı biliyor. Mevcut `bot.js`'e aynı mantık (`parryThink`) aktarılabilir |
| Gerçek telefonda FPS ölçümü | Bu ortamda GPU yok (yazılımla çizim, 5–8 FPS) | Oyun açılışta FPS ölçüp grafik düzeyini kendisi seçiyor. Ayarlar > Oyun sayfasında ölçülen FPS görünüyor. Telefonda bir kez aç ve oradaki değere bak |
| Çevrim içi kurulum | Hesap senin açman gereken bir şey | CEVRIMICI.md'deki adımlar. Supabase önerildi (kartsız) |

## Neler eklendi (kısa)

- **Gök Demir** (ikinci para, mor-mavi taş), **Tunç Davul** (yiğit çağırma), sayaçlar menüde, bitişte ve Çarşı'da; kazanınca zıplar.
- **Akıncı Seviyesi:** Er → Alp → Tarkan → Tudun → Şad → Yabgu → Kağan. Açılımlar: Boy seçimi 3, Çarşı 5, Seferler 8, Sonsuz Akın 10, Ordu 12, Etkinlikler 15. Kilitli düğmeler kaçıncı seviyede açılacağını söyler. "ALP OLDUN!" ekranı, alttan kayan bildirim kartları.
- **Ses ve müzik:** 9 bölge/boss müziği, zafer ve yenilgi parçası, 29 efekt. Ayrı düzeyler; sekme gizlenince susar; ilk dokunuşta açılır; seslendirme çalarken müzik kısılır.
- **Dört kombo:** VURUŞ / KIL PAYI / İSABET (altın tamga halkası) / KALKAN. Süre halkası, 5 sn'de söner, çarpan 40 komboya kadar.
- **Boss:** mavi KAÇIŞ çubuğu (60–90 sn; bitince boss kaçar); altın parlayan mermiler kılıçla **geri çalınır**.
- **Altın düşman** (Gök Demir düşürür, önden kaçar), **kırılan ahşap engeller** (çatlak doku, 3–5 kut).
- **Sonsuz Akın:** 7 bölge × ~1500 m, her bölge sonunda boss, turlar hızlanır; günün ve tüm zamanların rekoru.
- **Hayat Suyu ile devam:** 1 → 2 → 4 Gök Demir, en çok 3; altın kase, 5 sn halka, yeşil ışık.
- **Çarşı:** 6 takviye, 6 kalıcı yükseltme (5 kademe), Gök Demir paketleri "YAKINDA"; Boy Seçimi'nde takviye rafı.
- **Töre Defteri:** günlük 3 görev, 42 başarım × 3 kademe, 7 günlük giriş armağanı.
- **Akın Haritası:** parşömen üstünde düğümler, ek görevler (bazıları boy ya da yiğit ister), madalyalar, "GÖREV TAMAM" ekranı.
- **Yiğit Kartları:** 30 yiğit, Er 3★'dan Destan 8★'a, ordu (lider + 3), ordu gücü çarpanı (sağ üst), Tunç Davul.
- **Kağanlık Kademesi**, **Akın Seferleri** (gerçek saatle), **Destan Koleksiyonları** (6 set).
- **Uluğ Türük diyalogları:** 20 kısmın başında ve 7 bölüm sonunda, portreli konuşma balonları; 68 cümle SESLENDIRME.md'de.
- **Eğitim ipuçları:** ilk kısımda sırayla, sonra her yeni şeyde bir kez; telefonda el hareketi, masaüstünde tuş.
- **Ayarlar:** ses düzeyleri, grafik (otomatik), titreşim, eğerek yönlendirme, ipuçlarını sıfırla, ara sahne galerisi, emeği geçenler, dil.

## Bilinçli kararlar

- **Harita düğümleri ayrı görev:** Her kısım ayrı oynanır (SMU'daki gibi). Sonraki kısımlar kendi girişiyle başlar; Yeraltı'nda dalışla. Eski yıldızlar madalyaya çevrildi.
- **Kostümler yiğit kartı oldu:** Satın alınmış kostüm kaybolmaz, kart olur; giyilen lider olur.
- **Seferden gelen destan eşyası:** Uzun seferler bazen eksik bir **gümüş ok** getirir, **altın yay hiçbir zaman** gelmez; altın yay bölümde bulunmalı.
- **Nazar Boncuğu + Kara-evli:** İkisi toplanır (2 kalkan).
- **Kaçış süreleri:** Bot, 15 boss'un hepsini sürenin yarısından azında yendi (en uzun: Yelbegen 35 sn / 70 sn). Oyuncu için bol pay var.
