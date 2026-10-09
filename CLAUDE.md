# Ortak hafıza (bütün Claude oturumları için)

Claude oturumları birbirinin sohbetini görmez; bu repo tek ortak nokta. Önemli bir karar, yeni proje ya da kural çıkınca bu dosyayı güncelle.

## Kullanıcı
- **Hacı Kadir Özmen**, İzmir. Türkçe konuşur; kısa, sade Türkçe cevap ister. Küçük adımlarla ("Adım N") istek verir.
- E-posta: `kadir@oguzkagangame.com` (Cloudflare Email Routing → kişisel Gmail).
- LinkedIn: https://www.linkedin.com/in/hac%C4%B1-kadir-%C3%B6zmen-5285ba311/
- YouTube: **Scar Edits** (https://www.youtube.com/@scarfan35), çok dilli (multilanguage) dublaj videoları.

## Projeler
| Proje | Nerede | Not |
|---|---|---|
| **Oğuz Kağan** (3B koşu oyunu, Three.js + Vite) | bu repo, `oyun/` | Ayrıntı: `oyun/DEVIR.md`, `oyun/UYGULAMA.md`, son PC aktarımı `oyun/PC-RAPOR.md` |
| **Tanıtım sitesi** oguzkagangame.com | bu repo, `site/` (statik) | Cloudflare Workers, `wrangler.jsonc`; ana dala her push'ta kendiliğinden yayınlanır. `site/oyna/` = oyunun web derlemesi |
| **Multi Editor** (Python + FFmpeg masaüstü video aracı) | kullanıcının PC'si, ayrı (özel) repo | Tanıtım bilgisi: `multi-editor-tanitim` dalı, `tanitim/multi-editor/BILGI.md`. **Kaynak kodu bu repoya konmaz.** |

## Dallar
- `claude/serene-wright-uo3dxg`: ana çalışma dalı; site buradan yayınlanır.
- PC'den gelen güncellemeler önce ayrı bir dala gönderilir (`pc-guncelleme` gibi), bulut tarafı birleştirir. Başkasının dalına force-push yok.

## Kurallar (bozma)
- Ücretli bir şey gerekirse **önce sor**. Hesap açma, parola, kart bilgisi kullanıcıda.
- API anahtarları yalnız ortam değişkeninde; dosyaya, commit'e, günlüğe yazılmaz. **Repo herkese açık.**
- Oyuna oyuncular arası sohbet eklenmez (moderasyon, çocuk güvenliği).
- Commit, PR ve kodda model adı ya da sürümü yazılmaz.
- PR yalnız istenirse açılır.
- Telifli içerik (ör. dublajlı film sahneleri, Gameloft dosyaları) repoya ve siteye konmaz.

## Durum (Ekim 2026)
- Claude Startups: iki kez reddedildi (7 ve 9 Ekim 2026; ikincisi LinkedIn, kurucu bilgisi, Multi Editor ve kanalla). Neden büyük ihtimalle resmi şirket kaydı olmaması. Şirket kurulana ya da oyundan gelir/kullanıcı kanıtı birikene kadar yeniden başvurulmayacak.
- Şahıs şirketi şimdilik açılmadı (2026'da genç girişimci Bağ-Kur desteği kalktı; yıllık maliyet yüksek).
