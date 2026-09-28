// Oyunun kendi simgeleri (emoji yerine): 64×64 çizgi roman üslubu, kalın mürekkep çizgisi.
// svg(ad, boy) bir <svg> öğesi döndürür. Renkler sabit; kilitli durum CSS filtresiyle soluklaştırılır.
const INK = '#1a1020';
const S = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const ICONS = {
  // ---- bölgeler ----
  // Ötüken: Göktürk kurt başı (sağa bakan, ağzı açık)
  otuken: `<circle cx="32" cy="32" r="29" fill="#b3202a" ${S}/>
    <path d="M14 44 L20 22 L26 30 L30 14 L36 26 Q46 26 52 34 L50 38 L42 38 L46 42 L36 42 Q30 50 18 48 Z" fill="#e8e0d0" ${S}/>
    <circle cx="38" cy="31" r="2" fill="${INK}"/><path d="M42 38 L45 40" ${S} fill="none"/>`,
  // Kara Bataklık: sazlar, sis ve kurumuş ağaç
  bataklik: `<circle cx="32" cy="32" r="29" fill="#2e4a3a" ${S}/>
    <path d="M12 42 Q32 36 52 42" fill="none" stroke="#9ab8a8" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 50 Q32 45 48 50" fill="none" stroke="#9ab8a8" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 40 L40 18 M40 26 L48 18 M40 30 L33 22" fill="none" ${S}/>
    <path d="M20 42 L20 24 M24 42 L25 20 M20 24 q-3 -6 0 -10 q3 4 0 10 M25 20 q-3 -6 0 -10 q3 4 0 10" fill="#c9a86a" ${S}/>`,
  // Altay: karlı iki doruk
  altay: `<circle cx="32" cy="32" r="29" fill="#4a6a9a" ${S}/>
    <path d="M6 48 L24 18 L32 30 L40 20 L58 48 Z" fill="#e8eef8" ${S}/>
    <path d="M18 28 L24 18 L30 28 L26 26 L22 30 Z M36 26 L40 20 L45 28 L41 27 Z" fill="#ffffff" stroke="none"/>
    <path d="M6 48 L58 48" ${S}/>`,
  // Gök Yolu: Tulpar kanadı ve bulut
  gok: `<circle cx="32" cy="32" r="29" fill="#3a8ad8" ${S}/>
    <path d="M14 44 Q10 34 20 32 Q22 24 30 26 Q36 20 44 26 Q54 26 52 36 Q56 44 46 44 Z" fill="#ffffff" ${S}/>
    <path d="M24 30 Q28 12 46 10 Q40 16 42 20 Q36 20 34 26" fill="#ffd23f" ${S}/>`,
  // Yeraltı: Erlik'in alevi, basamaklar
  yeralti: `<circle cx="32" cy="32" r="29" fill="#2a1216" ${S}/>
    <path d="M32 10 Q44 24 40 36 Q46 32 44 26 Q52 38 42 48 L22 48 Q12 38 20 26 Q20 34 26 36 Q20 22 32 10 Z" fill="#ff6a1a" ${S}/>
    <path d="M32 26 Q38 34 34 42 L28 42 Q26 36 32 26 Z" fill="#ffd23f" stroke="none"/>
    <path d="M14 52 L50 52" ${S}/>`,
  // Çin: sur burcu, kıvrık dam
  cin: `<circle cx="32" cy="32" r="29" fill="#8a1a1a" ${S}/>
    <path d="M12 26 Q32 16 52 26 L46 26 L46 30 L18 30 L18 26 Z" fill="#2a2a2a" ${S}/>
    <path d="M20 30 L20 48 L44 48 L44 30" fill="#d8b070" ${S}/>
    <path d="M28 48 L28 38 Q32 34 36 38 L36 48" fill="${INK}" stroke="none"/>
    <path d="M14 48 L50 48" ${S}/>`,
  // Karanlık Ülke: hilal, kuzey ışıkları
  karanlik: `<circle cx="32" cy="32" r="29" fill="#141a3a" ${S}/>
    <path d="M10 34 Q22 22 32 30 Q42 38 54 26" fill="none" stroke="#5affb0" stroke-width="4" stroke-linecap="round"/>
    <path d="M12 42 Q24 32 34 38 Q44 44 52 34" fill="none" stroke="#3ac0ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 10 A9 9 0 1 0 46 24 A7 7 0 1 1 40 10 Z" fill="#fff6c0" ${S}/>`,

  // ---- düğümler ----
  // kısım: çapraz iki kılıç
  kisim: `<path d="M14 50 L44 16 L48 14 L46 18 L16 52 Z" fill="#dfe6ee" ${S}/>
    <path d="M50 50 L20 16 L16 14 L18 18 L48 52 Z" fill="#dfe6ee" ${S}/>
    <path d="M14 44 L22 52 M50 44 L42 52" ${S} fill="none"/>`,
  // boss: boynuzlu dev yüzü
  boss: `<path d="M16 22 Q10 10 18 6 Q18 16 24 20 Z M48 22 Q54 10 46 6 Q46 16 40 20 Z" fill="#e8dcc0" ${S}/>
    <path d="M14 26 Q14 16 32 16 Q50 16 50 26 L50 38 Q50 52 32 56 Q14 52 14 38 Z" fill="#b3202a" ${S}/>
    <path d="M20 30 L28 34 L20 36 Z M44 30 L36 34 L44 36 Z" fill="#ffd23f" ${S}/>
    <path d="M22 44 L26 48 L30 44 L34 48 L38 44 L42 48" fill="none" ${S}/>`,
  // kıl payı: rüzgâr çizgileri ve engelin kenarı
  kilpayi: `<rect x="36" y="14" width="12" height="36" rx="2" fill="#8a5a2a" ${S}/>
    <path d="M8 22 L30 22 M12 32 L32 32 M8 42 L30 42" fill="none" stroke="#3a8ad8" stroke-width="4" stroke-linecap="round"/>`,
  kill: `<path d="M18 50 L42 14" ${S} fill="none"/><path d="M34 12 Q52 12 50 30 Q42 22 34 24 Z" fill="#dfe6ee" ${S}/>`,
  ride_dist: `<path d="M16 50 Q14 34 24 26 L22 14 L30 22 Q44 18 50 30 L46 36 L38 32 Q36 44 40 50 Z" fill="#8a5a3a" ${S}/><circle cx="36" cy="26" r="2" fill="${INK}"/>
    <path d="M24 26 Q20 20 22 14" fill="none" stroke="${INK}" stroke-width="4"/>`,
  nohit: `<path d="M32 8 L52 16 Q52 42 32 56 Q12 42 12 16 Z" fill="#3a8ad8" ${S}/><path d="M32 16 L44 20 Q44 38 32 48 Z" fill="#8ac0f0" stroke="none"/>`,
  hoop: `<circle cx="32" cy="32" r="18" fill="none" stroke="${INK}" stroke-width="9"/><circle cx="32" cy="32" r="18" fill="none" stroke="#ffd23f" stroke-width="5"/>`,
  isabet: `<circle cx="32" cy="32" r="20" fill="#ffd23f" ${S}/><path d="M32 18 L32 46 M22 26 L32 34 L42 26" fill="none" ${S}/>`,
  kill_arrow: `<path d="M18 10 Q46 32 18 54" fill="none" ${S}/><path d="M18 10 L18 54" fill="none" stroke="${INK}" stroke-width="2"/>
    <path d="M12 32 L54 32 M48 26 L56 32 L48 38" fill="none" ${S}/>`,
  // ---- menü ----
  // Töre: mühürlü tomar
  tore: `<rect x="14" y="12" width="36" height="40" rx="4" fill="#f3e6c4" ${S}/><path d="M20 22 L44 22 M20 30 L44 30 M20 38 L34 38" ${S} fill="none"/>
    <circle cx="42" cy="46" r="8" fill="#b3202a" ${S}/><path d="M38 52 L36 60 L42 56 L48 60 L46 52" fill="#b3202a" ${S}/>`,
  // Yiğit: sivri miğfer ve yanaklık
  yigit: `<path d="M32 6 L36 16 Q52 20 52 38 L52 44 L44 44 L44 36 L20 36 L20 44 L12 44 L12 38 Q12 20 28 16 Z" fill="#c8ccd4" ${S}/>
    <path d="M20 36 L20 50 Q32 58 44 50 L44 36" fill="#d8a06a" ${S}/><path d="M24 42 L30 42 M34 42 L40 42" ${S}/><path d="M12 40 L52 40" stroke="#ffd23f" stroke-width="3"/>`,
  // Çarşı: çadır tezgâh
  carsi: `<path d="M8 26 L32 8 L56 26 Z" fill="#b3202a" ${S}/><path d="M8 26 Q14 32 20 26 Q26 32 32 26 Q38 32 44 26 Q50 32 56 26" fill="#f3e6c4" ${S}/>
    <path d="M14 30 L14 54 L50 54 L50 30" fill="none" ${S}/><rect x="22" y="40" width="20" height="14" fill="#8a5a2a" ${S}/>`,
  // Sefer: at başı ve sancak
  sefer: `<path d="M44 8 L44 56" ${S}/><path d="M44 10 L58 16 L44 22 Z" fill="#b3202a" ${S}/>
    <path d="M10 54 Q8 38 18 30 L16 18 L24 26 Q34 22 38 32 L34 38 L28 34 Q26 46 30 54 Z" fill="#8a5a3a" ${S}/>`,
  // Destan: açık kitap
  destan: `<path d="M8 16 Q20 12 32 18 Q44 12 56 16 L56 50 Q44 46 32 52 Q20 46 8 50 Z" fill="#f3e6c4" ${S}/><path d="M32 18 L32 52" ${S}/>
    <path d="M14 24 Q20 22 26 25 M14 32 Q20 30 26 33 M38 25 Q44 22 50 24 M38 33 Q44 30 50 32" ${S} fill="none"/>`,
  // Hikâye: çizgi roman kareleri
  hikaye: `<rect x="8" y="12" width="22" height="18" fill="#8ac0f0" ${S}/><rect x="34" y="12" width="22" height="18" fill="#ffd23f" ${S}/><rect x="8" y="34" width="48" height="18" fill="#f3e6c4" ${S}/>
    <path d="M14 46 L24 40 L30 46 L40 38 L50 46" ${S} fill="none"/>`,
  // Ayarlar: dişli
  ayar: `<path d="M28 6 L36 6 L37 13 L43 16 L49 12 L54 18 L50 24 L52 30 L58 32 L58 40 L51 41 L48 47 L52 53 L46 58 L40 54 L34 56 L32 62 L26 60 L25 54 L19 51 L13 55 L8 49 L12 43 L10 37 L4 35 L4 28 L11 26 L14 20 L10 14 L16 9 L22 13 L27 11 Z" fill="#c8ccd4" ${S}/><circle cx="31" cy="34" r="9" fill="#2e2238" ${S}/>`,
  // Oba: keçe çadır (yurt)
  oba: `<path d="M10 34 Q12 16 32 12 Q52 16 54 34 Z" fill="#f3e6c4" ${S}/><path d="M10 34 L10 52 L54 52 L54 34" fill="#e8dcc0" ${S}/><path d="M26 52 L26 40 L38 40 L38 52" fill="#b3202a" ${S}/><path d="M10 38 L54 38" stroke="#b3202a" stroke-width="3"/>`,
  kostum: `<path d="M20 10 L32 16 L44 10 L56 20 L50 30 L44 26 L44 54 L20 54 L20 26 L14 30 L8 20 Z" fill="#3a6ab0" ${S}/><path d="M32 16 L32 54" stroke="#ffd23f" stroke-width="3"/>`,
  kilit: `<rect x="16" y="28" width="32" height="24" rx="3" fill="#8a7a68" ${S}/><path d="M22 28 L22 20 Q22 10 32 10 Q42 10 42 20 L42 28" fill="none" ${S}/><circle cx="32" cy="40" r="3" fill="${INK}"/>`,
  yakinda: `<circle cx="32" cy="32" r="20" fill="#d8c8a4" ${S}/><path d="M32 20 L32 33 L40 38" fill="none" ${S}/>`,
};

export function svg(name, size = 48) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  e.setAttribute('viewBox', '0 0 64 64');
  e.setAttribute('width', size);
  e.setAttribute('height', size);
  e.setAttribute('aria-hidden', 'true');
  e.innerHTML = ICONS[name] || ICONS.kisim;
  return e;
}
export const hasIcon = name => name in ICONS;
