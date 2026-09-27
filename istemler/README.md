# İstemler — Uygulama Sırası

Bu klasördeki her dosya, PC'deki Claude Code'a verilecek tek bir istemdir. Sırayla uygula. Her dosyanın başında hangi adımların önce yapılmış olması gerektiği yazar.

**Kadir için kullanım:** Her özellik için PC'deki Claude'da **yeni bir oturum** aç ve şunu yaz:

> `istemler/03-ses-muzik.md` dosyasını oku ve uygula.

Her özellik için yeni oturum açmak krediyi korur, çünkü önceki özelliklerin uzun konuşması her mesajda yeniden okunmaz. Bir özellik bitince, bir sonrakine geçmeden oyunu kendin de bir kez oyna.

## Genel kurallar (PC'deki Claude için)

1. **Başlamadan önce** proje klasöründe `git status` bak. Commit edilmemiş değişiklik varsa önce commit et. Her özelliği **ayrı bir commit** olarak bitir.
2. İstemdeki "Test" maddelerini atlama. `tools/bot.js` ile oyna, istenen ekran görüntülerini al ve raporuna ekle. Test yapılamadıysa bunu açıkça söyle.
3. Mevcut kod stiline uy: Türkçe yorumlar ve adlar, `$()`, `pop()`, `banner()`, `has()`, `pool()` gibi yardımcılar, `createElement` + `replaceChildren` ile DOM kurma.
4. localStorage anahtarları `oguz-` ile başlar. Her `localStorage` erişimini mevcut kodun yaptığı gibi `try/catch` içine al.
5. Önceki bir adımda yapılmış bir şeyi yeniden yazma, onu kullan. Bir adım eksik ya da bozuksa önce bunu raporla.
6. Ücretli bir hizmet, hesap, kart bilgisi ya da parola gerekiyorsa **dur ve kullanıcıya danış**.
7. İş bitince kısa bir rapor ver: ne değişti, hangi dosyalar, test sonuçları, açık kalan sorular.
8. `npm run build` ile `OYNA.html` derlenebildiğini doğrula (çift tıklayınca çalışan tek dosya).

## Sıra ve bağımlılıklar

| # | Özellik | Aşama | Önce yapılmış olmalı |
|---|---|---|---|
| 00 | Hazırlık, git, koşu içi 4 bölümü doğrulama | — | — |
| 01 | Gök Demir (ikinci para) | Temel | 00 |
| 02 | Akıncı Seviyesi (XP, unvan, açılımlar) | Temel | 01 |
| 03 | Ses ve müzik (`sound.js`) | Temel | 00 |
| 04 | Dört kombo türü | Oynanış | 03 |
| 05 | Boss: Kaçış çubuğu + Geri Çalma | Oynanış | 03 |
| 06 | Altın Düşman + Kırılan Engeller | Oynanış | 01, 03, 04 |
| 07 | Sonsuz Akın (bölge döngüsü) | Oynanış | 02, 05 |
| 08 | Hayat Suyu ile devam | Oynanış | 01, 03 |
| 09 | Çarşı | Meta | 01, 02 |
| 10 | Töre Defteri (günlük, başarım, giriş) | Meta | 01, 02, 04 |
| 11 | Düğümlü Akın Haritası + bitiş ekranı | Meta | 01, 02, 04 |
| 12 | Yiğit Kartları | Koleksiyon | 01, 02, 04, 11 |
| 13 | Kağanlık Kademesi | Koleksiyon | 12 |
| 14 | Akın Seferleri | Koleksiyon | 01, 02, 12 |
| 15 | Destan Koleksiyonları | Koleksiyon | 10, 12 |
| 16 | Uluğ Türük diyalogları | Sunum | 03 |
| 17 | Eğitim ipuçları | Sunum | 04, 05, 06, 11 |
| 18 | Ayarlar | Sunum | 03, 17 |
| 19 | Çevrim içi (önce karşılaştırma, sonra kurulum) | Çevrim içi | 02, 07, 12 |

**Neden bu sıra:**
- **01–03 temel:** Gök Demir, XP ve ses; sonraki özelliklerin neredeyse hepsi bunları kullanıyor. Bunlar önce gelirse sonrakiler geçici çözümle yazılıp sonra düzeltilmek zorunda kalmaz.
- **İpuçları (17) ve Ayarlar (18) sona yakın:** İpuçları bütün mekanikleri anlatmalı. Ayarlar da ses, ipucu ve grafik ayarlarını tek yerde toplamalı.
- **Çevrim içi (19) en son:** Hesap açmanı ve belki kart bilgisi girmeni gerektiriyor. 1. aşamada sadece karşılaştırma yapılıp durulacak.

## Eski paketler

- `updates/001-alp-gucu-ultimate` (beceriyle dolan özel yetenek) ve `updates/006-kovalamaca-chase` (koşarken takip) bu listede yok. İsteğe bağlıdır. İstersen 04 ve 05'ten sonra uygulanabilir.
- `iptal/` klasöründeki 002, 003, 004, 005 ve 007 paketlerinin yerine bu istemler geçti (Hayat Suyu, Kombo türleri, Töre Defteri). **Uygulama.**
