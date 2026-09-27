# Oğuz Kağan × Spiderman Unlimited — Uyarlama Raporu

**Tarih:** 2026-09-27
**Kaynak:** `oguzkhan/` proje kodu (Three.js + Vite), analiz edilen dosyalar: `main.js` (2299 satır), `world.js`, `bosses.js`, `story.js`, `comic.js`, `costumes.js`, `boylar.js`, `book.js`, `cine.js`, `assets.js`, `index.html`.

---

## 1. Genel Değerlendirme

Beklenenin çok üstünde bir noktadasın. Oğuz Kağan zaten Spiderman Unlimited'ın (SMU) iskeletinin büyük kısmını taşıyor:

| SMU mekaniği | Oğuz Kağan'daki karşılığı | Durum |
|---|---|---|
| 3 şeritli sonsuz koşu, zıplama, kayma | `LANES`, `act()`, `P.slide`/`P.y` | ✅ Var |
| Web-swing ile süzülme | — | ❌ Kasıtlı yok (temaya aykırı, doğru karar) |
| Kombo / skor çarpanı | `combo`, `mult()` | ✅ Var |
| Yakın dövüş + uzak menzil silahı | Kılıç (`slash`) + Yay (`throwArrow`) | ✅ Var, SMU'dan bile zengin (silah değişimi) |
| Boss dövüşleri + bitiriş sahnesi | `bosses.js`, `startFinisher()` | ✅ Var, çok detaylı (QTE'ler: `B.tap`, `B.mash`, `B.warn`, `swipe`) |
| Suit/kostüm koleksiyonu | `costumes.js` (14 kostüm) | ✅ Var (ama tamamen kozmetik) |
| Suit power / takım gücü | `boylar.js` (24 boy, perk sistemi) | ✅ Var, hatta SMU'dan daha zengin bir tasarım |
| Gizli koleksiyon eşyaları (chest/stash) | Gümüş ok + altın yay rölikleri (`relicPlan`) | ✅ Var |
| Bölüm haritası / dünya haritası | `openMap()`, `PARTS` | ✅ Var |
| Ara sahneler / çizgi roman anlatımı | `cine.js`, `comic.js`, `story.js` | ✅ Var, SMU'dan bile iddialı (motion-comic) |
| At/taşıyıcı bineği | At (`mount`), Kartal, Sal, Kızak | ✅ Var, çeşitliliği SMU'nun tek web-swing'inden fazla |
| Uçuş bölümü (3x3 grid) | `flying`, Gök Yolu bölümü | ✅ Var |
| Günlük/haftalık görevler | — | ❌ Yok |
| Ölünce devam etme (kut ile) | Sadece Çepni boyu perk'i (1 kez ücretsiz) | ⚠️ Kısmi |
| Kombo/skill ile doldurulan özel yetenek (meter) | — | ❌ Yok (güçler hep şans/toplama bazlı) |
| Başarımlar / unvanlar | — | ❌ Yok |
| Kaçış/takip sahnesi (scripted chase) | Boss dövüşleri var ama "koşarken kovalanma" yok | ⚠️ Kısmi |
| Skor/istatistik paneli | Sadece `oguz-best` localStorage | ⚠️ Kısmi |
| Kıl payı / near-miss bonus | — | ❌ Yok |

**Sonuç:** Eksik olan şeyler SMU'nun *temel iskeleti* değil, SMU'nun *bağımlılık yaratan ince katmanları* — meta-ilerleme, günlük dönüş sebepleri, ödül geri bildirimi. Aşağıdaki 7 öneri tam bunları hedefliyor, hepsi Oğuz Kağan'ın Türk mitolojisi temasına organik olarak oturacak şekilde yeniden yorumlandı.

---

## 2. Kasıtlı Olarak ÖNERİLMEYEN SMU Özellikleri

Kullanıcının kendi örneğine (ağ atıp süzülme) sadık kalarak şunları da elemeye özen gösterdim:

- **Web-swing / şerit dışı süzülme** — zaten yok, doğru.
- **Çoklu oynanabilir "Spider-kimlik" seçimi (multiverse karakterleri)** — Oğuz Kağan tek bir ölümsüz destan kahramanı; onun yerine zaten kostüm + boylar sistemi var. Farklı "karakterler" eklemek mitolojiyi zedeler.
- **Gerçek para ile IAP / reklam izleyerek ödül** — proje şu an ticari değil, bunu eklemek erken ve gereksiz karmaşıklık.
- **Global online liderlik tablosu / sosyal özellikler (arkadaş, hediye)** — sunucu altyapısı gerektirir, kapsam dışı bıraktım. Yerel bir istatistik paneli öneriyorum (§2.7), bu yeterli.
- **Enerji/stamina sistemi (oyunu sınırlayan bekleme süresi)** — F2P retention hilesi, bu oyunun ruhuna aykırı; önerilmedi.

---

## 3. Önerilen 7 Güncelleme

Her biri `updates/00X-.../TALIMAT.md` içinde ayrıntılı geliştirme talimatı olarak hazır. Özet:

### 3.1 — Alp Gücü: Beceriyle Dolan Özel Yetenek Ölçeği
SMU'nun "team-up meter"ının karşılığı. Şu anki güçler (Tanrı Kılıcı, Islıklı Ok, Kurt) hep **şans bazlı pickup**. SMU'da oyuncu **kendi performansıyla** (hasarsız kombo) bir ölçeği doldurup özel saldırıyı **kendi seçtiği anda** patlatır — bu beceri-ödül döngüsü eksik. Yeni "Alp Gücü" barı: hasarsız/kesintisiz kombo ile dolar, dolunca oyuncu dokunarak "Bozkurt Saldırısı" (ekrandaki tüm düşmanları temizleyen kurt sürüsü) tetikler.

### 3.2 — Umay Ana'nın Bağışı: Kut ile Canlanma
SMU'nun "continue" mekaniği. Türk mitolojisinde Umay Ana, savaşçıları ve çocukları koruyan ana tanrıçadır — tam oturan bir isim. Ölüm anında ekranda "Umay Ana seni bağışlasın mı? (X kut)" seçeneği çıkar, kut yeterliyse bir kez daha canlanılır (Çepni boyu perk'inden bağımsız, herkes kullanabilir ama pahalı).

### 3.3 — Kıl Payı: Ucundan Kaçış Bonusu
SMU'nun near-miss ödül geri bildirimi. Bir engelin/düşman saldırısının milim farkla altından geçilince/üstünden atlanınca bonus skor + "KIL PAYI!" yazısı. Küçük ama akışı çok zenginleştiren bir katman.

### 3.4 — Alplik Unvanları: Başarım Sistemi
SMU'nun trophy/achievement sistemi. Kalıcı, tüm koşulardan biriken görevler ("1000 düşman öldür → Alp Eren", "10 boss yen → Bozkurt Soyu"), her biri kut ödülü verir. Menüde yeni bir "UNVANLAR" ekranı.

### 3.5 — Yörük Görevleri: Günlük Görevler
SMU'nun daily missions'ı. Her gün 3 rastgele görev ("Bu akın: 5 düşman öldür", "300 kut topla"), tamamlanınca ödül. Oyuncuyu her gün geri getiren katman.

### 3.6 — Kovalamaca: Senaryolu Takip Sahnesi
SMU'nun kaçış/takip set-piece'leri (örn. Green Goblin chase). Şu an boss'lar hep *durağan bir meydanda* karşılaşılıyor; SMU'da bazı boss'lar koşuyu kesmeden **arkadan kovalar**. `bosses.js`'teki mevcut `swipe`/`tap`/`warn` QTE altyapısını kullanarak, koşuyu durdurmadan arkadan gelen bir düşmanın saldırılarını kaçma/eğilme ile savuşturduğun yeni bir "sect" türü.

### 3.7 — Şan Defteri: İstatistik ve Rekor Paneli
SMU'nun profil/istatistik ekranı. Şu an sadece tek bir `oguz-best` sayısı tutuluyor. Bölüm bazlı en iyi skorlar, toplam öldürülen düşman, en uzun kombo, toplam koşulan mesafe gibi kalıcı istatistikleri gösteren yeni bir ekran (Destan Kitabı'nın yanına eklenebilir).

---

## 4. Uygulama Sırası Önerisi

1. **Kıl Payı** (3.3) — en küçük, en düşük riskli, hemen "hissedilir" bir iyileştirme.
2. **Umay Ana'nın Bağışı** (3.2) — retention'a en büyük etkiyi tek başına yapar.
3. **Alp Gücü** (3.1) — savaş hissini derinleştirir, ama `main.js`'in savaş döngüsüne dokunduğu için dikkatli test ister.
4. **Alplik Unvanları** (3.4) ve **Şan Defteri** (3.7) — birlikte yapılabilir, ikisi de salt-okunur meta katman, oyun döngüsüne dokunmaz, düşük risk.
5. **Yörük Görevleri** (3.5) — 4 tamamlandıktan sonra, ödül ekonomisini (kut akışını) yeniden dengelemek gerekebilir.
6. **Kovalamaca** (3.6) — en büyük efor; yeni bir boss/sect türü, `bosses.js` + `main.js` her ikisine dokunur, en sona bırakılmalı.

---

## 5. Nasıl Uygulanır

Her `updates/00X-.../TALIMAT.md`, gerçek proje dosyalarına erişimi olan bir Claude oturumu (PC'deki Claude Code) için yazıldı: hangi dosyaya, hangi fonksiyonun yanına, ne ekleneceği; mevcut kod stiline (Türkçe değişken/yorum, `has()`, `pool()`, `pop()`, `banner()` gibi yardımcılar) sadık kalınarak anlatıldı. Uygulayan Claude'a şu şekilde verebilirsin:

> "`updates/001-alp-gucu-ultimate/TALIMAT.md` dosyasını oku ve anlattığı özelliği oyuna ekle."

Bitince o klasörü `applied/` altına taşı (bkz. repo `README.md`).
