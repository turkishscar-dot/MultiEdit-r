// Surların üstündeki koşu yolu, aşağıdaki şehir, gökyüzü, engeller ve efektler.
import * as THREE from 'three';
import { GRAD } from './assets.js';

export const SEG = 30; // bir sur parçasının boyu (m)
const rand = (a, b) => a + Math.random() * (b - a);
const NO_OUTLINE = { visible: false };

const mats = {};
export const toon = (color, key = color, extra = {}) =>
  (mats[key] ??= new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...extra }));

function tex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.repeat.set(rx, ry);
  return t;
}

// ---- yapay zekâ dokuları (src/assets/doku/*.jpg, tools/ai_doku.py): yüklenince kodla çizilen dokunun yerine geçer ----
// Kodla çizilen hali yedek kalır (dosya yoksa ya da yüklenmezse). reTex ile çoğaltılan kopyalar da güncellenir.
const DOKU = import.meta.glob('./assets/doku/*.jpg', { eager: true, query: '?url', import: 'default' });
const KOPYA = new Map();
function aiDoku(t, ad, olcek = 1) {
  const u = DOKU[`./assets/doku/${ad}.jpg`];
  if (!u || typeof Image === 'undefined') return t;
  const im = new Image();
  im.onload = () => {
    for (const x of [t, ...(KOPYA.get(t) || [])]) { x.image = im; x.repeat.multiplyScalar(olcek); x.needsUpdate = true; }
  };
  im.src = u;
  return t;
}
// Düz renkli zemine dünya koordinatıyla döşenen doku (kutunun boyundan bağımsız): her 'metre' birimde bir tekrar
function aiZemin(m, ad, metre) {
  const u = DOKU[`./assets/doku/${ad}.jpg`];
  if (!u || typeof Image === 'undefined') return;
  const t = new THREE.Texture(); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  const im = new Image();
  im.onload = () => {
    t.image = im; t.needsUpdate = true;
    m.map = t; m.color.set(0xffffff);
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>\n\tvMapUv = (modelMatrix * vec4(position, 1.0)).xz / ${metre.toFixed(2)};`); };
    m.customProgramCacheKey = () => 'zemin' + metre;
    m.needsUpdate = true;
  };
  im.src = u;
}

const shade = (hex, k) => {
  const c = new THREE.Color(hex).multiplyScalar(k);
  return '#' + c.getHexString();
};

// ---- dokular ----
const stoneTex = aiDoku(tex(512, 512, (g, w, h) => {
  g.fillStyle = '#6b5a48';
  g.fillRect(0, 0, w, h);
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    let x = r % 2 ? -64 : 0;
    while (x < w) {
      const sw = 110 + Math.random() * 90;
      g.fillStyle = shade(0xc9b393, 0.85 + Math.random() * 0.2);
      g.fillRect(x + 4, r * (h / rows) + 4, sw - 8, h / rows - 8);
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.fillRect(x + 4, r * (h / rows) + 4, sw - 8, 6);
      x += sw;
    }
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(60,40,20,${Math.random() * 0.12})`;
    g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  }
}, 3, SEG / 2.5), 'tasyol', 1.7);

const wallTex = aiDoku(tex(256, 256, (g, w, h) => {
  g.fillStyle = '#5e4d3c';
  g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
    g.fillStyle = shade(0xb09775, 0.8 + Math.random() * 0.25);
    g.fillRect(c * 64 + (r % 2) * 32 + 3, r * 32 + 3, 58, 26);
  }
}), 'surduvar');

const woodTex = aiDoku(tex(128, 128, (g, w, h) => {
  g.fillStyle = '#7a4a24';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = shade(0x8a5a2b, 0.85 + Math.random() * 0.25);
    g.fillRect(i * 32 + 2, 0, 28, h);
    g.strokeStyle = 'rgba(40,20,5,.35)';
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      const x = i * 32 + 5 + Math.random() * 22;
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.6, x + 2, h);
      g.stroke();
    }
  }
}), 'tahta');

const kilimTex = tex(128, 256, (g, w, h) => {
  const cols = ['#b3202a', '#e3a82b', '#1f4e9c', '#f3ead8', '#2b1d13'];
  g.fillStyle = cols[0];
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = cols[(y / 32) % 4 + 1];
    g.beginPath();
    for (let x = 0; x <= w; x += 32) { g.lineTo(x, y + 16); g.lineTo(x + 16, y); }
    g.lineTo(w, y + 22); g.lineTo(0, y + 22);
    g.fill();
  }
  g.strokeStyle = '#2b1d13';
  g.lineWidth = 6;
  g.strokeRect(3, 3, w - 6, h - 6);
});

// İslamiyet öncesi Türk devletlerinin sancakları. Gerçek sancaklar günümüze ulaşmadığı için
// dönemin bilinen motifleriyle (bozkurt, güneş, kartal, damga, ok-yay) yeniden yorumlanmıştır.
const EMBLEM = {
  sun(g) { // güneş kursu
    g.beginPath(); g.arc(64, 110, 26, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.beginPath(); g.moveTo(64 + Math.cos(a) * 32, 110 + Math.sin(a) * 32); g.lineTo(64 + Math.cos(a) * 46, 110 + Math.sin(a) * 46); g.stroke();
    }
  },
  wolf(g) { // bozkurt başı
    g.beginPath();
    for (const [x, y] of [[40, 150], [34, 96], [46, 70], [56, 96], [74, 92], [86, 66], [90, 100], [104, 116], [96, 124], [84, 122], [74, 140], [58, 158]]) g.lineTo(x, y);
    g.closePath(); g.fill();
  },
  eagle(g) { // açık kanatlı kartal
    g.beginPath();
    for (const [x, y] of [[64, 70], [72, 88], [110, 80], [84, 104], [74, 106], [80, 150], [64, 136], [48, 150], [54, 106], [44, 104], [18, 80], [56, 88]]) g.lineTo(x, y);
    g.closePath(); g.fill();
  },
  tamga(g) { // damga
    g.beginPath();
    g.moveTo(64, 160); g.lineTo(64, 70);
    g.moveTo(34, 76); g.lineTo(34, 110); g.quadraticCurveTo(64, 140, 94, 110); g.lineTo(94, 76);
    g.stroke();
  },
  bow(g) { // ok ve yay
    g.beginPath();
    g.moveTo(64, 160); g.lineTo(64, 70); g.moveTo(64, 70); g.lineTo(50, 88); g.moveTo(64, 70); g.lineTo(78, 88);
    g.moveTo(28, 120); g.quadraticCurveTo(64, 170, 100, 120);
    g.stroke();
  },
  arrows(g) { // çapraz oklar
    g.beginPath();
    g.moveTo(32, 150); g.lineTo(96, 76); g.lineTo(84, 78); g.moveTo(96, 76); g.lineTo(94, 88);
    g.moveTo(96, 150); g.lineTo(32, 76); g.lineTo(44, 78); g.moveTo(32, 76); g.lineTo(34, 88);
    g.stroke();
  },
  sunmoon(g) { // güneş ve ay kursları
    g.beginPath(); g.arc(46, 110, 18, 0, 7); g.fill();
    g.beginPath(); g.arc(84, 110, 18, 0, 7); g.stroke();
  },
  horns(g) { // geyik boynuzu
    g.beginPath();
    g.moveTo(64, 160); g.lineTo(64, 120);
    g.moveTo(64, 120); g.quadraticCurveTo(30, 110, 34, 70); g.moveTo(44, 100); g.lineTo(28, 94);
    g.moveTo(64, 120); g.quadraticCurveTo(98, 110, 94, 70); g.moveTo(84, 100); g.lineTo(100, 94);
    g.stroke();
  },
};
export const FLAGS = [
  { name: 'BÜYÜK HUN', bg: '#a3161f', emblem: 'sun' },
  { name: 'BATI HUN', bg: '#1f5fb0', emblem: 'bow' },
  { name: 'AVRUPA HUN', bg: '#5c1a1a', emblem: 'eagle' },
  { name: 'AK HUN', bg: '#efe8d8', emblem: 'tamga', ink: '#a3161f' },
  { name: 'GÖKTÜRK', bg: '#3f8fd6', emblem: 'wolf' },
  { name: 'AVAR', bg: '#4c2a6e', emblem: 'arrows' },
  { name: 'HAZAR', bg: '#1d5e3a', emblem: 'horns' },
  { name: 'UYGUR', bg: '#c4561d', emblem: 'sunmoon' },
];
const flagTex = f => tex(128, 256, (g, w, h) => {
  g.fillStyle = f.bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#e3a82b';
  g.fillRect(0, 0, w, 12);
  g.fillStyle = g.strokeStyle = f.ink || '#ffd35a';
  g.lineWidth = 8;
  g.lineCap = g.lineJoin = 'round';
  EMBLEM[f.emblem](g);
  g.globalCompositeOperation = 'destination-out'; // kırlangıç kuyruğu
  g.beginPath(); g.moveTo(0, h + 1); g.lineTo(w / 2, h - 36); g.lineTo(w, h + 1); g.fill();
});

const glowTex = tex(64, 64, (g, w) => {
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,240,170,1)');
  r.addColorStop(0.35, 'rgba(255,200,60,.6)');
  r.addColorStop(1, 'rgba(255,160,0,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, w, w);
});

const dotTex = tex(32, 32, (g, w) => { // beyaz yumuşak nokta: kar, toz
  const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, w, w);
});

const burstTex = tex(128, 128, (g, w) => {
  g.translate(w / 2, w / 2);
  g.fillStyle = '#ffe45c';
  g.strokeStyle = '#15101c';
  g.lineWidth = 5;
  g.beginPath();
  for (let i = 0; i < 24; i++) {
    const r = i % 2 ? 28 : 60;
    const a = (i / 24) * Math.PI * 2;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill();
});

// ---- hazır modeller (Quaternius doğa ve kale paketleri): yüklenince segmentlere serpilir ----
let ENV = null;
export function setEnv(map) { ENV = map; }
// ad: 'PineTree_' gibi önek verilirse o ailenin rastgele biri seçilir
function envObj(name, x, z, s = 1, ry = rand(0, 6.3), y = 0) {
  if (!ENV) return null;
  const keys = ENV[name] ? [name] : Object.keys(ENV).filter(k => k.startsWith(name));
  if (!keys.length) return null;
  const o = ENV[keys[Math.floor(Math.random() * keys.length)]].clone();
  o.position.set(x, y, z);
  o.rotation.y = ry;
  o.scale.setScalar(s);
  return o;
}
const addEnv = (g, ...a) => { const o = envObj(...a); if (o) g.add(o); return o; };

// ---- temel geometri yardımcıları ----
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cone: new THREE.ConeGeometry(1, 1, 12),
  oct: new THREE.CylinderGeometry(1, 1, 1, 8),
  octCone: new THREE.ConeGeometry(1, 1, 8),
  dome: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
};

function mesh(geo, mat, [x, y, z] = [0, 0, 0], [sx, sy, sz] = [1, 1, 1], shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

const M = {
  stone: new THREE.MeshToonMaterial({ map: stoneTex, gradientMap: GRAD }),
  wall: new THREE.MeshToonMaterial({ map: wallTex, gradientMap: GRAD }),
  wood: new THREE.MeshToonMaterial({ map: woodTex, gradientMap: GRAD }),
  kilim: new THREE.MeshToonMaterial({ map: kilimTex, gradientMap: GRAD, side: THREE.DoubleSide }),
  groove: toon(0x3d3026),
  plaster: toon(0xe3d2b0),
  roof: toon(0x7a4a2a),
  tile: toon(0x2f9e9a),
  felt: toon(0xf3ead8),
  red: toon(0xb3202a),
  gold: toon(0xe3a82b),
  iron: toon(0x4a4d55),
  hay: toon(0xe0c060),
  rock: toon(0x8b8d91),
  rope: toon(0xc0392b),
  flame: new THREE.MeshBasicMaterial({ color: 0xffa21a }),
  vial: new THREE.MeshBasicMaterial({ color: 0xffd23f }),
  glow: new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.75 }),
  burst: new THREE.SpriteMaterial({ map: burstTex, depthWrite: false }),
};
const FLAG_MATS = FLAGS.map(f => new THREE.MeshToonMaterial({ map: flagTex(f), gradientMap: GRAD, side: THREE.DoubleSide, alphaTest: 0.5 }));
M.flame.userData.outlineParameters = M.glow.userData.outlineParameters = M.burst.userData.outlineParameters = NO_OUTLINE;
M.vial.userData.outlineParameters = { thickness: 0.006, color: [0.3, 0.18, 0], alpha: 1 };

// ---- gökyüzü + uzak dağlar ----
export function makeSky() {
  const g = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(380, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(0x3f78c4) }, mid: { value: new THREE.Color(0xf6b27a) }, low: { value: new THREE.Color(0xffe2b0) } },
    vertexShader: 'varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, low; varying vec3 p;
      void main(){ float h = normalize(p).y; vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.5, h)) : mix(low, mid, smoothstep(-0.05, 0.08, h)); gl_FragColor = vec4(c, 1.); }`,
  }));
  sky.material.userData.outlineParameters = NO_OUTLINE;
  g.add(sky);
  g.userData.u = sky.material.uniforms; // ara sahnelerde gökyüzü rengi değişir
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, depthWrite: false, color: 0xfff0c0 }));
  sun.material.userData.outlineParameters = NO_OUTLINE;
  sun.scale.setScalar(120);
  sun.position.set(-90, 40, -300);
  g.add(sun);
  g.userData.orb = sun.material; // gece aya, Erlik sahnelerinde kızıla döner
  const rock = new THREE.MeshToonMaterial({ color: 0x8a7fa8, gradientMap: GRAD, fog: false });
  const snow = new THREE.MeshToonMaterial({ color: 0xfff1e6, gradientMap: GRAD, fog: false });
  g.userData.rock = rock;
  g.userData.snow = snow;
  for (let i = 0; i < 16; i++) {
    const h = rand(40, 90), r = h * 0.9;
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), rock);
    m.position.set(-260 + i * 34 + rand(-8, 8), h / 2 - 20, -300 + rand(-20, 20));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.3, h * 0.3, 6), snow);
    cap.position.y = h * 0.36;
    m.add(cap);
    g.add(m);
  }
  return g;
}

// ---- sur parçası: zemin, oluklar, korkuluk, mazgallar, meşaleler, sancaklar ve aşağıdaki şehir ----
function segSurlar() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.stone, [0, -0.5, -SEG / 2], [9.6, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.groove, [x, 0.005, -SEG / 2], [0.14, 0.02, SEG], false));
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.wall, [s * 5.1, 0.35, -SEG / 2], [0.9, 0.7, SEG]));
    g.add(mesh(G.box, M.wall, [s * 5.6, -7, -SEG / 2], [1.2, 15, SEG], false));
    for (let z = 0.9; z < SEG; z += 1.8) g.add(mesh(G.box, M.wall, [s * 5.1, 1.05, -z], [0.9, 0.7, 0.9]));
  }
  const flames = [], flags = [];
  for (const z of [7, 22]) {
    const s = z === 7 ? -1 : 1;
    g.add(mesh(G.cyl, M.iron, [s * 4.45, 0.9, -z], [0.08, 1.8, 0.08]));
    g.add(mesh(G.cone, M.iron, [s * 4.45, 1.9, -z], [0.3, -0.35, 0.3]));
    const f = mesh(G.cone, M.flame, [s * 4.45, 2.25, -z], [0.2, 0.5, 0.2], false);
    flames.push(f);
    g.add(f);
    const fl = new THREE.Sprite(M.glow);
    fl.scale.setScalar(1.6);
    fl.position.set(s * 4.45, 2.2, -z);
    g.add(fl);
    // karşı tarafta sancak
    g.add(mesh(G.cyl, M.wood, [-s * 4.6, 2.3, -z], [0.07, 4.6, 0.07]));
    g.add(mesh(G.cone, M.gold, [-s * 4.6, 4.75, -z], [0.12, 0.3, 0.12]));
    // sancak yola (oyuncuya) dönük asılır
    const flag = mesh(new THREE.PlaneGeometry(1.3, 2.6), FLAG_MATS[0], [-s * 4.6 + s * 0.72, 3.2, -z], [1, 1, 1]);
    flags.push(flag);
    g.add(flag);
  }
  g.userData.flames = flames;
  g.userData.flags = flags;
  g.userData.wisps = [];
  reflag(g);
  city(g);
  for (const s of [-1, 1]) if (Math.random() < 0.7) addEnv(g, pick3(['Tower', 'PointyTower', 'WatchTowerWRoof', 'LargeTower']), s * rand(14, 30), -rand(0, SEG), rand(2.6, 3.4), rand(0, 6.3), -9);
  return g;
}
const pick3 = a => a[Math.floor(Math.random() * a.length)];

// Parça her öne taşındığında sancaklar yeniden rastgele seçilir
export function reflag(seg) {
  for (const f of seg.userData.flags) f.material = FLAG_MATS[Math.floor(Math.random() * FLAG_MATS.length)];
}

function city(g) {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const x = s * rand(8, 30), z = -rand(0, SEG), base = -9;
      const kind = Math.random();
      if (kind < 0.45) { // kerpiç ev, düz dam
        const w = rand(3, 6), h = rand(3, 7), d = rand(3, 6);
        g.add(mesh(G.box, M.plaster, [x, base + h / 2, z], [w, h, d], false));
        g.add(mesh(G.box, M.roof, [x, base + h + 0.15, z], [w + 0.4, 0.3, d + 0.4], false));
      } else if (kind < 0.7) { // kümbet: sekizgen gövde, firuze külah
        const r = rand(1.6, 2.6), h = rand(5, 9);
        g.add(mesh(G.oct, M.plaster, [x, base + h / 2, z], [r, h, r], false));
        g.add(mesh(G.octCone, M.tile, [x, base + h + r * 0.6, z], [r * 1.1, r * 1.2, r * 1.1], false));
      } else if (kind < 0.9) { // otağ
        const r = rand(2, 3);
        g.add(mesh(G.cyl, M.felt, [x, base + 1.2, z], [r, 2.4, r], false));
        g.add(mesh(G.cone, M.red, [x, base + 3.1, z], [r * 1.15, 1.4, r * 1.15], false));
      } else if (Math.abs(x) > 14) { // gözetleme kulesi, surdan yüksek
        g.add(mesh(G.cyl, M.wall, [x, base + 9, z], [2.2, 18, 2.2], false));
        g.add(mesh(G.cone, M.roof, [x, base + 19.5, z], [3, 3.5, 3], false));
      }
    }
  }
}

// ---- engeller ----
function eskiBarricade() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const x = -0.9 + i * 0.45, h = rand(1.4, 1.8);
    const log = mesh(G.cyl, M.wood, [x, h / 2, 0], [0.13, h, 0.13]);
    const tip = mesh(G.cone, M.wood, [x, h + 0.18, 0], [0.13, 0.36, 0.13]);
    log.rotation.x = tip.rotation.x = 0.18;
    tip.position.z = -0.03;
    g.add(log, tip);
  }
  g.add(mesh(G.box, M.wood, [0, 0.6, 0.12], [2.3, 0.18, 0.12]));
  g.add(mesh(G.box, M.wood, [0, 1.1, 0.2], [2.3, 0.18, 0.12]));
  return g;
}

function eskiCart() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wood, [0, 1.0, 0], [1.9, 0.6, 1.5]));
  g.add(mesh(G.box, M.hay, [0, 1.55, 0], [1.7, 0.6, 1.3]));
  for (const s of [-1, 1]) {
    const w = mesh(G.cyl, M.wood, [s * 1.02, 0.6, 0], [0.6, 0.14, 0.6]);
    w.rotation.z = Math.PI / 2;
    const hub = mesh(G.cyl, M.iron, [s * 1.1, 0.6, 0], [0.14, 0.1, 0.14]);
    hub.rotation.z = Math.PI / 2;
    g.add(w, hub);
  }
  g.add(mesh(G.box, M.wood, [0, 0.8, -1.3], [0.12, 0.12, 1.4]));
  return g;
}

function eskiCrates() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wood, [-0.5, 0.5, 0], [1, 1, 1]));
  g.add(mesh(G.box, M.wood, [0.55, 0.45, 0.1], [0.9, 0.9, 0.9]));
  g.add(mesh(G.box, M.wood, [0, 1.4, 0], [0.9, 0.9, 0.9]));
  g.add(mesh(G.cyl, M.iron, [0.55, 0.45, 0.1], [0.47, 0.08, 0.47]));
  return g;
}

// Alçak ip: üstünden zıplanır
function eskiRope() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(mesh(G.cyl, M.wood, [s * 1.15, 0.45, 0], [0.08, 0.9, 0.08]));
  const r = mesh(G.cyl, M.rope, [0, 0.55, 0], [0.04, 2.3, 0.04]);
  r.rotation.z = Math.PI / 2;
  g.add(r);
  [M.gold, toon(0x1f5fb0), M.red, M.gold].forEach((m, i) => g.add(mesh(G.cone, m, [-0.75 + i * 0.5, 0.38, 0], [0.14, -0.32, 0.03])));
  return g;
}

// Yüksek kiriş: altından takla atılır
function eskiBeam() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(mesh(G.box, M.wood, [s * 1.15, 1.4, 0], [0.2, 2.8, 0.2]));
  g.add(mesh(G.box, M.wood, [0, 2.6, 0], [2.6, 0.25, 0.25]));
  g.add(mesh(new THREE.PlaneGeometry(2.1, 1.25), M.kilim, [0, 1.95, 0.02]));
  return g;
}

export function makeBoulder() {
  const g = new THREE.Group();
  const geo = new THREE.DodecahedronGeometry(1.1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.85 + Math.random() * 0.25;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const m = mesh(geo, M.rock, [0, 1.1, 0]);
  g.add(m);
  g.userData.spin = m;
  return g;
}

// Kut kapsülü (Spider-Man'deki şişelerin karşılığı)
const vialGeo = new THREE.CapsuleGeometry(0.15, 0.42, 4, 10);
export function makeKut() {
  const g = new THREE.Group();
  const v = new THREE.Group();
  v.add(new THREE.Mesh(vialGeo, M.vial));
  for (const y of [-0.3, 0.3]) v.add(mesh(G.cyl, M.iron, [0, y, 0], [0.165, 0.08, 0.165], false));
  v.position.y = 1.0;
  v.rotation.x = -0.35;
  g.add(v);
  const glow = new THREE.Sprite(M.glow);
  glow.scale.setScalar(0.95);
  glow.position.y = 1.0;
  g.add(glow);
  g.userData.anim = t => (v.rotation.y = t * 3);
  return g;
}

export function makeArrow() {
  const g = new THREE.Group();
  const shaft = mesh(G.cyl, M.wood, [0, 0, 0], [0.025, 1.1, 0.025], false);
  shaft.rotation.x = Math.PI / 2;
  const tip = mesh(G.cone, M.iron, [0, 0, -0.6], [0.06, 0.18, 0.06], false);
  tip.rotation.x = -Math.PI / 2;
  const f = mesh(G.box, M.red, [0, 0, 0.5], [0.02, 0.14, 0.22], false);
  g.add(shaft, tip, f);
  return g;
}

export function makeBurst() {
  const s = new THREE.Sprite(M.burst.clone());
  s.renderOrder = 10;
  return s;
}

// Tepegöz'ün ezme vuruşu için şeritte kırmızı uyarı
export function makeWarn() {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 9), new THREE.MeshBasicMaterial({ color: 0xff2a1a, transparent: true, opacity: 0.4, depthWrite: false }));
  m.material.userData.outlineParameters = NO_OUTLINE;
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

// At nalı: toplanınca Oğuz ata biner
export function makeHorseshoe() {
  const g = new THREE.Group();
  const v = new THREE.Group();
  const shoe = mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 20, Math.PI * 1.3), M.gold, [0, 0, 0], [1, 1, 1], false);
  shoe.rotation.z = -Math.PI * 0.15 - Math.PI / 2 + Math.PI;
  v.add(shoe);
  v.position.y = 1.2;
  g.add(v);
  const glow = new THREE.Sprite(M.glow);
  glow.scale.setScalar(1.8);
  glow.position.y = 1.2;
  g.add(glow);
  g.userData.anim = t => { v.rotation.y = t * 2.5; v.position.y = 1.2 + Math.sin(t * 4) * 0.12; };
  return g;
}

// Mızrakçının fırlattığı mızrak: oyuncuya (+z) doğru uçar, altından kayılır
export function makeSpear() {
  const g = new THREE.Group();
  const shaft = mesh(G.cyl, M.wood, [0, 1.45, 0], [0.03, 1.8, 0.03], false);
  shaft.rotation.x = Math.PI / 2;
  const tip = mesh(G.cone, M.iron, [0, 1.45, 1.0], [0.07, 0.3, 0.07], false);
  tip.rotation.x = Math.PI / 2;
  g.add(shaft, tip);
  return g;
}

// Ani saldırı uyarısı
const alertTex = tex(128, 128, (g, w) => {
  g.fillStyle = '#d7263d';
  g.strokeStyle = '#15101c';
  g.lineWidth = 8;
  g.beginPath(); g.arc(w / 2, w / 2, 54, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff';
  g.font = 'bold 90px Impact, sans-serif';
  g.textAlign = 'center';
  g.fillText('!', w / 2, 96);
});
export function makeAlert() {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: alertTex, depthTest: false }));
  s.material.userData.outlineParameters = NO_OUTLINE;
  s.renderOrder = 20;
  s.scale.setScalar(0.9);
  return s;
}

// Basit parçacık sistemi (kıvılcım, toz, kıymık)
export class Particles {
  constructor(scene, max, additive, gravity = 14) {
    this.max = max;
    this.gravity = gravity;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.next = 0;
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -99;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({
      size: additive ? 0.22 : 0.35, vertexColors: true, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, map: additive ? glowTex : dotTex,
    }));
    this.points.material.userData.outlineParameters = NO_OUTLINE;
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit(x, y, z, n, color, speed = 6, up = 3, life = 0.5) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const i = this.next;
      this.next = (i + 1) % this.max;
      this.pos.set([x, y, z], i * 3);
      this.vel.set([rand(-1, 1) * speed, rand(0, 1) * up + rand(-0.5, 1) * speed * 0.5, rand(-1, 1) * speed], i * 3);
      this.col.set([c.r, c.g, c.b], i * 3);
      this.life[i] = life * rand(0.6, 1.4);
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -99; continue; }
      this.vel[i * 3 + 1] -= this.gravity * dt;
      for (let a = 0; a < 3; a++) this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}


// =====================================================================================
// Faz 3 haritaları: her tema kendi zeminini, dekorunu ve engellerini getirir.
// =====================================================================================
const plankTex = aiDoku(tex(256, 256, (g, w, h) => {
  g.fillStyle = '#2e1d10';
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) {
    g.fillStyle = shade(0x6b4a2a, 0.7 + Math.random() * 0.35);
    g.fillRect(0, y + 2, w, 28);
    g.strokeStyle = 'rgba(20,10,0,.4)';
    g.beginPath(); g.moveTo(Math.random() * w, y + 2); g.lineTo(Math.random() * w, y + 30); g.stroke();
  }
}, 2, SEG / 3), 'iskele');
const waterTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#16302c';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,200,170,.18)';
  g.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 15, y - 5, x + 30, y); g.stroke();
  }
}, 20, 4);
const snowTex = aiDoku(tex(256, 256, (g, w, h) => {
  g.fillStyle = '#eef3f8';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(120,150,190,${Math.random() * 0.12})`;
    g.fillRect(Math.random() * w, Math.random() * h, 4, 4);
  }
}, 3, SEG / 4), 'kar');
const basaltTex = aiDoku(tex(256, 256, (g, w, h) => {
  g.fillStyle = '#140a0a';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { // altıgen bazalt taşları, aralarında kor çatlaklar
    g.fillStyle = shade(0x3a2c2c, 0.7 + Math.random() * 0.4);
    const x = (i % 5) * 52 + (Math.floor(i / 5) % 2) * 26, y = Math.floor(i / 5) * 52;
    g.beginPath();
    for (let k = 0; k < 6; k++) g.lineTo(x + 26 + Math.cos(k * 1.047) * 24, y + 26 + Math.sin(k * 1.047) * 24);
    g.fill();
  }
  g.strokeStyle = 'rgba(255,90,20,.55)';
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * w, Math.random() * h); g.lineTo(Math.random() * w, Math.random() * h); g.stroke(); }
}, 3, SEG / 3), 'bazalt');

Object.assign(M, {
  plank: new THREE.MeshToonMaterial({ map: plankTex, gradientMap: GRAD }),
  water: new THREE.MeshToonMaterial({ map: waterTex, gradientMap: GRAD }),
  snow: new THREE.MeshToonMaterial({ map: snowTex, gradientMap: GRAD }),
  basalt: new THREE.MeshToonMaterial({ map: basaltTex, gradientMap: GRAD }),
  lava: new THREE.MeshBasicMaterial({ color: 0xff5a10 }),
  deadwood: toon(0x2a2018),
  reed: toon(0x5a6a2a),
  pine: toon(0x1f4a3a),
  white: toon(0xf6f9ff),
  ice: toon(0x9fd6f0),
  cliff: toon(0x6a7488),
  spire: toon(0x2a1616),
  bone: toon(0xe6dcc2),
  cloud: toon(0xffffff),
  storm: toon(0x4a4a5e),
  wisp: new THREE.SpriteMaterial({ map: glowTex, color: 0x7affc0, blending: THREE.AdditiveBlending, depthWrite: false }),
  ring: new THREE.MeshBasicMaterial({ color: 0xd8c8ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }),
  fire: new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.85, depthWrite: false }),
  bolt: new THREE.MeshBasicMaterial({ color: 0xf2f6ff }),
});
for (const k of ['lava', 'wisp', 'ring', 'fire', 'bolt']) M[k].userData.outlineParameters = NO_OUTLINE;

function empty() {
  const g = new THREE.Group();
  g.userData.flames = [];
  g.userData.flags = [];
  g.userData.wisps = [];
  return g;
}

function deadTree(x, z) {
  const t = new THREE.Group();
  const h = rand(4, 7);
  t.add(mesh(G.cyl, M.deadwood, [0, h / 2, 0], [0.22, h, 0.22]));
  for (let i = 0; i < 3; i++) {
    const b = mesh(G.cyl, M.deadwood, [0, h * (0.55 + i * 0.13), 0], [0.08, rand(1.4, 2.4), 0.08]);
    b.rotation.z = (i % 2 ? 1 : -1) * rand(0.6, 1.1);
    b.rotation.y = rand(0, 6);
    b.position.x = Math.sin(b.rotation.z) * -0.6;
    t.add(b);
  }
  t.position.set(x, -0.6, z);
  return t;
}

function segBataklik() {
  const g = empty();
  g.add(mesh(G.box, M.plank, [0, -0.2, -SEG / 2], [8.6, 0.3, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.groove, [x, -0.04, -SEG / 2], [0.12, 0.02, SEG], false));
  const water = mesh(new THREE.PlaneGeometry(160, SEG), M.water, [0, -0.6, -SEG / 2], [1, 1, 1], false);
  water.rotation.x = -Math.PI / 2;
  g.add(water);
  for (let z = 1.5; z < SEG; z += 3) for (const s of [-1, 1]) g.add(mesh(G.cyl, M.deadwood, [s * 4.35, -0.2, -z], [0.13, 1.4, 0.13]));
  for (let i = 0; i < 8; i++) {
    const s = Math.random() < 0.5 ? -1 : 1, x = s * rand(6, 22), z = -rand(0, SEG);
    if (!addEnv(g, 'DeadTree_', x, z, rand(0.9, 1.4), rand(0, 6.3), -0.6)) g.add(deadTree(x, z));
  }
  for (let i = 0; i < 14; i++) { // saz öbekleri
    const s = Math.random() < 0.5 ? -1 : 1, x = s * rand(4.8, 14), z = -rand(0, SEG);
    for (let k = 0; k < 4; k++) {
      const r = mesh(G.cone, M.reed, [x + rand(-0.4, 0.4), 0.1, z + rand(-0.4, 0.4)], [0.06, rand(1, 1.8), 0.06], false);
      r.rotation.z = rand(-0.2, 0.2);
      g.add(r);
    }
  }
  for (let i = 0; i < 4; i++) { // hayalet ışıkları
    const w = new THREE.Sprite(M.wisp);
    w.scale.setScalar(0.7);
    w.position.set((Math.random() < 0.5 ? -1 : 1) * rand(5, 10), rand(0.8, 2.5), -rand(0, SEG));
    w.userData.base = w.position.y;
    g.userData.wisps.push(w);
    g.add(w);
  }
  return g;
}

function pineTree(x, z, sc = 1) {
  const t = new THREE.Group();
  t.add(mesh(G.cyl, M.deadwood, [0, 0.8 * sc, 0], [0.18 * sc, 1.6 * sc, 0.18 * sc]));
  for (let i = 0; i < 3; i++) {
    t.add(mesh(G.cone, M.pine, [0, (1.8 + i * 1.1) * sc, 0], [(1.5 - i * 0.35) * sc, 1.8 * sc, (1.5 - i * 0.35) * sc]));
    t.add(mesh(G.cone, M.white, [0, (2.2 + i * 1.1) * sc, 0], [(0.9 - i * 0.2) * sc, 0.9 * sc, (0.9 - i * 0.2) * sc]));
  }
  t.position.set(x, 0, z);
  return t;
}

function segAltay() {
  const g = empty();
  g.add(mesh(G.box, M.snow, [0, -0.5, -SEG / 2], [9.6, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.ice, [x, 0.005, -SEG / 2], [0.16, 0.02, SEG], false));
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.snow, [s * 9, -0.2, -SEG / 2], [9, 0.9, SEG], false));
    for (let z = 2; z < SEG; z += 4) g.add(mesh(G.dome, M.white, [s * rand(5.2, 6.2), 0, -z - rand(0, 2)], [rand(1, 1.8), rand(0.6, 1.1), rand(1, 1.8)], false));
  }
  for (let i = 0; i < 10; i++) {
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(6.5, 20), z = -rand(0, SEG), sc = rand(0.8, 1.4);
    if (!addEnv(g, 'PineTree_', x, z, sc * 1.3)) g.add(pineTree(x, z, sc));
  }
  for (let i = 0; i < 3; i++) addEnv(g, 'Rock_', (Math.random() < 0.5 ? -1 : 1) * rand(5.5, 12), -rand(0, SEG), rand(0.8, 1.6));
  for (let i = 0; i < 4; i++) { // yamaçlar
    const s = Math.random() < 0.5 ? -1 : 1, h = rand(14, 30);
    g.add(mesh(G.cone, M.cliff, [s * rand(24, 40), h / 2 - 2, -rand(0, SEG)], [rand(8, 14), h, rand(8, 14)], false));
    g.add(mesh(G.cone, M.white, [s * rand(24, 40), h - 3, -rand(0, SEG)], [3, 4, 3], false));
  }
  return g;
}

function segYeralti() {
  const g = empty();
  g.add(mesh(G.box, M.basalt, [0, -0.5, -SEG / 2], [9.2, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.lava, [x, 0.006, -SEG / 2], [0.1, 0.02, SEG], false));
  for (const s of [-1, 1]) {
    const lava = mesh(new THREE.PlaneGeometry(14, SEG), M.lava, [s * 11.6, -0.7, -SEG / 2], [1, 1, 1], false);
    lava.rotation.x = -Math.PI / 2;
    g.add(lava);
    g.add(mesh(G.box, M.spire, [s * 4.9, 0.2, -SEG / 2], [0.8, 0.5, SEG]));
    for (let i = 0; i < 4; i++) { // kara kaya kuleleri
      const h = rand(6, 20);
      g.add(mesh(G.cone, M.spire, [s * rand(18, 34), h / 2 - 1, -rand(0, SEG)], [rand(2, 4), h, rand(2, 4)], false));
    }
  }
  for (const z of [8, 23]) { // mangal ateşi
    const s = z === 8 ? 1 : -1;
    g.add(mesh(G.cyl, M.iron, [s * 4.5, 0.9, -z], [0.1, 1.8, 0.1]));
    g.add(mesh(G.cone, M.iron, [s * 4.5, 1.9, -z], [0.35, -0.4, 0.35]));
    const f = mesh(G.cone, M.flame, [s * 4.5, 2.3, -z], [0.25, 0.6, 0.25], false);
    g.userData.flames.push(f);
    g.add(f);
    const fl = new THREE.Sprite(M.glow);
    fl.scale.setScalar(2);
    fl.position.set(s * 4.5, 2.3, -z);
    g.add(fl);
  }
  for (let i = 0; i < 3; i++) { // kemik yığınları
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(5.5, 8), z = -rand(0, SEG);
    for (let k = 0; k < 5; k++) {
      const b = mesh(G.cyl, M.bone, [x + rand(-0.5, 0.5), 0.1, z + rand(-0.5, 0.5)], [0.05, rand(0.4, 0.8), 0.05], false);
      b.rotation.set(rand(0, 3), rand(0, 3), Math.PI / 2);
      g.add(b);
    }
  }
  return g;
}

function segGok() {
  const g = empty();
  for (let i = 0; i < 10; i++) { // bulut denizi
    g.add(mesh(G.dome, M.cloud, [rand(-40, 40), -14, -rand(0, SEG)], [rand(8, 16), rand(3, 6), rand(6, 12)], false));
  }
  for (let i = 0; i < 4; i++) { // yanda süzülen bulutlar
    const s = Math.random() < 0.5 ? -1 : 1;
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) c.add(mesh(G.dome, M.cloud, [rand(-2, 2), rand(-0.5, 0.5), rand(-2, 2)], [rand(1.5, 3), rand(1, 2), rand(1.5, 3)], false));
    c.position.set(s * rand(10, 25), rand(-4, 12), -rand(0, SEG));
    g.add(c);
  }
  return g;
}

// ---- İkinci Kısım: Çin surları ve saray yolu ----
Object.assign(M, {
  greystone: new THREE.MeshToonMaterial({ map: stoneTex, color: 0xaab0b8, gradientMap: GRAD }),
  greywall: new THREE.MeshToonMaterial({ map: wallTex, color: 0x9aa2ac, gradientMap: GRAD }),
  lacquer: toon(0xa3161f),
  jade: toon(0x2f6e5a),
  lampglow: new THREE.MeshBasicMaterial({ color: 0xffd27a }),
  jar: toon(0x7a4a2a),
  rice: toon(0xe8dcc0),
});
M.lampglow.userData.outlineParameters = NO_OUTLINE;

const ROOF = new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4); // kenarları eksenlere hizalı piramit

function pagoda(x, z, tiers) {
  if (ENV?.Pagoda) { // yapay zekâ modeli: kat sayısına göre boy (eski: kat başına 2.6 birim, taban 3.2)
    const o = ENV.Pagoda.clone(), h = new THREE.Box3().setFromObject(ENV.Pagoda).getSize(new THREE.Vector3()).y;
    o.scale.setScalar((tiers * 2.6 + 1.3) / h);
    o.rotation.y = rand(-0.4, 0.4);
    o.position.set(x, -9, z);
    return o;
  }
  const g = new THREE.Group();
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const w = 3.2 - i * 0.45;
    g.add(mesh(G.box, M.plaster, [0, y + 1, 0], [w, 2, w], false));
    g.add(mesh(new THREE.ConeGeometry(1, 1, 4), M.jade, [0, y + 2.3, 0], [w * 1.05, 0.8, w * 1.05], false));
    g.children[g.children.length - 1].rotation.y = Math.PI / 4;
    y += 2.6;
  }
  g.add(mesh(G.cone, M.gold, [0, y + 0.3, 0], [0.15, 1, 0.15], false));
  g.position.set(x, -9, z);
  return g;
}

function segCin() {
  const g = empty();
  g.add(mesh(G.box, M.greystone, [0, -0.5, -SEG / 2], [9.6, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.groove, [x, 0.005, -SEG / 2], [0.14, 0.02, SEG], false));
  for (const s2 of [-1, 1]) {
    g.add(mesh(G.box, M.greywall, [s2 * 5.6, -7, -SEG / 2], [1.2, 15, SEG], false));
    // kırmızı cilalı korkuluk
    g.add(mesh(G.box, M.lacquer, [s2 * 4.75, 0.95, -SEG / 2], [0.12, 0.12, SEG]));
    g.add(mesh(G.box, M.lacquer, [s2 * 4.75, 0.35, -SEG / 2], [0.1, 0.1, SEG]));
    for (let z = 0.75; z < SEG; z += 1.5) {
      g.add(mesh(G.box, M.lacquer, [s2 * 4.75, 0.55, -z], [0.16, 1.1, 0.16]));
      g.add(mesh(G.box, M.gold, [s2 * 4.75, 1.13, -z], [0.2, 0.06, 0.2], false));
    }
  }
  for (const z of [6, 21]) { // taş fener
    const s2 = z === 6 ? -1 : 1;
    g.add(mesh(G.box, M.greywall, [s2 * 4.2, 0.5, -z], [0.35, 1, 0.35]));
    g.add(mesh(G.box, M.lampglow, [s2 * 4.2, 1.2, -z], [0.45, 0.4, 0.45], false));
    g.add(mesh(new THREE.ConeGeometry(1, 1, 4), M.jade, [s2 * 4.2, 1.6, -z], [0.5, 0.4, 0.5]));
    const fl = new THREE.Sprite(M.glow);
    fl.scale.setScalar(1.4);
    fl.position.set(s2 * 4.2, 1.2, -z);
    g.add(fl);
  }
  // yolun üstünden geçen geçit kemeri (paifang): altından koşulur
  for (const s2 of [-1, 1]) g.add(mesh(G.cyl, M.lacquer, [s2 * 4.4, 3, -14], [0.28, 6, 0.28]));
  g.add(mesh(G.box, M.lacquer, [0, 5.3, -14], [9.6, 0.45, 0.45]));
  g.add(mesh(G.box, M.gold, [0, 5.75, -14], [8, 0.35, 0.3]));
  g.add(mesh(ROOF, M.jade, [0, 6.6, -14], [5.4, 1.4, 1])); // dikdörtgen piramit çatı
  for (let i = 0; i < 3; i++) g.add(pagoda((Math.random() < 0.5 ? -1 : 1) * rand(12, 32), -rand(0, SEG), 3 + Math.floor(Math.random() * 3)));
  return g;
}

// ---- Ak Geyik'in götürdüğü gizli yol: altın yapraklı kayın korusu (Hayat Ağacı'nın bahçesi) ----
Object.assign(M, {
  holy: toon(0xf3e2b0), meadow: toon(0x8ad05a), birch: toon(0xf4f1ea), birchMark: toon(0x2a2420),
  goldLeaf: toon(0xffcf3f), goldLeaf2: toon(0xffe07a),
  mote: new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0a0, blending: THREE.AdditiveBlending, depthWrite: false }),
  shaft: new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  // Karanlık Ülke
  tundra: toon(0x2a3240), frost: toon(0x9fb4cc), blackPine: toon(0x0c1418), dogSkull: toon(0xd8d0bc), pole: toon(0x3a2a1e),
  aurora: new THREE.MeshBasicMaterial({ color: 0x3aff9a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  aurora2: new THREE.MeshBasicMaterial({ color: 0x9a6aff, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
  blueFlame: new THREE.MeshBasicMaterial({ color: 0x6ad0ff }),
  // Erlik'in demirhanesi
  forgeFloor: toon(0x2a2226), anvil: toon(0x1e1c22), molten: new THREE.MeshBasicMaterial({ color: 0xffb02a }),
});
for (const k of ['mote', 'shaft', 'aurora', 'aurora2', 'blueFlame', 'molten']) M[k].userData.outlineParameters = NO_OUTLINE;

function birch(x, z, sc = 1) {
  const t = new THREE.Group();
  const h = rand(7, 11) * sc;
  t.add(mesh(G.cyl, M.birch, [0, h / 2, 0], [0.22 * sc, h, 0.22 * sc]));
  for (let i = 0; i < 5; i++) t.add(mesh(G.box, M.birchMark, [0, rand(0.8, h - 1), 0.2 * sc], [0.18 * sc, 0.08, 0.06], false));
  for (let i = 0; i < 4; i++) t.add(mesh(new THREE.IcosahedronGeometry(1, 0), i % 2 ? M.goldLeaf : M.goldLeaf2,
    [rand(-1.2, 1.2) * sc, h - rand(0, 2.5), rand(-1.2, 1.2) * sc], [rand(1.2, 2) * sc, rand(1, 1.6) * sc, rand(1.2, 2) * sc], false));
  t.position.set(x, 0, z);
  return t;
}

function segKoru() {
  const g = empty();
  g.add(mesh(G.box, M.holy, [0, -0.5, -SEG / 2], [8.6, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.goldLeaf, [x, 0.005, -SEG / 2], [0.1, 0.02, SEG], false));
  for (const s of [-1, 1]) g.add(mesh(G.box, M.meadow, [s * 30, -0.55, -SEG / 2], [52, 1, SEG], false));
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(5.5, 24), z = -rand(0, SEG), sc = rand(0.8, 1.3);
    if (!addEnv(g, 'BirchTree_', x, z, sc * 1.3)) g.add(birch(x, z, sc));
  }
  for (let i = 0; i < 8; i++) addEnv(g, pick3(['Bush_Flowers', 'Flower_2_Clump', 'Flower_4_Clump']), (Math.random() < 0.5 ? -1 : 1) * rand(4.6, 9), -rand(0, SEG), rand(1, 1.6));
  for (let i = 0; i < 3; i++) { // ışık huzmeleri
    const sh = mesh(new THREE.PlaneGeometry(3, 26), M.shaft, [(Math.random() < 0.5 ? -1 : 1) * rand(3, 9), 10, -rand(0, SEG)], [1, 1, 1], false);
    sh.rotation.z = 0.35;
    g.add(sh);
  }
  for (let i = 0; i < 6; i++) {
    const w = new THREE.Sprite(M.mote);
    w.scale.setScalar(0.35);
    w.position.set(rand(-6, 6), rand(0.8, 3.5), -rand(0, SEG));
    w.userData.base = w.position.y;
    g.userData.wisps.push(w);
    g.add(w);
  }
  return g;
}

// ---- Karanlık Ülke: kuzeyin donmuş tundrası, it kafatası totemleri, kuzey ışıkları ----
function segKaranlik() {
  const g = empty();
  g.add(mesh(G.box, M.tundra, [0, -0.5, -SEG / 2], [8.8, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.frost, [x, 0.005, -SEG / 2], [0.12, 0.02, SEG], false));
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.snow, [s * 22, -0.45, -SEG / 2], [26, 1, SEG], false));
    for (let z = 3; z < SEG; z += 7) { // it kafatası direkleri
      const x = s * rand(4.8, 5.6), zz = -z - rand(0, 3);
      g.add(mesh(G.cyl, M.pole, [x, 1.3, zz], [0.08, 2.6, 0.08]));
      g.add(mesh(new THREE.SphereGeometry(0.22, 8, 6), M.dogSkull, [x, 2.7, zz], [1, 0.85, 1.3]));
      const snout = mesh(G.cone, M.dogSkull, [x, 2.65, zz - 0.3], [0.12, 0.35, 0.1], false);
      snout.rotation.x = -Math.PI / 2;
      g.add(snout);
    }
    const f = mesh(G.cone, M.blueFlame, [s * 6.5, 0.6, -rand(4, 26)], [0.35, 1, 0.35], false); // ruh ateşi
    g.userData.flames.push(f);
    g.add(f);
  }
  for (let i = 0; i < 12; i++) { // kara çamlar
    const x = (Math.random() < 0.5 ? -1 : 1) * rand(7, 26), z = -rand(0, SEG), sc = rand(0.9, 1.6);
    if (!addEnv(g, 'PineTree_', x, z, sc * 1.4)) g.add(mesh(G.cone, M.blackPine, [x, 2.6 * sc, z], [1.3 * sc, 5.2 * sc, 1.3 * sc], false));
  }
  for (const s of [-1, 1]) { // kuzey ışıkları
    const a = mesh(new THREE.PlaneGeometry(60, 14), Math.random() < 0.5 ? M.aurora : M.aurora2, [s * 30, 26, -SEG / 2], [1, 1, 1], false);
    a.rotation.set(0.3, s * 1.2, 0.1 * s);
    g.add(a);
  }
  return g;
}

// ---- Kayın Ormanı (Altay'ın eteği): toprak yol, çayır, kayın-çam-akçaağaç, çalı, çiçek, kaya ----
Object.assign(M, { dirt: toon(0x9a7a52), grass: toon(0x6aa84a), bog: toon(0x1e3a2e) });
aiZemin(M.dirt, 'toprak', 4);
aiZemin(M.grass, 'cimen', 6);
function segOrman() {
  const g = empty();
  g.add(mesh(G.box, M.dirt, [0, -0.5, -SEG / 2], [8.6, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.groove, [x, 0.005, -SEG / 2], [0.12, 0.02, SEG], false));
  for (const s of [-1, 1]) g.add(mesh(G.box, M.grass, [s * 30, -0.5, -SEG / 2], [52, 1, SEG], false));
  if (!ENV) for (let i = 0; i < 10; i++) g.add(pineTree((Math.random() < 0.5 ? -1 : 1) * rand(6, 22), -rand(0, SEG), rand(0.8, 1.3)));
  for (let i = 0; i < 14; i++) addEnv(g, pick3(['BirchTree_', 'PineTree_', 'NormalTree_', 'MapleTree_']), (Math.random() < 0.5 ? -1 : 1) * rand(6, 26), -rand(0, SEG), rand(1.1, 1.6));
  for (let i = 0; i < 10; i++) addEnv(g, pick3(['Bush', 'Bush_Large', 'Bush_Flowers', 'Flower_2_Clump', 'Flower_4_Clump', 'Grass_Large', 'Plant_1']), (Math.random() < 0.5 ? -1 : 1) * rand(4.6, 10), -rand(0, SEG), rand(1, 1.8));
  for (let i = 0; i < 3; i++) addEnv(g, 'Rock_', (Math.random() < 0.5 ? -1 : 1) * rand(6, 14), -rand(0, SEG), rand(1, 2));
  return g;
}

// ---- Ölü Orman (bataklığın derini): kara su, kuru ağaç iskeletleri, hayalet ışıkları ----
function segOlu() {
  const g = segBataklik();
  for (let i = 0; i < 6; i++) addEnv(g, 'DeadTree_', (Math.random() < 0.5 ? -1 : 1) * rand(5, 14), -rand(0, SEG), rand(1.2, 1.8), rand(0, 6.3), -0.6);
  for (let i = 0; i < 3; i++) addEnv(g, 'Rock_', (Math.random() < 0.5 ? -1 : 1) * rand(5, 10), -rand(0, SEG), rand(0.8, 1.4), rand(0, 6.3), -0.5);
  return g;
}

// Kaya engeli (doğa paketinden), yoksa eski kaya
export function makeKaya() {
  const g = new THREE.Group();
  if (!addEnv(g, 'Rock_', 0, 0, rand(1.3, 1.6))) return makeSnowRock();
  return g;
}

const LINK = new THREE.TorusGeometry(0.18, 0.05, 6, 10);
// ---- Erlik'in demirhanesi: demir döşeme, örsler, erimiş maden olukları ----
function segDemirhane() {
  const g = empty();
  g.add(mesh(G.box, M.forgeFloor, [0, -0.5, -SEG / 2], [9, 1, SEG], false));
  for (const x of [-1.25, 1.25]) g.add(mesh(G.box, M.molten, [x, 0.006, -SEG / 2], [0.1, 0.02, SEG], false));
  for (const s of [-1, 1]) {
    const m = mesh(new THREE.PlaneGeometry(3, SEG), M.molten, [s * 6.2, -0.3, -SEG / 2], [1, 1, 1], false); // erimiş maden oluğu
    m.rotation.x = -Math.PI / 2;
    g.add(m, mesh(G.box, M.iron, [s * 4.7, 0.3, -SEG / 2], [0.4, 0.6, SEG]));
    for (let z = 5; z < SEG; z += 10) { // örs + zincir
      g.add(mesh(G.box, M.anvil, [s * 9, 0.6, -z], [1.4, 0.5, 0.7]), mesh(G.box, M.anvil, [s * 9, 0.2, -z], [0.6, 0.4, 0.5]));
      for (let k = 0; k < 6; k++) {
        const link = mesh(LINK, M.iron, [s * 7.5, 9 - k * 0.32, -z], [1, 1, 1], false);
        link.rotation.y = k % 2 ? Math.PI / 2 : 0;
        g.add(link);
      }
    }
    for (let i = 0; i < 3; i++) { // demir kuleler
      const h = rand(10, 22);
      g.add(mesh(G.box, M.anvil, [s * rand(14, 30), h / 2 - 1, -rand(0, SEG)], [rand(2, 4), h, rand(2, 4)], false));
    }
  }
  const f = mesh(G.cone, M.flame, [(Math.random() < 0.5 ? -1 : 1) * 9, 1.4, -rand(3, 27)], [0.4, 1.2, 0.4], false);
  g.userData.flames.push(f);
  g.add(f);
  return g;
}

const SEGMENTS = { surlar: segSurlar, bataklik: segBataklik, altay: segAltay, yeralti: segYeralti, gok: segGok, cin: segCin, koru: segKoru, karanlik: segKaranlik, demirhane: segDemirhane, tamu: segYeralti, orman: segOrman, olu: segOlu };
export const makeSegment = (theme = 'surlar') => SEGMENTS[theme]();

// ---- temaya özel engeller (hit: block = şerit değiştir, low = zıpla, high = kay) ----
function eskiStump() {
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.deadwood, [0, 0.7, 0], [0.75, 1.4, 0.75]));
  for (let i = 0; i < 5; i++) {
    const r = mesh(G.cone, M.deadwood, [Math.cos(i * 1.26) * 0.8, 0.25, Math.sin(i * 1.26) * 0.8], [0.18, 0.9, 0.18]);
    r.rotation.set(Math.sin(i * 1.26) * 1.1, 0, -Math.cos(i * 1.26) * 1.1);
    g.add(r);
  }
  return g;
}
function eskiBoat() {
  const g = new THREE.Group();
  const hull = mesh(new THREE.CylinderGeometry(1, 1, 2.2, 10, 1, true, 0, Math.PI), M.plank, [0, 0.9, 0], [0.95, 1, 0.9]);
  hull.rotation.set(0, 0, Math.PI);
  hull.material = M.plank;
  const h2 = hull.clone();
  h2.material = M.deadwood;
  h2.scale.multiplyScalar(0.97);
  g.add(hull, h2, mesh(G.box, M.deadwood, [0, 0.6, 0], [1.6, 0.1, 0.25]));
  g.rotation.y = Math.PI / 2 + 0.3;
  return g;
}
function eskiVine() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(mesh(G.cyl, M.deadwood, [s * 1.15, 0.45, 0], [0.1, 0.9, 0.1]));
  const v = mesh(new THREE.TorusGeometry(1.15, 0.07, 6, 16, Math.PI), M.reed, [0, 0.55, 0], [1, 0.12, 1]);
  g.add(v);
  for (let i = 0; i < 6; i++) g.add(mesh(G.cone, M.reed, [-0.9 + i * 0.36, 0.6, 0], [0.05, 0.25, 0.05]));
  return g;
}
function eskiLog() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(mesh(G.cyl, M.deadwood, [s * 1.2, 1.1, 0], [0.3, 2.2, 0.3]));
  const l = mesh(G.cyl, M.deadwood, [0, 2.05, 0], [0.32, 2.9, 0.32]);
  l.rotation.z = Math.PI / 2 + 0.08;
  g.add(l);
  for (let i = 0; i < 4; i++) g.add(mesh(G.cone, M.reed, [-0.9 + i * 0.6, 1.7, 0], [0.06, -0.6, 0.06]));
  return g;
}
function eskiSnowRock() {
  const g = new THREE.Group();
  const r = mesh(new THREE.DodecahedronGeometry(1, 0), M.cliff, [0, 0.8, 0], [1.1, 0.85, 0.9]);
  g.add(r, mesh(G.dome, M.white, [0, 1.35, 0], [0.85, 0.35, 0.7]));
  return g;
}
function eskiSled() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.wood, [0, 0.7, 0], [1.6, 0.25, 1.9]), mesh(G.box, M.hay, [0, 1.1, 0], [1.4, 0.6, 1.5]));
  for (const s of [-1, 1]) g.add(mesh(G.box, M.iron, [s * 0.75, 0.3, 0], [0.08, 0.6, 2.1]));
  return g;
}
function eskiFence() {
  const g = new THREE.Group();
  for (const x of [-1.1, 0, 1.1]) g.add(mesh(G.box, M.wood, [x, 0.4, 0], [0.12, 0.8, 0.12]));
  g.add(mesh(G.box, M.wood, [0, 0.55, 0], [2.4, 0.12, 0.08]), mesh(G.box, M.white, [0, 0.72, 0], [2.4, 0.1, 0.2]));
  return g;
}
function eskiPine() {
  const g = new THREE.Group();
  const l = eskiSnowRock().translateX(-1.1), r = eskiSnowRock().translateX(1.1);
  l.scale.setScalar(0.7); r.scale.setScalar(0.7);
  g.add(l, r);
  const t = mesh(G.cyl, M.deadwood, [0, 1.75, 0], [0.3, 2.7, 0.3]);
  t.rotation.z = Math.PI / 2;
  g.add(t, mesh(G.box, M.white, [0, 2.05, 0], [2.5, 0.12, 0.4]));
  return g;
}
function eskiBones() {
  const g = new THREE.Group();
  g.add(mesh(G.dome, M.spire, [0, 0, 0], [1.1, 0.5, 1]));
  for (let i = 0; i < 9; i++) {
    const b = mesh(G.cyl, M.bone, [rand(-0.7, 0.7), rand(0.3, 1.1), rand(-0.5, 0.5)], [0.06, rand(0.6, 1.1), 0.06]);
    b.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
    g.add(b);
  }
  g.add(mesh(new THREE.SphereGeometry(0.3, 10, 8), M.bone, [0, 1.3, 0.1])); // kafatası
  return g;
}
function eskiCage() {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(mesh(G.cyl, M.iron, [Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8], [0.05, 2, 0.05]));
  }
  g.add(mesh(G.cyl, M.iron, [0, 2, 0], [0.9, 0.12, 0.9]), mesh(G.cyl, M.iron, [0, 0.06, 0], [0.9, 0.12, 0.9]));
  return g;
}
function eskiSpikes() {
  const g = new THREE.Group();
  g.add(mesh(G.box, M.iron, [0, 0.08, 0], [2.3, 0.16, 0.5]));
  for (let i = 0; i < 7; i++) g.add(mesh(G.cone, M.iron, [-1 + i * 0.33, 0.4, 0], [0.09, 0.55, 0.09]));
  return g;
}
function eskiChain() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(mesh(G.box, M.spire, [s * 1.2, 1.4, 0], [0.3, 2.8, 0.3]));
  g.add(mesh(G.box, M.iron, [0, 2.7, 0], [2.7, 0.2, 0.2]));
  for (let i = 0; i < 5; i++) g.add(mesh(G.cyl, M.iron, [-0.9 + i * 0.45, 2.2, 0], [0.04, 0.9, 0.04]));
  g.add(mesh(new THREE.SphereGeometry(0.22, 8, 6), M.bone, [0, 1.7, 0]));
  return g;
}
function eskiLavaRock() {
  const g = eskiSnowRock();
  g.children[0].material = M.spire;
  g.children[1].material = M.lava;
  g.children[1].scale.set(0.5, 0.15, 0.4);
  return g;
}

// ---- boss saldırıları ----
export function makeIce() {
  const g = makeBoulder();
  g.userData.spin.material = M.ice;
  return g;
}
export function makeWave() { // Albastı'nın çığlık halkası
  const g = new THREE.Group();
  const r = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 20), M.ring);
  r.position.y = 1.2;
  g.add(r);
  g.userData.anim = t => r.scale.setScalar(1 + Math.sin(t * 20) * 0.1);
  return g;
}
export function makeShock() { // Erlik'in balyoz dalgası: yerde kızıl dalga, üstünden zıplanır
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.5), M.fire);
  w.position.y = 0.25;
  g.add(w);
  g.userData.anim = t => (w.scale.y = 1 + Math.sin(t * 30) * 0.2);
  return g;
}
export function makePillar() { // Erlik'in ateş sütunu: önce yerde halka, sonra alev
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 24), M.fire.clone());
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 7, 16, 1, true), M.fire);
  col.position.y = 3.5;
  col.visible = false;
  g.add(ring, col);
  g.userData.anim = t => {
    ring.material.opacity = t < 0.8 ? 0.4 + Math.abs(Math.sin(t * 14)) * 0.5 : 0;
    col.visible = t > 0.8 && t < 1.6;
    col.scale.x = col.scale.z = 1 + Math.sin(t * 25) * 0.08;
  };
  return g;
}
export function makeCloud() { // uçuşta fırtına bulutu
  const g = new THREE.Group();
  for (let k = 0; k < 5; k++) g.add(mesh(G.dome, M.storm, [rand(-0.6, 0.6), rand(-0.4, 0.2), rand(-0.6, 0.6)], [rand(0.8, 1.2), rand(0.7, 1), rand(0.8, 1.2)], false));
  const bolt = mesh(G.box, M.bolt, [0, -1, 0], [0.08, 1.2, 0.08], false);
  bolt.rotation.z = 0.3;
  g.add(bolt);
  g.userData.anim = t => (bolt.visible = Math.sin(t * 9) > 0.7);
  return g;
}
export function makeFeather() {
  const g = new THREE.Group();
  const f = mesh(new THREE.ConeGeometry(0.15, 1.1, 4), toon(0x15121a), [0, 0, 0], [1, 1, 0.3], false);
  f.rotation.x = Math.PI / 2;
  g.add(f);
  g.userData.anim = t => (f.rotation.z = t * 8);
  return g;
}

// ---- Çin Seferi engelleri ----
function eskiJars() { // şarap küpleri
  const g = new THREE.Group();
  for (const [x, y, z, r] of [[-0.5, 0.5, 0, 0.5], [0.5, 0.5, 0.1, 0.5], [0, 1.35, 0, 0.42]]) {
    g.add(mesh(new THREE.SphereGeometry(r, 12, 10), M.jar, [x, y, z], [1, 1.15, 1]));
    g.add(mesh(G.cyl, M.red, [x, y + r * 1.1, z], [r * 0.45, 0.12, r * 0.45]));
  }
  return g;
}
function eskiSupply() { // pirinç çuvallı erzak arabası
  const g = eskiCart();
  g.children[1].material = M.rice;
  g.add(mesh(G.box, M.lacquer, [0, 2.1, 0.3], [0.08, 1, 0.08]), mesh(G.box, M.lacquer, [0.3, 2.4, 0.3], [0.6, 0.4, 0.02]));
  return g;
}
function eskiLowGate() { // alçak kırmızı çit: üstünden zıplanır
  const g = new THREE.Group();
  for (const x of [-1.1, 1.1]) g.add(mesh(G.box, M.lacquer, [x, 0.4, 0], [0.14, 0.8, 0.14]));
  for (const y of [0.3, 0.6]) g.add(mesh(G.box, M.lacquer, [0, y, 0], [2.3, 0.1, 0.1]));
  for (let i = 0; i < 5; i++) g.add(mesh(G.box, M.gold, [-0.8 + i * 0.4, 0.45, 0], [0.05, 0.3, 0.05], false));
  return g;
}
function eskiBannerBeam() { // kırmızı sancak kirişi: altından eğilinir
  const g = new THREE.Group();
  for (const x of [-1.2, 1.2]) g.add(mesh(G.box, M.lacquer, [x, 1.4, 0], [0.2, 2.8, 0.2]));
  g.add(mesh(G.box, M.lacquer, [0, 2.65, 0], [2.7, 0.22, 0.22]));
  const cloth = mesh(new THREE.PlaneGeometry(2.1, 1.2), toon(0xc4202a, 'banner', { side: THREE.DoubleSide }), [0, 1.95, 0.02]);
  g.add(cloth, mesh(G.box, M.gold, [0, 1.95, 0.03], [0.5, 0.5, 0.01], false));
  return g;
}
export function makeCaltrops() { // generalin atından döktüğü demir dikenler: üstünden zıplanır
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const c = mesh(new THREE.TetrahedronGeometry(0.16), M.iron, [rand(-0.9, 0.9), 0.12, rand(-0.5, 0.5)]);
    c.rotation.set(rand(0, 3), rand(0, 3), 0);
    g.add(c);
  }
  return g;
}
export function makeBolt() { // okçuların oku: oyuncuya doğru uçar, altından eğilinir
  const g = makeArrow();
  g.rotation.y = Math.PI;
  const w = new THREE.Group();
  w.add(g);
  g.position.y = 1.5;
  return w;
}

// ---- görünürlük: mermilere parıltı + yerde tehlike halkası (karanlık haritalarda da seçilsin) ----
const hazardMats = {};
const HALO_RING = new THREE.RingGeometry(0.55, 0.85, 24);
export function hazardGlow(g, color, y = 1.2, size = 1.8) {
  const m = (hazardMats[color] ??= {
    halo: new THREE.SpriteMaterial({ map: dotTex, color, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95 }),
    ring: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  });
  m.halo.userData.outlineParameters = m.ring.userData.outlineParameters = NO_OUTLINE;
  const s = new THREE.Sprite(m.halo);
  s.scale.setScalar(size);
  s.position.y = y;
  s.renderOrder = 5;
  const r = new THREE.Mesh(HALO_RING, m.ring);
  r.rotation.x = -Math.PI / 2;
  r.position.y = 0.05;
  g.add(s, r);
  g.userData.halo = s;
  g.userData.haloRing = r;
}

// Şifalı kımız tulumu: nadir çıkar, bir can verir
const heartTex = tex(128, 128, (g, w) => {
  g.translate(w / 2, w / 2 + 6);
  g.beginPath();
  g.moveTo(0, 38);
  g.bezierCurveTo(-60, -4, -40, -52, 0, -22);
  g.bezierCurveTo(40, -52, 60, -4, 0, 38);
  g.fillStyle = '#e8283c';
  g.strokeStyle = '#15101c';
  g.lineWidth = 8;
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,.7)';
  g.beginPath(); g.ellipse(-20, -14, 9, 5, -0.7, 0, 7); g.fill();
});
const heartMat = new THREE.SpriteMaterial({ map: heartTex, depthWrite: false });
const kimizGlow = new THREE.SpriteMaterial({ map: dotTex, color: 0xff3a5a, blending: THREE.AdditiveBlending, depthWrite: false });
heartMat.userData.outlineParameters = kimizGlow.userData.outlineParameters = NO_OUTLINE;
export function makeKimiz() {
  const g = new THREE.Group();
  const v = new THREE.Group();
  v.add(mesh(new THREE.SphereGeometry(0.32, 14, 10), toon(0x8a5a2e, 'tulum'), [0, 0, 0], [1, 1.2, 0.8], false));
  v.add(mesh(G.cyl, toon(0x5a3417, 'tulumag'), [0, 0.45, 0], [0.09, 0.2, 0.09], false));
  v.add(mesh(G.cyl, M.red, [0, 0.12, 0], [0.33, 0.05, 0.27], false));
  v.position.y = 1.0;
  const h = new THREE.Sprite(heartMat);
  h.scale.setScalar(0.7);
  h.position.y = 1.95;
  const glow = new THREE.Sprite(kimizGlow);
  glow.scale.setScalar(2);
  glow.position.y = 1.2;
  g.add(v, h, glow);
  g.userData.anim = t => { v.rotation.y = t * 2.5; h.position.y = 1.95 + Math.sin(t * 5) * 0.12; h.scale.setScalar(0.7 + Math.sin(t * 8) * 0.06); };
  return g;
}

// Uçuşta boş hücreyi gösteren altın halka: içinden geçilir
const hoopMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9 });
hoopMat.userData.outlineParameters = { thickness: 0.004, color: [0.3, 0.18, 0], alpha: 1 };
const HOOP = new THREE.TorusGeometry(1.15, 0.07, 8, 32);
const hoopGlow = new THREE.SpriteMaterial({ map: dotTex, color: 0xffc83a, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.35 });
hoopGlow.userData.outlineParameters = NO_OUTLINE;
export function makeHoop() {
  const g = new THREE.Group();
  const r = new THREE.Mesh(HOOP, hoopMat);
  r.position.y = 1.6;
  const s = new THREE.Sprite(hoopGlow);
  s.scale.setScalar(2.4);
  s.position.y = 1.6;
  g.add(r, s);
  g.userData.anim = t => r.scale.setScalar(1 + Math.sin(t * 6) * 0.05);
  return g;
}

// ---- koşu sırasında toplanan destan eşyaları ----
const relicGlow = {};
function glowSprite(color, size, y) {
  const m = (relicGlow[color] ??= new THREE.SpriteMaterial({ map: dotTex, color, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.8 }));
  m.userData.outlineParameters = NO_OUTLINE;
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.position.y = y;
  return s;
}
const silver = toon(0xdfe6ee, 'silver');
const whiteBone = toon(0xf4efe0, 'whitebone');

// Mete'nin ıslıklı oku (vızlayan ok): kemik ıslıklı uç, beyaz parıltı
export function makeIslik() {
  const g = new THREE.Group();
  const v = makeArrow();
  v.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), whiteBone, [0, 0, -0.5], [1, 1, 1.4], false));
  v.scale.setScalar(1.3);
  v.rotation.x = -0.6;
  v.position.y = 1.3;
  g.add(v, glowSprite(0xffffff, 2, 1.3));
  g.userData.anim = t => { v.rotation.y = t * 3; v.position.y = 1.3 + Math.sin(t * 4) * 0.15; };
  return g;
}
// Uluğ Türük'ün rüyasındaki altın yay
export function makeAltinYay() {
  const g = new THREE.Group();
  const v = new THREE.Group();
  const arc = mesh(new THREE.TorusGeometry(0.62, 0.05, 6, 24, Math.PI * 0.9), M.gold, [0, 0, 0], [1, 1, 1], false);
  arc.rotation.z = Math.PI * 0.05;
  const str = mesh(G.box, toon(0xfff2c0, 'string'), [0.03, 0, 0], [0.015, 1.18, 0.015], false);
  str.position.x = Math.cos(Math.PI * 0.95) * 0.0;
  v.add(arc, str);
  v.position.y = 2.1;
  g.add(v, glowSprite(0xffc83a, 2.4, 2.1));
  g.userData.anim = t => { v.rotation.y = t * 2.2; v.position.y = 2.1 + Math.sin(t * 4) * 0.12; };
  return g;
}
// Rüyadaki üç gümüş oktan biri
export function makeGumusOk() {
  const g = new THREE.Group();
  const v = makeArrow();
  v.traverse(o => { if (o.isMesh) o.material = silver; });
  v.scale.setScalar(1.2);
  v.rotation.x = Math.PI / 2 - 0.3;
  v.position.y = 2.1;
  g.add(v, glowSprite(0xbfe0ff, 2, 2.1));
  g.userData.anim = t => { v.rotation.z = t * 3; v.position.y = 2.1 + Math.sin(t * 4) * 0.12; };
  return g;
}
// Tanrı Kılıcı: topal düvenin kan izinin sonunda, ucu toprağa gömülü kızıl parıltılı kılıç
const bloodMat = new THREE.MeshBasicMaterial({ color: 0x8e0a14 });
bloodMat.userData.outlineParameters = NO_OUTLINE;
export function makeTanriKilici() {
  const g = new THREE.Group();
  const s = new THREE.Group();
  s.add(mesh(G.box, toon(0xf0f4ff, 'godblade', { emissive: 0x6a0a0a }), [0, 0.55, 0], [0.12, 1.2, 0.03], false));
  s.add(mesh(G.box, M.gold, [0, 1.2, 0], [0.5, 0.07, 0.08], false));
  s.add(mesh(G.cyl, M.wood, [0, 1.42, 0], [0.04, 0.36, 0.04], false));
  s.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), M.gold, [0, 1.63, 0], [1, 1, 1], false));
  s.rotation.z = 0.12;
  const crack = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), bloodMat);
  crack.rotation.x = -Math.PI / 2;
  crack.position.y = 0.03;
  g.add(s, crack, glowSprite(0xff2a2a, 3, 1.1));
  g.userData.anim = t => (g.children[2].scale.setScalar(2.6 + Math.sin(t * 6) * 0.5));
  return g;
}
// Kan izi damlaları (kılıca giden yol)
export function makeKan() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(rand(0.08, 0.16), 10), bloodMat);
    d.rotation.x = -Math.PI / 2;
    d.position.set(rand(-0.35, 0.35), 0.03, rand(-1.2, 1.2));
    g.add(d);
  }
  return g;
}
export { glowSprite };

// Erlik'in örsü: her çekiç vuruşundan sonra akkor kesilir (o an okla vurulur)
export function makeAnvil() {
  const g = new THREE.Group();
  const hot = new THREE.MeshBasicMaterial({ color: 0xff8a1a });
  hot.userData.outlineParameters = NO_OUTLINE;
  const top = mesh(G.box, M.anvil, [0, 1.7, 0], [3.4, 0.7, 1.4]);
  g.add(mesh(G.box, M.anvil, [0, 0.6, 0], [1.4, 1.2, 1]), top, mesh(G.cone, M.anvil, [2.3, 1.75, 0], [0.5, 1.4, 0.5], false));
  g.children[2].rotation.z = -Math.PI / 2;
  const glow = glowSprite(0xff7a1a, 5, 2.1);
  g.add(glow);
  g.userData.hot = on => { top.material = on ? hot : M.anvil; glow.visible = on; };
  g.userData.hot(false);
  return g;
}

// ================= Koşu içi bölümler: uçurumdan iniş, kartal, sal, buzda kayma =================
const riverTex = tex(256, 256, (g, w, h) => {
  g.fillStyle = '#1f5a66';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(200,245,255,.35)';
  g.lineWidth = 3;
  for (let i = 0; i < 46; i++) { // akıntı çizgileri (boylamasına)
    const x = Math.random() * w, y = Math.random() * h;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 5, y + 14, x, y + 30); g.stroke();
  }
}, 10, SEG / 6);
const lakeTex = tex(256, 256, (g, w, h) => { // donmuş göl: mavi buz, beyaz çatlaklar
  g.fillStyle = '#a8d8ec';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, rand(10, 60), 3); }
  g.strokeStyle = 'rgba(255,255,255,.7)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    let x = Math.random() * w, y = Math.random() * h;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += rand(-25, 25); y += rand(-25, 25); g.lineTo(x, y); }
    g.stroke();
  }
}, 3, SEG / 6);
const rockTex = aiDoku(tex(256, 256, (g, w, h) => { // uçurum kayası: katmanlı, çatlaklı
  g.fillStyle = '#4a4240';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = shade(0x7a6e66, 0.6 + Math.random() * 0.5);
    const x = Math.random() * w, y = Math.random() * h, r = rand(10, 34);
    g.beginPath();
    for (let k = 0; k < 6; k++) g.lineTo(x + Math.cos(k * 1.05) * r * rand(0.7, 1.3), y + Math.sin(k * 1.05) * r * rand(0.5, 1));
    g.fill();
  }
  g.strokeStyle = 'rgba(20,12,10,.6)';
  g.lineWidth = 2;
  for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(Math.random() * w, 0); g.lineTo(Math.random() * w, h); g.stroke(); }
}, 2, SEG / 8), 'kaya');
const whirlTex = tex(128, 128, (g, w) => { // girdap sarmalı
  g.translate(w / 2, w / 2);
  g.strokeStyle = 'rgba(220,250,255,.9)';
  g.lineWidth = 5;
  for (let arm = 0; arm < 3; arm++) {
    g.beginPath();
    for (let a = 0; a < 9; a += 0.2) { const r = 4 + a * 6.5, t = a + arm * 2.09; g.lineTo(Math.cos(t) * r, Math.sin(t) * r); }
    g.stroke();
  }
});
Object.assign(M, {
  river: new THREE.MeshToonMaterial({ map: riverTex, gradientMap: GRAD }),
  lake: new THREE.MeshToonMaterial({ map: lakeTex, gradientMap: GRAD }),
  well: new THREE.MeshToonMaterial({ map: rockTex, gradientMap: GRAD }),
  bark: toon(0x6e4a28), twine: toon(0xcaa86a), root: toon(0x3a2616), crystal: new THREE.MeshBasicMaterial({ color: 0x8ae0ff }),
  whirl: new THREE.MeshBasicMaterial({ map: whirlTex, transparent: true, depthWrite: false, color: 0xbff4ff }),
  crack: new THREE.MeshBasicMaterial({ color: 0x0e2a3a }),
});
for (const k of ['crystal', 'whirl', 'crack']) M[k].userData.outlineParameters = NO_OUTLINE;
// akıntı: su dokusu akar (her karede çağrılır)
export function flowWater(dt) { riverTex.offset.y -= dt * 0.9; }

// Uçurumdan iniş: kamera arkadan-yukarıdan bakar, dünya -z yönünde "aşağı" akar. Dört duvarlı derin kuyu.
function segKuyu() {
  const g = empty();
  const W2 = 4.1, Y0 = 1.1, Y1 = 9.2; // iç ölçüler: 3 şerit x 3 yükseklik
  g.add(mesh(G.box, M.well, [0, Y0 - 1, -SEG / 2], [W2 * 2 + 2, 2, SEG], false));
  g.add(mesh(G.box, M.well, [0, Y1 + 1, -SEG / 2], [W2 * 2 + 2, 2, SEG], false));
  for (const s of [-1, 1]) g.add(mesh(G.box, M.well, [s * (W2 + 1), (Y0 + Y1) / 2, -SEG / 2], [2, Y1 - Y0 + 4, SEG], false));
  for (let i = 0; i < 10; i++) { // duvardan çıkan kaya dişleri ve sarkan kökler (süs)
    const side = i % 4, z = -rand(0, SEG);
    const pos = [[-W2, rand(Y0, Y1)], [W2, rand(Y0, Y1)], [rand(-W2, W2), Y0], [rand(-W2, W2), Y1]][side];
    g.add(mesh(new THREE.DodecahedronGeometry(1, 0), M.well, [pos[0], pos[1], z], [rand(0.4, 0.8), rand(0.4, 0.8), rand(0.8, 1.6)], false));
    if (i % 3 === 0) {
      const root = mesh(G.cyl, M.root, [pos[0] * 0.9, pos[1], z - 1], [0.07, rand(1.5, 3), 0.07], false);
      root.rotation.set(rand(-1, 1), 0, rand(-1, 1));
      g.add(root);
    }
  }
  for (let i = 0; i < 4; i++) { // parlayan kristaller: derinliği okutur
    const s = Math.random() < 0.5 ? -1 : 1, z = -rand(0, SEG), y = rand(Y0 + 0.5, Y1 - 0.5);
    g.add(mesh(new THREE.OctahedronGeometry(0.3, 0), M.crystal, [s * (W2 - 0.1), y, z], [1, 2, 1], false));
    const gl = new THREE.Sprite(M.glow);
    gl.scale.setScalar(2.2);
    gl.position.set(s * (W2 - 0.4), y, z);
    g.add(gl);
  }
  return g;
}

// Kartal taşıması: derin vadi, dipte akan ırmak
function segVadi() {
  const g = empty();
  const water = mesh(new THREE.PlaneGeometry(60, SEG), M.river, [0, -32, -SEG / 2], [1, 1, 1], false);
  water.rotation.x = -Math.PI / 2;
  g.add(water);
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.cliff, [s * rand(17, 19), -16, -SEG / 2], [8, 34, SEG + 0.5], false));
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.DodecahedronGeometry(1, 0), M.cliff, [s * rand(12, 14), rand(-30, -4), -rand(0, SEG)], [rand(2, 4), rand(3, 6), rand(3, 5)], false));
    for (let i = 0; i < 4; i++) {
      const x = s * rand(14, 22), z = -rand(0, SEG);
      if (!addEnv(g, 'PineTree_', x, z, rand(1.2, 1.8), rand(0, 6.3), 1)) g.add(pineTree(x, z, 1.2).translateY(1));
    }
  }
  return g;
}

// Sal: geniş ırmak, iki yanda kıyı ve orman
function segNehir() {
  const g = empty();
  const water = mesh(new THREE.PlaneGeometry(26, SEG), M.river, [0, -0.35, -SEG / 2], [1, 1, 1], false);
  water.rotation.x = -Math.PI / 2;
  g.add(water);
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.dirt, [s * 7.2, -0.3, -SEG / 2], [2, 0.8, SEG], false));
    g.add(mesh(G.box, M.grass, [s * 22, 0.1, -SEG / 2], [28, 1, SEG], false));
    for (let i = 0; i < 6; i++) {
      const x = s * rand(9, 22), z = -rand(0, SEG);
      if (!addEnv(g, pick3(['PineTree_', 'BirchTree_', 'NormalTree_']), x, z, rand(1.1, 1.6), rand(0, 6.3), 0.6)) g.add(pineTree(x, z, 1).translateY(0.6));
    }
    for (let i = 0; i < 5; i++) { // kıyı sazları
      const x = s * rand(6.4, 8), z = -rand(0, SEG);
      for (let k = 0; k < 3; k++) g.add(mesh(G.cone, M.reed, [x + rand(-0.3, 0.3), 0.3, z + rand(-0.3, 0.3)], [0.06, rand(0.9, 1.5), 0.06], false));
    }
    addEnv(g, 'Rock_', s * rand(6.5, 8), -rand(0, SEG), rand(0.6, 1), rand(0, 6.3), -0.2);
  }
  return g;
}

// Buzda kayma: Altay'da donmuş göl
function segBuzgol() {
  const g = empty();
  g.add(mesh(G.box, M.lake, [0, -0.5, -SEG / 2], [30, 1, SEG], false));
  for (const s of [-1, 1]) {
    g.add(mesh(G.box, M.snow, [s * 26, -0.2, -SEG / 2], [22, 1, SEG], false));
    for (let z = 2; z < SEG; z += 5) g.add(mesh(G.dome, M.white, [s * rand(14.5, 16), 0, -z - rand(0, 2)], [rand(1.4, 2.4), rand(0.6, 1.1), rand(1.4, 2.4)], false));
    for (let i = 0; i < 5; i++) {
      const x = s * rand(17, 26), z = -rand(0, SEG);
      if (!addEnv(g, 'PineTree_', x, z, rand(1.3, 1.9))) g.add(pineTree(x, z, 1.2));
    }
    const h = rand(18, 30);
    g.add(mesh(G.cone, M.cliff, [s * rand(34, 46), h / 2 - 2, -rand(0, SEG)], [rand(8, 14), h, rand(8, 14)], false));
  }
  return g;
}
Object.assign(SEGMENTS, { kuyu: segKuyu, vadi: segVadi, nehir: segNehir, buzgol: segBuzgol });

// ---- bölüm engelleri ----
export function makeLedge() { // kuyuda duvardan çıkan kaya çıkıntısı: bir hücreyi kapatır
  const g = new THREE.Group();
  g.add(mesh(new THREE.DodecahedronGeometry(1, 0), M.well, [0, 0, 0], [1.25, 1.15, 0.7], false));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.DodecahedronGeometry(1, 0), M.well, [rand(-0.7, 0.7), rand(-0.7, 0.7), 0.2], [0.5, 0.5, 0.5], false));
  return g;
}
export function makeRoots() { // kuyuya sarkan kök yumağı
  const g = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const r = mesh(G.cyl, M.root, [rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.2, 0.2)], [rand(0.06, 0.12), 2.5, rand(0.06, 0.12)], false);
    r.rotation.set(0, 0, (i / 7) * Math.PI + rand(-0.2, 0.2));
    g.add(r);
  }
  return g;
}
export function makeKutuk() { // ırmakta yüzen kütük: üstünden zıplanır
  const g = new THREE.Group();
  const l = mesh(G.cyl, M.bark, [0, 0.05, 0], [0.38, 2.4, 0.38]);
  l.rotation.z = Math.PI / 2;
  g.add(l);
  for (const s of [-1, 1]) g.add(mesh(G.cyl, M.twine, [s * 0.8, 0.05, 0], [0.4, 0.06, 0.4], false).rotateZ(Math.PI / 2));
  g.userData.anim = t => (g.rotation.z = Math.sin(t * 2) * 0.05);
  return g;
}
export function makeRiverRock() {
  const g = new THREE.Group();
  if (!addEnv(g, 'Rock_', 0, 0, rand(1.1, 1.4), rand(0, 6.3), -0.4)) g.add(mesh(new THREE.DodecahedronGeometry(1, 0), M.cliff, [0, 0.4, 0], [1, 0.9, 0.9]));
  return g;
}
export function makeGirdap() { // girdap: dönen sarmal, içine girilmez
  const g = new THREE.Group();
  const d = new THREE.Mesh(new THREE.CircleGeometry(1.3, 28), M.whirl);
  d.rotation.x = -Math.PI / 2;
  d.position.y = -0.2;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16), M.crack);
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = -0.18;
  g.add(d, hole);
  g.userData.anim = t => (d.rotation.z = t * 5);
  return g;
}
export function makeSal(w = 2.2, l = 3) { // bağlı kütüklerden sal
  const g = new THREE.Group();
  const n = Math.round(w / 0.42);
  for (let i = 0; i < n; i++) g.add(mesh(G.cyl, M.bark, [-w / 2 + 0.21 + i * 0.42, -0.2, 0], [0.21, l, 0.21]).rotateX(Math.PI / 2));
  for (const z of [-l / 2 + 0.3, l / 2 - 0.3]) g.add(mesh(G.box, M.twine, [0, 0.02, z], [w + 0.1, 0.06, 0.12], false));
  return g;
}
export function makeCatlak() { // çatlak buz: altında kara su, üstünden zıplanır
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.9), M.crack);
  c.rotation.x = -Math.PI / 2;
  c.position.y = 0.02;
  g.add(c);
  for (let i = 0; i < 5; i++) g.add(mesh(new THREE.BoxGeometry(rand(0.3, 0.6), 0.12, rand(0.2, 0.4)), M.white, [rand(-1.1, 1.1), 0.06, (i % 2 ? 1 : -1) * 0.5], [1, 1, 1], false));
  return g;
}
function eskiBuzkule() { // buz sarkıtı yığını: şerit değiştir
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.ConeGeometry(0.35, 1, 5), M.ice, [rand(-0.6, 0.6), 0.9, rand(-0.3, 0.3)], [1, rand(1.4, 2.4), 1]));
  g.add(mesh(G.dome, M.white, [0, 0, 0], [1, 0.4, 0.8]));
  return g;
}
export function makeShieldBoard() { // Oğuz'un üstünde kaydığı yuvarlak kalkan
  const g = new THREE.Group();
  g.add(mesh(G.cyl, M.iron, [0, 0.03, 0], [0.68, 0.05, 0.68]), mesh(G.cyl, M.wood, [0, 0.07, 0], [0.6, 0.06, 0.6]), mesh(G.dome, M.gold, [0, 0.1, 0], [0.16, 0.1, 0.16]));
  return g;
}

// ---- kombo: altın tamga halkası (yolda dikey halka; içinden geçilir) ----
const tamgaTex = tex(128, 128, (g, w) => { // Kayı boyunun tamgası: iki yana açılan ok ve ortada dikme
  g.clearRect(0, 0, w, w);
  g.strokeStyle = '#15101c'; g.lineWidth = 22; g.lineCap = 'round'; g.lineJoin = 'round';
  const path = () => { g.beginPath(); g.moveTo(24, 30); g.lineTo(44, 98); g.moveTo(104, 30); g.lineTo(84, 98); g.moveTo(64, 20); g.lineTo(64, 110); g.stroke(); };
  path();
  g.strokeStyle = '#ffd23f'; g.lineWidth = 12;
  path();
});
const tamgaMat = new THREE.SpriteMaterial({ map: tamgaTex, depthWrite: false });
tamgaMat.userData.outlineParameters = NO_OUTLINE;
const tamgaRingMat = new THREE.MeshBasicMaterial({ color: 0xffc21a });
tamgaRingMat.userData.outlineParameters = { thickness: 0.005, color: [0.3, 0.18, 0], alpha: 1 };
const TAMGA_RING = new THREE.TorusGeometry(1.25, 0.11, 8, 36);
export function makeTamga() {
  const g = new THREE.Group();
  const r = new THREE.Mesh(TAMGA_RING, tamgaRingMat);
  r.position.y = 1.45;
  const s = new THREE.Sprite(tamgaMat);
  s.scale.setScalar(0.9);
  s.position.y = 3.2;
  g.add(r, s);
  g.userData.anim = t => { r.rotation.z = Math.sin(t * 2) * 0.08; s.position.y = 3.2 + Math.sin(t * 4) * 0.08; };
  return g;
}

// ---- kırılabilir ahşap engeller: çatlak dokuyla belli olur ----
const crackTex = tex(128, 128, (g, w) => {
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, w);
  g.strokeStyle = '#2a1608'; g.lineWidth = 3; g.lineCap = 'round';
  for (let k = 0; k < 3; k++) { // kırık çizgiler dallanır
    let x = 20 + Math.random() * 88, y = 4;
    g.beginPath(); g.moveTo(x, y);
    while (y < w - 4) {
      x += rand(-16, 16); y += rand(10, 22);
      g.lineTo(x, y);
      if (Math.random() < 0.35) { g.moveTo(x, y); g.lineTo(x + rand(-22, 22), y + rand(8, 18)); g.moveTo(x, y); }
    }
    g.stroke();
  }
});
const cracked = new Map();
const eskiDoku = t => t.image instanceof HTMLCanvasElement && !t.image.dataset?.ai;
export function crackify(obj) {
  obj.traverse(o => {
    if (!o.isMesh || !o.material?.isMeshToonMaterial) return;
    if (!cracked.has(o.material)) {
      const m = o.material.clone();
      if (m.map) { // dokulu ahşap: çatlak çizgileri dokunun üstüne çizilir
        const c = document.createElement('canvas'), img = m.map.image;
        c.width = img.width; c.height = img.height;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        g.globalCompositeOperation = 'multiply';
        g.globalAlpha = eskiDoku(m.map) ? 1 : 0.55; // yapay zekâ modelinin doku atlasında çatlak hafif kalsın
        g.drawImage(crackTex.image, 0, 0, c.width, c.height);
        const eski = m.map;
        m.map = new THREE.CanvasTexture(c);
        m.map.flipY = eski.flipY; // glTF dokuları ters durur
        m.map.colorSpace = THREE.SRGBColorSpace;
        m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping;
      } else m.map = crackTex;
      cracked.set(o.material, m);
    }
    o.material = cracked.get(o.material);
  });
  return obj;
}

// Kırılınca saçılan tahta parçaları
const chipMat = toon(0x8a5a2a, 'chip');
export function makeChips(n = 8) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(G.box, chipMat);
    m.scale.set(rand(0.12, 0.35), rand(0.06, 0.12), rand(0.2, 0.5));
    m.userData.v = new THREE.Vector3(rand(-4, 4), rand(3, 7), rand(-3, 3));
    m.userData.r = new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9));
    g.add(m);
  }
  return g;
}

// ================= İNİŞ-ÇIKIŞ: yükselen sur yolları, rampalar ve uçurumlar =================
// Parça dünyada zA'dan (yakın uç) zA - len'e uzanır. h0: yakın uçtaki, h1: uzak uçtaki yükseklik.
// Dokular kutu izdüşümüyle metre başına yerleşir (her parçanın boyu farklı).
const TW = 8.4; // parçanın genişliği: üç şerit + kenar
const reTex = (t, r = 1) => { const c = t.clone(); c.repeat.set(r, r); c.needsUpdate = true; KOPYA.set(t, [...(KOPYA.get(t) || []), c]); return c; };
const TSTYLE = {
  sur: { top: new THREE.MeshToonMaterial({ map: reTex(stoneTex), gradientMap: GRAD }), side: new THREE.MeshToonMaterial({ map: reTex(wallTex), gradientMap: GRAD }), ts: [3.2, 2.2], pit: 0x07050a },
  tahta: { top: new THREE.MeshToonMaterial({ map: reTex(plankTex), gradientMap: GRAD }), side: toon(0x2a2018, 'tside'), ts: [2.6, 2.6], pit: 0x07140f },
  kar: { top: new THREE.MeshToonMaterial({ map: reTex(snowTex), gradientMap: GRAD }), side: new THREE.MeshToonMaterial({ map: reTex(rockTex), gradientMap: GRAD, color: 0x9aa6c0 }), ts: [3, 3], pit: 0x0a1626 },
  kaya: { top: new THREE.MeshToonMaterial({ map: reTex(rockTex), gradientMap: GRAD, color: 0xa8b890 }), side: new THREE.MeshToonMaterial({ map: reTex(rockTex), gradientMap: GRAD }), ts: [3, 3], pit: 0x080a06 },
  bazalt: { top: new THREE.MeshToonMaterial({ map: reTex(basaltTex), gradientMap: GRAD }), side: new THREE.MeshToonMaterial({ map: reTex(basaltTex), gradientMap: GRAD, color: 0x8a7070 }), ts: [3, 3], pit: 0xff4a0a, lava: true },
};
function boxUV(geo, ts) {
  geo.computeVertexNormals();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / ts, p.getZ(i) / ts);
    else if (ax >= az) uv.setXY(i, p.getZ(i) / ts, p.getY(i) / ts);
    else uv.setXY(i, p.getX(i) / ts, p.getY(i) / ts);
  }
  uv.needsUpdate = true;
}
export function makeTerrain(style, len, h0, h1) {
  const S = TSTYLE[style];
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.05); sh.lineTo(len, -0.05); sh.lineTo(len, h1); sh.lineTo(0, h0); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: TW, bevelEnabled: false });
  geo.rotateY(Math.PI / 2);
  geo.translate(-TW / 2, 0, 0);
  boxUV(geo, S.ts[0]);
  const m = new THREE.Mesh(geo, [S.side, S.top]);
  m.receiveShadow = true;
  g.add(m);
  const hAt = u => h0 + (h1 - h0) * (u / len);
  // kenar süsleri: surda mazgallar, iskelede korkuluk direkleri
  if (style === 'sur') for (let u = 0.9; u < len - 0.4; u += 3) for (const s of [-1, 1]) g.add(mesh(G.box, S.side, [s * (TW / 2 - 0.3), hAt(u) + 0.3, -u], [0.55, 0.6, 1]));
  if (style === 'tahta') for (let u = 1; u < len; u += 3) for (const s of [-1, 1]) g.add(mesh(G.cyl, M.deadwood, [s * (TW / 2 - 0.2), hAt(u) + 0.45, -u], [0.09, 0.9, 0.09]));
  if (style === 'kar') for (let u = 2; u < len; u += 5) g.add(mesh(G.dome, M.white, [(Math.random() < 0.5 ? -1 : 1) * (TW / 2 - 0.4), hAt(u), -u], [0.7, 0.35, 0.9], false));
  return g;
}
// Uçurum: yolun üstüne serilen karanlık boşluk (Yeraltı'nda kor lav). Kenarlarında kırık taşlar.
const pitMats = {};
const abyssTex = tex(16, 128, (g, w, h) => { // uçurum duvarı: yukarıda kaya rengi, aşağı indikçe kapkara
  const r = g.createLinearGradient(0, 0, 0, h);
  r.addColorStop(0, '#3a302a'); r.addColorStop(0.35, '#120d0c'); r.addColorStop(1, '#000');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
const abyssMat = new THREE.MeshBasicMaterial({ map: abyssTex });
abyssMat.userData.outlineParameters = NO_OUTLINE;
export function makePit(style, len, h = 0) {
  const S = TSTYLE[style];
  const mat = (pitMats[style] ??= new THREE.MeshBasicMaterial({ color: S.pit }));
  mat.userData.outlineParameters = NO_OUTLINE;
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.PlaneGeometry(9.8, len), mat);
  p.rotation.x = -Math.PI / 2;
  p.position.set(0, 0.015, -len / 2);
  g.add(p);
  if (S.lava) { const s = new THREE.Sprite(M.glow); s.scale.set(9, 3, 1); s.position.set(0, 0.6, -len / 2); g.add(s); }
  if (h > 0 && !S.lava) { // yükseltideki uçurum: karşı duvar karanlığa iner, dip görünmez
    const w = new THREE.Mesh(new THREE.PlaneGeometry(TW + 0.2, h), abyssMat);
    w.position.set(0, h / 2, -len + 0.03);
    g.add(w);
    p.material = abyssMat.clone(); p.material.map = null; p.material.color.set(0x000000);
  }
  for (const e of [0, -len]) for (let x = -4.4; x <= 4.4; x += rand(0.6, 1.1)) {
    const r = mesh(new THREE.DodecahedronGeometry(rand(0.18, 0.34)), S.side, [x, 0.04, e + (e ? 0.12 : -0.12)], [1, 0.5, 1], false);
    r.rotation.set(rand(0, 3), rand(0, 3), 0);
    g.add(r);
  }
  return g;
}

// ================= Düşmanın üstündeki eylem simgesi: ▼ KAY (mavi) ve ▲ ZIPLA (sarı) =================
const iconTex = (dir, fill) => tex(128, 128, (g, w) => {
  g.fillStyle = fill;
  g.strokeStyle = '#15101c';
  g.lineWidth = 8;
  g.beginPath(); g.arc(w / 2, w / 2, 56, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#fff';
  g.strokeStyle = '#15101c';
  g.lineWidth = 5;
  for (const k of [0, 1]) { // iki kat ok
    const y = dir > 0 ? 70 - k * 30 : 42 + k * 30;
    g.beginPath(); g.moveTo(30, y + dir * 14); g.lineTo(64, y - dir * 14); g.lineTo(98, y + dir * 14); g.lineTo(98, y + dir * 28); g.lineTo(64, y); g.lineTo(30, y + dir * 28); g.closePath();
    g.fill(); g.stroke();
  }
});
const ICONS = { kay: iconTex(-1, '#1f8fd6'), zipla: iconTex(1, '#f0a818') };
export function makeActIcon(kind) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ICONS[kind], depthTest: false }));
  s.material.userData.outlineParameters = NO_OUTLINE;
  s.renderOrder = 20;
  s.scale.setScalar(1);
  return s;
}

// ================= IŞIN (SMU'daki lazer): yolun kenarındaki kam totemi üç şeridi kapatan ışın salar =================
// İnce ışın (göğüs hizası): altından kay ya da üstünden zıpla. Kalın ışın (diz hizası, kalın): yalnız zıplanır.
// color: bölgenin rengi (kara şimşek, ayaz, yalın ateş...)
const beamMats = {};
export function makeIsin(color, thick, side) {
  const g = new THREE.Group();
  const m = (beamMats[color] ??= {
    core: new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false }),
    glow: new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
    halo: new THREE.SpriteMaterial({ map: dotTex, color, blending: THREE.AdditiveBlending, depthWrite: false }),
  });
  for (const k in m) m[k].userData.outlineParameters = NO_OUTLINE;
  const y = thick ? 0.5 : 1.05, r = thick ? 0.36 : 0.1, L = 9.4;
  // totem: taş dikme, üstünde boynuzlu baş; ağzından ışın çıkar
  const tx = side * 4.75;
  const totem = new THREE.Group();
  totem.add(mesh(G.oct, M.spire, [0, 1.1, 0], [0.32, 2.2, 0.32]), mesh(G.box, M.spire, [0, 2.35, 0], [0.55, 0.45, 0.45]));
  for (const s of [-1, 1]) { const h = mesh(G.cone, M.bone, [s * 0.32, 2.7, 0], [0.08, 0.5, 0.08]); h.rotation.z = -s * 0.5; totem.add(h); }
  const eye = new THREE.Sprite(m.halo);
  eye.scale.setScalar(0.9);
  eye.position.set(-side * 0.3, y, 0);
  totem.add(mesh(G.cyl, M.spire, [-side * 0.15, y, 0], [0.22, 0.3, 0.22]), eye);
  totem.position.x = tx;
  g.add(totem);
  const beam = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, L, 8), m.core);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), m.glow);
  for (const c of [core, glow]) { c.rotation.z = Math.PI / 2; c.position.set(tx - side * (L / 2 + 0.2), y, 0); beam.add(c); }
  const tipS = new THREE.Sprite(m.halo);
  tipS.scale.setScalar(thick ? 2.4 : 1.3);
  tipS.position.set(tx - side * (L + 0.2), y, 0);
  beam.add(tipS);
  g.add(beam);
  // durum: 0 = sönük, 0..1 = yükleniyor (titrer), 1 = açık
  g.userData.set = (k, t) => {
    beam.visible = k >= 1 || (k > 0 && Math.sin(t * 40) > 0.2);
    const w = k >= 1 ? 1 + Math.sin(t * 30) * 0.12 : 0.35;
    core.scale.set(w, 1, w); glow.scale.set(w, 1, w);
    eye.scale.setScalar(0.5 + k * 0.7);
  };
  g.userData.set(0, 0);
  return g;
}

// ================= YADA TAŞI: boss'a fırlatılır, Tengri'nin şimşeğini indirir =================
const yadaMat = new THREE.MeshBasicMaterial({ color: 0xbfe6ff });
yadaMat.userData.outlineParameters = { thickness: 0.006, color: [0.05, 0.15, 0.35], alpha: 1 };
export function makeYada() {
  const g = new THREE.Group();
  const v = new THREE.Group();
  v.add(mesh(new THREE.IcosahedronGeometry(0.34, 0), yadaMat, [0, 0, 0], [1, 1.25, 1], false));
  v.add(glowSprite(0x6ab8ff, 2.4, 0));
  v.position.y = 1.3;
  g.add(v);
  g.userData.anim = t => { v.rotation.y = t * 3; v.position.y = 1.3 + Math.sin(t * 5) * 0.15; };
  g.userData.stone = v;
  return g;
}
const boltMat = new THREE.MeshBasicMaterial({ color: 0xeaf4ff, transparent: true, depthWrite: false });
boltMat.userData.outlineParameters = NO_OUTLINE;
export function makeLightning(h = 26) { // gökten inen kırık çizgi şimşek
  const g = new THREE.Group();
  let x = 0, y = h;
  while (y > 0) {
    const ny = Math.max(0, y - rand(1.5, 3.5)), nx = x + rand(-1.2, 1.2);
    const len = Math.hypot(nx - x, ny - y);
    const s = new THREE.Mesh(G.box, boltMat);
    s.scale.set(0.16, len, 0.16);
    s.position.set((x + nx) / 2, (y + ny) / 2, 0);
    s.rotation.z = Math.atan2(-(nx - x), ny - y) + Math.PI;
    g.add(s);
    x = nx; y = ny;
  }
  const f = glowSprite(0x9ac8ff, 6, 0.5);
  g.add(f);
  return g;
}

// ---- yapay zekâ ile üretilmiş engeller (src/assets/dunya.glb, düğüm adı 'Engel_<ad>', tools/ai_uret.py + ai_isle.py) ----
// Model, eski kodla çizilen engelin kutusuna oturtulur: oynanış (şerit genişliği, zıplama/kayma yüksekliği) değişmez.
// Kayılan (yüksek) engellerde genişlik ve yükseklik ayrı ölçeklenir ki altındaki geçit aynı yükseklikte kalsın.
const AI_KUTU = {};
function aiEngel(ad, eski, tur) {
  const k = ENV && ENV['Engel_' + ad];
  if (!k) return eski();
  const b = AI_KUTU[ad] || (AI_KUTU[ad] = new THREE.Box3().setFromObject(eski()));
  const hs = b.getSize(new THREE.Vector3()), ks = new THREE.Box3().setFromObject(k).getSize(new THREE.Vector3());
  const o = k.clone(), g = new THREE.Group();
  if (tur === 'yuksek') { const sx = hs.x / ks.x, sy = hs.y / ks.y; o.scale.set(sx, sy, (sx + sy) / 2); }
  else o.scale.setScalar(Math.min(hs.x / ks.x, (hs.y * (tur === 'alcak' ? 1.1 : 1.2)) / ks.y));
  o.position.set((b.min.x + b.max.x) / 2, Math.max(0, b.min.y), (b.min.z + b.max.z) / 2);
  g.add(o);
  return g;
}
export const makeBarricade = () => aiEngel('barikat', eskiBarricade, 'engel');
export const makeCart = () => aiEngel('araba', eskiCart, 'engel');
export const makeCrates = () => aiEngel('sandik', eskiCrates, 'engel');
export const makeStump = () => aiEngel('kutuk', eskiStump, 'engel');
export const makeBoat = () => aiEngel('kayik', eskiBoat, 'engel');
export const makeSnowRock = () => aiEngel('karkaya', eskiSnowRock, 'engel');
export const makeSled = () => aiEngel('kizak', eskiSled, 'engel');
export const makeBones = () => aiEngel('kemik', eskiBones, 'engel');
export const makeCage = () => aiEngel('kafes', eskiCage, 'engel');
export const makeLavaRock = () => aiEngel('lavkaya', eskiLavaRock, 'engel');
export const makeJars = () => aiEngel('kupler', eskiJars, 'engel');
export const makeSupply = () => aiEngel('erzak', eskiSupply, 'engel');
export const makeBuzkule = () => aiEngel('buzkule', eskiBuzkule, 'engel');
export const makeFence = () => aiEngel('cit', eskiFence, 'alcak');
export const makeSpikes = () => aiEngel('dikenler', eskiSpikes, 'alcak');
export const makeLowGate = () => aiEngel('alcakkapi', eskiLowGate, 'alcak');
export const makeRope = () => aiEngel('ip', eskiRope, 'alcak');
export const makeVine = () => aiEngel('sarmasik', eskiVine, 'alcak');
export const makeBeam = () => aiEngel('kiris', eskiBeam, 'yuksek');
export const makeLog = () => aiEngel('devrik', eskiLog, 'yuksek');
export const makePine = () => aiEngel('devrikcam', eskiPine, 'yuksek');
export const makeChain = () => aiEngel('zincir', eskiChain, 'yuksek');
export const makeBannerBeam = () => aiEngel('sancak', eskiBannerBeam, 'yuksek');
