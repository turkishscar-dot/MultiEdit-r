// Kaftan ve şalvar desenleri: kodla çizilen açık renkli dokular. Kostümün rengiyle çarpılır, böylece
// aynı desen her renkte kullanılabilir. Blender'da kaftana gerçek işleme dokusu yapılınca bunların yerini alabilir.
import * as THREE from 'three';

function tex(draw, size = 256, rep = 3) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, size, size);
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.anisotropy = 4;
  return t;
}
const line = (g, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; };

const DRAW = {
  // kilim: iç içe baklavalar ve kenarda "koçboynuzu" kıvrımları
  kilim: (g, s) => {
    for (let y = 0; y < s; y += s / 4) for (let x = 0; x < s; x += s / 4) {
      const cx = x + s / 8, cy = y + s / 8, r = s / 9;
      g.fillStyle = 'rgba(0,0,0,.28)';
      g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.fill();
      g.fillStyle = 'rgba(255,215,90,.9)';
      g.beginPath(); g.moveTo(cx, cy - r / 2); g.lineTo(cx + r / 2, cy); g.lineTo(cx, cy + r / 2); g.lineTo(cx - r / 2, cy); g.fill();
    }
  },
  // çintemani: üçlü benek ve iki dalgalı çizgi (Osmanlı kumaşlarında)
  cintemani: (g, s) => {
    for (let y = 0; y < s; y += s / 3) for (let x = 0; x < s; x += s / 3) {
      const ox = x + ((y / (s / 3)) % 2) * s / 6;
      g.fillStyle = 'rgba(255,210,80,.95)';
      for (const [dx, dy] of [[0, 0], [14, 0], [7, -12]]) { g.beginPath(); g.arc(ox + 20 + dx, y + 30 + dy, 6, 0, 7); g.fill(); }
      line(g, 4, 'rgba(0,0,0,.3)');
      for (const k of [0, 9]) { g.beginPath(); g.moveTo(ox + 14, y + 50 + k); g.bezierCurveTo(ox + 26, y + 42 + k, ox + 34, y + 58 + k, ox + 46, y + 50 + k); g.stroke(); }
    }
  },
  // rumi: kıvrık dallar (Selçuklu, Timurlu bezemesi)
  rumi: (g, s) => {
    line(g, 5, 'rgba(255,205,70,.9)');
    for (let y = 0; y < s; y += s / 4) {
      g.beginPath();
      for (let x = 0; x <= s; x += 4) g.lineTo(x, y + 20 + Math.sin(x / s * Math.PI * 4) * 12);
      g.stroke();
      for (let x = 16; x < s; x += s / 4) { g.beginPath(); g.arc(x, y + 20 + Math.sin(x / s * Math.PI * 4) * 12 - 12, 9, 0.3, 4.2); g.stroke(); }
    }
  },
  // pul: balık pulu gibi dizilmiş altın levhalar (Saka, Hun zırhı)
  pul: (g, s) => {
    const r = s / 10;
    for (let y = 0; y < s + r; y += r) for (let x = 0; x < s + r; x += r * 2) {
      const ox = x + ((y / r) % 2) * r;
      g.fillStyle = 'rgba(255,200,60,.95)';
      g.beginPath(); g.arc(ox, y, r, 0, Math.PI); g.fill();
      line(g, 2, 'rgba(90,50,0,.6)'); g.stroke();
    }
  },
  // kürk: yumuşak benekli tüy dokusu
  kurk: (g, s) => {
    for (let i = 0; i < 1800; i++) {
      const x = Math.random() * s, y = Math.random() * s, l = 4 + Math.random() * 8;
      line(g, 2, `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${0.1 + Math.random() * 0.2})`);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y + l); g.stroke();
    }
  },
  // yol: kenarlarında altın şerit olan dikey çizgiler (şaman giysisindeki şeritler)
  yol: (g, s) => {
    for (let x = 0; x < s; x += s / 6) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x, 0, 10, s); g.fillStyle = 'rgba(255,215,90,.9)'; g.fillRect(x + 12, 0, 4, s); }
  },
};
const cache = {};
export const DESENLER = Object.keys(DRAW);
export const desen = id => (cache[id] ??= tex(DRAW[id]));
