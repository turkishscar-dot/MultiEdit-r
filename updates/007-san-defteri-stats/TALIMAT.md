# 007 — Şan Defteri: İstatistik ve Rekor Paneli

**SMU karşılığı:** Profil/istatistik ekranı — oyuncunun genel performansını (en iyi skorlar, toplamlar)
gösteren kalıcı bir panel.

**Ön koşul:** **004 (Alplik Unvanları)** paketindeki `stats` (`src/achievements.js`) nesnesini kullanır;
004'ten sonra uygulanmalı. 004 zaten `kills`, `bosses`, `dist`, `kutTotal`, `esirTotal`, `bestCombo`,
`costumes` toplamlarını tutuyor — bu paket sadece bunları **görselleştiriyor**, yeni veri toplamıyor
(ufak bir ekleme dışında, aşağıda).

**Neden eksik:** Şu an ilerlemeyi gösteren tek yer `gameOver()`'daki `$('final')` listesi — o da sadece
**o koşuya ait** rakamları gösteriyor, üstüne `oguz-best` (tek bir en iyi skor sayısı) var. Bölüm bazlı en
iyi skorlar hiç tutulmuyor (sadece yıldız sayısı — `progress[level]` — tutuluyor, skor değil).

## Tasarım

1. **Bölüm bazlı en iyi skor** — şu an eksik olan tek yeni veri noktası. `win()` fonksiyonunda
   (`progress[level] = Math.max(...)` satırının yanına) bölüm bazlı en iyi skoru da tut:
   ```js
   const bestScores = (() => { try { return JSON.parse(localStorage.getItem('oguz-bestscores')) || {}; } catch { return {}; } })();
   // win() içinde:
   bestScores[level] = Math.max(bestScores[level] || 0, Math.floor(score));
   try { localStorage.setItem('oguz-bestscores', JSON.stringify(bestScores)); } catch {}
   ```
   (Bu `main.js`'e küçük bir ekleme; ayrı bir dosyaya gerek yok, `relicSave`'in tanımlandığı yerdeki
   IIFE deseniyle birebir aynı yapıda satır ~338 civarına eklenebilir.)

2. **Yeni ekran: `#stats` (Şan Defteri)** — Destan Kitabı'nın yanına, menüde yeni bir buton
   (`#statsbtn`). İçerik:
   - Genel toplamlar (004'ün `stats` nesnesinden): toplam öldürme, toplam mesafe (km cinsinden
     `Math.round(stats.dist / 1000)`), toplam kut, toplam kurtarılan esir, en iyi kombo, toplam yenilen
     boss.
   - Bölüm bazlı liste (`PARTS`'daki tüm `levels` üzerinden `openMap()`'teki `list` oluşturma deseniyle
     birebir aynı yapıda döngü): her bölüm için `bestScores[lv.id] || 0` ve `progress[lv.id]` (yıldız).
   - Açılan unvan sayısı (004'ten `unlocked.length` / `ACHIEVEMENTS.length`), "UNVANLAR" ekranına
     kısayol butonu.
   - En iyi genel skor (`oguz-best`, zaten `gameOver()`'da tutuluyor).

3. **DOM oluşturma:** `openMap()` fonksiyonundaki desenle birebir aynı yaklaşım (satır ~543-573):
   `document.createElement` ile satır satır, `replaceChildren(...)` ile toplu ekleme. Yeni kod eklerken
   bu projedeki stile sadık kal — hiçbir yerde template literal ile innerHTML kullanılmıyor (XSS'e karşı
   değil, muhtemelen stil tercihi), `createElement`/`textContent` deseni korunmalı.

## Nereye eklenecek (main.js)

```js
function openStats() {
  state = 'stats';
  for (const id of ['menu', 'map', 'book']) $(id).hidden = true;
  const box = $('statlist');
  box.replaceChildren();
  const rows = [
    ['Toplam öldürme', stats.kills],
    ['Toplam mesafe', Math.round((stats.dist || 0) / 1000) + ' km'],
    ['Toplam kut', stats.kutTotal || 0],
    ['Kurtarılan esir', stats.esirTotal || 0],
    ['En iyi kombo', stats.bestCombo || 0],
    ['Yenilen boss', stats.bosses || 0],
    ['Açılan unvan', unlocked.length + ' / ' + ACHIEVEMENTS.length],
    ['En iyi skor', (() => { try { return +localStorage.getItem('oguz-best') || 0; } catch { return 0; } })()],
  ];
  for (const [label, val] of rows) {
    const row = document.createElement('div');
    row.className = 'statrow';
    const l = document.createElement('span'); l.textContent = label;
    const v = document.createElement('b'); v.textContent = val;
    row.append(l, v);
    box.append(row);
  }
  const lvbox = $('statlevels');
  lvbox.replaceChildren();
  for (const part of PARTS) for (const lv of part.levels) {
    if (!lv.ready) continue;
    const row = document.createElement('div');
    row.className = 'statrow';
    const l = document.createElement('span'); l.textContent = lv.name;
    const v = document.createElement('b'); v.textContent = (bestScores[lv.id] || 0).toLocaleString('tr-TR');
    row.append(l, v);
    lvbox.append(row);
  }
  $('stats').hidden = false;
}
```

Menü butonu ve kapama: `$('statsbtn').onclick = openStats;`, `$('statsback').onclick = toMenu;`,
`update(dt)`'nin state kontrol zincirine `state === 'stats'` de `hero.update(dt)` satırına eklenmeli
(diğer statik ekranlarla aynı, satır ~1922 civarı).

## index.html

`#book` ekranının hemen altına yeni bir `.screen` bloğu:

```html
<div id="stats" class="screen" hidden>
  <h1 class="ink">ŞAN DEFTERİ</h1>
  <div class="kilim"></div>
  <div id="statlist" class="statbox"></div>
  <h2 class="ink">Bölüm Rekorları</h2>
  <div id="statlevels" class="statbox"></div>
  <div class="menu-buttons">
    <button id="statsback" class="small">◂ MENÜ</button>
  </div>
</div>
```

CSS: `.statbox { width: min(420px, 90%); max-height: 40vh; overflow-y: auto; }`,
`.statrow { display: flex; justify-content: space-between; font: 15px/1.6 system-ui, sans-serif;
letter-spacing: 0; color: #fff; padding: 2px 8px; }` — mevcut `.screen p`/`.wcard` stilleriyle tutarlı,
`#wardrobe`'daki `#wlist` scroll deseninden esinlenilebilir.

## Denge notları
- Bu paket **salt okunur** — hiçbir oyun içi ekonomiyi/mekanizmayı etkilemiyor, en düşük riskli
  pakettir, 004 ile birlikte güvenle uygulanabilir.
