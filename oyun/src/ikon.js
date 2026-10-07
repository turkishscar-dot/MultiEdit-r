// Oyunun kendi simgeleri: çizgi roman mürekkep hattı, düz renk (emoji yerine). ikon(ad) SVG döndürür.
// Arayüzde kalan emojiler kendiliğinden bu simgelere çevrilir (emojiyiCevir): tek yerden, bütün ekranlarda.
const K = '#1b1320';
const s = (d, fill, w = 1.8) => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const c = (x, y, r, fill, w = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${K}" stroke-width="${w}"/>`;
const l = (d, col = K, w = 1.8) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const GOLD = '#f2b632', RED = '#c8322a', CREAM = '#f3e3bf', BONE = '#efe4c8', STEEL = '#c9d3dc', WOOD = '#8a5a2e', BLUE = '#3a7ad0', DARK = '#3a2a3a';
const saber = flip => `<g transform="${flip ? 'translate(32 0) scale(-1 1)' : ''}">${s('M6 26 Q13 13 25 5 L26.5 6.5 Q16 16 8.5 27.5 Z', STEEL, 1.6)}${s('M5 23.5 L10.5 29', GOLD, 2.6)}${s('M3.5 27.5 L6 30', WOOD, 3)}</g>`;

export const IKON = {
  // bölgeler
  kale: s('M4 29V13h4v-3h3v3h3v-3h4v3h3v-3h3v3h4v16z', '#d8b57a') + s('M13 29v-6a3 3 0 0 1 6 0v6z', DARK) + l('M8 18h3M21 18h3') + l('M16 10V3', K, 1.6) + s('M16 3l7 2.5-7 2.5z', RED, 1.4),
  sazlik: s('M3 25q3.5-3 6.5 0t6.5 0 6.5 0 6.5 0v5H3z', '#3d6e5a') + l('M9 23V9M13 23V12M22 23V7', '#6a8a3a', 2.2) + s('M8 9.5a1.5 3 0 1 1 3 0v3a1.5 1.5 0 0 1-3 0z', '#8a5a2e', 1.4) + s('M21 7.5a1.5 3 0 1 1 3 0v3a1.5 1.5 0 0 1-3 0z', '#8a5a2e', 1.4) + l('M26 23c0-6 2-9 3-11M26 16l-3-3', '#5a4030', 1.8),
  dag: s('M2 28 12 9l5 8 4-5 9 16z', '#7a8aa8') + s('M12 9l-3.6 6.8 2.2-1 1.6 1.8 1.8-2 1.6 1.6z', '#fff', 1.4) + s('M21 12l-2.4 3 1.6.2 1.2 1.2 1.4-1.4z', '#fff', 1.2),
  gok: s('M6 24a5 5 0 0 1 1-9.8A7 7 0 0 1 20 12a5.5 5.5 0 0 1 6 12z', '#fff') + s('M13 13c3-6 9-9 16-8-3 2-5 5-6 8-3-1-6-1-10 0z', GOLD, 1.6) + l('M18 9.5l6-2.5M17 11.5l7-1', K, 1.2),
  ates: s('M16 30c-6 0-9-4-9-9 0-6 5-8 5-14 3 2 5 5 5 8 1-2 2-4 1.5-6 4 3 7.5 7 7.5 12 0 5-4 9-10 9z', RED) + s('M16 30c-3 0-5-2-5-5 0-3 3-5 3-8 3 2 7 5 7 8.5 0 3-2 4.5-5 4.5z', '#ff9a2a', 1.5) + s('M16 30c-1.5 0-2.5-1-2.5-2.5s1.5-2.5 1.5-4c2 1 3.5 2.5 3.5 4.2 0 1.4-1 2.3-2.5 2.3z', '#ffe06a', 1.2),
  pagoda: s('M16 2l2 3h-4z', GOLD, 1.4) + s('M5 10q11-4 22 0l-3 1H8z', RED) + s('M9 11h14v5H9z', CREAM) + s('M3 18q13-4 26 0l-3 1H6z', RED) + s('M7 19h18v10H7z', CREAM) + s('M13 29v-5a3 3 0 0 1 6 0v5z', DARK) + l('M16 5v5'),
  kuzey: s('M5 12c5-2 17-2 22 0-4 3-18 3-22 0z', '#3aff9a', 1.2) + s('M22 5a7 7 0 1 0 5 10 5.5 5.5 0 1 1-5-10z', '#e8edf8') + s('M4 29l4-9 3 3 3-8 3 6 3-3 4 5 4-2v8z', '#2a3a4a'),
  // düğümler ve görevler
  kilic: saber(false) + saber(true),
  boss: s('M7 7q-2-5 1-6 1 4 5 6zM25 7q2-5-1-6-1 4-5 6z', BONE, 1.5) + s('M16 5c7 0 11 5 10 12-1 6-5 11-10 11S7 23 6 17C5 10 9 5 16 5z', RED) + s('M9 14l5 2-1 2.5-4-1.5zM23 14l-5 2 1 2.5 4-1.5z', '#ffe23a', 1.4) + s('M11 23q5 3 10 0l-1.5 3h-7z', '#fff', 1.3) + l('M13 11l2 2M19 11l-2 2', K, 1.6),
  kilit: s('M10 14v-4a6 6 0 0 1 12 0v4', 'none', 2.6) + s('M7 14h18v14H7z', GOLD) + s('M16 19a2 2 0 0 1 1 3.7V25h-2v-2.3a2 2 0 0 1 1-3.7z', K, 1),
  acik: s('M10 14v-4a6 6 0 0 1 12 0', 'none', 2.6) + s('M7 14h18v14H7z', GOLD) + s('M16 19a2 2 0 0 1 1 3.7V25h-2v-2.3a2 2 0 0 1 1-3.7z', K, 1),
  at: s('M9 29c0-6 1-10 5-14l-3-5 3 1 2-6 3 5c5 2 8 6 8 11l-3 1-4-4c-2 2-3 6-3 11z', '#b08050') + s('M16 5c-3 3-4 6-4 9', 'none', 2.4) + c(19.5, 11.5, 1, K, 0.5) + l('M16 6c-2 1-3 3-3 5M18 8c-2 1-3 3-3 5', '#5a3a1a', 1.4),
  kalkan: c(16, 16, 12.5, WOOD) + c(16, 16, 8.5, RED, 1.5) + c(16, 16, 3.2, GOLD, 1.5) + l('M16 3.5v5M16 23.5v5M3.5 16h5M23.5 16h5', GOLD, 1.8),
  halka: `<circle cx="16" cy="16" r="11" fill="none" stroke="${K}" stroke-width="6"/><circle cx="16" cy="16" r="11" fill="none" stroke="${GOLD}" stroke-width="3.2"/>`,
  yay: s('M9 3q14 13 0 26', 'none', 3) + l('M9 3q14 13 0 26', WOOD, 1.6) + l('M9 3v26', '#e8e0d0', 1.2) + l('M5 16h22') + s('M27 16l-4-2.5v5z', STEEL, 1.4) + s('M5 16l-2-2M5 16l-2 2', 'none', 1.6),
  tac: s('M4 25l2-13 5 6 5-10 5 10 5-6 2 13z', GOLD) + s('M4 25h24v4H4z', GOLD) + c(16, 14, 1.8, RED, 1.2) + c(9, 21, 1.4, BLUE, 1) + c(23, 21, 1.4, BLUE, 1),
  yildiz: s('M16 2l3.2 10.6L30 16l-10.8 3.4L16 30l-3.2-10.6L2 16l10.8-3.4z', GOLD),
  kimiz: s('M11 7h10l-1 4c5 2 7 6 6 11-1 5-5 7-10 7S7 27 6 22c-1-5 1-9 6-11z', '#a0703a') + s('M11 3h10v4H11z', '#5a3a1a') + l('M8 17c5 2 11 2 16 0', '#6a4520', 1.6),
  kurt: s('M5 4l5 7h12l5-7 1 11c0 7-5 13-12 13S4 22 4 15z', '#8a94a8') + s('M11 19c2 3 8 3 10 0l-5 7z', '#e8ecf2', 1.4) + s('M9.5 15l4 1-1 2zM22.5 15l-4 1 1 2z', '#ffe23a', 1.2) + c(16, 21, 1.4, K, 0.5),
  muska: s('M16 3l12 22H4z', '#c8322a') + s('M16 10l6 11H10z', CREAM, 1.4) + l('M16 3V1', K, 2) + c(16, 17, 1.6, GOLD, 1),
  nazar: c(16, 16, 12, '#1f5fc8') + c(16, 16, 8, '#fff', 1.2) + c(16, 16, 5, '#5ab8ff', 1.2) + c(16, 16, 2.4, K, 0.5),
  miknatis: s('M6 4h7v12a3 3 0 0 0 6 0V4h7v12a10 10 0 0 1-20 0z', RED) + s('M6 4h7v5H6zM19 4h7v5h-7z', STEEL, 1.6),
  kupa: s('M9 4h14v7a7 7 0 0 1-14 0z', GOLD) + s('M9 6H5a4 4 0 0 0 4 6M23 6h4a4 4 0 0 1-4 6', 'none', 2) + s('M14 17h4v5h-4z', GOLD, 1.5) + s('M9 22h14v5H9z', WOOD) + c(16, 9, 2, RED, 1.2),
  carsi: s('M3 12l3-8h20l3 8z', RED) + l('M9 4 8 12M16 4v8M23 4l1 8', '#fff', 1.8) + s('M5 12h22v16H5z', CREAM) + s('M13 28v-9h6v9z', WOOD, 1.5) + s('M7 16h4v4H7zM21 16h4v4h-4z', GOLD, 1.3),
  kart: s('M6 7l12-3 5 21-12 3z', '#d8c8a4') + s('M10 4h13v22H10z', CREAM) + s('M16.5 9l1.6 4.4 4.6.2-3.6 2.9 1.3 4.5-3.9-2.6-3.9 2.6 1.3-4.5-3.6-2.9 4.6-.2z', GOLD, 1.3),
  cadir: s('M3 28l3-13 10-9 10 9 3 13z', '#e8dcc0') + s('M6 15h20', 'none', 1.6) + s('M13 28v-7a3 3 0 0 1 6 0v7z', RED, 1.5) + s('M14 6.5l2-3 2 3z', WOOD, 1.2) + l('M9 20l2-4M23 20l-2-4', '#b04030', 1.6),
  cadir2: s('M1 28l2-9 7-6 7 6 2 9z', '#e8dcc0') + s('M13 28l2-10 9-8 9 8 0 10z', '#e8dcc0') + s('M8 28v-4a2 2 0 0 1 4 0v4zM21 28v-5a2.5 2.5 0 0 1 5 0v5z', RED, 1.3),
  cadir3: s('M0 28l2-8 6-5 6 5 2 8z', '#e8dcc0') + s('M16 28l2-8 6-5 6 5 2 8z', '#e8dcc0') + s('M8 28l2-10 6-6 6 6 2 10z', '#f3ead2') + s('M14 28v-5a2 2 0 0 1 4 0v5z', RED, 1.3),
  kaftan: s('M11 3l5 4 5-4 8 5-3 6-3-2v17H9V12l-3 2-3-6z', BLUE) + s('M16 7v22', 'none', 2) + s('M11 3l5 4 5-4', GOLD, 2) + l('M9 20h14', GOLD, 2.2),
  destan: s('M4 6c4-2 8-2 12 1v21c-4-3-8-3-12-1z', CREAM) + s('M28 6c-4-2-8-2-12 1v21c4-3 8-3 12-1z', CREAM) + l('M7 11c2-.6 4-.4 6 .6M7 15c2-.6 4-.4 6 .6M19 11.6c2-1 4-1.2 6-.6M19 15.6c2-1 4-1.2 6-.6', '#8a6a4a', 1.3) + s('M14 26h4v4l-2-1.5-2 1.5z', RED, 1.2),
  tomar: s('M7 5h18v22H7z', CREAM) + s('M5 5a2 2 0 0 1 4 0v22a2 2 0 0 1-4 0zM23 5a2 2 0 0 1 4 0v22a2 2 0 0 1-4 0z', WOOD, 1.5) + l('M11 10h10M11 14h10M11 18h7', '#8a6a4a', 1.4) + c(19, 23, 2.2, RED, 1.2),
  film: s('M4 5h24v22H4z', DARK) + s('M8 9h16v14H8z', '#f3e3bf', 1.5) + l('M6 7h0M6 12h0M6 17h0M6 22h0M26 7h0M26 12h0M26 17h0M26 22h0', '#fff', 2.2) + s('M11 20l4-6 3 4 2-2 3 4z', RED, 1.2),
  ayar: s('M14 2h4l.7 3.4 2.6 1.1 2.9-2 2.8 2.8-2 2.9 1.1 2.6L30 14v4l-3.4.7-1.1 2.6 2 2.9-2.8 2.8-2.9-2-2.6 1.1L18 30h-4l-.7-3.4-2.6-1.1-2.9 2-2.8-2.8 2-2.9-1.1-2.6L2 18v-4l3.4-.7 1.1-2.6-2-2.9 2.8-2.8 2.9 2 2.6-1.1z', STEEL, 1.5) + c(16, 16, 4.5, DARK, 1.5),
  davul: `<ellipse cx="16" cy="16" rx="12" ry="12" fill="#c89a5a" stroke="${K}" stroke-width="3"/>` + c(16, 16, 9, '#e8c890', 1.2) + s('M12 11l4 5 4-5M12 21l4-5 4 5', 'none', 1.4) + c(16, 16, 1.6, RED, 1),
  geyik: s('M11 14c-4-2-6-6-5-11l2 4 1-4 2 5 1-3 1 6zM21 14c4-2 6-6 5-11l-2 4-1-4-2 5-1-3-1 6z', '#e8d8b0', 1.5) + s('M10 14h12l-2 9-4 5-4-5z', '#f4f0e6') + c(13.5, 18, 1, K, 0.3) + c(18.5, 18, 1, K, 0.3) + c(16, 26, 1.3, K, 0.3),
  sandik: s('M4 9h24v18H4z', WOOD) + l('M4 15h24M4 21h24', '#5a3a1a', 1.6) + l('M9 10l14 16', '#f3e3bf', 1.4) + s('M4 9h24', 'none', 1.8),
  simsek: s('M19 2L6 18h8l-3 12 15-18h-9z', '#5ab8ff'),
  hedef: c(16, 16, 13, '#fff') + c(16, 16, 9, RED, 1.4) + c(16, 16, 5, '#fff', 1.4) + c(16, 16, 2, RED, 1) + s('M16 16L28 4M24 4h4v4', 'none', 2),
  zincir: `<rect x="3" y="11" width="13" height="10" rx="5" fill="none" stroke="${K}" stroke-width="4.5"/><rect x="3" y="11" width="13" height="10" rx="5" fill="none" stroke="${STEEL}" stroke-width="2"/><rect x="16" y="11" width="13" height="10" rx="5" fill="none" stroke="${K}" stroke-width="4.5"/><rect x="16" y="11" width="13" height="10" rx="5" fill="none" stroke="${STEEL}" stroke-width="2"/>`,
  el: s('M12 29c-3-3-6-7-7-10l2-1 4 3V5a2 2 0 0 1 4 0v9l1-.5V11a2 2 0 0 1 4 0v3l1-.3V12a2 2 0 0 1 4 0v10c0 3-1 5-3 7z', '#f0c89a'),
  tik: s('M4 17l8 8L28 7', 'none', 4.5) + l('M4 17l8 8L28 7', '#3ac060', 2.4),
  carpi: s('M6 6l20 20M26 6 6 26', 'none', 4.5) + l('M6 6l20 20M26 6 6 26', RED, 2.4),
  bronz: s('M10 2h5l1 8-5 1zM22 2h-5l-1 8 5 1z', RED, 1.3) + c(16, 20, 9, '#c07a3a') + s('M16 15l1.4 3.2 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3z', '#e8a868', 1),
  gumus: s('M10 2h5l1 8-5 1zM22 2h-5l-1 8 5 1z', BLUE, 1.3) + c(16, 20, 9, '#d8dde6') + s('M16 15l1.4 3.2 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3z', '#fff', 1),
  altin: s('M10 2h5l1 8-5 1zM22 2h-5l-1 8 5 1z', '#2a8a4a', 1.3) + c(16, 20, 9, GOLD) + s('M16 15l1.4 3.2 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3z', '#fff3b0', 1),
  gunes: c(16, 16, 7, GOLD) + l('M16 2v5M16 25v5M2 16h5M25 16h5M6 6l3.5 3.5M22.5 22.5 26 26M6 26l3.5-3.5M22.5 9.5 26 6', GOLD, 2.6),
  ucurum: s('M2 30V14h9l3 16z', '#8a7a68') + s('M30 30V10h-8l-3 20z', '#8a7a68') + l('M11 14l2 6M22 10l-1 7', K, 1.3) + s('M13 6l3-3 3 3-3 3z', GOLD, 1.3),
  kivilcim: s('M16 2l2.5 11.5L30 16l-11.5 2.5L16 30l-2.5-11.5L2 16l11.5-2.5z', '#fff3a0'),
  kutlu: s('M12 8h8v3a5 5 0 0 1 3 5v9a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4v-9a5 5 0 0 1 3-5z', '#ffd23f') + s('M11 4h10v4H11z', WOOD, 1.5),
};

export const ikon = (ad, cls = '') => `<svg class="ik ${cls}" viewBox="0 0 32 32" aria-hidden="true">${IKON[ad] || ''}</svg>`;

// Arayüzde geçen emoji -> simge
const EMOJI = {
  '🏯': 'kale', '🌫': 'sazlik', '🏔': 'dag', '☁': 'gok', '🔥': 'ates', '🏮': 'pagoda', '🌌': 'kuzey', '🗺': 'tomar',
  '⚔': 'kilic', '👹': 'boss', '🔒': 'kilit', '🔓': 'acik', '🐎': 'at', '🐴': 'at', '🛡': 'kalkan', '🏹': 'yay', '👑': 'tac',
  '✦': 'yildiz', '✨': 'kivilcim', '🍶': 'kimiz', '🐺': 'kurt', '📿': 'muska', '🧿': 'nazar', '🧲': 'miknatis', '🏆': 'kupa',
  '🏪': 'carsi', '🃏': 'kart', '⛺': 'cadir', '🏕': 'cadir2', '🏘': 'cadir3', '👘': 'kaftan', '📜': 'tomar', '🎞': 'film', '⚙': 'ayar',
  '🥁': 'davul', '🦌': 'geyik', '📦': 'sandik', '⚡': 'simsek', '🎯': 'hedef', '⛓': 'zincir', '👆': 'el', '🥉': 'bronz', '🥈': 'gumus',
  '🥇': 'altin', '☀': 'gunes', '⛰': 'ucurum', '✓': 'tik', '✗': 'carpi',
};
const RE = new RegExp(`(${Object.keys(EMOJI).join('|')})\\uFE0F?`, 'u');
const RE_ALL = new RegExp(RE.source, 'gu');
const esc = t => t.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]);

function cevir(node) {
  if (node.nodeType === 3) {
    if (!RE.test(node.data) || !node.parentNode || node.parentNode.closest?.('svg, script, style, textarea')) return;
    const span = document.createElement('span');
    span.className = 'ikm';
    span.innerHTML = esc(node.data).replace(RE_ALL, (m, e) => ikon(EMOJI[e]));
    node.replaceWith(span);
    return;
  }
  if (node.nodeType !== 1 || node.matches('svg, script, style, canvas')) return;
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const list = [];
  while (w.nextNode()) if (RE.test(w.currentNode.data)) list.push(w.currentNode);
  list.forEach(cevir);
}
export function emojiyiCevir(root = document.body) {
  cevir(root);
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') cevir(m.target);
      else m.addedNodes.forEach(cevir);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
