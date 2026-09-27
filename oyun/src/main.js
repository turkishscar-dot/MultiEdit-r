import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadAssets, Actor, GRAD } from './assets.js';
import * as W from './world.js';
import { Cine } from './cine.js';
import { Comic } from './comic.js';
import { Book } from './book.js';
import { JENERIK, PROLOG, PROLOG_PAGES, PARTS, EPILOG, BOOK, levelIntro } from './story.js';
import { BOSSES } from './bosses.js';
import { COSTUMES, applyCostume, wallet } from './costumes.js';
import { BOYLAR, picks, has, slots } from './boylar.js';

const LANES = [-2.5, 0, 2.5];
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// --- sahne + efekt zinciri: mürekkep hatlı çizim -> parlama (bloom) -> renk çıkışı ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const outline = new OutlineEffect(renderer, { defaultThickness: 0.0035, defaultColor: [0.08, 0.05, 0.1] });

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf6c89a, 70, 190);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);

class OutlineRenderPass extends Pass {
  constructor() { super(); this.needsSwap = false; }
  render(r, writeBuffer, readBuffer) {
    r.setRenderTarget(this.renderToScreen ? null : readBuffer);
    r.clear();
    outline.render(active.scene, active.camera);
  }
}
const active = { scene, camera };
const composer = new EffectComposer(renderer);
composer.addPass(new OutlineRenderPass());
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.35, 0.86);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0xd6e6ff, 0x8a6a48, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -10, near: 1, far: 60 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const sky = W.makeSky();
scene.add(sky);

// Işık ruh halleri: gün batımı, Erlik'in kan kırmızısı, gece
const MOODS = {
  day: { top: 0x3f78c4, mid: 0xf6b27a, low: 0xffe2b0, fog: 0xf6c89a, hs: 0xd6e6ff, hg: 0x8a6a48, hi: 1.15, sc: 0xffe2b8, si: 2.6, rock: 0x8a7fa8, snow: 0xfff1e6, orb: 0xfff0c0 },
  blood: { top: 0x12030a, mid: 0x5e0d0d, low: 0x9a2a14, fog: 0x3a0c0c, hs: 0x8a3a3a, hg: 0x2a0808, hi: 0.8, sc: 0xff5a30, si: 1.4, rock: 0x3a1420, snow: 0x9a5a50, orb: 0xff3a10 },
  night: { top: 0x040818, mid: 0x14224a, low: 0x2c4274, fog: 0x14224a, hs: 0x7088c8, hg: 0x101830, hi: 0.75, sc: 0x9ab8ff, si: 1.1, rock: 0x2a3050, snow: 0x8090b8, orb: 0x6a7cb0 },
  swamp: { top: 0x06100e, mid: 0x163a30, low: 0x2e5a48, fog: 0x1e3a30, hs: 0x7ab8a0, hg: 0x0e1a14, hi: 0.85, sc: 0xa8ffd8, si: 1.1, rock: 0x14241e, snow: 0x2e4a40, orb: 0xb8ffe0, fn: 16, ff: 85 },
  snow: { top: 0x5a92cf, mid: 0xc4dcf0, low: 0xf2f6fa, fog: 0xdbe7f2, hs: 0xe8f0ff, hg: 0x7a90a8, hi: 0.95, sc: 0xfff2e0, si: 1.5, rock: 0x6a7a90, snow: 0xffffff, orb: 0xfffbe8, fn: 40, ff: 160, bl: 1.2 },
  hell: { top: 0x080204, mid: 0x3a0a06, low: 0x8a2a0a, fog: 0x2a0806, hs: 0xff8a60, hg: 0x1a0404, hi: 0.75, sc: 0xff6a30, si: 1.6, rock: 0x1a0808, snow: 0x5a1a10, orb: 0xff4010, fn: 30, ff: 120 },
  cin: { top: 0x5a88c0, mid: 0xf2c6a0, low: 0xfae4cc, fog: 0xe6d2c4, hs: 0xf0f0ff, hg: 0x7a6a58, hi: 1.1, sc: 0xffe6c8, si: 2.2, rock: 0x6a8a7a, snow: 0xe8f0e8, orb: 0xfff0d0, fn: 50, ff: 170 },
  orman: { top: 0x4a8ad0, mid: 0xbfe0a0, low: 0xf0f4d8, fog: 0xd0e4c0, hs: 0xf0ffe0, hg: 0x5a7a40, hi: 1.2, sc: 0xfff0d0, si: 2.3, rock: 0x6a8a6a, snow: 0xe8f0e0, orb: 0xfff6d8, fn: 40, ff: 150 },
  aksam: { top: 0x2a1a4a, mid: 0xd06a4a, low: 0xffb070, fog: 0xc07a60, hs: 0xffc0a0, hg: 0x5a3a3a, hi: 1.0, sc: 0xff9a5a, si: 2.2, rock: 0x6a4a6a, snow: 0xf0c0a0, orb: 0xff8a3a },
  swampNight: { top: 0x020806, mid: 0x0e2a22, low: 0x1e4a38, fog: 0x12281e, hs: 0x5a9a80, hg: 0x08120e, hi: 0.8, sc: 0x8affc8, si: 0.9, rock: 0x0e1a14, snow: 0x243a30, orb: 0x9affd0, fn: 14, ff: 75 },
  storm: { top: 0x1a2230, mid: 0x4a5a70, low: 0x8a9ab0, fog: 0x6a7a90, hs: 0xc0d0e8, hg: 0x3a4250, hi: 1.0, sc: 0xd0e0ff, si: 1.3, rock: 0x4a5670, snow: 0xc0c8d8, orb: 0xd0e0ff, fn: 50, ff: 180 },
  abyss: { top: 0x020004, mid: 0x14061e, low: 0x2a0c3a, fog: 0x0e0414, hs: 0x9a6aff, hg: 0x06020a, hi: 0.75, sc: 0x9a5aff, si: 1.2, rock: 0x0e0614, snow: 0x2a1a3a, orb: 0x7a2aff, fn: 24, ff: 100 },
  koru: { top: 0x6ab0e0, mid: 0xffe8a0, low: 0xfff6d8, fog: 0xfff0c8, hs: 0xfff8e0, hg: 0x8aa050, hi: 1.3, sc: 0xfff0c0, si: 2.4, rock: 0xc8d8a0, snow: 0xffffff, orb: 0xfff8e0, fn: 40, ff: 150, bl: 1.0 },
  karanlik: { top: 0x020308, mid: 0x0a1a2a, low: 0x1a3444, fog: 0x0c1824, hs: 0x7a9ac8, hg: 0x10141c, hi: 0.8, sc: 0xa8c8ff, si: 1.1, rock: 0x1a2230, snow: 0x6a7a90, orb: 0xd8e8ff, fn: 28, ff: 130 },
  tamu: { top: 0x06020c, mid: 0x1e0a2a, low: 0x3a1440, fog: 0x1a0a22, hs: 0xb08aff, hg: 0x10061a, hi: 0.8, sc: 0xc07aff, si: 1.3, rock: 0x1a0a22, snow: 0x4a2a5a, orb: 0xa050ff, fn: 30, ff: 120 },
  forge: { top: 0x0a0402, mid: 0x3a1a06, low: 0x8a4a10, fog: 0x2a1206, hs: 0xffb070, hg: 0x1a0a04, hi: 0.85, sc: 0xffa040, si: 1.7, rock: 0x2a1a10, snow: 0x6a3a1a, orb: 0xffa020, fn: 30, ff: 120 },
  sky: { top: 0x2a6ad0, mid: 0x8ec5f0, low: 0xdff0ff, fog: 0xc8e4fa, hs: 0xffffff, hg: 0x9ab8d8, hi: 1.2, sc: 0xfff2d8, si: 2.0, rock: 0x9ab0d0, snow: 0xffffff, orb: 0xfff6d8, fn: 80, ff: 260, bl: 1.1 },
};
const ca = new THREE.Color(), cb = new THREE.Color();
function setMood(a, b = a, k = 1) {
  const m1 = MOODS[a], m2 = MOODS[b], u = sky.userData.u;
  const mix = (key, target) => target.copy(ca.set(m1[key]).lerp(cb.set(m2[key]), k));
  mix('top', u.top.value); mix('mid', u.mid.value); mix('low', u.low.value);
  mix('fog', scene.fog.color); mix('hs', hemi.color); mix('hg', hemi.groundColor); mix('sc', sun.color);
  mix('rock', sky.userData.rock.color); mix('snow', sky.userData.snow.color); mix('orb', sky.userData.orb.color);
  hemi.intensity = lerp(m1.hi, m2.hi, k);
  sun.intensity = lerp(m1.si, m2.si, k);
  scene.fog.near = lerp(m1.fn ?? 70, m2.fn ?? 70, k);
  scene.fog.far = lerp(m1.ff ?? 190, m2.ff ?? 190, k);
  bloom.threshold = lerp(m1.bl ?? 0.86, m2.bl ?? 0.86, k); // karda beyaz zemin parlamasın
  if (has('bayat')) hemi.intensity = Math.max(hemi.intensity, 1.1); // Bayat boyu: gece gözü
}
let segs = [], theme = null;
function setTheme(t) {
  if (theme !== t) {
    theme = t;
    for (const s of segs) scene.remove(s);
    segs = [];
    for (let i = 0; i < 7; i++) {
      const s = W.makeSegment(THEMES[t].seg || t);
      s.position.z = Math.floor(P.z / W.SEG) * W.SEG + W.SEG - i * W.SEG;
      scene.add(s);
      segs.push(s);
    }
  }
  if (THEMES[t].mood) setMood(THEMES[t].mood);
}
const warn = W.makeWarn();
warn.visible = false;
scene.add(warn);
const sparks = new W.Particles(scene, 400, true);
const dust = new W.Particles(scene, 300, false);
const snowfx = new W.Particles(scene, 600, false, 1.2); // Altay'da kar
const embers = new W.Particles(scene, 300, true, -1.5); // Yeraltı'nda yükselen korlar

// --- oyun verisi ---
const DEF = {
  barricade: { make: W.makeBarricade, hit: 'block' },
  cart: { make: W.makeCart, hit: 'block' },
  crates: { make: W.makeCrates, hit: 'block' },
  rope: { make: W.makeRope, hit: 'low' },
  beam: { make: W.makeBeam, hit: 'high' },
  boulder: { make: W.makeBoulder, hit: 'block' },
  spear: { make: W.makeSpear, hit: 'high' },
  kut: { make: W.makeKut },
  kimiz: { make: W.makeKimiz }, // nadir: bir can verir
  hoop: { make: W.makeHoop }, // uçuşta boş hücreyi gösteren halka
  // destan eşyaları: koşarken toplanır
  kurt: { make: () => makeWolfToken() }, islik: { make: W.makeIslik }, yay: { make: W.makeAltinYay }, gumus: { make: W.makeGumusOk },
  kilic: { make: W.makeTanriKilici }, kan: { make: W.makeKan }, geyik: { deer: true },
  kaya: { make: W.makeKaya, hit: 'block' },
  nal: { make: W.makeHorseshoe },
  kormos: { foe: true, hit: 'block' },
  // Kara Bataklık
  stump: { make: W.makeStump, hit: 'block' }, boat: { make: W.makeBoat, hit: 'block' },
  vine: { make: W.makeVine, hit: 'low' }, log: { make: W.makeLog, hit: 'high' },
  // Altay Geçidi
  snowrock: { make: W.makeSnowRock, hit: 'block' }, sled: { make: W.makeSled, hit: 'block' },
  fence: { make: W.makeFence, hit: 'low' }, pine: { make: W.makePine, hit: 'high' },
  // Yeraltı
  bones: { make: W.makeBones, hit: 'block' }, cage: { make: W.makeCage, hit: 'block' }, lavarock: { make: W.makeLavaRock, hit: 'block' },
  spikes: { make: W.makeSpikes, hit: 'low' }, chain: { make: W.makeChain, hit: 'high' },
  // boss saldırıları
  ice: { make: W.makeIce, hit: 'block' }, wave: { make: W.makeWave, hit: 'block' },
  shock: { make: W.makeShock, hit: 'low' }, pillar: { make: W.makePillar, hit: 'fire' },
  // Gök Yolu
  cloud: { make: W.makeCloud, hit: 'block' }, feather: { make: W.makeFeather, hit: 'block' },
  bird: { make: () => makeBird(), hit: 'block', flyfoe: true },
  // Çin Seferi
  jars: { make: W.makeJars, hit: 'block' }, supply: { make: W.makeSupply, hit: 'block' },
  lowgate: { make: W.makeLowGate, hit: 'low' }, bannerbeam: { make: W.makeBannerBeam, hit: 'high' },
  caltrop: { make: W.makeCaltrops, hit: 'low' }, bolt: { make: W.makeBolt, hit: 'high' },
  esir: { esir: true },
  // koşu içi bölümler
  ledge: { make: W.makeLedge, hit: 'block' }, roots: { make: W.makeRoots, hit: 'block' },
  kutuk: { make: W.makeKutuk, hit: 'low' }, rrock: { make: W.makeRiverRock, hit: 'block' }, girdap: { make: W.makeGirdap, hit: 'block' },
  catlak: { make: W.makeCatlak, hit: 'low' }, buzkule: { make: W.makeBuzkule, hit: 'block' },
};
const HELL = ['bones', 'cage', 'lavarock', 'spikes', 'chain'];
const THEMES = {
  surlar: { mood: 'day', obst: ['barricade', 'cart', 'crates', 'rope', 'beam'], foes: [['baltaci', 0], ['baltaci', 0], ['kalkanli', 350], ['mizrakci', 500]] },
  bataklik: { mood: 'swamp', obst: ['stump', 'boat', 'crates', 'vine', 'log'], foes: [['sulu', 0], ['baltaci', 0], ['sulu', 150], ['albis', 250], ['kalkanli', 450]] },
  altay: { mood: 'snow', obst: ['snowrock', 'sled', 'fence', 'pine', 'crates'], foes: [['baltaci', 0], ['almas', 120], ['kalkanli', 350], ['almas', 450], ['mizrakci', 600]] },
  yeralti: { mood: 'hell', obst: HELL, foes: [['baltaci', 0], ['sulmus', 100], ['kalkanli', 300], ['sulmus', 400], ['mizrakci', 500]] },
  tamu: { mood: 'tamu', obst: HELL, foes: [['sulmus', 0], ['baltaci', 0], ['kalkanli', 250], ['mizrakci', 400]] },
  demirhane: { mood: 'forge', obst: ['cage', 'spikes', 'chain', 'lavarock'], foes: [['sulmus', 0], ['baltaci', 0], ['kalkanli', 200], ['sulmus', 300]] },
  gok: { mood: 'sky', obst: [] },
  cin: { mood: 'cin', obst: ['jars', 'supply', 'crates', 'lowgate', 'bannerbeam'], foes: [['baltaci', 0], ['okcu', 250], ['kalkanli', 350], ['mizrakci', 500]] },
  karanlik: { mood: 'karanlik', obst: ['snowrock', 'sled', 'fence', 'bones', 'pine'], foes: [['kosucu', 0], ['kosucu', 150], ['itokcu', 250], ['itkalkan', 300]] },
  koru: { mood: 'koru', obst: [] },
  orman: { mood: 'orman', obst: ['kaya', 'log', 'fence', 'stump', 'crates'], foes: [['baltaci', 0], ['almas', 150], ['kalkanli', 300], ['mizrakci', 450]] },
  olu: { mood: 'swampNight', obst: ['stump', 'boat', 'kaya', 'vine', 'log'], foes: [['sulu', 0], ['albis', 100], ['sulu', 200], ['baltaci', 300]] },
  aksam: { seg: 'surlar', mood: 'aksam', obst: ['barricade', 'cart', 'crates', 'rope', 'beam'], foes: [['baltaci', 0], ['kalkanli', 150], ['mizrakci', 250]] },
  burc: { seg: 'surlar', mood: 'blood', obst: ['barricade', 'cart', 'crates', 'rope', 'beam'], foes: [['baltaci', 0], ['kalkanli', 100], ['mizrakci', 200]] },
  firtina: { seg: 'gok', mood: 'storm', obst: [] },
  abyss: { seg: 'yeralti', mood: 'abyss', obst: HELL, foes: [['sulmus', 0], ['sulmus', 100], ['kalkanli', 200], ['mizrakci', 300]] },
  // koşu içi bölümlerin sahneleri (ışık önceki temadan kalır); ırmakta düşmanlar önceki temadan gelir
  kuyu: { obst: [] }, vadi: { obst: [] },
  nehir: { obst: ['kutuk', 'rrock', 'girdap', 'kutuk', 'log'] },
  buzgol: { obst: ['catlak', 'buzkule', 'snowrock', 'catlak'], foes: [] },
  karakol: { seg: 'cin', mood: 'aksam', obst: ['jars', 'supply', 'crates', 'lowgate', 'bannerbeam'], foes: [['baltaci', 0], ['okcu', 100], ['kalkanli', 200], ['mizrakci', 300]] },
};
// 0 = sonsuz akın
// Her bölüm kısımlardan oluşur. Kısım: tema, görevler (hepsi tamamlanınca) ve kısım sonu boss'u (null: boss'suz geçiş).
// fall: yerin bir kat altına düşülür (Yeraltı)
const LEVELS = {
  0: { theme: 'surlar', boss: 'tepegoz', bossAt: 1000 },
  1: {
    theme: 'surlar', floors: [
      { name: 'SUR KAPISI', sub: 'BİRİNCİ KISIM', theme: 'surlar', boss: 'korbasi', goals: [['dist', 550], ['kut', 40]] },
      { name: 'AKŞAM SURLARI', sub: 'İKİNCİ KISIM', theme: 'aksam', boss: null, goals: [['dist', 500], ['kill', 8]], sect: ['kartal', 200] },
      { name: 'KANLI BURÇLAR', sub: 'ÜÇÜNCÜ KISIM', theme: 'burc', boss: 'tepegoz', goals: [['dist', 450], ['combo', 5]] },
    ],
  },
  2: {
    theme: 'bataklik', floors: [
      { name: 'SİSLİ SAZLIK', sub: 'BİRİNCİ KISIM', theme: 'bataklik', boss: 'suluaga', goals: [['dist', 550], ['kill', 8]], sect: ['sal', 200] },
      { name: 'ÖLÜ ORMAN', sub: 'İKİNCİ KISIM', theme: 'olu', boss: null, goals: [['dist', 500], ['kut', 50]], fall: true },
      { name: 'KARA GÖL', sub: 'ÜÇÜNCÜ KISIM', theme: 'bataklik', boss: 'albasti', goals: [['dist', 450], ['kill', 8]] },
    ],
  },
  3: {
    theme: 'orman', floors: [
      { name: 'KAYIN ORMANI', sub: 'BİRİNCİ KISIM', theme: 'orman', boss: 'almasbey', goals: [['dist', 600], ['kill', 10]], sect: ['kartal', 250] },
      { name: 'KARLI YAMAÇ', sub: 'İKİNCİ KISIM', theme: 'altay', boss: null, goals: [['dist', 500], ['kut', 60]], sect: ['buz', 180] },
      { name: 'ALTAY GEÇİDİ', sub: 'ÜÇÜNCÜ KISIM', theme: 'altay', boss: 'yelbegen', goals: [['dist', 500], ['kill', 8]] },
    ],
  },
  4: {
    theme: 'gok', flight: true, floors: [
      { name: 'BULUT DENİZİ', sub: 'BİRİNCİ KISIM', theme: 'gok', boss: null, goals: [['dist', 700], ['hoop', 10]] },
      { name: 'FIRTINA', sub: 'İKİNCİ KISIM', theme: 'firtina', boss: 'karakus', goals: [['dist', 600], ['hoop', 8]] },
    ],
  },
  5: {
    theme: 'tamu', floors: [
      { name: 'KARA-TEŞ', sub: 'YERALTININ BİRİNCİ KATI', theme: 'tamu', boss: 'kerey', goals: [['dist', 600], ['kill', 10]], fall: true },
      { name: "ERLİK'İN DEMİRHANESİ", sub: 'İKİNCİ KAT', theme: 'demirhane', boss: 'demirhane', goals: [['dist', 500], ['kill', 8]], fall: true },
      { name: 'TÜPKEN KARA TAMU', sub: 'ÜÇÜNCÜ KAT', theme: 'abyss', boss: 'matman', goals: [['dist', 500], ['kut', 40]], fall: true },
      { name: "ERLİK'İN TAHTI", sub: 'DÖRDÜNCÜ KAT', theme: 'yeralti', boss: 'erlik', goals: [['dist', 450], ['combo', 6]], fall: true },
    ],
  },
  6: {
    theme: 'cin', foeModel: 'cinli', prisoners: true, floors: [
      { name: 'SINIR KARAKOLU', sub: 'BİRİNCİ KISIM', theme: 'cin', boss: 'yuzbasi', goals: [['dist', 550], ['kill', 10]] },
      { name: 'ESİR KAMPI', sub: 'İKİNCİ KISIM', theme: 'cin', boss: null, goals: [['dist', 500], ['esir', 8]] },
      { name: 'KALE KAPISI', sub: 'ÜÇÜNCÜ KISIM', theme: 'karakol', boss: 'general', goals: [['dist', 500], ['kill', 10]], sect: ['kartal', 180] },
    ],
  },
  7: {
    theme: 'karanlik', floors: [
      { name: 'DONMUŞ IRMAK', sub: 'BİRİNCİ KISIM', theme: 'karanlik', boss: 'itbasi', goals: [['dist', 600], ['kill', 12]], sect: ['buz', 200] },
      { name: 'KUZEY IŞIKLARI', sub: 'İKİNCİ KISIM', theme: 'karanlik', boss: null, goals: [['dist', 500], ['combo', 6]], sect: ['sal', 150] },
      { name: 'İT-BARAK OBASI', sub: 'ÜÇÜNCÜ KISIM', theme: 'karanlik', boss: 'boyali', goals: [['dist', 500], ['kill', 12]], sect: ['kartal', 200] },
    ],
  },
};
const GOAL_ICON = { dist: ['⬆', ' m'], kill: ['⚔', ''], kut: ['◆', ''], esir: ['⛓', ''], hoop: ['◯', ''], combo: ['✦', ' kombo'] };
const HEIGHTS = [1, 3.5, 6]; // uçuşta üç yükseklik
// Karanlıkta da görünsünler: mermilere renkli parıltı + yerde halka [renk, parıltı yüksekliği, boy]
const HAZARD = {
  spear: [0xff7a2a, 1.45, 2.2], bolt: [0xffc04a, 1.5, 2], ice: [0x7ad8ff, 1.1, 2.6], wave: [0xff4a9a, 1.2, 3],
  shock: [0xff3a1a, 0.4, 3], feather: [0xc08aff, 0, 1.8], caltrop: [0xff5a2a, 0.2, 2.2], boulder: [0xffa040, 1.1, 2.6],
};
// Erlik'in kulları: aynı model, farklı silah ve davranış
const FOE = {
  baltaci: { parts: ['Axe'], idle: 'Sword_Idle', attack: 'Sword_Attack', hp: 1 },
  kalkanli: { parts: ['Axe', 'Shield'], idle: 'Idle_Shield_Loop', attack: 'Shield_Dash', hp: 2 },
  mizrakci: { parts: ['Spear'], idle: 'Idle_Loop', attack: 'Punch_Jab', hp: 1 },
  pusucu: { parts: ['Axe'], idle: 'Sword_Idle', attack: 'Sword_Attack', hp: 1 },
  yeralti: { parts: [], idle: 'Idle_Loop', attack: 'Zombie_Scratch', hp: 1 },
  // bölgelere özel: sulu (bataklıktan yükselen ölü), albıs (süzülen, son anda şerit değiştiren cadı), almas (kar devi, buz kayası atar),
  // şulmus (Erlik'in üstüne koşan iblisi), okçu, İt-Barak koşucusu (oklardan kaçar), İt-Barak okçusu ve kalkanlısı
  sulu: { model: 'sulu', parts: [], idle: 'Zombie_Idle_Loop', attack: 'Zombie_Scratch', hp: 2, rise: true },
  albis: { model: 'albasti', parts: [], idle: 'Idle_Loop', attack: 'Zombie_Scratch', hp: 1, zig: true, scale: 0.8, float: 0.35 },
  almas: { model: 'almas', parts: [], idle: 'Idle_Loop', attack: 'Punch_Cross', hp: 2, lob: 'ice' },
  sulmus: { model: 'sulmus', parts: [], idle: 'Zombie_Idle_Loop', attack: 'Zombie_Scratch', hp: 1, charge: 7 },
  okcu: { parts: [], idle: 'Idle_Loop', attack: 'Spell_Simple_Shoot', hp: 1, shoot: true },
  kosucu: { model: 'itbarak', parts: ['Axe'], idle: 'Sword_Idle', attack: 'Sword_Attack', hp: 1, charge: 9, dodge: true },
  itokcu: { model: 'itbarak', parts: [], idle: 'Idle_Loop', attack: 'Spell_Simple_Shoot', hp: 1, shoot: true },
  itkalkan: { model: 'itbarak', parts: ['Axe', 'Shield'], idle: 'Idle_Shield_Loop', attack: 'Shield_Dash', hp: 2 },
};
const setParts = (a, list) => { for (const p of ['Axe', 'Dao', 'Shield', 'Spear']) if (a.parts[p]) a.parts[p].visible = list.includes(p === 'Dao' ? 'Axe' : p); };
const PRAISE = ['HASSAS!', 'HARİKA!', 'YİĞİT!', 'ALP!', 'BOZKURT!'];
// Hareket çeşitliliği: Quaternius + Mixamo klipleri (Mixamo'lar tools/build_chars.py'de iskeletimize aktarılır)
const SLASHES = ['Sword_Regular_A', 'MX_GS_Slash1', 'Sword_Regular_B', 'MX_Stab1', 'MX_GS_Slash4', 'Sword_Stab', 'MX_GS_Slash3',
  'Sword_Regular_C', 'MX_GS_Attack', 'MX_Stab3', 'MX_GS_Slash5', 'Sword_Attack'];
const HEAVY = ['Sword_Heavy_Combo', 'MX_GS_Spin', 'MX_GS_JumpAttack'];
const RUNS = { sword: ['Sprint_Loop', 'MX_GS_Run', 'MX_GS_Run2', 'MX_Running'], bow: ['MX_BowRun', 'MX_Run', 'Sprint_Loop'] };
const HURTS = ['Hit_Chest', 'MX_GS_Impact', 'MX_GS_Impact2', 'MX_React'];
const DEATHS = ['Death01', 'MX_Death1', 'MX_Death2', 'MX_DeathBack', 'MX_DeathFwd'];
const FOE_IDLE = ['Sword_Idle', 'MX_GS_Idle', 'MX_GS_Idle3', 'MX_GS_Strafe'];
const FOE_ATK = ['Sword_Attack', 'MX_GS_Slash1', 'MX_GS_Attack', 'MX_GS_Slash3', 'MX_GS_Slash5', 'MX_Stab3', 'MX_GS_Kick'];
const FOE_RUN = ['Sprint_Loop', 'MX_FastRun', 'MX_GS_Run', 'MX_RunUnarmed'];
const MENU_IDLE = ['Idle_Loop', 'MX_Look', 'MX_Examine', 'MX_BowIdle'];
// klibi istenen sürede (sn) oynat: Mixamo kliplerinin uzunlukları farklı, oyun temposu sabit kalsın
const timed = (a, clip, t, o = {}) => a.play(clip, { loop: false, fade: 0.05, ...o, speed: a.duration(clip) / t });
const timedOver = (a, clip, t) => a.overlay(clip, { speed: a.duration(clip) / t });
let runClip = 'Sprint_Loop', runT = 0, bowStyle = 0;
const TAU = Math.PI * 2;
const BOSS_SCALE = 2.5;
const RIDE_TIME = 12, HORSE_SCALE = 0.48, SEAT = 1.2;

// Koşu içi bölümler (SMU'daki serbest düşüş / ağla sallanma / tünel karşılıkları): 10-20 sn, koşunun içine yerleşir.
// fly: Gök Yolu'nun 3x3 ızgarası; stand: yerde koşu yerine duruş; slip: şerit oturma hızı (buzda kaygan); fast: hız çarpanı
const SECTS = {
  dive: { name: 'UÇURUMDAN İNİŞ!', seg: 'kuyu', dur: 12, fly: true, obst: ['ledge', 'roots'], pose: 'MX_FallLoop' },
  kartal: { name: 'KARTAL TAŞIMASI!', seg: 'vadi', dur: 15, fly: true, obst: ['cloud', 'bird'], pose: 'MX_FallLoop' },
  sal: { name: 'SALLA IRMAĞA!', seg: 'nehir', dur: 16, stand: 'MX_GS_Idle' },
  buz: { name: 'BUZDA KAYMA!', seg: 'buzgol', dur: 14, stand: 'Crouch_Idle_Loop', slip: 3.2, fast: 1.2 },
};
let sect = null, sectDone = false, sectAt = 300, eagle = null, eagleAway = null, raft = null, board = null;
const sw = { a: 0, v: 0, px: 0 }; // kartalın pençesinde sarkaç
let camEase = 0;
const camFromP = new THREE.Vector3(), camFromQ = new THREE.Quaternion();
const P = { lane: 1, x: 0, y: 0, vy: 0, z: 0, slide: 0, inv: 0, hp: 3, speed: 0, lock: 0, lunge: 0, ride: 0, sword: 0, row: 1, flip: 0, flipAxis: 'x', spin: 0, roll: false, rear: 0 };
const FLIP_T = 0.62; // zıplamanın havada kalma süresi (takla bu sürede döner)
let state = 'loading', objs = [], arrows = [], bursts = [], pending = [], boss = null, fin = null, A = null;
let deerActor, comic;
let hero, giant, horse, wolf, tulpar, book, cine, ctx, horseAway = null, mode = 'level', level = 1, flying = false;
let flow = 1, holdTarget = 1, esirs = 0; // düelloda Oğuz durur: dünya akışı 0'a iner
const foes = [];
const pools = {}; // model -> tekrar kullanılan aktörler (düşmanlar, esirler)
function pool(model) {
  return (pools[model] ??= Array.from({ length: model === 'esir' ? 6 : 10 }, () => {
    const a = new Actor(A, model);
    a.root.visible = false;
    scene.add(a.root);
    return a;
  }));
}
function makeWolfToken() { // gök yeleli kurt çağrısı: parlayan küçük mavi kurt
  const g = new THREE.Group();
  const w = new Actor(A, 'wolf', A.wolfClips).root; // iskeletli model: SkeletonUtils ile kopyalanır
  w.traverse(o => { if (o.isMesh) o.material = wolfTokenMat; });
  w.scale.setScalar(0.22);
  w.position.y = 0.9;
  w.rotation.y = 0.5;
  g.add(w, W.glowSprite(0x6ab8ff, 2.6, 1.2));
  g.userData.anim = t => { w.rotation.y = t * 2; w.position.y = 0.9 + Math.sin(t * 4) * 0.12; };
  return g;
}
// Düşman modelinin yakın dövüş silahı: Körmös'te balta, Çin askerinde kılıç
const melee = a => a.parts.Axe || a.parts.Dao;
const wolfTokenMat = new THREE.MeshToonMaterial({ color: 0x6ab8ff, emissive: 0x1a4a8a, gradientMap: GRAD });
let weapon = 'sword'; // koşarken elde kılıç ya da yay; düğme / Q ile değişir
// görevler, katlar, destan eşyaları ve boy güçleri
let floor = 0, goalsDone = false, hoops = 0, maxCombo = 0, goalKey = '';
const pow = { kurt: 0, kilic: 0 }; // etkin güçlerin kalan süresi
let secret = 0, secretTheme = null, deer = null, deerDone = false, trail = null, godDone = false, islikDone = false;
let stageT = 0, godGlow = null, relicPlan = [], rain = null, guideLane = 1, guideT = 0, shield = 0, reviveUsed = false, smashUsed = false, rideTime = 12;
const cur = () => LEVELS[level].floors?.[floor] ?? LEVELS[level];
const relicSave = (() => { try { return JSON.parse(localStorage.getItem('oguz-relics')) || {}; } catch { return {}; } })();
let time = 0, runZ = 0, kut = 0, score = 0, combo = 0, kills = 0, nextZ = 0, bossAt = 0, cool = 0, shake = 0, bannerT = 0, overT = 0;
let debugCam = null, camX = 0, fovKick = 0, slowK = 1, slowT = 0, stopT = 0, ambushT = 0, slashStep = 0, lastSlash = -9, wasSliding = false;

const dist = () => Math.max(0, Math.floor(runZ - P.z));
const mult = () => (1 + Math.min(combo, 20) * 0.1) * (has('kayi') ? 1.15 : 1);
const slowmo = (k, dur) => { slowK = k; slowT = dur; };

function swordMode(on) { // ara sahneler ve bitiriş: kılıç elde mi kında mı
  hero.parts.SwordHand.visible = on;
  hero.parts.SwordSheath.visible = !on;
  hero.parts.BowHand.visible = hero.parts.ArrowNock.visible = false;
  hero.parts.BowBack.visible = true;
}

function setWeapon(w) {
  weapon = w;
  const bow = w === 'bow';
  hero.parts.SwordHand.visible = !bow;
  hero.parts.SwordSheath.visible = bow;
  hero.parts.BowHand.visible = bow;
  hero.parts.BowBack.visible = !bow;
  hero.parts.ArrowNock.visible = false;
  $('weapon').textContent = bow ? '🏹' : '⚔';
  $('weapon').classList.toggle('bow', bow);
  runClip = pick(RUNS[w]);
  if (state === 'run' && !flying) timedOver(hero, bow ? 'MX_BowEquip' : 'MX_GS_Draw', 0.4);
}

loadAssets(p => ($('loadbar').style.width = p * 100 + '%')).then(a => {
  A = a;
  hero = new Actor(A, 'oguz');
  hero.root.rotation.y = Math.PI; // -z yönüne koşar
  scene.add(hero.root);
  applyCostume(hero, wallet.worn);
  swordMode(false);
  hero.play('Idle_Loop');
  for (let i = 0; i < 10; i++) {
    const f = new Actor(A, 'kormos');
    f.root.visible = false;
    scene.add(f.root);
    foes.push(f);
  }
  giant = new Actor(A, 'tepegoz');
  giant.root.scale.setScalar(BOSS_SCALE);
  giant.root.visible = false;
  scene.add(giant.root);
  horse = new Actor(A, 'horse', A.horseClips);
  horse.root.scale.setScalar(HORSE_SCALE);
  horse.root.rotation.y = Math.PI;
  horse.root.visible = false;
  scene.add(horse.root);
  pools.kormos = foes;
  wolf = new Actor(A, 'wolf', A.wolfClips);
  wolf.root.scale.setScalar(0.34);
  wolf.root.visible = false;
  scene.add(wolf.root);
  tulpar = new Actor(A, 'tulpar', A.tulparClips);
  tulpar.root.scale.setScalar(HORSE_SCALE);
  tulpar.root.rotation.y = Math.PI;
  tulpar.root.visible = false;
  scene.add(tulpar.root);
  W.setEnv(A.env);
  theme = null;
  setTheme('surlar'); // ağaçlar ve kuleler yüklendi: segmentleri yeniden kur
  deerActor = new Actor(A, 'stag', A.stagClips);
  deerActor.root.scale.setScalar(0.42);
  deerActor.root.visible = false;
  scene.add(deerActor.root);
  book = new Book(A);
  ctx = makeCtx();
  cine = new Cine(ctx);
  comic = new Comic(renderer.domElement);
  state = 'gate';
  $('loadbar').parentElement.hidden = true;
  $('loadtext').hidden = true;
  $('enter').hidden = false;
}).catch(e => { $('loading').querySelector('p').textContent = 'Yüklenemedi: ' + e.message; });

// --- ara sahne bağlamı: story.js çekimleri sahneyi bununla kurar ---
setTheme('surlar');

function makeCtx() {
  const cast = () => [hero, wolf, horse, giant, ...foes];
  return {
    P, Z: 0, hero, wolf, horse, giant, dust, sparks,
    mood: setMood,
    swordMode,
    rideLegs,
    shake: v => (shake = Math.max(shake, v)),
    cam(px, py, pz, lx, ly, lz) {
      const j = shake > 0 ? 0.15 : 0;
      camera.position.set(px + rand(-j, j), py + rand(-j, j), pz);
      camera.lookAt(lx, ly, lz);
    },
    fade: v => ($('fade').style.opacity = v),
    title(lines) {
      $('titlecard').replaceChildren(...lines.map(([text, cls]) => {
        const d = document.createElement('div');
        d.className = cls + ' ink';
        d.textContent = text;
        return d;
      }));
    },
    titleAlpha(a, slam) {
      const t = $('titlecard');
      t.style.opacity = a;
      if (slam) { t.classList.remove('slam'); void t.offsetWidth; t.classList.add('slam'); }
    },
    foe(i, variant, model = 'kormos') {
      const a = pool(model)[i];
      a.busy = true;
      a.root.rotation.set(0, 0, 0);
      setParts(a, FOE[variant].parts);
      a.play(FOE[variant].idle, { fade: 0 });
      return a;
    },
    show(actor, x, y, z, ry) {
      actor.root.visible = true;
      actor.root.position.set(x, y, z);
      actor.root.rotation.set(0, ry, 0);
    },
    actor(model, i) { // esir gibi havuz aktörü
      const a = pool(model)[i];
      a.busy = true;
      if (a.parts.Cangue) a.parts.Cangue.visible = true;
      return a;
    },
    clear() {
      for (const a of cast()) a.root.visible = false;
      for (const list of Object.values(pools)) for (const f of list) { f.busy = false; f.root.visible = false; }
      $('titlecard').replaceChildren();
      $('fade').style.opacity = 0;
    },
    update(dt) {
      for (const a of cast()) if (a.root.visible) a.update(dt);
      for (const list of Object.values(pools)) for (const a of list) if (a.root.visible && !cast().includes(a)) a.update(dt);
    },
  };
}

// Hikâye çizgi roman sayfaları olarak oynar (bitince menü)
function playComic(pages, after = toMenu) {
  comic.start();
  cine.comic = comic;
  $('cine').classList.add('comic');
  return playCine(comic.build(pages), () => {
    comic.stop();
    cine.comic = null;
    $('cine').classList.remove('comic');
    after();
  });
}
const titleLines = () => {
  const tc = $('titlecard'), a = +getComputedStyle(tc).opacity || 0;
  return a > 0.01 ? [...tc.children].map(d => [d.textContent, d.className.split(' ')[0], a]) : null;
};

// Video için: hikâyeyi kare kare oynat, her kareyi geliştirme sunucusuna yolla (video/kareler)
async function recordComic(fps = 30) {
  frozen = true;
  playComic(PROLOG_PAGES);
  let i = 0;
  while (state === 'cine') {
    frame(1 / fps);
    const blob = await new Promise(r => comic.c.toBlob(r, 'image/jpeg', 0.9));
    await fetch('/__frame?i=' + i++, { method: 'POST', body: blob });
  }
  frozen = false;
  return i;
}

// Sinematik oynar, bitince menüye döner
async function playCine(shots, after = toMenu) {
  for (const id of ['menu', 'hud', 'win', 'map', 'loading', 'over']) $(id).hidden = true;
  state = 'cine';
  $('banner').classList.remove('show'); // oyun içi yazı başlık kartının üstüne binmesin
  ctx.Z = P.z;
  await cine.play(shots);
  after();
}

function toMenu() {
  for (const o of objs) release(o);
  for (const a of arrows) scene.remove(a.mesh);
  objs = []; arrows = [];
  if (boss) endBoss();
  fin = null;
  ctx.clear();
  tulpar.root.visible = false;
  flying = false;
  setTheme('surlar');
  hero.root.visible = true;
  hero.root.rotation.set(0, Math.PI, 0);
  swordMode(false);
  hero.play(pick(MENU_IDLE));
  Object.assign(P, { x: 0, y: 0, lane: 1, ride: 0, dead: false });
  state = 'menu';
  for (const id of ['hud', 'over', 'paused', 'bossbar', 'ride', 'map', 'book', 'win', 'tap', 'mash', 'wardrobe', 'loading', 'grid', 'goals', 'powers', 'boyscreen']) $(id).hidden = true;
  wolf.root.visible = deerActor.root.visible = false;
  $('menu').hidden = false;
}

const progress = (() => { try { return JSON.parse(localStorage.getItem('oguz-levels')) || {}; } catch { return {}; } })();

function openMap() {
  state = 'map';
  $('menu').hidden = $('win').hidden = $('over').hidden = $('boyscreen').hidden = true;
  const list = $('maplist');
  list.replaceChildren();
  for (const part of PARTS) {
    const h = document.createElement('h3');
    h.className = 'ink';
    h.textContent = `${part.name} · ${part.sub}`;
    list.append(h);
    const row = document.createElement('div');
    row.className = 'nodes';
    for (const lv of part.levels) {
      const b = document.createElement('button');
      b.className = 'node' + (lv.ready ? '' : ' locked');
      b.disabled = !lv.ready;
      const stars = progress[lv.id] ? '★'.repeat(progress[lv.id]) + '☆'.repeat(3 - progress[lv.id]) : '';
      const r = relicSave[lv.id], relicTxt = r ? `🏹 ${r.ok.filter(Boolean).length}/3${r.yay ? ' · ALTIN YAY' : ''}` : '';
      for (const [cls, text] of [['num', lv.id], ['name', lv.name], ['boss', lv.ready ? lv.boss : 'YAKINDA'], ['stars', stars], ['relic', relicTxt]]) {
        const sp = document.createElement('span');
        sp.className = cls;
        sp.textContent = text;
        b.append(sp);
      }
      b.onclick = () => openBoylar('level', lv.id);
      row.append(b);
    }
    list.append(row);
  }
  $('map').hidden = false;
}

// Boy seçimi: bölüm öncesi isteğe bağlı; yuva sayısı geçilen ana bölümlerle artar.
// Her Han'ın simgesi: Gün güneş, Ay hilal, Yıldız yıldız, Gök gökkubbe, Dağ dağ, Deniz dalga
const SVG = d => `<svg viewBox="0 0 40 40" fill="none" stroke="#15101c" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SONS = [
  ['Gün Han', SVG('<circle cx="20" cy="20" r="7" fill="#e3a82b"/><path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M31.3 8.7l-3.5 3.5M12.2 27.8l-3.5 3.5"/>'), 'BOZOK'],
  ['Ay Han', SVG('<path d="M26 6a14 14 0 1 0 8 22A11 11 0 0 1 26 6z" fill="#dfe6ee"/>'), 'BOZOK'],
  ['Yıldız Han', SVG('<path d="M20 5l4.4 9.6 10.4 1.2-7.7 7.1 2.1 10.3L20 28l-9.2 5.2 2.1-10.3-7.7-7.1 10.4-1.2z" fill="#ffd23f"/>'), 'BOZOK'],
  ['Gök Han', SVG('<path d="M5 28a15 15 0 0 1 30 0z" fill="#5a9ad8"/><path d="M3 32h34"/>'), 'ÜÇOK'],
  ['Dağ Han', SVG('<path d="M3 33l12-20 7 11 4-6 11 15z" fill="#8a7a68"/><path d="M12 18l3-5 3 5"/>'), 'ÜÇOK'],
  ['Deniz Han', SVG('<path d="M4 16c4-4 8 4 12 0s8 4 12 0 6 1 8 0M4 25c4-4 8 4 12 0s8 4 12 0 6 1 8 0" stroke="#2f7ab8"/>'), 'ÜÇOK'],
];
let boyAfter = null;
function openBoylar(m, lv) {
  state = 'boylar';
  boyAfter = () => start(m, lv);
  for (const id of ['map', 'menu', 'win', 'over']) $(id).hidden = true;
  const n = slots(progress);
  picks.list = picks.list.filter(id => BOYLAR.some(b => b.id === id)).slice(0, n);
  let sel = picks.list[0] || BOYLAR[0].id;
  const toggle = id => {
    if (picks.list.includes(id)) picks.list = picks.list.filter(x => x !== id);
    else if (picks.list.length < n) picks.list.push(id);
    else picks.list = [...picks.list.slice(1), id]; // yuva doluysa en eskisi çıkar
    picks.save();
  };
  const draw = () => {
    $('boyslot').replaceChildren(document.createTextNode('YUVA'), ...Array.from({ length: n }, (_, i) => {
      const d = document.createElement('i');
      d.className = i < picks.list.length ? 'on' : '';
      return d;
    }));
    $('boylist').replaceChildren(...SONS.map(([son, icon, wing]) => {
      const col = document.createElement('div');
      col.className = 'col';
      const h = document.createElement('b');
      h.className = 'ink';
      h.textContent = son;
      const w = document.createElement('small');
      w.textContent = wing;
      col.append(h, w, ...BOYLAR.filter(b => b.son === son).map(b => {
        const c = document.createElement('button');
        c.className = 'boy' + (picks.list.includes(b.id) ? ' on' : '') + (b.id === sel ? ' sel' : '');
        c.innerHTML = icon;
        const s = document.createElement('span');
        s.textContent = b.name;
        c.append(s);
        c.onclick = () => { if (sel === b.id) toggle(b.id); sel = b.id; draw(); }; // ilk dokunuş gücü gösterir, ikincisi seçer
        return c;
      }));
      return col;
    }));
    const b = BOYLAR.find(x => x.id === sel), on = picks.list.includes(b.id);
    const h = document.createElement('h3');
    h.textContent = b.name;
    const o = document.createElement('p');
    o.className = 'ong';
    o.textContent = `${b.son} oğlu · ongun kuşu: ${b.bird}`;
    const p = document.createElement('p');
    p.textContent = b.perk;
    const btn = document.createElement('button');
    btn.className = 'small';
    btn.textContent = on ? 'ÇIKAR' : 'SEÇ';
    btn.onclick = () => { toggle(b.id); draw(); };
    $('boydetail').replaceChildren(h, o, p, btn);
  };
  draw();
  $('boyscreen').hidden = false;
}

// Destan Kitabı: kapak açılır, sol sayfada karakter döner, sağ sayfada destandaki yeri; sayfa çevrilerek gezilir
let page = 0, turning = false;
const CN = '零一二三四五六七八九十';
const cnNum = n => n <= 10 ? CN[n] : n < 20 ? '十' + CN[n - 10] : CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
function openBook() {
  state = 'book';
  $('menu').hidden = true;
  $('chips').replaceChildren(...BOOK.map((e, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (e.locked ? ' locked' : '');
    b.textContent = e.name;
    b.onclick = () => turnTo(i);
    return b;
  }));
  $('tome').className = 'closed';
  $('book').className = 'closed';
  $('book').hidden = false;
  fillPage(page);
  book.current && (book.current.root.visible = false);
  book.pedestal(false);
  requestAnimationFrame(bookResize);
}
function openCover() {
  if (!$('tome').classList.contains('closed')) return;
  $('tome').className = 'open';
  $('book').className = '';
  setTimeout(() => { bookResize(); book.pedestal(true); book.show(BOOK[page]); }, 700);
}
function closeBook() {
  if ($('tome').classList.contains('closed')) return toMenu();
  book.current && (book.current.root.visible = false);
  book.pedestal(false);
  $('tome').className = 'closing'; // kapak sayfaların üstüne kapanır, sonra kitap ortaya kayar
  $('book').className = 'closed';
  setTimeout(() => { $('tome').className = 'closed'; }, 1000);
  setTimeout(toMenu, 1500);
}
function bookResize() {
  const r = $('lpage').getBoundingClientRect();
  book.resize(innerWidth, innerHeight, r);
}
function fillPage(i) {
  const e = BOOK[i];
  [...$('chips').children].forEach((c, j) => c.classList.toggle('on', i === j));
  $('bname').textContent = e.name;
  $('btitle').textContent = e.title;
  $('btext').textContent = e.text;
  $('block').hidden = !e.locked;
  $('block').textContent = e.locked ? `YAKINDA · ${e.locked}` : '';
  $('lfolio').textContent = cnNum(i * 2 + 1);
  $('rfolio').textContent = `${i * 2 + 2} · ${cnNum(i * 2 + 2)}`;
}
function turnTo(i) {
  i = (i + BOOK.length) % BOOK.length;
  if (turning || i === page || $('tome').classList.contains('closed')) return;
  const fwd = i > page, leaf = $('leaf');
  turning = true;
  // ileri: sağ sayfanın kopyası sola kıvrılır; geri: boş yaprak soldan sağa kapanır, yeni yazıyı taşır
  leaf.children[0].replaceChildren($('bcard').cloneNode(true), $('rfolio').cloneNode(true));
  page = i;
  if (fwd) fillPage(i);
  else { const tmp = $('bcard').cloneNode(true); fillPage(i); leaf.children[0].replaceChildren($('bcard').cloneNode(true)); void tmp; }
  leaf.className = fwd ? 'turn' : 'turnback';
  setTimeout(() => book.show(BOOK[i]), fwd ? 600 : 50);
  setTimeout(() => { leaf.className = ''; turning = false; }, 760);
}
function showEntry(i) { turnTo(i); }

// --- Kostümler: Destan Kitabı'nın vitrin sahnesinde Oğuz döner, kartlardan kostüm alınır/giyilir ---
let wardSel = wallet.worn;
function openWardrobe() {
  state = 'wardrobe';
  $('menu').hidden = true;
  book.resize(innerWidth, innerHeight);
  book.pedestal(true);
  book.show({ id: 'oguz', model: 'oguz', anim: 'Idle_Loop', h: 1.9 });
  wardSel = wallet.worn;
  drawWardrobe();
  $('wardrobe').hidden = false;
}

function drawWardrobe() {
  applyCostume(book.actors.oguz, wardSel);
  $('wbank').textContent = '◆ ' + wallet.bank;
  $('wlist').replaceChildren(...COSTUMES.map(c => {
    const card = document.createElement('div');
    card.className = 'wcard' + (c.id === wardSel ? ' on' : '');
    card.onclick = () => { wardSel = c.id; drawWardrobe(); };
    const h = document.createElement('h3');
    h.textContent = c.name;
    const t = document.createElement('div');
    t.className = 'wtitle';
    t.textContent = c.title;
    const p = document.createElement('p');
    p.textContent = c.text;
    const b = document.createElement('button');
    b.className = 'small';
    const owned = wallet.owned.includes(c.id);
    b.textContent = wallet.worn === c.id ? 'GİYİLİ' : owned ? 'GİY' : `◆ ${c.price} KUT`;
    b.disabled = wallet.worn === c.id || (!owned && wallet.bank < c.price);
    b.onclick = e => {
      e.stopPropagation();
      if (!owned && !wallet.buy(c)) return;
      wallet.wear(c.id);
      wardSel = c.id;
      applyCostume(hero, c.id);
      drawWardrobe();
    };
    card.append(h, t, p, b);
    return card;
  }));
}

function closeWardrobe() {
  applyCostume(hero, wallet.worn); // denenen ama alınmayan kostümü geri al
  toMenu();
}

function win() {
  state = 'win';
  const stars = Math.max(1, P.hp);
  const r = relicSave[level];
  const full = r && r.yay && r.ok.every(Boolean) && !r.paid;
  if (full) { r.paid = true; kut += 200; saveRelics(); } // Bozok-Üçok: rüyadaki yay ve üç ok tamam
  wallet.deposit(Math.round(kut * (has('alkaevli') ? 1.25 : 1)));
  progress[level] = Math.max(progress[level] || 0, stars);
  try { localStorage.setItem('oguz-levels', JSON.stringify(progress)); } catch {}
  $('winstars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('winstats').textContent = `Skor ${Math.floor(score).toLocaleString('tr-TR')} · Kut ${kut} · Düşman ${kills}` + (LEVELS[level].prisoners ? ` · Kurtarılan esir ${esirs}` : '')
    + (full ? ' · ALTIN YAY VE ÜÇ GÜMÜŞ OK TAMAM! +200 KUT' : '');
  $('winstory').textContent = EPILOG[level] || '';
  for (const id of ['hud', 'bossbar', 'ride']) $(id).hidden = true;
  $('win').hidden = false;
}

function start(m = mode, lv = level, skipIntro = false) {
  mode = m;
  level = m === 'endless' ? 0 : lv;
  for (const id of ['book', 'map', 'win', 'over', 'menu', 'loading']) $(id).hidden = true;
  const L = LEVELS[level];
  floor = 0;
  setTheme(cur().theme);
  if (m === 'level' && !skipIntro) {
    ctx.clear();
    return playCine(levelIntro(level), () => start(m, lv, true));
  }
  flying = !!L.flight;
  sect = eagleAway = null; sectDone = false; sectAt = 300; hideProps();
  hero.root.visible = true;
  hero.root.rotation.set(0, Math.PI, 0);
  for (const o of objs) release(o);
  for (const a of arrows) scene.remove(a.mesh);
  objs = []; arrows = []; pending = [];
  if (boss) endBoss();
  fin = null;
  horse.root.visible = false;
  horseAway = null;
  Object.assign(P, { lane: 1, x: 0, y: 0, vy: 0, slide: 0, inv: 0, hp: 3, speed: has('kayi') ? 13.5 : 12, lock: 0, lunge: 0, ride: 0, sword: 0, dead: false, flip: 0, spin: 0, roll: false, rear: 0 });
  time = kut = score = combo = kills = hoops = maxCombo = 0;
  runZ = P.z; nextZ = P.z - 35; bossAt = cur().goals ? Infinity : L.bossAt; ambushT = 6; esirs = 0;
  goalsDone = false; goalKey = ''; stageT = 0; goalBase = { kill: 0, kut: 0, esir: 0, hoop: 0 };
  pow.kurt = pow.kilic = secret = 0; deer = trail = rain = null; deerDone = godDone = islikDone = false;
  secretTheme = null; wolf.root.visible = deerActor.root.visible = false;
  shield = has('karaevli') ? 1 : 0; reviveUsed = smashUsed = false;
  rideTime = RIDE_TIME + (has('doger') ? 6 : 0);
  planRelics();
  $('goals').hidden = !cur().goals;
  $('powers').hidden = true;
  $('esirc').hidden = !L.prisoners;
  $('grid').hidden = !L.flight;
  $('esirc').textContent = '⛓ 0';
  flow = holdTarget = 1;
  P.row = 1;
  if (flying) P.y = HEIGHTS[1];
  tulpar.root.visible = flying;
  if (flying) tulpar.play('Gallop', { speed: 0.7, fade: 0 });
  state = 'run';
  setWeapon(flying ? 'bow' : weapon);
  hero.play(flying ? 'Sitting_Idle_Loop' : 'Sprint_Loop');
  for (const id of ['menu', 'over', 'paused', 'bossbar', 'ride']) $(id).hidden = true;
  $('hud').hidden = false;
  hearts();
  comboUi();
  if (has('alayuntli') && !flying) mount(); // Ala-yuntlı: akına at sırtında başla
}

// --- nesneler ---
function add(kind, lane, z, extra = {}) {
  const def = DEF[kind];
  let mesh, actor = null;
  if (def.esir) { // boyunduruklu esir: üstüne koşunca kurtulur
    actor = pool('esir').find(f => !f.busy);
    if (!actor) return null;
    actor.busy = true;
    actor.root.visible = true;
    actor.root.rotation.set(0, 0, 0);
    actor.parts.Cangue.visible = true;
    actor.play('Crouch_Idle_Loop', { fade: 0 });
    mesh = actor.root;
  } else if (def.deer) { // Ak Geyik: önden koşar, yakalanırsa gizli yola götürür
    actor = deerActor;
    actor.root.visible = true;
    actor.root.rotation.set(0, Math.PI, 0);
    actor.play('Gallop', { speed: 1.4, fade: 0 });
    mesh = actor.root;
  } else if (def.foe) {
    const cfg = FOE[extra.variant || 'baltaci'];
    actor = pool(cfg.model || LEVELS[level].foeModel || 'kormos').find(f => !f.busy);
    if (!actor) return null;
    actor.busy = true;
    actor.root.visible = true;
    actor.root.rotation.set(0, 0, 0);
    actor.root.scale.setScalar(cfg.scale || 1);
    setParts(actor, cfg.parts);
    const idle = cfg.idle === 'Sword_Idle' ? pick(FOE_IDLE) : cfg.idle;
    actor.play(extra.phase === 'wait' && extra.variant === 'pusucu' ? 'MX_GS_Crouch' : idle, { fade: 0 }); // pusucu çömelip bekler
    mesh = actor.root;
    extra = { variant: 'baltaci', hp: cfg.hp, cfg, ready: true, idle, atk: cfg.attack === 'Sword_Attack' ? pick(FOE_ATK) : cfg.attack, ...extra };
    if (cfg.rise && extra.phase == null) Object.assign(extra, { y: -1.9, phase: 'lurk', ready: false }); // suyun altında bekler
    else if (theme === 'nehir' && !extra.bank) { extra.raft = W.makeSal(1.7, 2.2); scene.add(extra.raft); }
  } else {
    mesh = def.make();
    if (HAZARD[kind]) W.hazardGlow(mesh, ...HAZARD[kind]);
    scene.add(mesh);
  }
  const o = { kind, def, mesh, actor, lane, x: LANES[lane], y: 0, z, vz: 0, t: kind === 'pillar' ? 0 : rand(0, 9), ...extra }; // sütun zamanlaması sıfırdan
  if (o.row != null) { o.fy = HEIGHTS[o.row]; o.y = o.fy + (kind === 'kut' ? 0.8 : 1.6); }
  objs.push(o);
  return o;
}

function release(o) {
  if (o.alert) scene.remove(o.alert);
  if (o.raft) scene.remove(o.raft);
  if (o.actor) { o.actor.busy = false; o.actor.root.visible = false; if (o.def.deer) deer = null; return; }
  scene.remove(o.mesh);
  if (o.kind === 'boulder' || o.kind === 'ice') o.mesh.userData.spin.geometry.dispose(); // her kaya kendi geometrisini üretir
}

function spawnRow(z) {
  const d = runZ - z;
  if (secret > 0) { // gizli yol: engel yok, her şeritte kut; sıradaki destan eşyası burada
    const rl = relicPlan.length ? Math.floor(Math.random() * 3) : -1;
    for (let l = 0; l < 3; l++) {
      if (l === rl) { const [k, i] = relicPlan.shift(); add(k, l, z, { fy: 1.6, ri: i }); }
      else for (let i = 0; i < 6; i++) add('kut', l, z + 3 - i * 2);
    }
    return;
  }
  const free = Math.floor(Math.random() * 3);
  for (let l = 0; l < 3; l++) {
    if (trail && l === trail.lane && z < trail.z0 && z > trail.z1) continue; // kan izi şeridi kılıca kadar boş
    if (l === free) {
      if (relicPlan.length && d >= relicPlan[0][2]) { const [k, i] = relicPlan.shift(); add(k, l, z, { fy: 1.6, ri: i }); } // zıplayarak alınır
      else if (d > 150 && !P.ride && !sect && Math.random() < (has('doger') ? 0.06 : 0.035)) add('nal', l, z);
      else if (d > 100 && Math.random() < (P.hp < 3 ? 0.025 : 0.004) * (has('bayindir') ? 2 : 1)) add('kimiz', l, z);
      else if (d > 200 && !pow.kurt && Math.random() < 0.012) add('kurt', l, z);
      else if (d > 300 && !islikDone && Math.random() < 0.012) { islikDone = true; add('islik', l, z); }
      else if (LEVELS[level].prisoners && d > 60 && Math.random() < 0.22) add('esir', l, z);
      else if (Math.random() < 0.65) for (let i = 0; i < 6; i++) add('kut', l, z + 3 - i * 2);
    } else if (Math.random() < 0.55) {
      const foes = (THEMES[theme].foes ?? THEMES[sect?.prev]?.foes)?.filter(f => d >= f[1]);
      if (d < 150 || !foes?.length || Math.random() < 0.5) add(pick(THEMES[theme].obst), l, z);
      else add('kormos', l, z, { variant: pick(foes)[0] });
    }
  }
  if (theme === 'nehir' && Math.random() < 0.3) { // kıyıdan ok atan okçu: yayla vurulur
    const s = Math.random() < 0.5 ? -1 : 1;
    add('kormos', s < 0 ? 0 : 2, z - 4, { variant: level === 7 ? 'itokcu' : 'okcu', x: s * 6.6, y: 0.1, bank: true, ready: false });
  }
  if (sect) return;
  if (!godDone && d > 500 && Math.random() < 0.004) startTrail(z); // çok nadir: Tanrı Kılıcı
  if (!deer && !deerDone && d > 350 && Math.random() < 0.025) { deerDone = true; deer = add('geyik', Math.floor(Math.random() * 3), z - 10, { vz: -P.speed * 0.8, lt: 0 }); }
}

// Topal düvenin kan izi: aynı şeritte damlalar, sonunda toprağa gömülü Tanrı Kılıcı
function startTrail(z) {
  godDone = true;
  const lane = Math.floor(Math.random() * 3);
  for (let i = 0; i < 5; i++) add('kan', lane, z - 6 - i * 8);
  add('kilic', lane, z - 50);
  trail = { lane, z0: z + 2, z1: z - 56 };
}

// Uluğ Türük'ün rüyası: her bölümde üç gümüş ok ve bir altın yay saklı; toplananlar bir daha çıkmaz
function planRelics() {
  relicPlan = [];
  if (mode !== 'level') return;
  const r = (relicSave[level] ??= { yay: false, ok: [false, false, false] });
  const at = cur().goals?.find(g => g[0] === 'dist')?.[1] ?? 900, nf = LEVELS[level].floors?.length || 1;
  // dört eşya kısımlara dağılır: her kısımda o kısma düşenler
  [['gumus', 0], ['gumus', 1], ['yay', 0], ['gumus', 2]].forEach(([k, i], j) => {
    if (j % nf !== floor % nf || (k === 'yay' ? r.yay : r.ok[i])) return;
    relicPlan.push([k, i, Math.round(at * (0.3 + 0.4 * Math.floor(j / nf) / Math.ceil(4 / nf)))]);
  });
}
function saveRelics() { try { localStorage.setItem('oguz-relics', JSON.stringify(relicSave)); } catch {} }

// Gök Yolu: 3 şerit x 3 yükseklik; her sırada en az bir hücre boş
const birdWings = [];
function makeBird() {
  const g = A.templates.karakus.clone(true);
  g.scale.setScalar(0.7);
  const L = g.getObjectByName('Wing_L'), R = g.getObjectByName('Wing_R'), ph = Math.random() * 6;
  g.userData.anim = t => { const a = Math.sin(t * 12 + ph) * 0.7; L.rotation.z = a; R.rotation.z = -a; };
  return g;
}
function spawnSky(z) {
  const free = Math.floor(Math.random() * 9), dive = sect?.kind === 'dive';
  for (let c = 0; c < 9; c++) {
    const lane = c % 3, row = Math.floor(c / 3);
    if (c === free) {
      if (!dive) add('hoop', lane, z, { row });
      if (relicPlan.length && runZ - z >= relicPlan[0][2]) { const [k, i] = relicPlan.shift(); add(k, lane, z - 3, { row, ri: i }); continue; }
      if (Math.random() < 0.7) for (let i = 0; i < 5; i++) add('kut', lane, z + 5 - i * 2, { row });
    }
    else if (Math.random() < (dive ? 0.36 : 0.28)) add(sect ? pick(sect.S.obst) : runZ - z > 200 && Math.random() < 0.4 ? 'bird' : 'cloud', lane, z, { row, vz: 0 });
  }
}
function freeEsir(o) {
  o.freed = true;
  o.ft = 0;
  o.side = o.x > 0 ? 1 : o.x < 0 ? -1 : (Math.random() < 0.5 ? -1 : 1);
  o.actor.parts.Cangue.visible = false;
  o.actor.root.rotation.y = o.side > 0 ? -Math.PI / 2 : Math.PI / 2;
  o.actor.play('Sprint_Loop', { fade: 0.1 });
  esirs++;
  score += 150 * mult() * (has('uregir') ? 2 : 1);
  if (has('uregir')) kut += 5;
  $('esirc').textContent = '⛓ ' + esirs;
  dust.emit(o.x, 1.5, o.z, 25, 0x7a4a24, 5, 4);
  burst(o.x, 1.6, o.z, 1.4);
  pop(pick(['ÖZGÜR!', 'KURTULDU!']), o.mesh.position);
}

function killBird(o) {
  o.dead = true;
  kills++; combo++;
  score += 80 * mult();
  comboUi(true);
  burst(o.x, o.y, o.z, 1.6);
  sparks.emit(o.x, o.y, o.z, 30, 0x2a2030, 5, 3);
  pop(pick(['ŞAK!', 'HAP!']), o);
}

// Ani saldırı: surdan atlayan pusucu ya da yerden fırlayan Erlik kulu, çoğunlukla oyuncunun şeridine
function spawnAmbush() {
  const lane = Math.random() < 0.65 ? P.lane : Math.floor(Math.random() * 3);
  const z = P.z - P.speed * (P.ride ? 1.3 : 1.5);
  if (objs.some(o => o.lane === lane && Math.abs(o.z - z) < 6 && o.def.hit)) return;
  const variant = Math.random() < 0.55 || LEVELS[level].foeModel === 'cinli' ? 'pusucu' : 'yeralti'; // yerden fırlayan sadece Erlik'in kulu
  const side = LANES[lane] >= 0 ? 1 : -1;
  const extra = variant === 'pusucu'
    ? { variant, x: side * 4.6, y: 1.4, sx: side * 4.6, phase: 'wait', pt: 0, ready: false }
    : { variant, y: -1.9, phase: 'wait', pt: 0, ready: false };
  const o = add('kormos', lane, z, extra);
  if (!o) return;
  o.alert = W.makeAlert();
  scene.add(o.alert);
  if (variant === 'yeralti') dust.emit(LANES[lane], 0.2, z, 25, 0x2a1830, 3, 4);
}

const dodged = hit => (hit === 'low' ? P.y > 0.6 : hit === 'high' ? P.slide > 0 : false);

function hurt(o) {
  if (P.inv > 0 || P.dead || fin) return;
  if (o?.def?.foe) killFoe(o, null);
  if (shield > 0) { // Kara-evli boyu: ilk darbe işlemez
    shield--;
    P.inv = 1;
    sparks.emit(P.x, 1.4, P.z, 30, 0x9ad0ff, 5, 3);
    return pop('KALKAN!', { x: P.x, y: 0, z: P.z });
  }
  P.hp--; P.inv = has('eymur') ? 2.4 : 1.4; shake = 0.4; combo = has('dodurga') ? Math.floor(combo / 2) : 0;
  comboUi();
  hearts();
  if (P.hp <= 0) return die();
  timed(hero, pick(HURTS), 0.4);
  if (P.ride) horse.play('Idle_HitReact1', { loop: false, speed: 2, fade: 0.05, then: () => horse.play('Gallop', { speed: 1.5, fade: 0.1 }) });
  P.lock = 0.3;
}

function die() {
  if (has('cepni') && !reviveUsed) { // Hüma kuşu: bir kez ölümden döner
    reviveUsed = true;
    P.hp = 1;
    P.inv = 2.5;
    hearts();
    banner('HÜMA KUŞU!');
    sparks.emit(P.x, 1.5, P.z, 60, 0xffe07a, 7, 4);
    return;
  }
  P.dead = true;
  state = 'dying';
  overT = 1.6;
  timed(hero, pick(DEATHS), 1.5, { fade: 0.1 });
}

// how: 'sword' | 'arrow' | 'horse' | null (çarpışma). Kalkanlı ilk kılıçta kalkanını kaybeder, ok işlemez.
function killFoe(o, how) {
  const at = o.mesh.position;
  if (o.cfg.parts.includes('Shield') && !o.shieldBroken && !has('bukduz') && !pow.kilic && (how === 'sword' || how === 'arrow')) {
    sparks.emit(at.x, 1.4, at.z + 0.4, 25, 0xfff2a0, 5, 3);
    if (how === 'arrow') { pop('KALKAN!', at); return false; }
    o.shieldBroken = true;
    o.actor.parts.Shield.visible = false;
    o.actor.play('Idle_Shield_Break', { loop: false, speed: 1.5, then: () => o.actor.play('Sword_Idle') });
    o.hp = 1;
    pop('KIRILDI!', at);
    stopT = 0.05;
    return false;
  }
  if (o.cfg.hp > 1 && how === 'arrow' && (o.hp -= 1) > 0) { pop('DAYANDI!', at); sparks.emit(at.x, 1.4, at.z, 15, 0xffd23f, 4, 2); return false; }
  o.dying = true; o.vz = 0; o.t = 0;
  if (o.alert) { scene.remove(o.alert); o.alert = null; }
  timed(o.actor, how === 'horse' ? 'Hit_Knockback' : pick(DEATHS), 1.1);
  burst(at.x, 1.3, at.z, 1.6);
  sparks.emit(at.x, 1.3, at.z, 30, how === 'arrow' ? 0xffd23f : 0xff7a3a, 6, 3);
  if (!how) return true;
  kills++; combo++;
  score += (how === 'horse' ? 50 : 100) * mult();
  comboUi(true);
  if (how === 'sword') stopT = 0.06;
  maxCombo = Math.max(maxCombo, combo);
  if (kills % (has('avsar') ? 4 : 6) === 0 && how !== 'horse') { // bitiriş anı: ağır çekim + yakınlaşma
    slowmo(0.25, 0.45);
    fovKick = -12;
    pop('BİTİRİŞ!', at);
  } else pop(pick(['ŞAK!', 'HAP!', 'ÇAT!']), at);
  return true;
}

function updateObj(o, dt) {
  o.t += dt;
  o.z += o.vz * dt;
  const ahead = P.z - o.z;
  if (o.actor && !o.dying && o.def.foe) updateFoe(o, dt, ahead);
  if (o.dying && o.t > 1.4) o.dead = true;
  if (o.freed) { // kurtulan esir yana doğru koşup gider
    o.x += o.side * 5 * dt;
    o.z -= 3 * dt;
    if ((o.ft += dt) > 1.8) o.dead = true;
  }
  if (o.kind === 'kut' && !o.mag && ahead < 7 && ahead > 0 && (has('salur') || (has('kizik') && Math.abs(o.x - P.x) < 2.8))) o.mag = true;
  if (o.def.foe && !o.phase && !o.dying && !o.bank) o.x += (LANES[o.lane] - o.x) * Math.min(1, dt * 8); // şerit değiştiren düşman
  if (o.raft) o.raft.position.set(o.x, Math.sin(o.t * 2) * 0.05, o.z);
  if (o.def.deer) updateDeer(o, dt, ahead);
  if (o.mag) {
    o.x += (P.x - o.x) * Math.min(1, dt * 12);
    o.z += (P.z - o.z) * Math.min(1, dt * 12);
  }
  o.mesh.position.set(o.x, o.y, o.z);
  o.mesh.userData.anim?.(o.t);
  if (o.mesh.userData.spin) o.mesh.userData.spin.rotation.x -= dt * 5;
  if (o.kind === 'pillar' && o.t > 1.8) o.dead = true;
  o.actor?.update(dt);
  if (o.alert) o.alert.position.set(o.x, o.y + 2.6, o.z);

  const reach = P.ride ? 1.5 : 0.9;
  if (o.kind === 'pillar') { // alev sadece yandığı anda yakar
    if (o.t > 0.8 && o.t < 1.6 && Math.abs(P.z - o.z) < 1.2 && Math.abs(o.x - P.x) < 1.2) hurt();
  } else if (!o.done && !o.dying && (o.ready ?? true) && Math.abs(P.z - o.z) < reach && Math.abs(o.x - P.x) < 1.1 && (o.fy == null || Math.abs(o.fy - P.y) < 1.3)) {
    o.done = true;
    if (pickup(o)) {}
    else if (o.kind === 'esir') freeEsir(o);
    else if (!o.def.hit) {}
    else if (P.ride || pow.kilic > 0) trample(o); // atlıyken ve Tanrı Kılıcı elindeyken önündeki her şey yıkılır
    else if (!dodged(o.def.hit)) {
      if (has('cavuldur') && !smashUsed && !o.def.foe) { smashUsed = true; trample(o); pop('GÜÇLÜ OMUZ!', o.mesh.position); } // Çavuldur
      else hurt(o);
    }
  }
  if (ahead < -8) o.dead = true;
}

// Toplanan eşyalar: true dönerse çarpışma işlendi
function pickup(o) {
  const at = o.mesh.position;
  switch (o.kind) {
    case 'kut': {
      const n = pow.kurt > 0 && P.lane === guideLane ? 2 : 1; // kurdun yolundan gidene iki kat
      kut += n; score += 10 * n * mult(); o.dead = true; return true;
    }
    case 'hoop': hoops++; score += 50 * mult() * (has('begdili') ? 2 : 1); sparks.emit(o.x, o.y, o.z, 20, 0xffd23f, 5, 2); o.mesh.visible = false; return true;
    case 'kimiz':
      o.dead = true;
      P.hp = Math.min(3, P.hp + (has('yiva') ? 2 : 1));
      hearts();
      banner('ŞİFA! +♥');
      sparks.emit(o.x, 1.5, o.z, 40, 0xff4a6a, 5, 3);
      return true;
    case 'nal': o.dead = true; mount(); return true;
    case 'kan': return true;
    case 'kurt': // Gök yeleli kurt: önden koşup güvenli yolu gösterir, pusucuları yakalar
      o.dead = true;
      pow.kurt = 14;
      wolf.root.visible = true;
      wolf.root.position.set(P.x, 0, P.z - 3);
      wolf.play('Gallop', { speed: 1.4, fade: 0 });
      banner('GÖK YELELİ KURT!');
      sparks.emit(o.x, 1.2, o.z, 40, 0x6ab8ff, 5, 3);
      return true;
    case 'islik': o.dead = true; volley(); return true;
    case 'gumus': case 'yay': {
      o.dead = true;
      const r = relicSave[level];
      if (r) { if (o.kind === 'yay') r.yay = true; else r.ok[o.ri] = true; saveRelics(); }
      const n = r ? r.ok.filter(Boolean).length : 0;
      banner(o.kind === 'yay' ? 'ALTIN YAY!' : `GÜMÜŞ OK ${n}/3`);
      score += 500;
      sparks.emit(at.x, 2, at.z, 50, o.kind === 'yay' ? 0xffc83a : 0xcfe8ff, 6, 3);
      return true;
    }
    case 'kilic': // Tanrı Kılıcı
      o.dead = true;
      trail = null;
      pow.kilic = 12;
      timedOver(hero, 'MX_GS_PowerUp', 0.9);
      setWeapon('sword');
      banner('TANRI KILICI!');
      slowmo(0.3, 0.6);
      sparks.emit(at.x, 1.4, at.z, 70, 0xff3a2a, 8, 4);
      return true;
  }
  return false;
}

// Mete'nin ıslıklı oku: ok nereye giderse bütün ordu oraya atar — önündeki her şeye ok yağmuru
function volley() {
  banner('ISLIKLI OK! ORDU, ATEŞ!');
  slowmo(0.5, 0.5);
  rain = { t: 0, n: 0, drops: [] };
}
function updateRain(dt) {
  rain.t += dt;
  while (rain.n < 40 && rain.n < rain.t * 34) {
    rain.n++;
    const m = W.makeArrow();
    m.rotation.x = Math.PI / 2;
    const d = { m, x: LANES[rain.n % 3] + rand(-0.6, 0.6), y: rand(14, 20), z: P.z - rand(8, 70) };
    scene.add(m);
    rain.drops.push(d);
  }
  for (const d of rain.drops) {
    d.y -= 45 * dt;
    d.m.position.set(d.x, d.y, d.z);
    if (d.y > 0.3) continue;
    d.done = true;
    scene.remove(d.m);
    dust.emit(d.x, 0.2, d.z, 6, 0xc9a77a, 2, 2);
    for (const o of objs) { // isabet: düşman ölür, engel parçalanır
      if (o.dead || o.dying || Math.abs(o.z - d.z) > 3 || Math.abs(o.x - d.x) > 1.4) continue;
      if (o.def.foe && o.ready) killFoe(o, 'rain');
      else if (o.def.hit && !o.def.foe && o.kind !== 'pillar') { o.dead = true; burst(o.x, 1, o.z, 1.6); dust.emit(o.x, 0.8, o.z, 25, 0x7a4a24, 6, 4); }
    }
  }
  rain.drops = rain.drops.filter(d => !d.done);
  if (rain.n >= 40 && !rain.drops.length) rain = null;
}

// Kurt önden koşar: önündeki 30 m'de engelsiz (tercihen kutlu) şeride geçer
function updateGuide(dt) {
  if ((guideT -= dt) <= 0) {
    guideT = 0.35;
    const score3 = [0, 1, 2].map(l => objs.reduce((s, o) => {
      const a = P.z - o.z;
      if (o.lane !== l || a < 2 || a > 32 || o.dead) return s;
      return s + (o.def.hit ? -10 : o.kind === 'kut' ? 1 : 0);
    }, l === guideLane ? 0.5 : 0));
    guideLane = score3.indexOf(Math.max(...score3));
  }
  const w = wolf.root;
  w.position.x += (LANES[guideLane] - w.position.x) * Math.min(1, dt * 5);
  w.position.z += (P.z - 6.5 - w.position.z) * Math.min(1, dt * 4);
  w.position.y = 0;
  w.rotation.set(0, Math.PI, 0);
  wolf.update(dt * 1.3);
  if (pow.kurt <= dt) { w.visible = false; banner('KURT GİTTİ'); }
}

// Ak Geyik: önden koşar, ara sıra şerit değiştirir; yakalanırsa gizli yola götürür
function updateDeer(o, dt, ahead) {
  o.vz = -P.speed * 0.8;
  if ((o.lt += dt) > 1.4) { o.lt = 0; o.lane = clamp(o.lane + pick([-1, 1]), 0, 2); }
  o.x += (LANES[o.lane] - o.x) * Math.min(1, dt * 4);
  if (o.t > 11) o.dead = true; // yakalanamadı, ormana kaçtı
  if (ahead < 1.5 && ahead > -1 && Math.abs(o.x - P.x) < 1.2) { o.dead = true; enterSecret(); }
}
function enterSecret() {
  banner('AK GEYİK! GİZLİ YOL!');
  flash();
  secret = 10;
  secretTheme = theme;
  for (const o of objs) if (!o.actor || o.def.foe) o.dead = true;
  setTheme('koru');
}
function flash() { // beyaz parlama: tema değişimini örter
  const f = $('flash');
  f.style.transition = 'none';
  f.style.opacity = 1;
  void f.offsetWidth;
  f.style.transition = 'opacity .7s';
  f.style.opacity = 0;
}

function updateFoe(o, dt, ahead) {
  const cfg = o.cfg;
  if (o.phase === 'lurk') { // bataklıkta suyun altında: yaklaşınca yükselir
    if (ahead < 22) { o.phase = 'rise'; o.pt = 0; dust.emit(o.x, 0.2, o.z, 30, 0x2e5a48, 4, 6); }
    return;
  }
  if (cfg.float && !o.phase) o.y = cfg.float + Math.sin(o.t * 3) * 0.15;
  if (cfg.zig && !o.zigged && ahead < 17 && ahead > 6) { // son anda oyuncunun şeridine süzülür
    o.zigged = true;
    o.lane = P.lane !== o.lane && Math.abs(P.lane - o.lane) === 1 ? P.lane : clamp(o.lane + pick([-1, 1]), 0, 2);
    sparks.emit(o.x, 1.4, o.z, 12, 0xffe07a, 3, 2);
  }
  if (cfg.charge && !o.charging && ahead < 30 && ahead > 4) { // üstüne koşar
    o.charging = true;
    o.vz = cfg.charge;
    o.actor.root.rotation.y = 0;
    o.actor.play(pick(FOE_RUN), { speed: 1.2, fade: 0.1 });
  }
  if (cfg.dodge && !o.dodged && arrows.some(a => Math.abs(a.x - o.x) < 1 && o.z - a.z < 0 && a.z - o.z < 9)) { // İt-Barak oktan kaçar
    o.dodged = true;
    if (Math.random() < 0.6) { o.lane = clamp(o.lane + (o.lane === 1 ? pick([-1, 1]) : o.lane === 0 ? 1 : -1), 0, 2); pop('KAÇTI!', o.mesh.position); }
  }
  if (cfg.lob && !o.thrown && ahead < 32 && ahead > 14) { // Almas buz kayası yuvarlar
    o.thrown = true;
    o.actor.play('OverhandThrow', { loop: false, speed: 1.3, fade: 0.08, then: () => o.actor.play(cfg.idle) });
    o.lobT = 0.35;
  }
  if (o.lobT > 0 && (o.lobT -= dt) <= 0) add(cfg.lob, o.lane, o.z + 1, { vz: 13 });
  if (cfg.shoot && (o.shots ?? 0) < 2 && ahead < 34 && ahead > 12 && (o.st = (o.st ?? 0.6) - dt) <= 0) { // okçu
    o.shots = (o.shots ?? 0) + 1;
    o.st = 1.1;
    o.actor.play(cfg.attack, { loop: false, speed: 1.5, fade: 0.05, then: () => o.actor.play(cfg.idle) });
    add('bolt', o.lane, o.z + 1, { vz: 18 });
  }
  if (o.phase === 'wait') {
    o.pt += dt;
    if (o.alert) o.alert.scale.setScalar(0.9 + Math.sin(o.pt * 30) * 0.12);
    if (o.pt > (has('yaparli') ? 0.7 : 0.35)) {
      o.phase = o.variant === 'pusucu' ? 'leap' : 'rise';
      o.pt = 0;
      if (o.variant === 'pusucu') o.actor.play('NinjaJump_Start', { loop: false, speed: 1.8, fade: 0.05 });
      else dust.emit(o.x, 0.2, o.z, 30, 0x3a2040, 4, 6);
    }
  } else if (o.phase === 'leap') {
    o.pt += dt;
    const t = Math.min(1, o.pt / 0.45);
    o.x = lerp(o.sx, LANES[o.lane], t);
    o.y = lerp(1.4, 0, t) + Math.sin(t * Math.PI) * 1.3;
    if (t >= 1) land(o);
  } else if (o.phase === 'rise') {
    o.pt += dt;
    o.y = lerp(-1.9, 0, Math.min(1, o.pt / 0.3));
    if (o.pt >= 0.3) land(o);
  } else if (o.variant === 'mizrakci' && !o.thrown && ahead < 30 && ahead > 12) {
    o.thrown = true;
    o.actor.play('OverhandThrow', { loop: false, speed: 1.4, fade: 0.08, then: () => o.actor.play('Idle_Loop') });
    o.throwT = 0.3;
  } else if (o.ready && !o.swung && !cfg.shoot && ahead < 9 && ahead > 0) {
    o.swung = true;
    timed(o.actor, o.shieldBroken ? pick(FOE_ATK) : o.atk, 0.6);
  }
  if (o.throwT > 0 && (o.throwT -= dt) <= 0) {
    o.actor.parts.Spear.visible = false;
    add('spear', o.lane, o.z + 0.8, { vz: 16 });
  }
}

function land(o) {
  o.phase = null;
  o.ready = true;
  if (pow.kurt > 0 && o.alert) { // kurt pusucuyu yere serer
    wolf.play('Attack', { loop: false, speed: 1.6, fade: 0.05, then: () => wolf.play('Gallop', { speed: 1.4 }) });
    killFoe(o, 'wolf');
    return pop('KURT!', o.mesh.position);
  }
  o.y = 0;
  o.x = LANES[o.lane];
  if (o.alert) { scene.remove(o.alert); o.alert = null; }
  dust.emit(o.x, 0.2, o.z, 20, 0xc9a77a, 3, 2);
  o.actor.play(o.variant === 'pusucu' ? 'NinjaJump_Land' : o.idle, { loop: o.variant !== 'pusucu', speed: 1.6, then: () => o.actor.play(o.idle) });
}

// --- dövüş ---
// Dokunma / sol tık: elde kılıç varsa kombo (yakındaki düşmana atılarak), yay varsa ok. Tepegöz sersemken kılıçla vurulur.
function tapAction() {
  if (P.dead || fin) return;
  if (boss && boss.def.tap(B, boss)) return;
  if (sect?.S.fly) return; // eller kartalın pençesinde / düşerken
  if (flying || weapon === 'bow') return throwArrow(); // havada kılıç yok
  const reach = pow.kilic > 0 ? 16 : P.ride ? 3 : 9;
  const inLane = objs.filter(o => o.def.foe && !o.dying && o.ready && Math.abs(o.x - P.x) < 1.3 && P.z - o.z > -0.5 && P.z - o.z < reach).sort((a, b) => b.z - a.z);
  slash(inLane[0] || null);
  if (pow.kilic > 0) for (const o of inLane.slice(1)) killFoe(o, 'sword'); // Tanrı Kılıcı: şeritteki herkes
}

function slash(target, atBoss = false) {
  if (cool > 0) return;
  cool = 0.22;
  swordMode(true);
  P.sword = 1.0;
  slashStep = time - lastSlash < 0.9 ? (slashStep + 1) % SLASHES.length : 0;
  lastSlash = time;
  const far = target && P.z - target.z > 3.5;
  const heavy = target && (kills + 1) % 6 === 0; // bitiriş vuruşu: ağır kombo + dönerek
  const clip = heavy ? pick(HEAVY) : far ? 'Sword_Dash' : SLASHES[slashStep];
  const t = heavy ? 0.8 : far ? 0.45 : clip.startsWith('MX_') ? 0.5 : hero.duration(clip) / 1.7;
  if (clip === 'Sword_Heavy_Combo' || clip === 'Sword_Regular_C') P.spin = 0.4;
  if (P.ride) timedOver(hero, clip, t);
  else {
    timed(hero, clip, t);
    P.lock = t * 0.75;
  }
  if (far || atBoss || heavy) P.lunge = 0.35;
  if (target) killFoe(target, 'sword');
  if (atBoss) hitBoss();
}

// Gerçek yay atışı: sol kol yayı ileri uzatır, sağ el kirişi çeker ve bırakır; bacaklar koşmaya devam eder
const BOW_SPEED = 2.4, BOW_RELEASE = 15 / 24 / BOW_SPEED;
function throwArrow() {
  if (cool > 0) return;
  cool = has('yazir') ? 0.2 : 0.3;
  if (weapon !== 'bow') setWeapon('bow'); // Albastı gibi okla vurulan düşmanda yay kendiliğinden ele geçer
  hero.parts.ArrowNock.visible = true;
  const sp = BOW_SPEED * (has('yazir') ? 1.3 : 1);
  bowStyle = (bowStyle + 1) % 2;
  if (bowStyle) hero.overlay('Bow_Shoot', { speed: sp }); // çekip bırakma (kendi klibimiz)
  else timedOver(hero, 'MX_BowDraw', BOW_RELEASE * BOW_SPEED / sp); // Mixamo: ok takıp çekme, bırakınca geri tepme
  pending.push(BOW_RELEASE * BOW_SPEED / sp);
}

const v3 = new THREE.Vector3();
function launchArrow() {
  hero.parts.ArrowNock.visible = false;
  if (!bowStyle && !flying) timedOver(hero, 'MX_BowRecoil', 0.35);
  hero.bone('hand_r').getWorldPosition(v3);
  const mesh = W.makeArrow();
  scene.add(mesh);
  const tgt = objs.find(o => o.bank && !o.dying && P.z - o.z > 5 && P.z - o.z < 40 && (P.lane === 1 || (o.x < 0) === (P.lane === 0)));
  arrows.push({ mesh, x: P.x, y: flying ? P.y + 1.8 : clamp(v3.y, 1, 3.5), z: v3.z - 0.4, tgt });
  if (has('igdir')) { // çift ok: ikincisi yan şeride
    const m2 = W.makeArrow();
    scene.add(m2);
    arrows.push({ mesh: m2, x: LANES[clamp(P.lane + (P.lane === 2 ? -1 : 1), 0, 2)], y: flying ? P.y + 1.8 : clamp(v3.y, 1, 3.5), z: v3.z - 0.4 });
  }
}

function updateArrow(a, dt) {
  a.z -= 65 * dt;
  if (has('kinik')) { // Kınık: ok uçan düşmana döner
    const t = objs.find(o => o.def.flyfoe && !o.dead && o.z < a.z && a.z - o.z < 14);
    if (t) { a.x += (t.x - a.x) * Math.min(1, dt * 8); a.y += (t.y - a.y) * Math.min(1, dt * 8); }
  }
  if (a.tgt) a.x += (a.tgt.x - a.x) * Math.min(1, dt * 7);
  a.mesh.position.set(a.x, a.y, a.z);
  if (P.z - a.z > 60) a.dead = true;
  for (const o of objs) {
    if (o.def.flyfoe && !o.dead && Math.abs(o.z - a.z) < 1.8 && Math.abs(o.x - a.x) < 1.2 && Math.abs(o.y - a.y) < 1.3) {
      a.dead = true;
      killBird(o);
      return;
    }
    if (!o.def.foe || o.dying || !(o.ready || o.bank) || Math.abs(o.z - a.z) > 1.8 || Math.abs(o.x - a.x) > 1.2) continue;
    a.dead = true;
    killFoe(o, 'arrow');
    return;
  }
  if (boss && !fin && a.z < boss.gz + 1.2 && boss.def.arrow(B, boss, a)) a.dead = true;
}

function burst(x, y, z, size) {
  const s = W.makeBurst();
  s.position.set(x, y, z);
  scene.add(s);
  bursts.push({ s, t: 0, size });
}

// --- at ---
function mount() {
  P.ride = rideTime; P.slide = 0; P.lock = 0;
  horseAway = null;
  horse.root.visible = true;
  horse.play('Gallop', { speed: 1.5, fade: 0 });
  hero.play('Sitting_Idle_Loop', { fade: 0.1 });
  P.rear = 0.7; // at şahlanır
  $('ride').hidden = false;
  banner('ATA BİN!');
  dust.emit(P.x, 0.3, P.z, 30, 0xc9a77a, 4, 2);
}

function dismount() {
  P.ride = 0;
  $('ride').hidden = true;
  horseAway = { t: 0, x: P.x, z: P.z };
  horse.play('Jump_toIdle', { loop: false, speed: 1.2, fade: 0.2, then: () => horse.play('Walk', { speed: 1, fade: 0.3 }) });
  P.y = 1.2; P.vy = 5;
  hero.play('NinjaJump_Idle_Loop', { fade: 0.1 });
  banner('AT YORULDU!');
}

// Atlıyken şeritteki her şey ezilir
function trample(o) {
  const at = o.mesh.position;
  horse.play(Math.random() < 0.5 ? 'Attack_Headbutt' : 'Attack_Kick', { loop: false, speed: 2.4, fade: 0.05, then: () => horse.play('Gallop', { speed: 1.5, fade: 0.1 }) });
  if (o.def.foe) { killFoe(o, 'horse'); return; }
  o.dead = true;
  score += 20 * mult();
  dust.emit(at.x, 0.8, at.z, 35, 0x7a4a24, 7, 5);
  burst(at.x, 1, at.z, 1.8);
  shake = 0.15;
  pop('GÜM!', at);
}

// Oturma animasyonundaki bacakları eyerin iki yanına indirir: kemiğin boyu (+Y) verilen dünya yönüne çevrilir.
// Kahraman -z'ye bakar; sol taraf -x.
const RIDE_AIM = [
  ['thigh_l', new THREE.Vector3(-0.5, -0.6, -0.55)], ['thigh_r', new THREE.Vector3(0.5, -0.6, -0.55)],
  ['calf_l', new THREE.Vector3(-0.2, -1, 0.3)], ['calf_r', new THREE.Vector3(0.2, -1, 0.3)],
];
const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), ya = new THREE.Vector3(), ta = new THREE.Vector3();
function rideLegs(actor = hero) {
  actor.root.updateMatrixWorld(true);
  for (const [name, dir] of RIDE_AIM) {
    const bone = actor.bone(name);
    bone.getWorldQuaternion(qa);
    ya.set(0, 1, 0).applyQuaternion(qa);
    qa.premultiply(qb.setFromUnitVectors(ya, ta.copy(dir).normalize()));
    bone.parent.getWorldQuaternion(qb);
    bone.quaternion.copy(qb.invert().multiply(qa));
    bone.updateMatrixWorld(true);
  }
}

// --- boss'lar: davranışlar bosses.js'te, burada ortak yardımcılar ---
const bossActors = {};
function getBossActors(kind) {
  if (bossActors[kind]) return bossActors[kind];
  const def = BOSSES[kind];
  const mk = () => {
    const a = new Actor(A, def.model);
    a.root.scale.setScalar(def.scale);
    a.root.visible = false;
    scene.add(a.root);
    return a;
  };
  const main = mk();
  const extra = [];
  let mountActor = null;
  if (def.mount) {
    mountActor = new Actor(A, 'horse', A.horseClips);
    mountActor.root.scale.setScalar(HORSE_SCALE);
    mountActor.root.visible = false;
    scene.add(mountActor.root);
  }
  for (let i = 0; i < (def.clones || 0); i++) { // seraplar: gölgesiz
    const e = mk();
    e.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    extra.push(e);
  }
  return (bossActors[kind] = { main, extra, mount: mountActor });
}

const B = {
  P, sparks, dust,
  add: (k, l, z, e) => add(k, l, z, e),
  hurt: () => hurt(),
  burst: (x, y, z, s) => burst(x, y, z, s),
  pop: (t, p) => pop(t, p),
  banner: t => banner(t),
  shake: v => (shake = Math.max(shake, v)),
  warn(lane, zFar, zNear, on, t = 0) {
    warn.visible = on;
    if (!on) return;
    warn.position.set(LANES[lane], 0.03, (zFar + zNear) / 2);
    warn.scale.y = Math.max(2, zNear - zFar) / 9;
    warn.material.opacity = 0.25 + Math.abs(Math.sin(t * 10)) * 0.3;
  },
  tap(text) { $('tap').hidden = !text; if (text) $('tap').textContent = text; },
  hold(on) { holdTarget = on ? 0 : 1; },
  mash(v) { $('mash').hidden = v == null; if (v != null) $('mashbar').style.width = Math.min(1, v) * 100 + '%'; },
  hitBoss: () => hitBoss(),
  arm: w => setWeapon(w),
  prop(make) { const m = W[make](); scene.add(m); return m; }, // boss sahnesine ait nesne (Erlik'in örsü)
  unprop(m) { scene.remove(m); },
  done: () => finishDone(boss), // bitiriş vuruşu olmadan boss'u geç (kaçan Erlik)
  slashBoss: () => { cool = 0; slash(null, true); },
  rideLegs: a => rideLegs(a),
  finish: () => startFinisher(),
  bar: () => bossBar(),
  mark() { // hedef işareti (Yelbegen'in kesilecek başı)
    const m = W.makeAlert();
    scene.add(m);
    return m;
  },
  blob() { // yerde koyu gölge lekesi (Albastı'nın gerçeğini belli eder)
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8, depthWrite: false }));
    m.material.userData.outlineParameters = { visible: false };
    m.rotation.x = -Math.PI / 2;
    scene.add(m);
    return m;
  },
};

function startBoss() {
  const kind = cur().boss, def = BOSSES[kind];
  const { main, extra, mount } = getBossActors(kind);
  boss = { kind, def, hp: def.hp, max: def.hp, state: 'enter', t: 0, time: 0, gz: 0, off: 0, x: 0, y: 0, lane: 1, rot: 0, n: 0, hits: 0, actor: main, extra, mount };
  main.root.visible = true;
  main.root.rotation.set(0, 0, 0);
  def.start(B, boss);
  main.root.rotation.y = boss.rot;
  if (def.ranged && !flying) { setWeapon('bow'); banner('YAYINI ÇEK!'); }
  $('bossname').textContent = def.name;
  $('bossbar').hidden = false;
  bossBar();
}

// Kanat çırpma: kanatlar model kökünde, uzunlamasına (z) eksen etrafında döner; base < 0 kanatları yukarı açar
function flap(root, speed, axis = 'z', base = 0) {
  const L = root.getObjectByName('Wing_L'), R = root.getObjectByName('Wing_R');
  if (!L) return;
  const a = base + Math.sin(time * speed) * 0.55;
  L.rotation[axis] = a;
  R.rotation[axis] = -a;
}

function hitBoss() {
  const b = boss;
  if (!b || b.hp <= 0) return;
  b.hp--;
  combo++;
  score += 200 * mult();
  comboUi(true);
  const at = new THREE.Vector3(b.x, (b.def.hitY || 2) + (b.y || 0), b.gz + 1);
  burst(at.x, at.y, at.z, 2.6);
  sparks.emit(at.x, at.y, at.z, 40, 0xff9a3a, 7, 3);
  pop(pick(['ŞAK!', 'GÜM!', 'ÇAT!']), at);
  shake = 0.2;
  stopT = 0.07;
  bossBar();
  if (b.hp > 1 && (pow.kilic > 0 || (has('becene') && Math.random() < 0.25))) { b.hp--; pop('ÇİFT!', at); bossBar(); } // Tanrı Kılıcı / Beçene
  if (b.hp > 0) return b.def.hit(B, b);
  if (!b.def.beforeFinish?.(B, b)) startFinisher();
}

function endBoss() {
  if (boss) {
    if (boss.blob) scene.remove(boss.blob);
    boss.def.end?.(B, boss);
    if (boss.mark) scene.remove(boss.mark);
    boss.actor.root.visible = false;
    for (const e of boss.extra) e.root.visible = false;
  }
  boss = null;
  bossAt = dist() + 2000;
  holdTarget = 1;
  for (const id of ['bossbar', 'tap', 'mash']) $(id).hidden = true;
  warn.visible = false;
}

function updateBoss(dt) {
  const b = boss;
  b.t += dt;
  b.time += dt;
  b.off = P.z - b.gz;
  b.def.update(B, b, dt);
  if (!boss) return;
  b.off = P.z - b.gz;
  const r = b.actor.root;
  r.position.set(b.x, b.y || 0, b.gz);
  const d = Math.atan2(Math.sin(b.rot - r.rotation.y), Math.cos(b.rot - r.rotation.y));
  r.rotation.y += d * Math.min(1, dt * 8);
  if (b.def.flying) flap(r, b.flap || 7);
  b.actor.update(dt);
  b.def.post?.(B, b);
}

// Boss bitirişi: ağır çekim, kamera etrafında döner, Oğuz ağır kombo ile son darbeyi vurur. Uçan boss spiral çizerek düşer.
function startFinisher() {
  const b = boss;
  fin = { t: 0, hits: 0 };
  B.tap(null);
  B.mash(null);
  warn.visible = false;
  b.state = 'dying';
  for (const e of b.extra) e.root.visible = false;
  if (b.def.flying) { slowmo(0.4, 1.4); banner(b.def.name + ' DÜŞÜYOR!'); return; }
  swordMode(true);
  hero.play('Sword_Heavy_Combo', { loop: false, speed: 1.15, fade: 0.08 });
  b.actor.play('Hit_Chest', { loop: false, speed: 0.6 });
  slowmo(0.45, 1.6);
  banner('BİTİR ONU!');
}

function updateFinisher(dt) {
  fin.t += dt;
  const b = boss, gz = b.gz, s = b.def.scale / 2.5;
  if (b.def.flying) {
    b.y -= dt * (2 + fin.t * 5);
    b.actor.root.rotation.z += dt * 4;
    b.actor.root.position.set(b.x, b.y, gz);
    flap(b.actor.root, 2);
    if (fin.hits < 3 && fin.t > 0.3 + fin.hits * 0.4) {
      fin.hits++;
      burst(b.x, b.y + 1, gz + 1, 3);
      sparks.emit(b.x, b.y + 1, gz + 1, 50, 0xffc040, 8, 4);
      pop(['ŞAK!', 'ÇAT!', 'GÜM!'][fin.hits - 1], new THREE.Vector3(b.x, b.y, gz));
    }
    flightRig(dt);
    if (fin.t > 2.6) finishDone(b);
    return;
  }
  const lungeTo = Math.min(1, fin.t / 0.35) * (b.off - 2.4 * Math.max(1, s));
  hero.root.position.set(lerp(P.x, b.x, Math.min(1, fin.t / 0.35)), 0, P.z - lungeTo);
  if (fin.hits < 3 && fin.t > 0.45 + fin.hits * 0.5) {
    fin.hits++;
    const y = (b.def.hitY || 2) * (0.75 + fin.hits * 0.15);
    burst(b.x, y, gz + 1, 3);
    sparks.emit(b.x, y, gz + 1, 60, 0xffc040, 9, 4);
    pop(['ŞAK!', 'ÇAT!', 'GÜM!'][fin.hits - 1], new THREE.Vector3(b.x, y, gz));
    shake = 0.3;
    if (fin.hits === 3) b.actor.play('Death01', { loop: false, speed: 0.9, fade: 0.1 });
  }
  if (fin.t > 2.1 && fin.t - dt <= 2.1) dust.emit(b.x, 0.3, gz - 3, 80, 0xc9a77a, 10, 5);
  b.actor.root.position.set(b.x, b.y || 0, gz);
  b.actor.update(dt);
  hero.update(dt);
  if (fin.t > 3.2) finishDone(b);
}

function finishDone(b) {
  score += 2000;
  banner(`${b.def.name} YENİLDİ!`);
  endBoss();
  fin = null;
  swordMode(false);
  const fl = LEVELS[level].floors;
  if (mode === 'level' && fl && floor < fl.length - 1) return nextFloor();
  if (mode === 'level') { if (!flying) hero.play('Idle_Loop', { fade: 0.3 }); return win(); }
  setWeapon(weapon);
  hero.play('Sprint_Loop', { fade: 0.2 });
}

// Kat geçişi: yerin bir kat daha altına düşülür, yeni kat yeni görevlerle başlar
function nextFloor() {
  floor++;
  const F = cur();
  for (const o of objs) release(o);
  objs = [];
  const z = P.z;
  const runShot = { // yeni kısım: Oğuz koşarak gelir, kamera önünden geri çekilir
    dur: 3.2,
    enter(c) { c.fade(1); setTheme(F.theme); c.title([[F.sub, 'sub'], [F.name, 'logo']]); c.titleAlpha(0); c.hero.play(pick(RUNS[weapon]), { fade: 0 }); },
    update(c, k, t) {
      const hz = z - 6 - t * 12;
      c.P.z = hz + 6;
      c.show(c.hero, 0, 0, hz, Math.PI);
      c.cam(Math.sin(k * 1.2) * 3, 1.6 + k * 1.5, hz - 5 + k * 1.5, 0, 1.2, hz);
      c.fade(Math.max(0, 1 - k * 4) + (k > 0.85 ? (k - 0.85) * 6 : 0));
      c.titleAlpha(k > 0.15 && k < 0.9 ? 1 : 0, k > 0.15 && k < 0.2);
    },
  };
  const enter = () => {
    setTheme(F.theme);
    goalsDone = false; goalKey = '';
    bossAt = Infinity;
    goalBase = { kill: kills, kut, esir: esirs, hoop: hoops }; maxCombo = combo; // görevler bu kısımdan sayılır
    runZ = P.z; nextZ = P.z - 30;
    P.x = LANES[P.lane = 1];
    hero.root.visible = true;
    hero.root.rotation.set(0, Math.PI, 0);
    planRelics();
    $('fade').style.opacity = 0;
    P.inv = 1.5;
    if (P.hp < 3) { P.hp++; hearts(); } // her katta bir can tazelenir
    state = 'run';
    setWeapon(weapon);
    hero.play('Sprint_Loop');
    $('hud').hidden = false;
    $('goals').hidden = false;
    sectDone = false;
  };
  if (F.fall) { // yol uçurumda biter: Oğuz aşağı atlar, dipte yeni kata iner
    banner(F.sub);
    return startSect('dive', () => { enter(); banner(F.name); hero.play('NinjaJump_Land', { loop: false, speed: 1.6, fade: 0.05 }); P.lock = 0.3; });
  }
  playCine([runShot], enter);
}

// ---- koşu içi bölümler ----
function makeEagle() { // Er-Töştük'ün Kara Kuşu: altın-kahve dev kartal
  const g = A.templates.karakus.clone(true);
  const gold = new THREE.Color(0xc8923a);
  g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.color?.lerp(gold, 0.55); } });
  g.scale.setScalar(1.0);
  scene.add(g);
  return g;
}
function hideProps() {
  for (const p of [eagle, raft, board]) if (p) p.visible = false;
  if (hero) hero.root.rotation.z = 0;
  $('grid').hidden = !LEVELS[level]?.flight;
}
function camMark() { camEase = 1; camFromP.copy(camera.position); camFromQ.copy(camera.quaternion); }
function startSect(kind, after = null) {
  const S = SECTS[kind];
  sect = { kind, S, t: 0, prev: theme, after };
  for (const o of objs) if (P.z - o.z > -2) o.dead = true; // önü temizlenir
  nextZ = P.z - 26;
  if (P.ride) dismount();
  camMark();
  flash();
  setTheme(S.seg);
  if (!after) banner(S.name);
  P.slide = P.flip = 0; P.lock = 0;
  if (S.fly) {
    swordMode(false);
    flying = true; P.row = 1; P.vy = 0;
    if (kind === 'dive') P.y = HEIGHTS[1];
    $('grid').hidden = false;
  }
  if (kind === 'kartal') { (eagle ??= makeEagle()).visible = true; eagleAway = null; sw.a = sw.v = 0; sw.px = P.x; }
  if (kind === 'sal') { (raft ??= (() => { const r = W.makeSal(); scene.add(r); return r; })()).visible = true; P.y = 0; }
  if (kind === 'buz') { (board ??= (() => { const b = W.makeShieldBoard(); scene.add(b); return b; })()).visible = true; }
}
function endSect() {
  const s = sect;
  sect = null;
  for (const o of objs) if (P.z - o.z > -2) o.dead = true;
  nextZ = P.z - 30;
  camMark();
  flash();
  if (s.kind === 'kartal') { eagleAway = { t: 0, x: eagle.position.x, y: eagle.position.y, z: eagle.position.z }; P.vy = 2; } // bırakır, Oğuz yere süzülür
  if (s.S.fly) flying = false;
  if (s.kind === 'dive') P.y = P.vy = 0;
  const keep = eagle;
  hideProps();
  if (eagleAway) keep.visible = true;
  setTheme(s.after ? theme : s.prev);
  s.after?.();
  if (!s.after) banner(pick(['YİĞİT!', 'ALP!', 'BOZKURT!']));
  swordMode(false);
  setWeapon(weapon);
}
function sectTick(dt) { // update(): bölüm zamanı ve tetikleyiciler
  if (sect) { if ((sect.t += dt) >= sect.S.dur) endSect(); return; }
  if (boss || fin || flying || stageT > 0) return;
  const sc = cur().sect;
  if (mode === 'level' && sc && !sectDone && !goalsDone && dist() >= sc[1]) { sectDone = true; startSect(sc[0]); }
  else if (mode === 'endless' && dist() >= sectAt) { sectAt += 650; startSect(pick(['kartal', 'sal', 'buz'])); }
}
function sectView(dt) { // view(): bölümdeki duruşlar ve sahne eşyaları
  const r = hero.root, k = sect.kind;
  if (k === 'dive') { // baş aşağı dalış: gövde düşüş yönünde (-z), yüz aşağı
    r.position.set(P.x, P.y + 1.6, P.z + 0.9);
    r.rotation.set(-1.3, Math.PI, Math.sin(time * 3) * 0.12);
  } else if (k === 'kartal') {
    const vx = (P.x - sw.px) / Math.max(dt, 1e-3);
    sw.px = P.x;
    sw.v += ((-clamp(vx * 0.05, -0.45, 0.45) - sw.a) * 28 - sw.v * 2.5) * dt; // şerit değişince Oğuz sarkaç gibi sallanır
    sw.a += sw.v * dt;
    const a = sw.a + Math.sin(time * 1.7) * 0.07, into = Math.max(0, 1 - sect.t / 0.7);
    const py = P.y + 2.8, arm = 2.1;
    eagle.position.set(P.x, py + 0.2 + into * 9, P.z + 0.3 + into * 6);
    eagle.rotation.set(-0.15 - into * 0.6, 0, -sw.v * 0.05);
    flap(eagle, 7, 'z', -0.2);
    r.position.set(P.x + Math.sin(a) * arm, py - Math.cos(a) * arm + into * 9, P.z + into * 6);
    r.rotation.set(0, Math.PI, -a);
  } else if (k === 'sal') {
    const bob = Math.sin(time * 2.2) * 0.05;
    raft.position.set(P.x, bob, P.z + 0.3);
    raft.rotation.set(Math.sin(time * 1.6) * 0.03, 0, (P.x - LANES[P.lane]) * 0.06);
    r.position.y = P.y + bob;
  } else if (k === 'buz') { // kalkanın üstünde yan duruş, dönüşte yatar
    const lean = (LANES[P.lane] - P.x) * 0.12;
    board.position.set(P.x, P.y, P.z);
    board.rotation.set(0, 0.9, lean);
    r.position.y = P.y + 0.14;
    r.rotation.set(0, Math.PI + 0.9, lean);
  }
}

// Görevler: hepsi tamamlanınca boss gelir
let goalBase = { kill: 0, kut: 0, esir: 0, hoop: 0 };
function goalVal(k) { return { dist: dist(), kill: kills - goalBase.kill, kut: kut - goalBase.kut, esir: esirs - goalBase.esir, hoop: hoops - goalBase.hoop, combo: maxCombo }[k]; }
function updateGoals() {
  const G = cur().goals;
  if (!G) return;
  const key = G.map(([k, n]) => Math.min(n, goalVal(k))).join();
  if (key === goalKey) return;
  goalKey = key;
  $('goals').replaceChildren(...G.map(([k, n]) => {
    const d = document.createElement('div');
    const v = Math.min(n, goalVal(k));
    d.className = v >= n ? 'done' : '';
    d.textContent = `${GOAL_ICON[k][0]} ${v}/${n}${GOAL_ICON[k][1]}`;
    return d;
  }));
  if (!goalsDone && G.every(([k, n]) => goalVal(k) >= n)) {
    goalsDone = true;
    if (!cur().boss) { banner('KISIM TAMAM!'); stageT = 1.6; return; }
    bossAt = dist() + 40;
    for (const o of objs) if (P.z - o.z > 28 && !o.def.deer) o.dead = true; // boss meydanı boş kalsın
    banner(`GÖREV TAMAM! ${BOSSES[cur().boss].name} GELİYOR!`);
  }
}

// Etkin güçler ve süreleri
function updatePowers(dt) {
  if (pow.kurt > 0) { updateGuide(dt); pow.kurt -= dt; }
  if (pow.kilic > 0 && (pow.kilic -= dt) <= 0) banner('KILIÇ GÖĞE DÖNDÜ');
  if (secret > 0 && (secret -= dt) <= 0) { flash(); setTheme(secretTheme); for (const o of objs) if (o.kind === 'kut') o.dead = true; }
  godGlow ??= (() => { const g = W.glowSprite(0xff3a2a, 1.6, 0); scene.add(g); return g; })(); // kızıl parlayan kılıç
  godGlow.visible = pow.kilic > 0 && weapon === 'sword';
  if (godGlow.visible) { hero.bone('hand_r').getWorldPosition(godGlow.position); godGlow.position.z -= 0.4; }
  const items = [];
  if (pow.kurt > 0) items.push(`🐺 ${Math.ceil(pow.kurt)}` + (P.lane === guideLane ? ' ×2' : ''));
  if (pow.kilic > 0) items.push(`⚔ ${Math.ceil(pow.kilic)}`);
  if (secret > 0) items.push(`🦌 ${Math.ceil(secret)}`);
  if (shield > 0) items.push('🛡');
  $('powers').hidden = !items.length;
  $('powers').textContent = items.join('  ');
}

// Uçuşta yön göstergesi: sıradaki engel dizisinde hangi hücreler dolu (kırmızı), oyuncu nerede (altın çerçeve)
function skyGrid() {
  const ahead = objs.filter(o => o.row != null && o.def.hit && !o.dead && P.z - o.z > 1);
  const z0 = ahead.reduce((m, o) => Math.max(m, o.z), -Infinity);
  const cells = $('grid').children;
  for (let c = 0; c < 9; c++) {
    const lane = c % 3, row = 2 - Math.floor(c / 3); // üst satır = en yüksek
    const bad = ahead.some(o => o.z > z0 - 1 && o.lane === lane && o.row === row);
    cells[c].className = (bad ? 'bad' : 'ok') + (lane === P.lane && row === P.row ? ' me' : '');
  }
}

// Uçuşta Tulpar ve üstündeki Oğuz
function flightRig(dt) {
  hero.update(dt);
  rideLegs();
  tulpar.update(dt);
  tulpar.root.position.set(P.x, P.y, P.z + 0.15);
  tulpar.root.rotation.z = (P.x - LANES[P.lane]) * 0.08;
  tulpar.root.rotation.x = (P.y - HEIGHTS[P.row]) * 0.08;
  flap(tulpar.root, 5, 'z', -0.45); // yukarı açık V
}

// --- döngü ---
function heroAnim() {
  if (P.dead || P.lock > 0) return;
  if (sect?.S.pose) return void hero.play(sect.S.pose, { fade: 0.2 });
  if (P.ride || flying) return void hero.play('Sitting_Idle_Loop', { fade: 0.15 });
  if (flow < 0.35) return void hero.play('Sword_Idle', { fade: 0.2 }); // düello duruşu
  if (P.slide > 0) return void (P.roll || hero.play('Slide_Loop', { fade: 0.08 })); // özel kayma klibi kendi oynar
  if (wasSliding) {
    wasSliding = false;
    hero.play('Slide_Exit', { loop: false, speed: 1.8, fade: 0.06 });
    P.lock = 0.18;
    return;
  }
  if (P.y > 0) { if (P.flip <= 0) hero.play('NinjaJump_Idle_Loop', { fade: 0.12 }); } // takla klibi kendi oynar
  else if (sect?.S.stand) hero.play(sect.S.stand, { fade: 0.25 });
  else {
    if ((runT -= 1 / 60) <= 0) { runT = rand(5, 9); runClip = pick(RUNS[weapon]); } // ara sıra koşu tarzı değişir
    hero.play(runClip, { speed: runClip.startsWith('MX_') ? P.speed / 12 : P.speed / 14, fade: 0.25 });
  }
}

function update(dt) {
  time += dt;
  if (!hero) return;
  if (state === 'cine') { ctx.update(dt); cine.update(dt); sparks.update(dt); dust.update(dt); return; }
  if (state === 'book' || state === 'wardrobe') { book.update(dt); return; }
  if (state === 'menu' || state === 'map' || state === 'gate' || state === 'win' || state === 'boylar') { hero.update(dt); return; }
  if (state === 'dying') {
    hero.update(dt);
    if ((overT -= dt) <= 0) gameOver();
    return;
  }
  if (state !== 'run') return;
  if (fin) { updateFinisher(dt); sparks.update(dt); dust.update(dt); return; }

  if (!boss) P.speed = Math.min(24, (has('kayi') ? 13.5 : 12) + time * 0.1);
  flow += (holdTarget - flow) * Math.min(1, dt * 6);
  const speed = P.speed * (P.ride ? 1.45 : 1) * flow * (sect?.S.fast || 1);
  P.vz = speed;
  const dz = speed * dt;
  P.z -= dz;
  score += dz * mult();
  P.x += (LANES[P.lane] - P.x) * Math.min(1, dt * (sect?.S.slip || 14)); // buzda kaygan: şerit gecikmeli oturur
  if (flying) P.y += ((sect?.kind === 'kartal' && sect.t < 0.6 ? 0 : HEIGHTS[P.row]) - P.y) * Math.min(1, dt * 7); // kartal önce iner, sonra kaldırır
  else {
    P.vy -= 38 * dt;
    P.y += P.vy * dt;
  }
  if (!flying && P.y <= 0) {
    if (P.vy < -2 && !P.ride && P.lock <= 0 && P.slide <= 0) {
      hero.play('NinjaJump_Land', { loop: false, speed: 2.4, fade: 0.05 });
      P.lock = 0.12;
      dust.emit(P.x, 0.1, P.z, 8, 0xc9a77a, 2, 1);
    }
    P.y = P.vy = 0;
    P.flip = 0;
  }
  if (P.slide > 0) wasSliding = true;
  for (const k of ['slide', 'inv', 'lock', 'lunge', 'flip', 'spin', 'rear']) P[k] = Math.max(0, P[k] - dt);
  if (P.slide <= 0) P.roll = P.slideAtk = false;
  if (P.slideAtk) for (const o of objs) if (o.def.foe && o.ready && !o.dying && Math.abs(o.x - P.x) < 1.2 && P.z - o.z > 0 && P.z - o.z < 3) killFoe(o, 'sword');
  if (P.sword > 0 && (P.sword -= dt) <= 0) setWeapon(weapon); // boss'a kılıçla vurduktan sonra eldeki silaha dön
  if (P.ride && (P.ride -= dt) <= 0) dismount();
  $('ridebar').style.width = (P.ride / rideTime) * 100 + '%';
  cool -= dt;
  pending = pending.map(t => t - dt);
  while (pending.length && pending[0] <= 0) { pending.shift(); launchArrow(); }

  while (nextZ > P.z - 110) {
    if (sect || (!boss && (cur().goals ? !goalsDone : runZ - nextZ < bossAt - 40))) (flying ? spawnSky : spawnRow)(nextZ);
    nextZ -= rand(12, 17) + P.speed * 0.35;
  }
  if (!sect?.after) updateGoals(); // kat geçişi inişinde görevler sayılmaz
  sectTick(dt);
  W.flowWater(dt);
  if (stageT > 0 && !sect && (stageT -= dt) <= 0) {
    const fl = LEVELS[level].floors;
    if (mode === 'level' && fl && floor < fl.length - 1) nextFloor(); else win();
  }
  updatePowers(dt);
  if (rain) updateRain(dt);
  if (!boss && !sect && dist() > bossAt && !P.ride) startBoss();
  if (!boss && !flying && !sect && dist() > 250 && (ambushT -= dt) <= 0) { ambushT = rand(4, 8); spawnAmbush(); }

  for (const o of objs) updateObj(o, dt);
  for (const a of arrows) updateArrow(a, dt);
  if (boss) updateBoss(dt);
  for (const o of objs) if (o.dead) release(o);
  for (const a of arrows) if (a.dead) scene.remove(a.mesh);
  objs = objs.filter(o => !o.dead);
  arrows = arrows.filter(a => !a.dead);

  heroAnim();
  if (flying) { if (sect) hero.update(dt); else flightRig(dt); skyGrid(); }
  else hero.update(dt);
  if (P.ride) {
    rideLegs();
    horse.update(dt * (1 + P.speed / 40));
    if (Math.random() < dt * 20) dust.emit(P.x + rand(-0.4, 0.4), 0.1, P.z + 1.2, 1, 0xc9a77a, 1.5, 1.5);
  } else if (horseAway) {
    horseAway.t += dt;
    horseAway.z -= 5 * dt;
    horseAway.x += (Math.sign(horseAway.x || 1) * 3.6 - horseAway.x) * dt;
    horse.update(dt);
    if (horseAway.t > 2.5) { horse.root.visible = false; horseAway = null; }
  }
  sparks.update(dt);
  dust.update(dt);

  if (bannerT > 0 && (bannerT -= dt) <= 0) $('banner').classList.remove('show');
  $('dist').textContent = dist();
  $('kut').textContent = kut;
  $('score').textContent = Math.floor(score).toLocaleString('tr-TR');
  $('mult').textContent = 'x' + mult().toFixed(1);
}

function view(dt, realDt) {
  const cinematic = state === 'cine';
  if (!fin && hero && !cinematic) {
    const lungeZ = Math.sin((P.lunge / 0.35) * Math.PI) * 2.2;
    hero.root.position.set(P.x, P.y + (P.ride || flying ? SEAT : 0), P.z - lungeZ);
    hero.root.visible = P.inv === 0 || P.dead || Math.floor(time * 12) % 2 === 0;
    // takla: kalça etrafında döner (kök ayakta olduğu için konumu da düzeltilir); kılıç dönüşü: kendi ekseninde
    const k = 0, a = 0; // taklalar artık Mixamo klibiyle
    hero.root.rotation.x = a;
    hero.root.position.y += 0.9 - 0.9 * Math.cos(a);
    hero.root.position.z += 0.9 * Math.sin(a);
    hero.root.rotation.y = Math.PI + k + (P.spin > 0 ? (1 - P.spin / 0.4) * TAU : 0);
    hero.root.rotation.z = 0;
    if (sect) sectView(realDt);
  }
  if (eagleAway && !sect) { // kartal Oğuz'u bırakıp göğe süzülür
    const e = eagleAway;
    e.t += realDt;
    eagle.position.set(e.x, e.y + e.t * e.t * 5, e.z - e.t * 14);
    eagle.rotation.x = 0.4;
    flap(eagle, 9, 'z', -0.2);
    if (e.t > 2) { eagle.visible = false; eagleAway = null; }
  }
  if (cinematic) {} // atı çekim yerleştirir
  else if (P.ride && horse) {
    const rear = Math.sin((P.rear / 0.7) * Math.PI) * 0.55; // şahlanma: arka ayaklar üstünde kalkar
    horse.root.position.set(P.x, P.y + rear * 0.9, P.z + 0.15 + rear * 0.6);
    horse.root.rotation.x = -rear;
    horse.root.rotation.z = (P.x - LANES[P.lane]) * 0.08;
    if (rear > 0) hero.root.position.y += rear * 1.1;
  } else if (horseAway) horse.root.position.set(horseAway.x, 0, horseAway.z);

  for (const s of segs) {
    if (s.position.z - W.SEG > P.z + 12) { s.position.z -= W.SEG * segs.length; W.reflag(s); }
    for (const f of s.userData.flames) f.scale.y = 0.45 + Math.sin(time * 17 + f.position.z) * 0.08;
  }
  for (const s of segs) for (const w of s.userData.wisps) w.position.y = w.userData.base + Math.sin(time * 2 + w.position.x) * 0.4;
  if (state === 'run' || state === 'cine') { // hava efektleri
    if (theme === 'altay') snowfx.emit(P.x + rand(-14, 14), rand(5, 10), P.z - rand(-4, 34), 3, 0xffffff, 0.6, 0, 5);
    if (theme === 'yeralti' && Math.random() < 0.6) embers.emit(P.x + rand(-12, 12), 0, P.z - rand(0, 40), 1, 0xff6a1a, 0.5, 2, 3);
  }
  snowfx.update(realDt);
  embers.update(realDt);
  sky.position.set(P.x, 0, P.z);
  sun.position.set(P.x - 7, 14, P.z + 6);
  sun.target.position.set(P.x, 0, P.z - 4);

  for (const b of bursts) {
    b.t += realDt;
    b.s.scale.setScalar(b.size * Math.min(1, b.t * 8));
    b.s.material.opacity = 1 - b.t / 0.4;
    b.s.material.rotation = b.t * 2;
    if (b.t > 0.4) { scene.remove(b.s); b.dead = true; }
  }
  bursts = bursts.filter(b => !b.dead);
  $('speed').style.opacity = (P.ride || sect?.kind === 'dive') && !cinematic ? 0.55 : P.lunge > 0 ? 0.35 : 0;
  if (cinematic) { shake = Math.max(0, shake - realDt); return; } // kamerayı çekim kurar

  // kamera: menüde karşıdan kahraman çekimi, oyunda Spider-Man gibi arkadan alçak, bitirişte etrafında döner
  const s = shake > 0 ? ((shake -= realDt), 0.18) : 0;
  camX += (P.x * 0.8 - camX) * Math.min(1, realDt * 7);
  fovKick += (0 - fovKick) * Math.min(1, realDt * 4);
  camera.fov = baseFov + fovKick + (P.ride ? 6 : 0);
  camera.updateProjectionMatrix();
  if (debugCam) { // test: oyuncuya göre sabit kamera
    camera.position.set(P.x + debugCam[0], debugCam[1], P.z + debugCam[2]);
    const [, , , lx = 0, ly = 1.4, lz = 0] = debugCam;
    camera.lookAt(P.x + lx, ly, P.z + lz);
  } else if (state !== 'run' && state !== 'pause' && state !== 'dying') {
    camera.position.set(1.4, 1.7, P.z - 4.2);
    camera.lookAt(0, 1.25, P.z);
  } else if (fin && boss) {
    const gz = P.z - boss.off, mid = (P.z + gz) / 2;
    const a = lerp(0.35, 1.5, Math.min(1, fin.t / 3));
    camera.position.set(boss.x + Math.sin(a) * 9, 3.2, mid + Math.cos(a) * 9);
    camera.lookAt(boss.x, 2.4, mid);
  } else if (sect?.kind === 'dive') { // kuyuya yukarıdan bakış
    camera.position.set(camX * 0.7 + rand(-s, s), P.y + 3.1, P.z + 6.4);
    camera.lookAt(camX * 0.7, P.y + 1.3, P.z - 12);
  } else if (sect?.kind === 'kartal') {
    camera.position.set(camX + rand(-s, s), P.y + 5.6, P.z + 8);
    camera.lookAt(camX, P.y + 1.4, P.z - 9);
  } else if (flying) {
    camera.position.set(camX + rand(-s, s), P.y + 3.4 + rand(-s, s), P.z + 7);
    camera.lookAt(camX, P.y + 1.6 + (boss ? 1 : 0), P.z - 8);
  } else {
    const h = P.ride ? 3.6 : 2.8;
    camera.position.set(camX + rand(-s, s), h + P.y * 0.45 + rand(-s, s), P.z + (P.ride ? 6 : 5));
    camera.lookAt(camX, 1.6 + P.y * 0.3 + (boss ? 0.8 : 0) + (P.ride ? 0.6 : 0), P.z - 6);
  }
  if (camEase > 0 && !debugCam) { // bölüm geçişi: kamera eski yerinden yay çizerek yeni yerine kayar
    camEase = Math.max(0, camEase - realDt / 1.1);
    const k = 1 - camEase, e = k * k * (3 - 2 * k), arc = Math.sin(k * Math.PI);
    camFromP.z -= P.vz * realDt; // eski bakış da oyuncuyla ilerler
    camera.position.lerpVectors(camFromP, camera.position, e);
    camera.position.x += arc * 2.5;
    camera.position.y += arc * 1.5;
    camera.quaternion.slerpQuaternions(camFromQ, camera.quaternion, e);
  }
}

// --- arayüz ---
function hearts() { $('hearts').textContent = '♥'.repeat(Math.max(0, P.hp)) + '♡'.repeat(Math.max(0, 3 - P.hp)); }
function bossBar() { $('bosshp').style.width = (Math.max(0, boss.hp) / boss.max) * 100 + '%'; }
function banner(text) { $('banner').textContent = text; $('banner').classList.add('show'); bannerT = 2.2; }

let praiseT;
function comboUi(bump) {
  $('combo').hidden = combo < 2;
  $('combon').textContent = combo;
  if (!bump || combo < 2) return;
  const c = $('combo');
  c.classList.remove('pop');
  void c.offsetWidth;
  c.classList.add('pop');
  $('praise').textContent = pick(PRAISE);
  $('praise').classList.add('show');
  clearTimeout(praiseT);
  praiseT = setTimeout(() => $('praise').classList.remove('show'), 900);
}

const pv = new THREE.Vector3();
function pop(text, pos) {
  pv.set(pos.x, (pos.y || 0) + 1.8, pos.z).project(camera);
  const el = document.createElement('div');
  el.className = 'pop ink';
  el.textContent = text;
  el.style.left = clamp((pv.x * 0.5 + 0.5) * 100, 15, 85) + '%';
  el.style.top = clamp((-pv.y * 0.5 + 0.5) * 100, 15, 80) + '%';
  $('pops').append(el);
  setTimeout(() => el.remove(), 650);
}

function gameOver() {
  state = 'over';
  wallet.deposit(kut);
  let best = Math.floor(score);
  try { best = Math.max(best, +localStorage.getItem('oguz-best') || 0); localStorage.setItem('oguz-best', best); } catch {}
  const f = $('final');
  f.replaceChildren();
  for (const [k, v] of [['Mesafe', dist() + ' m'], ['Kut', kut], ['Düşman', kills], ['Skor', Math.floor(score)], ['En iyi', best]]) {
    const row = document.createElement('div');
    row.textContent = `${k}: ${v}`;
    f.append(row);
  }
  $('over').hidden = false;
}

function setPaused(on) {
  if (on && state === 'run') { state = 'pause'; $('paused').hidden = false; }
  else if (!on && state === 'pause') { state = 'run'; $('paused').hidden = true; }
}

// --- kontroller: kaydır = hareket, dokun / sol tık = saldırı ---
function act(a) {
  if (state !== 'run' || P.dead || fin) return;
  if (boss?.def.swipe && a !== 'tap' && boss.def.swipe(B, boss, a)) return; // Yelbegen: kaydırma sınavı
  if (flying && (a === 'up' || a === 'down')) { P.row = clamp(P.row + (a === 'up' ? 1 : -1), 0, 2); return; }
  if (a === 'weapon') return flying || setWeapon(weapon === 'sword' ? 'bow' : 'sword');
  if (a === 'left') P.lane = Math.max(0, P.lane - 1);
  else if (a === 'right') P.lane = Math.min(2, P.lane + 1);
  else if (a === 'up' && P.y === 0) {
    P.vy = P.ride ? 11 : has('karkin') ? 14.5 : 12.5; P.slide = 0;
    if (P.ride) horse.play('Gallop_Jump', { loop: false, speed: 1.4, fade: 0.05, then: () => horse.play('Gallop', { speed: 1.5 }) });
    else { // üç çeşit zıplama: ninja, öne takla, burgu
      P.lock = 0.15;
      const r = Math.random(), jc = r < 0.22 ? 'MX_FrontFlip' : r < 0.36 ? 'MX_TwistFlip' : r < 0.5 && weapon === 'sword' ? 'MX_GS_Jump' : null;
      P.flip = jc ? FLIP_T : 0;
      if (jc) timed(hero, jc, FLIP_T + 0.08);
      else hero.play('NinjaJump_Start', { loop: false, speed: 2, fade: 0.05 });
    }
  } else if (a === 'down' && !P.ride) {
    if (P.y > 0) P.vy = -22;
    if (P.slide <= 0) { // kayma ya da yuvarlanma
      const r = Math.random(); // kayma, yuvarlanma, balıklama, kılıçla kayarak saldırı
      const sc = r < 0.2 ? 'Roll' : r < 0.35 ? 'MX_Dive' : r < 0.55 && weapon === 'sword' ? 'MX_GS_Slide' : null;
      P.roll = !!sc;
      P.slideAtk = sc === 'MX_GS_Slide';
      if (sc) timed(hero, sc, 0.8);
      else hero.play('Slide_Start', { loop: false, speed: 2, fade: 0.05 });
      P.lock = sc ? 0.6 : 0.15;
    }
    P.slide = 0.8;
  } else if (a === 'tap') tapAction();
}

// Telefonu eğerek yönlendirme (isteğe bağlı, varsayılan kapalı): bölümlerde sola/düz/sağa eğim = sol/orta/sağ şerit
let tilt = false, tiltZ = 0;
try { tilt = localStorage.getItem('oguz-tilt') === '1'; } catch {}
function tiltUi() { for (const b of document.querySelectorAll('.tiltbtn')) b.textContent = 'EĞİMLE YÖNLENDİR: ' + (tilt ? 'AÇIK' : 'KAPALI'); }
async function toggleTilt() {
  tilt = !tilt;
  if (tilt && globalThis.DeviceOrientationEvent?.requestPermission) { // iPhone izin ister
    try { tilt = (await DeviceOrientationEvent.requestPermission()) === 'granted'; } catch { tilt = false; }
  }
  try { localStorage.setItem('oguz-tilt', tilt ? '1' : '0'); } catch {}
  tiltUi();
}
for (const b of document.querySelectorAll('.tiltbtn')) { b.onclick = toggleTilt; b.hidden = !matchMedia('(pointer: coarse)').matches; }
tiltUi();
addEventListener('deviceorientation', e => {
  if (!tilt || e.gamma == null) return;
  const z = e.gamma > 15 ? 1 : e.gamma < -15 ? -1 : 0;
  if (z !== tiltZ && sect && state === 'run' && !P.dead) P.lane = z + 1;
  tiltZ = z;
});

let sx = null, sy = 0;
addEventListener('pointerdown', e => { if (!e.target.closest('button')) { sx = e.clientX; sy = e.clientY; } });
addEventListener('pointermove', e => {
  if (sx === null) return;
  const dx = e.clientX - sx, dy = e.clientY - sy;
  if (Math.hypot(dx, dy) < 35) return;
  act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy < 0 ? 'up' : 'down');
  sx = null;
});
addEventListener('pointerup', () => { if (sx !== null) act('tap'); sx = null; });
const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ' ': 'tap', q: 'weapon', e: 'weapon' };
addEventListener('keydown', e => {
  if (KEYS[e.key]) { e.preventDefault(); act(KEYS[e.key]); }
  else if (e.key === 'Escape' || e.key === 'p') setPaused(state === 'run');
  else if (e.key === 'Enter' && (state === 'menu' || state === 'over')) start();
  else if (e.key === 'Escape' && state === 'cine') cine.skip();
});
$('start').onclick = openMap;
$('endless').onclick = () => openBoylar('endless', 0);
$('again').onclick = () => start();
$('wagain').onclick = () => start('level', level);
$('storybtn').onclick = () => playComic(PROLOG_PAGES);
$('boygo').onclick = () => { $('boyscreen').hidden = true; boyAfter(); };
$('boyback').onclick = openMap;
$('bookbtn').onclick = openBook;
$('wardbtn').onclick = openWardrobe;
$('wardback').onclick = closeWardrobe;
$('enter').onclick = () => playCine(JENERIK, () => playComic(PROLOG_PAGES));
$('skip').onclick = () => cine.skip();
for (const id of ['mapback', 'overmenu', 'pausemenu', 'wmenu']) $(id).onclick = toMenu;
$('bookback').onclick = closeBook;
$('cover').onclick = openCover;
$('bprev').onclick = () => turnTo(page - 1);
$('bnext').onclick = () => turnTo(page + 1);
$('wmap').onclick = openMap;
$('pause').onclick = () => setPaused(true);
$('weapon').onclick = () => act('weapon');
$('resume').onclick = () => setPaused(false);
addEventListener('blur', () => setPaused(true));

let baseFov = 55;
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (state === 'book') requestAnimationFrame(bookResize); else book?.resize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  baseFov = camera.aspect < 1 ? 72 : 55; // dikey telefonda 3 şerit sığsın
  camera.fov = baseFov;
  camera.updateProjectionMatrix();
  if (comic?.on) comic.resize();
}
addEventListener('resize', resize);
resize();

// Ağır çekim ve vuruş donması dünya zamanını yavaşlatır; kamera ve arayüz gerçek zamanda akar
const clock = new THREE.Clock();
function frame(realDt) {
  let k = 1;
  if (stopT > 0) { stopT -= realDt; k = 0.03; }
  else if (slowT > 0) { slowT -= realDt; k = slowK; }
  update(realDt * k);
  view(realDt * k, realDt);
  const showcase = state === 'book' || state === 'wardrobe';
  active.scene = showcase ? book.scene : scene;
  active.camera = showcase ? book.camera : camera;
  if (!norender) composer.render();
  if (cine?.comic) cine.comic.draw(realDt, cine.shot?.text, cine.t, titleLines());
}
let frozen = false, norender = false; // test: zaman durur, sadece çizilir / çizmeden hızlı oynat
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (frozen) composer.render();
  else frame(dt);
});

// test kancası (tarayıcı konsolundan oyunu adım adım sürmek için)
window.__game = {
  get boss2() { return boss; }, get flying() { return flying; }, get sect() { return sect; }, startSect, get theme() { return theme; }, setTheme, LEVELS,
  P, get state() { return state; }, get boss() { return boss; }, get objs() { return objs; }, get fin() { return fin; },
  get hero() { return hero; }, get book() { return book; }, get weapon() { return weapon; }, setWeapon, add, pow, get relics() { return relicSave; }, volley, enterSecret, get goalsDone() { return goalsDone; }, get floor() { return floor; }, nextFloor, set cam(v) { debugCam = v; }, set frozen(v) { frozen = v; }, set norender(v) { norender = v; }, get cine() { return cine; }, get comic() { return comic; }, playComic, recordComic, wallet, openWardrobe, playCine, openBook, openMap, toMenu, start, act, tick: frame, mount, spawnAmbush,
};
