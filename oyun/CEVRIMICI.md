# Çevrim İçi Altyapı: Firebase mi, Supabase mi?

> **Önemli:** Bu oturumun ortamından Firebase ve Supabase sitelerine erişim yoktu. Aşağıdaki fiyat ve sınırlar benim bilgimden (2025–2026). Bu şirketler sınırları sık değiştirir. Hesabı açmadan önce resmî fiyat sayfalarından doğrula: firebase.google.com/pricing ve supabase.com/pricing.

## Kısa cevap

**Supabase öneriyorum.** Asıl sebep hile koruması. Skoru sunucuda kontrol etmek için bir sunucu işlevi gerekiyor:
- **Firebase'de** bunun için Cloud Functions gerekir. Cloud Functions yalnızca **Blaze (kullandıkça öde)** planında çalışır, bu da **kart bilgisi** ister. Ücretsiz kotası geniş olsa da kart şart.
- **Supabase'de** Edge Functions **ücretsiz planda, kartsız** çalışır.

## Karşılaştırma

| | **Firebase** (Spark → Blaze) | **Supabase** (Free) |
|---|---|---|
| Aylık maliyet (başlangıç) | Spark: 0 ₺. Sunucu işlevi için Blaze gerekir; ücretsiz kota aşılmazsa fatura 0, ama **kart zorunlu** | 0 ₺, **kart gerekmez**. Pro plan: ~25 $/ay |
| Kullanıcı girişi | Firebase Auth: anonim, Google, Apple, e-posta; Play Games / Game Center sağlayıcısı var | Supabase Auth: anonim, Google, Apple, e-posta. Game Center / Play Games yok, telefonda Google/Apple ile girilir |
| Veritabanı | Firestore (NoSQL). Günde ~50 bin okuma, 20 bin yazma, 1 GiB | Postgres (SQL). 500 MB veritabanı |
| Sıralama tablosu | Firestore'da sıralı sorgu + dizin gerekir; "ilk 100" kolay, "oyuncunun sırası" zor | SQL ile doğrudan: `rank() over (order by score desc)`. Oyuncunun kendi sırası da tek sorgu |
| Sunucu işlevi (hile kontrolü) | Cloud Functions: **Blaze planı + kart** | Edge Functions: ücretsiz planda ~500 bin çağrı/ay |
| Günlük sıfırlama (gece yarısı) | Cloud Scheduler (Blaze) | `pg_cron` eklentisi (ücretsiz) |
| Güvenlik | Firestore Security Rules | Row Level Security (SQL politikaları) |
| Ücretsiz planın bir kusuru | Kotayı aşarsan servis durur (Spark) ya da faturalanır (Blaze) | 1 hafta hiç kullanılmayan proje **uykuya alınır**, panelden tek tıkla uyanır. Oyun yayına girince bu sorun olmaz |
| Kullanıcı sınırı | Auth: ~50 bin aylık aktif (sosyal/e-posta) | Auth: ~50 bin aylık aktif |

**Tahmini maliyet (Supabase Free):** Oyunda günde birkaç bin oyuncu olsa bile koşu başına bir skor gönderimi ve sıralama okuması ücretsiz sınırların içinde kalır. Oyuncu sayısı on binleri geçerse Pro plan (~25 $/ay) gerekir.

## Hesap açma adımları (Supabase)

1. **supabase.com** → "Start your project" → GitHub ya da e-postayla kayıt. Parolanı sen gir; bana verme.
2. "New project": ad `oguz-kagan`, bölge **Central EU (Frankfurt)** (Türkiye'ye en yakın), veritabanı parolasını güçlü seç ve bir yere kaydet.
3. Proje açılınca **Project Settings → API** sayfasından iki değeri al:
   - `Project URL`
   - `anon public` anahtar. Bu anahtar istemcide durabilir, güvenliği satır politikaları (RLS) sağlar.
   - `service_role` anahtarını **kimseyle paylaşma** ve oyunun koduna koyma. Sadece sunucu işlevinde kullanılır.
4. **Authentication → Providers**: "Anonymous sign-ins"i aç. Oyuncu hesap açmadan oynar; istersen sonradan Google/Apple bağlar.
5. Bana yalnızca `Project URL` ve `anon public` anahtarını ver. Gerisini ben kurarım.

(Firebase'i seçersen adımlar: console.firebase.google.com → proje → Blaze planına geç (kart) → Firestore + Authentication + Functions. Kart bilgisini sen girersin.)

## Hesap açıldıktan sonra kuracaklarım

- **KURULTAY SIRALAMASI:** `runs` tablosu. Sonsuz Akın bitince koşu özeti (`src/online.js` → `runSummary`) Edge Function'a gider, orada `plausible()` kontrolünden geçer, sonra kaydedilir. Günlük ve tüm zamanlar görünümleri. Gece yarısı (`pg_cron`) günlük derece ödülleri dağıtılır: 1–10 etkinlik yiğidi, 11–100 Tunç Davul, 101–1000 Gök Demir, diğerleri kut. Oyun zaten günlük en iyi koşuyu bu biçimde saklıyor (`oguz-sonsuz` → `daily`).
- **BOY İTTİFAKI:** Oyuncu 24 boydan birine katılır. Haftalık boy puanı, koşu skorlarının toplamından hesaplanır. Boylar arası sıralama ve haftalık ödül.
- **BAYRAM ETKİNLİKLERİ:** `events` tablosu (Nevruz 21 Mart, Tepreş, Sığın Avı). Süreli görevler Töre Defteri'nin görev yapısını kullanır. Etkinlik yiğidi ve etkinlik sıralaması; ilk 100'e özel kostüm. Etkinlikler Akıncı Seviyesi 15'te açılır.
- **BULUT KAYIT:** Oyunun bütün ilerlemesi zaten düz nesnelerde duruyor (Töre `snapshot()`, harita, kartlar, kasa). Bunlar tek bir `saves` satırına yazılır. Google Play Games / Game Center bağlantısı ancak oyun telefona paketlenince (Capacitor vb.) mümkün. Web sürümünde şimdilik Google/Apple girişiyle bulut kayıt yapılır.
- **Hile koruması:** `src/online.js` → `plausible()` mesafe/süre, düşman/süre, boss/mesafe ve skor üst sınırını kontrol eder. Bot koşularıyla denendi: gerçek koşular geçiyor, uydurma skorlar ("1 sn'de 5000 m", "99 milyon skor") reddediliyor. Sunucu aynı işlevi çalıştırır; istemciye güvenilmez.
- **Sohbet yok.** İstendiği gibi; moderasyon yükü ve çocuk güvenliği riski.

## Gizlilik (KVKK)

- Sıralamada **yalnızca oyuncunun seçtiği takma ad** görünür. Adlar kötü söz süzgecinden geçer ve değiştirilebilir.
- E-posta ya da gerçek ad sıralamada gösterilmez. Anonim girişte kişisel veri toplanmaz.
- Oyun çocuklara da hitap ettiği için 13 yaş altı için ayrı bir onay metni ve "verilerimi sil" düğmesi gerekir. Bunları kurulumla birlikte eklerim.
