import * as THREE from 'three';
import { AYAR as AYRINTI } from './ayrinti.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadAssets, Actor, GRAD } from './assets.js';
import * as W from './world.js';
import { setDesenAnisotropy } from './desen.js';
import { Cine } from './cine.js';
import { Comic } from './comic.js';
import { Book } from './book.js';
import { JENERIK, PROLOG, PROLOG_PAGES, PARTS, EPILOG, BOOK, levelIntro } from './story.js';
import { BOSSES } from './bosses.js';
import { COSTUMES, applyCostume, wallet, sway } from './costumes.js';
import { BOYLAR, picks, has, slots } from './boylar.js';
import { addXP, XP, isUnlocked, UNLOCKS, UNLOCK_NAMES, unlockAll } from './akinci.js';
import { toast, fillMoney, levelBar, levelUps } from './ui.js';
import { sfx, music, sting, regionOf } from './sound.js';
import * as SOUND from './sound.js';
import { bonus, collect as collectBonus } from './bonus.js';
import { tip, hideTip, tipSeen, resetTips, setGate } from './tips.js';
import { shop, upg, upgVal, drawShop, drawRack, BOOSTS, SMU_DUR } from './carsi.js';
import * as TORE from './tore.js';
import { rec, recMax, recSet } from './tore.js';
import { buildNodes, drawMap, isOpen, nextMain, migrate, medalsFor, thresholds, store as hStore, saveStore, COND_TEXT, REGIONS } from './harita.js';
import { level as akinciLevel } from './akinci.js';
import * as Y from './yigit.js';
import * as KO from './koleksiyon.js';
import * as EK from './ekranlar.js';
import * as DLG from './diyalog.js';
import * as AY from './ayarlar.js';
import { svg } from './simge.js';
import * as SMU from './smu.js';

const LANES = [-2.5, 0, 2.5];
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// --- sahne + efekt zinciri: mürekkep hatlı çizim -> parlama (bloom) -> renk çıkışı ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const maxDpr = Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 2, 3);
renderer.setPixelRatio(maxDpr);
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
    if (gfx.outline) outline.render(active.scene, active.camera);
    else r.render(active.scene, active.camera); // düşük grafik: mürekkep çizgisi yok
  }
}
const active = { scene, camera };
const gfx = { outline: true };

// MSAA (samples = 4) destekli EffectComposer render hedefi
const composerTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
  type: THREE.HalfFloatType,
  samples: 0,
});
const composer = new EffectComposer(renderer, composerTarget);
composer.addPass(new OutlineRenderPass());

const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.35, 0.86);
// Bloom ara render hedeflerini yarı çözünürlükte tutarak mobilde GPU fillrate tasarrufu sağla
const origBloomSetSize = bloom.setSize.bind(bloom);
bloom.setSize = (w, h) => origBloomSetSize(Math.max(128, Math.round(w / 2)), Math.max(128, Math.round(h / 2)));
composer.addPass(bloom);
composer.addPass(new OutputPass());

const hemi = new THREE.HemisphereLight(0xd6e6ff, 0x8a6a48, 1.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2b8, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 14, bottom: -10, near: 1, far: 60 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.02;
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
  mix('rock', sky.userData.rock.color); mix('snow', sky.userData.snow.color); mix('orb', sky.userData.orb.color); sky.userData.orbDisc.color.copy(sky.userData.orb.color).multiplyScalar(1.5);
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
  if (!boss && regionOf(t) && state !== 'menu') music(regionOf(t)); // bölge müziği
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
  barricade: { make: W.makeBarricade, hit: 'block', brk: true },
  cart: { make: W.makeCart, hit: 'block', brk: true },
  crates: { make: W.makeCrates, hit: 'block', brk: true },
  rope: { make: W.makeRope, hit: 'low' },
  beam: { make: W.makeBeam, hit: 'high' },
  boulder: { make: W.makeBoulder, hit: 'block' },
  spear: { make: W.makeSpear, hit: 'high' },
  kut: { make: W.makeKut },
  tamga: { make: W.makeTamga }, // İSABET: içinden geçilen altın tamga halkası
  kimiz: { make: W.makeKimiz }, // nadir: bir can verir
  miknatis: { make: W.makeMiknatis }, carpan: { make: W.makeCarpan },
  hoop: { make: W.makeHoop }, // uçuşta boş hücreyi gösteren halka
  // destan eşyaları: koşarken toplanır
  kurt: { make: () => makeWolfToken() }, islik: { make: W.makeIslik }, yay: { make: W.makeAltinYay }, gumus: { make: W.makeGumusOk },
  kilic: { make: W.makeTanriKilici }, kan: { make: W.makeKan }, geyik: { deer: true },
  kaya: { make: W.makeKaya, hit: 'block' },
  nal: { make: W.makeHorseshoe },
  kormos: { foe: true, hit: 'block' },
  // Kara Bataklık
  stump: { make: W.makeStump, hit: 'block' }, boat: { make: W.makeBoat, hit: 'block', brk: true },
  vine: { make: W.makeVine, hit: 'low' }, log: { make: W.makeLog, hit: 'high' },
  // Altay Geçidi
  snowrock: { make: W.makeSnowRock, hit: 'block' }, sled: { make: W.makeSled, hit: 'block', brk: true },
  fence: { make: W.makeFence, hit: 'low', brk: true }, pine: { make: W.makePine, hit: 'high' },
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
  jars: { make: W.makeJars, hit: 'block', brk: true }, supply: { make: W.makeSupply, hit: 'block', brk: true },
  lowgate: { make: W.makeLowGate, hit: 'low' }, bannerbeam: { make: W.makeBannerBeam, hit: 'high' },
  caltrop: { make: W.makeCaltrops, hit: 'low' }, bolt: { make: W.makeBolt, hit: 'high' },
  esir: { esir: true },
  // koşu içi bölümler
  ledge: { make: W.makeLedge, hit: 'block' }, roots: { make: W.makeRoots, hit: 'block' },
  kutuk: { make: W.makeKutuk, hit: 'low' }, rrock: { make: W.makeRiverRock, hit: 'block' }, girdap: { make: W.makeGirdap, hit: 'block' },
  catlak: { make: W.makeCatlak, hit: 'low' }, buzkule: { make: W.makeBuzkule, hit: 'block' },
  // SMU'daki lazer: yol kenarındaki kam toteminden üç şeridi kapatan ışın. İnce: kay ya da zıpla. Kalın: yalnız zıpla.
  isin: { beam: true, hit: 'mid' }, kalinisin: { beam: true, thick: true, hit: 'thick' },
  yada: { make: W.makeYada }, // boss savaşında yolda süzülen Yada Küresi: kılıçla vurulunca boss'a uçar
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
  goksirt: { seg: 'altay', mood: 'sky', obst: ['snowrock', 'fence', 'pine', 'crates', 'sled'], foes: [['baltaci', 0], ['kanatli', 100], ['kalkanli', 250], ['almas', 350], ['mizrakci', 450]] },
  firtinasirt: { seg: 'altay', mood: 'storm', obst: ['snowrock', 'fence', 'pine', 'sled'], foes: [['kanatli', 0], ['baltaci', 0], ['almas', 150], ['kalkanli', 250], ['mizrakci', 350]] },
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
      { name: 'AKŞAM SURLARI', sub: 'İKİNCİ KISIM', theme: 'aksam', boss: null, goals: [['dist', 500], ['kill', 8]] },
      { name: 'KANLI BURÇLAR', sub: 'ÜÇÜNCÜ KISIM', theme: 'burc', boss: 'tepegoz', goals: [['dist', 450], ['combo', 5]] },
    ],
  },
  2: {
    theme: 'bataklik', floors: [
      { name: 'SİSLİ SAZLIK', sub: 'BİRİNCİ KISIM', theme: 'bataklik', boss: 'suluaga', goals: [['dist', 550], ['kill', 8]], },
      { name: 'ÖLÜ ORMAN', sub: 'İKİNCİ KISIM', theme: 'olu', boss: null, goals: [['dist', 500], ['kut', 50]], fall: true },
      { name: 'KARA GÖL', sub: 'ÜÇÜNCÜ KISIM', theme: 'bataklik', boss: 'albasti', goals: [['dist', 450], ['kill', 8]] },
    ],
  },
  3: {
    theme: 'orman', floors: [
      { name: 'KAYIN ORMANI', sub: 'BİRİNCİ KISIM', theme: 'orman', boss: 'almasbey', goals: [['dist', 600], ['kill', 10]] },
      { name: 'KARLI YAMAÇ', sub: 'İKİNCİ KISIM', theme: 'altay', boss: null, goals: [['dist', 500], ['kut', 60]], sect: ['buz', 180] },
      { name: 'ALTAY GEÇİDİ', sub: 'ÜÇÜNCÜ KISIM', theme: 'altay', boss: 'yelbegen', goals: [['dist', 500], ['kill', 8]] },
    ],
  },
  4: {
    theme: 'goksirt', floors: [
      { name: 'BULUT SIRTI', sub: 'BİRİNCİ KISIM', theme: 'goksirt', boss: null, goals: [['dist', 650], ['kill', 10]] },
      { name: 'FIRTINA DORUĞU', sub: 'İKİNCİ KISIM', theme: 'firtinasirt', boss: 'karakus', goals: [['dist', 550], ['kut', 50]] },
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
      { name: 'KALE KAPISI', sub: 'ÜÇÜNCÜ KISIM', theme: 'karakol', boss: 'general', goals: [['dist', 500], ['kill', 10]] },
    ],
  },
  7: {
    theme: 'karanlik', floors: [
      { name: 'DONMUŞ IRMAK', sub: 'BİRİNCİ KISIM', theme: 'karanlik', boss: 'itbasi', goals: [['dist', 600], ['kill', 12]], sect: ['buz', 200] },
      { name: 'KUZEY IŞIKLARI', sub: 'İKİNCİ KISIM', theme: 'karanlik', boss: null, goals: [['dist', 500], ['combo', 6]] },
      { name: 'İT-BARAK OBASI', sub: 'ÜÇÜNCÜ KISIM', theme: 'karanlik', boss: 'boyali', goals: [['dist', 500], ['kill', 12]] },
    ],
  },
};
// SONSUZ AKIN (SMU'daki Unlimited): her ~1500 m'de bölge değişir, bölge sonunda o bölgenin boss'u gelir.
// Yedi bölge bitince tur başa döner, daha hızlı. LEVELS[0] o anki bölgeyi taşır.
const ZONES = [
  { lv: 1, name: 'ÖTÜKEN', theme: 'surlar', boss: 'tepegoz' },
  { lv: 2, name: 'KARA BATAKLIK', theme: 'bataklik', boss: 'albasti' },
  { lv: 3, name: 'ALTAY', theme: 'altay', boss: 'yelbegen' },
  { lv: 4, name: 'GÖK YOLU', theme: 'goksirt', boss: 'karakus' },
  { lv: 5, name: 'YERALTI', theme: 'yeralti', boss: 'erlik' },
  { lv: 6, name: 'ÇİN', theme: 'cin', boss: 'general', foeModel: 'cinli', prisoners: true },
  { lv: 7, name: 'KARANLIK ÜLKE', theme: 'karanlik', boss: 'boyali' },
];
const ZONE_LEN = 1500;
let zone = 0, loop = 0, zoneStart = 0;
function applyZone() {
  const Z = ZONES[zone];
  Object.assign(LEVELS[0], { theme: Z.theme, boss: Z.boss, flight: !!Z.flight, foeModel: Z.foeModel, prisoners: !!Z.prisoners, bossAt: zoneStart + ZONE_LEN });
}
const relicLv = () => (mode === 'endless' ? ZONES[zone].lv : level); // destan eşyaları o bölgenin bölümüne yazılır

const GOAL_ICON = { dist: ['⬆', ' m'], kill: ['⚔', ''], kut: ['◆', ''], esir: ['⛓', ''], hoop: ['◯', ''], combo: ['✦', ' kombo'], kilpayi: ['✦', ' kıl payı'], ride_dist: ['🐎', ' m'], nohit: ['🛡', ' m'], kill_arrow: ['🏹', ''], isabet: ['𐰴', ''] };
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
  itkalkan: { model: 'itbarak', parts: ['Axe', 'Shield'], idle: 'Idle_Shield_Loop', attack: 'Shield_Dash', hp: 2, icon: 'kay' },
  // SMU'dan: üstünde simge çıkan düşmanlar. ▼ KAY: altından kayınca yere serilir. Çift kalkanlıya kılıç işlemez, üstünden atlanmaz.
  // ▲ ZIPLA: Erlik'in kanatlı kulu havada süzülür; simge çıkınca zıplarsan Oğuz sıçrayıp onu havada indirir.
  ikikalkan: { parts: ['Shield', 'Shield2'], idle: 'Idle_Shield_Loop', attack: 'Shield_Dash', hp: 1, icon: 'kay', wall: true },
  kanatli: { parts: ['Spear'], idle: 'Idle_Loop', attack: 'OverhandThrow', hp: 1, icon: 'zipla', fly: true },
};
FOE.kalkanli.icon = 'kay';
const FOE_NAME = { ikikalkan: 'KALKAN DUVARI', kanatli: 'KANATLI KUL' };
const EXTRA_FOES = [['ikikalkan', 220], ['kanatli', 280]]; // her yer bölgesine eklenir
const setParts = (a, list) => {
  if (a.baked) list = []; // Meshy gövdesinde silah ve kalkan hazır
  for (const p of ['Axe', 'Dao', 'Shield', 'Spear', 'Shield2']) if (a.parts[p]) a.parts[p].visible = list.includes(p === 'Dao' ? 'Axe' : p);
  if (a.wings) a.wings.visible = false;
};
const PRAISE = ['HASSAS!', 'HARİKA!', 'YİĞİT!', 'ALP!', 'BOZKURT!'];
// Hareket çeşitliliği: Quaternius + Mixamo klipleri (Mixamo'lar tools/build_chars.py'de iskeletimize aktarılır)
// Klipler tek tek karelerine bakılarak seçildi (tools/anim-sheet.mjs): kılıcı gerçekten savuranlar kaldı; yumruk atar gibi
// duran Mixamo "greatsword" klipleri (Stab1/Stab3/Slash1/Slash3/Slash5) ve ok bırakınca yumruk atan BowRecoil çıkarıldı.
const SLASHES = ['Sword_Regular_A', 'MX_GS_Slash4', 'Sword_Regular_B', 'Sword_Stab', 'MX_GS_Attack', 'Sword_Regular_C', 'Sword_Attack'];
const HEAVY = ['Sword_Heavy_Combo', 'MX_GS_Spin'];
const RUNS = { sword: ['Sprint_Loop', 'MX_GS_Run2'], bow: ['MX_BowRun', 'Sprint_Loop'] };
const HURTS = ['Hit_Chest', 'MX_GS_Impact', 'MX_GS_Impact2', 'MX_React'];
const DEATHS = ['Death01', 'MX_Death1', 'MX_Death2', 'MX_DeathBack', 'MX_DeathFwd'];
const FOE_IDLE = ['Sword_Idle', 'MX_GS_Idle', 'MX_GS_Idle3', 'MX_GS_Strafe'];
const FOE_ATK = ['Sword_Attack', 'MX_GS_Attack', 'MX_GS_Slash4', 'Sword_Regular_A', 'MX_GS_Kick'];
const FOE_RUN = ['Sprint_Loop', 'MX_FastRun', 'MX_RunUnarmed'];
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
  kement: { name: 'KEMENT SALLANMASI!', seg: 'vadi', dur: 16, fly: true, obst: ['cloud', 'bird'], pose: 'MX_FallLoop' },
  sal: { name: 'SALLA IRMAĞA!', seg: 'nehir', dur: 16, stand: 'MX_GS_Idle' },
  buz: { name: 'BUZDA KAYMA!', seg: 'buzgol', dur: 14, stand: 'Crouch_Idle_Loop', slip: 3.2, fast: 1.2 },
};
const BAND = { dive: 'SERBEST DÜŞÜŞ', kement: 'KEMENT', buz: 'BUZDA KAYMA', sal: 'SAL' };
let bossCam = 0; // boss tanıtımında yakın çekim süresi
let sect = null, sectDone = false, sectAt = 300, eagle = null, eagleAway = null, raft = null, board = null;
const sw = { a: 0, v: 0, px: 0 }; // kartalın pençesinde sarkaç
let kementRope = null, kementAnchor = null, kementAx = 0;
const kementA3 = new THREE.Vector3(), kementV = new THREE.Vector3();
let camEase = 0;
const camFromP = new THREE.Vector3(), camFromQ = new THREE.Quaternion();
const P = { lane: 1, x: 0, y: 0, vy: 0, z: 0, slide: 0, inv: 0, hp: 3, speed: 0, lock: 0, lunge: 0, ride: 0, sword: 0, row: 1, flip: 0, flipAxis: 'x', spin: 0, roll: false, rear: 0 };
const FLIP_T = 0.62; // zıplamanın havada kalma süresi (takla bu sürede döner)
let state = 'loading', objs = [], arrows = [], bursts = [], pending = [], boss = null, fin = null, A = null;
let deerActor, comic, portraits, dlgShown = false;
let hero, giant, horse, wolf, tulpar, book, cine, ctx, horseAway = null, mode = 'level', level = 1, flying = false;
let flow = 1, holdTarget = 1, esirs = 0; // düelloda Oğuz durur: dünya akışı 0'a iner
const foes = [];
const pools = {}; // model -> tekrar kullanılan aktörler (düşmanlar, esirler)
// düşman türü -> [şablon, Meshy gövdesi (assets/govde)]: gövdede silah ve kalkan hazır, parça listesi boşalır
const FOE_BODY = { baltaci: ['kormos', 'baltaci'], kalkanli: ['kormos', 'kalkanli'], mizrakci: ['kormos', 'mizrakci'], pusucu: ['kormos', 'pusucu'], yeralti: ['kormos', 'yeralti'],
  okcu: ['kormos', 'okcu'], ikikalkan: ['kormos', 'ikikalkan'], kanatli: ['kormos', 'kanatli'], sulu: ['sulu', 'sulu'], albis: ['albasti', 'albis'], almas: ['almas', 'almas'],
  sulmus: ['sulmus', 'sulmus'], kosucu: ['itbarak', 'kosucu'], itokcu: ['itbarak', 'itokcu'], itkalkan: ['itbarak', 'itkalkan'] };
function foeBody(a, variant, model) {
  const b = FOE_BODY[variant];
  a.baked = !!(b && b[0] === model && a.setBody(b[1]));
  if (!a.baked) a.setBody(null);
  return a.baked;
}
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
const pow = { kurt: 0, kilic: 0, miknatis: 0, carpan: 0 }; // etkin güçlerin kalan süresi
let secret = 0, secretTheme = null, deer = null, deerDone = false, trail = null, godDone = false, islikDone = false;
let stageT = 0, godGlow = null, relicPlan = [], rain = null, guideLane = 1, guideT = 0, shield = 0, reviveUsed = false, smashUsed = false, rideTime = 12;
const cur = () => LEVELS[level].floors?.[floor] ?? LEVELS[level];
const relicSave = (() => { try { return JSON.parse(localStorage.getItem('oguz-relics')) || {}; } catch { return {}; } })();
let runHits = 0, runArrow = 0, runRide = 0, runFly = 0, nodeRun = null, runRecorded = false;
let contRun = false, contPaid = null, contShown = -1; // görev bitince "koşuya devam et": ödenen kut/XP kayıtlı, altın madalya skoruna kadar sürer
let continues = 0, noRevive = false, maxHp = 3, bereketT = 0, reviveT = 0, endlessBosses = 0;
let gallopT = 0, runBosses = 0, runParries = 0, runBroken = 0, runGold = 0; // bu koşuda yenilen boss sayısı (XP için)
let time = 0, runZ = 0, kut = 0, score = 0, combo = 0, kills = 0, nextZ = 0, bossAt = 0, cool = 0, shake = 0, bannerT = 0, overT = 0;
let markNext = 500, marks = [], bestDist = 0, recMark = null, recMarkDone = false;
let trial = null; // "bir koşu dene": { id } (kostüm denemesi, ödül yok)
let debugCam = null, camX = 0, fovKick = 0, slowK = 1, slowT = 0, stopT = 0, ambushT = 0, slashStep = 0, lastSlash = -9, wasSliding = false;

const dist = () => Math.max(0, Math.floor(runZ - P.z));
// SMU 5-kademeli kombo çarpanı (GameData.json): 1-10: 1x, 11-20: 2x, 21-30: 3x, 31-40: 4x, 40+: 5x
const comboTier = () => (combo >= 40 ? 5 : combo >= 31 ? 4 : combo >= 21 ? 3 : combo >= 11 ? 2 : 1);
const mult = () => comboTier() * (has('kayi') ? 1.15 : 1) * (1 + bonus.scoreMult) * (pow.carpan > 0 ? 2 : 1);
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
  dressHero();
  swordMode(false);
  hero.play('Idle_Loop');
  for (let i = 0; i < 10; i++) {
    const f = new Actor(A, 'kormos');
    f.root.visible = false;
    scene.add(f.root);
    foes.push(f);
  }
  giant = new Actor(A, 'tepegoz');
  giant.setBody('tepegoz');
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
  portraits = new DLG.Portraits(A, renderer, outline);
  applyGfx(AY.cfg.gfx || 'yuksek');
  warmShaders();
  AY.init({ setState: s => { state = s; }, toMenu, gallery, applyGfx, applyDynRes: setDynRes, tilt: () => tilt, setTilt: toggleTilt });
  AY.wire();
  EK.init({ setState: s => { state = s; }, book, toMenu, isUnlocked, locked, toast, sfx, levelUps, addXP, levelBar, dressHero, onCards, missingArrow, trial: id => startTrial(id) });
  ctx = makeCtx();
  cine = new Cine(ctx);
  comic = new Comic(renderer.domElement);
  state = 'gate';
  fillMoney();
  recMax('costumes', wallet.owned.length);
  recMax('level', akinciLevel());
  $('loadbar').parentElement.hidden = true;
  $('loadtext').hidden = true;
  $('enter').hidden = false;
  gpuUyari();
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
      foeBody(a, variant, model);
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
  SMU.modeBand(null); bossCam = 0;
  if (trial) { trial = null; TORE.mute(false); }
  for (const id of ['trialend', 'trialtag']) $(id).hidden = true;
  for (const o of objs) release(o);
  for (const a of arrows) scene.remove(a.mesh);
  objs = []; arrows = [];
  clearMarks();
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
  nodeRun = null;
  hideTip();
  music('menu');
  for (const id of ['hud', 'over', 'paused', 'bossbar', 'ride', 'map', 'book', 'win', 'tap', 'mash', 'wardrobe', 'loading', 'grid', 'goals', 'powers', 'boyscreen', 'carsi', 'revive', 'result', 'tore', 'yigit', 'kademe', 'sefer', 'koleksiyon', 'dialog', 'ayar']) $(id).hidden = true;
  wolf.root.visible = deerActor.root.visible = false;
  $('menu').hidden = false;
  menuLocks();
  levelBar();
  toreDot();
  dressHero();
  EK.checkCollections();
  $('kbadge').textContent = EK.tierBadge();
  $('mtitle').textContent = KO.titleOf() ? `“${KO.titleOf()}”` : '';
  $('seferbtn').querySelector('.dot').hidden = !EK.seferReady();
}

// Açılmamış menü düğmeleri kilitli görünür; dokununca kaçıncı seviyede açılacağını söyler
function menuLocks() {
  for (const b of document.querySelectorAll('[data-unlock]')) b.classList.toggle('locked', !isUnlocked(b.dataset.unlock));
}
function locked(key) {
  if (isUnlocked(key)) return false;
  toast('🔒', UNLOCK_NAMES[key], `Akıncı Seviyesi ${UNLOCKS[key]}'de açılır.`);
  return true;
}

// Dizüstünde tarayıcı çoğu zaman ekran kartı yerine Intel/yazılım çizicisini seçer: bir kez uyar
function gpuUyari() {
  try {
    const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'), ad = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '';
    if (!/Intel|SwiftShader|Basic Render|llvmpipe/i.test(ad) || localStorage.getItem('oguz-gpu-uyari')) return;
    localStorage.setItem('oguz-gpu-uyari', '1');
    setTimeout(() => toast('⚠️', 'Ekran kartı kullanılmıyor', 'Tarayıcı Intel/yazılım çiziciyi seçti. Windows > Grafik ayarları > tarayıcı > Yüksek performans.'), 1500);
  } catch { /* uyarı verilemese de oyun çalışır */ }
}

const progress = (() => { try { return JSON.parse(localStorage.getItem('oguz-levels')) || {}; } catch { return {}; } })();

// Dinamik çözünürlük: FPS düşerse geçici olarak oranı kıs, toparlanınca tekrar yükselt (kalıcı düşürme yok)
const dyn = {
  enabled: AY.cfg.dynRes ?? true,
  scale: 1.0,
  targetRatio: AY.GFX[AY.cfg.gfx || 'yuksek']?.ratio ?? maxDpr,
  activeRatio: AY.GFX[AY.cfg.gfx || 'yuksek']?.ratio ?? maxDpr,
  frames: 0,
  timeAcc: 0,
  minScale: 0.75, // en çok %25 kısılır: yarı çözünürlük görüntüyü bulanıklaştırıyordu
  maxScale: 1.0,
};

function setDynRes(enabled) {
  dyn.enabled = enabled;
  if (!enabled) {
    dyn.scale = 1.0;
    dyn.activeRatio = dyn.targetRatio;
    renderer.setPixelRatio(dyn.activeRatio);
    composer.setPixelRatio(dyn.activeRatio);
  }
}

function updateDynRes(realDt) {
  if (!dyn.enabled || state !== 'run') return;
  dyn.frames++;
  dyn.timeAcc += realDt;
  if (dyn.timeAcc >= 2) { // her oran değişimi render hedeflerini yeniden kurar (~80 ms takılma): seyrek ve kararlı değiştir
    const fps = dyn.frames / dyn.timeAcc;
    dyn.frames = 0;
    dyn.timeAcc = 0;
    let changed = false;
    dyn.hold = Math.max(0, (dyn.hold || 0) - 2);
    if (fps < 45 && dyn.scale > dyn.minScale) {
      dyn.scale = Math.max(dyn.minScale, +(dyn.scale - (fps < 30 ? 0.25 : 0.15)).toFixed(2));
      dyn.hold = 12;
      changed = true;
    } else if (fps >= 58 && !dyn.hold && dyn.scale < dyn.maxScale) {
      dyn.scale = Math.min(dyn.maxScale, +(dyn.scale + 0.05).toFixed(2));
      changed = true;
    }
    if (changed) {
      const newRatio = +(dyn.targetRatio * dyn.scale).toFixed(2);
      if (Math.abs(newRatio - dyn.activeRatio) >= 0.05) {
        dyn.activeRatio = newRatio;
        renderer.setPixelRatio(dyn.activeRatio);
        composer.setPixelRatio(dyn.activeRatio);
      }
    }
  }
}

// Grafik düzeyi (Ayarlar): çözünürlük, MSAA, anizotropi, gölge, parlama, mürekkep çizgisi
function applyGfx(k) {
  const G = AY.GFX[k] || AY.GFX.yerel;
  dyn.targetRatio = G.ratio;
  dyn.scale = 1.0;
  dyn.activeRatio = G.ratio;
  renderer.setPixelRatio(dyn.activeRatio);
  composer.setPixelRatio(dyn.activeRatio);

  // Kenar yumuşatma (MSAA)
  const maxSmpl = renderer.capabilities.maxSamples ?? 4;
  const samples = Math.min(G.msaa ?? 0, maxSmpl);
  if (composer.renderTarget1.samples !== samples) {
    composer.renderTarget1.samples = samples;
    composer.renderTarget2.samples = samples;
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
  }

  // Gölge kalitesi
  if (G.shadow === 'high' || (G.shadow === true && G.ratio >= 2)) {
    sun.castShadow = true;
    if (sun.shadow.mapSize.x !== 2048) {
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.02;
  } else if (G.shadow === 'med' || G.shadow === true) {
    sun.castShadow = true;
    if (sun.shadow.mapSize.x !== 1024) {
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
  } else if (G.shadow === 'low') {
    sun.castShadow = true;
    if (sun.shadow.mapSize.x !== 512) {
      sun.shadow.mapSize.set(512, 512);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
  } else {
    sun.castShadow = false;
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
  }

  bloom.enabled = G.bloom;
  gfx.outline = G.outline;

  // Doku anizotropisi
  const maxAniso = renderer.capabilities.getMaxAnisotropy?.() || 16;
  const aniso = Math.min(G.aniso || 4, maxAniso);
  W.setWorldAnisotropy?.(aniso);
  setDesenAnisotropy?.(aniso);
  if (A?.templates) {
    for (const group of Object.values(A.templates)) {
      group.traverse?.(o => {
        if (o.material?.map && o.material.map.anisotropy !== aniso) {
          o.material.map.anisotropy = aniso;
          o.material.map.needsUpdate = true;
        }
      });
    }
  }

  resize();
}

// Gölgelendirici ısıtma: ilk kez görünen nesne/düşman koşu ortasında saniyelerce takılmasın diye hepsi bir kez gizlice çizilir
function warmShaders() {
  const g = new THREE.Group();
  let i = 0;
  const put = o => { o.traverse(c => { c.visible = true; c.frustumCulled = false; }); o.position.set((i % 8 - 3.5) * 2, 0, P.z - 8 - Math.floor(i / 8) * 3); i++; g.add(o); };
  for (const d of Object.values(DEF)) if (d.make) { try { put(d.make()); } catch {} }
  for (const m of new Set(['kormos', 'esir', ...Object.values(LEVELS).map(L => L?.foeModel), ...ZONES.map(Z => Z.foeModel)].filter(Boolean))) { try { put(new Actor(A, m).root); } catch {} }
  scene.add(g);
  const cp = camera.position.clone(), cq = camera.quaternion.clone();
  camera.position.set(0, 6, P.z + 6);
  camera.lookAt(0, 0, P.z - 12);
  composer.render();
  camera.position.copy(cp); camera.quaternion.copy(cq);
  scene.remove(g);
  pool('kormos'); pool('esir'); // havuz da önceden kurulur (10 iskeletli kopya ~0,3 sn sürer)
}

// Açılışta FPS ölçülür (kalıcı düşürme yok; oyuncu seçmediyse donanıma göre başlangıç önerilir)
const fpsProbe = { n: 0, t0: 0, done: !!AY.cfg.gfx };
function probeFps() {
  if (fpsProbe.done || !hero) return;
  if (state === 'run') { fpsProbe.n = fpsProbe.t0 = 0; fpsProbe.warm = undefined; return; } // koşu sırasında ayar değişip takılmasın: menüde yeniden ölçülür
  const t = performance.now();
  fpsProbe.warm ??= t + 1500; // ilk kareler (gölgelendirici derleme) yavaştır: sayılmaz
  if (t < fpsProbe.warm) return;
  if (!fpsProbe.t0) fpsProbe.t0 = t;
  fpsProbe.n++;
  const sec = (t - fpsProbe.t0) / 1000;
  if (sec > 2.5) {
    fpsProbe.done = true;
    fpsProbe.fps = fpsProbe.n / sec;
    applyGfx(AY.autoGfx(fpsProbe.fps));
    warmShaders();
  }
}
// Ara sahne galerisi
function gallery() {
  const back = after => () => { toMenu(); after(); };
  const epi = n => [{ text: EPILOG[n], dur: 7, enter(c) { c.fade(0); setTheme(LEVELS[n].floors.at(-1).theme); c.hero.play('Idle_Loop', { fade: 0 }); c.title([[`BÖLÜM ${n} SONU`, 'sub']]); c.titleAlpha(1, true); },
    update(c, k) { c.show(c.hero, 0, 0, c.Z - 8, Math.PI); c.cam(lerp(3, 1.4, k), 2, c.Z - 12, 0, 1.5, c.Z - 8); c.titleAlpha(k < 0.25 ? 1 : 0); } }];
  const intro = n => () => { setTheme(LEVELS[n].floors[0].theme); return levelIntro(n); };
  return [
    ['Jenerik', after => playCine(JENERIK, back(after))],
    ['Prolog (çizgi roman)', after => playComic(PROLOG_PAGES, back(after))],
    ...[1, 2, 3, 4, 5, 6, 7].map(n => [`${n}. bölüm girişi`, after => playCine(intro(n)(), back(after))]),
    ...[1, 2, 3, 4, 5, 6, 7].map(n => [`${n}. bölüm sonu`, after => playCine(epi(n), back(after))]),
  ];
}

// Koşan yiğit: liderin görünüşü; Canavarlar koleksiyonu tamamsa altın çerçeveli Tanrı Kılıcı
// Koşan yiğit: lider (ya da denenen yiğit). Görünüşü, kılıç parıltısı, eyer rengi ve koşu izi ondan gelir.
const runner = () => (trial ? Y.CARDS.find(c => c.id === trial.id) : Y.leader());
let heroFx = null;
const plainMat = new WeakMap(), tintMats = {};
function tint(obj, color, glow) { // parçanın malzemesini renkli ve parlak kopyayla değiştirir; null: aslına döner
  obj?.traverse(o => {
    if (!o.isMesh) return;
    if (!plainMat.has(o)) plainMat.set(o, o.material);
    const base = plainMat.get(o);
    if (color == null) { o.material = base; return; }
    const k = base.uuid + color + glow;
    o.material = tintMats[k] ??= Object.assign(base.clone(), { color: new THREE.Color(color), emissive: new THREE.Color(color).multiplyScalar(glow) });
  });
}
function dressHero() {
  const c = runner();
  applyCostume(hero, Y.cardLook(c));
  heroFx = Y.cardFx(c);
  heroFx.rate = { 3: 6, 4: 10, 5: 15, 6: 20, 7: 26, 8: 32 }[Y.cardState(c.id)?.stars ?? c.stars];
  if (KO.goldSword()) tint(hero.parts.SwordHand, 0xffd23f, 0.35);
  else tint(hero.parts.SwordHand, heroFx.kilic ?? null, 0.55);
  tint(horse?.parts.Saddle, heroFx.at, 0);
}
// Koşu izi: ayakların arkasında yiğidin renginde parçacıklar (nadirlik arttıkça yoğun)
let izT = 0;
function heroTrail(dt) {
  if (!heroFx || flying || P.dead || state !== 'run') return;
  if ((izT -= dt * heroFx.rate) > 0) return;
  izT = 1;
  sparks.emit(P.x + rand(-0.25, 0.25), (P.gy || 0) + P.y + 0.25, P.z + 0.5, 1, heroFx.iz, 0.8, 1.2, 0.45);
}
function onCards() { recMax('costumes', Y.ownedCount()); EK.checkCollections(); }
// Seferden gelen eksik gümüş ok
function missingArrow() {
  for (const l of [1, 2, 3, 4, 5, 6, 7]) {
    const r = (relicSave[l] ??= { yay: false, ok: [false, false, false] }), i = r.ok.indexOf(false);
    if (i >= 0) { r.ok[i] = true; saveRelics(); rec('gumus'); return `${l}. bölümün gümüş oku`; }
  }
  return null;
}
Y.setHelpersCheck(() => isUnlocked('ordu'));
KO.setRelicSource(() => relicSave);

// TÖRE DEFTERİ: günlük görevler, başarımlar, giriş armağanı
TORE.onUnlock((a, t) => toast('🏆', `${a.name} ${['I', 'II', 'III'][t - 1]}`, a.desc.replace('{n}', (a.tiers[t - 1] / a.div).toLocaleString('tr-TR')) + ' · ödülünü Töre Defteri\'nden al'));
TORE.setRelicCheck(() => [1, 2, 3, 4, 5, 6, 7].some(l => { const r = relicSave[l]; return !r || !r.yay || !r.ok.every(Boolean); }));
wallet.onChange((kind, n) => { if (n > 0 && kind === 'kut') rec('kut', n); if (n > 0 && kind === 'gd') rec('gd', n); });
shop.onBuy = kind => { if (kind === 'upgrade') rec('upgrade'); };
let toreTab = 'gunluk';
function openTore() {
  state = 'tore';
  $('menu').hidden = true;
  drawTore();
  $('tore').hidden = false;
}
function drawTore() {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  for (const b of document.querySelectorAll('#ttabs button')) b.classList.toggle('on', b.dataset.tab === toreTab);
  const box = $('tlist');
  box.replaceChildren();
  const rewardTxt = r => [r.kut && `◆ ${r.kut}`, r.gd && `⬢ ${r.gd}`, r.davul && `🥁 ${r.davul} Tunç Davul`, r.xp && `${r.xp} XP`].filter(Boolean).join(' · ');
  if (toreTab === 'gunluk') {
    box.append(el('p', 'tnote', 'Her gün üç görev. Gece yarısı yenilenir; ödülü buradan al.'));
    for (const q of TORE.daily().quests) {
      const r = TORE.DAILY_REWARD[q.tier], row = el('div', 'trow ' + q.tier);
      row.append(el('b', 'tmed', { kolay: '🥉', orta: '🥈', zor: '🥇' }[q.tier]));
      const mid = el('div', 'tmid');
      mid.append(el('strong', null, q.text), bar(q.prog / q.n), el('small', null, `${q.prog.toLocaleString('tr-TR')} / ${q.n.toLocaleString('tr-TR')} · ${rewardTxt(r)}`));
      row.append(mid);
      const btn = el('button', 'small', q.claimed ? 'ALINDI' : 'AL');
      btn.disabled = q.claimed || q.prog < q.n;
      btn.onclick = () => { const got = TORE.claimDaily(q.id); if (got) { levelUps(addXP(got.xp), levelBar); drawTore(); } };
      row.append(btn);
      box.append(row);
    }
  } else if (toreTab === 'basarim') {
    const done = TORE.ACH.reduce((s, a) => s + TORE.achTier(a.id), 0);
    box.append(el('p', 'tnote', `${done} / ${TORE.ACH.length * 3} kademe · her kademe ödül verir`));
    const bekleyen = TORE.achClaimable(), hepsi = el('button', 'big', bekleyen.length ? `HEPSİNİ AL (${bekleyen.length})` : 'ALINACAK ÖDÜL YOK');
    hepsi.disabled = !bekleyen.length;
    hepsi.onclick = () => {
      const top = { kut: 0, gd: 0, xp: 0 };
      for (const a of bekleyen) { const g = TORE.claimAch(a.id); top.kut += g.kut; top.gd += g.gd; top.xp += g.xp; }
      toast('🏆', `${bekleyen.length} başarım ödülü alındı`, rewardTxt(top));
      levelUps(addXP(top.xp), levelBar); drawTore();
    };
    hepsi.style.margin = '2px auto 10px'; box.append(hepsi);
    for (const a of TORE.ACH) {
      const t = TORE.achTier(a.id), row = el('div', 'trow' + (t === 3 ? ' full' : ''));
      row.append(el('b', 'tmed', ['▫', '🥉', '🥈', '🥇'][t]));
      const mid = el('div', 'tmid'), goal = a.tiers[Math.min(t, 2)];
      mid.append(el('strong', null, a.name + ' ' + ['I', 'II', 'III'][Math.min(t, 2)]), bar(Math.min(1, TORE.stat(a.key) / goal)), el('small', null, a.desc.replace('{n}', (goal / a.div).toLocaleString('tr-TR')) + ` · ${Math.floor(Math.min(TORE.stat(a.key), goal) / a.div).toLocaleString('tr-TR')} / ${(goal / a.div).toLocaleString('tr-TR')}`));
      row.append(mid);
      const can = t > TORE.achClaimed(a.id);
      const btn = el('button', 'small', can ? 'AL' : t === 3 ? 'TAMAM' : rewardTxt(TORE.ACH_REWARD[t]));
      btn.disabled = !can;
      btn.onclick = () => { const got = TORE.claimAch(a.id); levelUps(addXP(got.xp), levelBar); drawTore(); };
      row.append(btn);
      box.append(row);
    }
  } else {
    const L = TORE.loginState(), ready = TORE.loginReady(), cur = L.day % 7;
    box.append(el('p', 'tnote', 'Her gün bir armağan. Bir gün kaçırsan da takvim sıfırlanmaz, kaldığın yerden sürer.'));
    const cal = el('div', 'tcal');
    TORE.LOGIN.forEach((r, i) => {
      const got = i < cur || (!ready && i === cur - 1 + (cur === 0 ? 7 : 0));
      const d = el('div', 'tday' + (i < cur ? ' got' : '') + (i === cur && ready ? ' today' : '') + (i === 6 ? ' big' : ''));
      d.append(el('small', null, `${i + 1}. GÜN`), el('b', null, r.davul ? '🥁' : r.gd ? '⬢' : '◆'), el('span', null, r.davul ? 'Tunç Davul' : r.gd ? `${r.gd} Gök Demir` : `${r.kut} kut`));
      void got;
      cal.append(d);
    });
    box.append(cal);
    const btn = el('button', 'big', ready ? `${cur + 1}. GÜNÜN ARMAĞANINI AL` : 'YARIN GEL');
    btn.disabled = !ready;
    btn.onclick = () => { const r = TORE.claimLogin(); if (r) { toast(r.davul ? '🥁' : r.gd ? '⬢' : '◆', `${r.day}. gün armağanı`, rewardTxt(r)); drawTore(); } };
    box.append(btn);
  }
  function bar(k) { const b = el('div', 'tbar'), i = el('i'); i.style.width = Math.round(k * 100) + '%'; b.append(i); return b; }
  toreDot();
}
function toreDot() { $('torebtn').querySelector('.dot').hidden = !TORE.toreBadge(); }

// AKIN HARİTASI: parşömen üstünde düğümler (harita.js). Her düğüm ayrı görev; madalya ve ödül verir.
let NODES = null;
const nodes = () => (NODES ??= (() => { const n = buildNodes(LEVELS, PARTS, BOSSES); migrate(progress, n); return n; })());
function openMap() {
  state = 'map';
  for (const id of ['menu', 'win', 'over', 'boyscreen', 'result']) $(id).hidden = true;
  $('mapdetail').hidden = $('mapshade').hidden = true;
  $('map').hidden = false;
  drawMap($('maplist'), nodes(), showNode);
}
const reqCard = n => Y.CARDS.find(c => c.costume === n.req?.costume || c.id === n.req?.card);
function reqOk(n) {
  if (n.req?.boy && !picks.list.includes(n.req.boy)) return false;
  if (n.req?.costume && reqCard(n) && Y.leader() !== reqCard(n)) return false; // ponytail: Manas'ın yiğit kartı yok; kart çıkana dek şart sayılmaz
  return true;
}
function reqText(n) {
  if (n.req?.boy) return `Bu görev ${BOYLAR.find(b => b.id === n.req.boy).name} boyundan bir yiğit ister.`;
  if (n.req?.costume && reqCard(n)) return `Bu görevde lider ${reqCard(n).name} olmalı.`;
  return '';
}
function showNode(n, open) {
  const box = $('mapdetail'), st = hStore[n.id], t = thresholds(n);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const F = !n.extra && !n.soon ? LEVELS[n.lv].floors[n.floor] : null;
  const goals = n.soon ? 'Bu bölüm henüz yapılıyor.' : n.extra ? n.text : F.goals.map(([k, v]) => `${GOAL_ICON[k][0]} ${v}${GOAL_ICON[k][1]}`).join('  ·  ') + (F.boss ? `  ·  sonunda ${BOSSES[F.boss].name}` : '');
  const kids = [el('h3', null, n.name), el('small', null, n.extra ? (n.gen ? 'GÖREV' : 'EK GÖREV') : `${REGIONS[n.lv]?.name || ''} · ${n.sub || ''}`), el('p', 'mgoal', goals)];
  if (!n.soon) {
    const thr = el('p', 'mthr');
    const md = (cls, text) => { const w = el('span', 'mm'); w.append(el('i', cls), document.createTextNode(text)); return w; };
    thr.append(document.createTextNode('Madalya: '), md('bz', 'bitir'), md('gm', t[1].toLocaleString('tr-TR')), md('al', t[2].toLocaleString('tr-TR') + ' skor'));
    kids.push(thr);
    const r = n.reward;
    kids.push(el('p', 'mrew', (st?.m ? 'İlk ödül alındı · ' : 'İlk bitirişte: ') + `◆ ${r.kut}` + (r.gd ? ` · ⬢ ${r.gd}` : '') + ` · ${r.xp} XP` + (st?.best ? ` · En iyi skor ${st.best.toLocaleString('tr-TR')}` : '')));
    if (reqText(n)) kids.push(el('p', 'mreq' + (reqOk(n) ? ' ok' : ''), (reqOk(n) ? '✓ ' : '✗ ') + reqText(n)));
  }
  const row = el('div', 'menu-buttons');
  const go = el('button', 'big', open ? 'BAŞLA ▸' : 'KİLİTLİ');
  go.disabled = !open;
  go.onclick = () => playNode(n);
  const close = el('button', 'small', 'KAPAT');
  close.onclick = () => { box.hidden = true; $('mapshade').hidden = true; };
  row.append(go, close);
  if (n.req?.costume && reqCard(n) && Y.leader() !== reqCard(n)) {
    const c = reqCard(n), w = el('button', 'small', Y.owned(c.id) ? 'LİDER YAP' : 'YİĞİTLER ▸');
    w.onclick = () => { if (Y.owned(c.id)) { Y.setLeader(c.id); dressHero(); showNode(n, open); } else EK.openYigit(c.id); };
    row.append(w);
  }
  kids.push(row);
  box.replaceChildren(...kids);
  box.hidden = false;
  $('mapshade').hidden = false;
}
function playNode(n) {
  if (n.req?.costume && !reqOk(n)) return toast('🃏', 'Yiğit şartı', reqText(n));
  nodeRun = n;
  $('mapdetail').hidden = true;
  openBoylar('level', n.lv);
}

function showDialog(lines, after) {
  state = 'dialog';
  for (const id of ['hud', 'menu', 'map', 'boyscreen', 'result']) $(id).hidden = true;
  hero.root.visible = true;
  hero.play('Idle_Loop', { fade: 0.2 });
  DLG.play(lines, portraits, Y.cardLook(Y.leader()), after, sfx);
}

// GÖREV TAMAM: SMU'daki gibi sonuç ekranı; madalyalar sırayla dolar
const MEDAL_XP = [30, 60, 100];
function nodeDone() {
  const n = nodeRun, st = (hStore[n.id] ??= { m: 0, best: 0 });
  state = 'result';
  $('banner').classList.remove('show');
  hideTip();
  const sc = Math.floor(score), m = medalsFor(n, sc), was = st.m, first = !was, newBest = sc > st.best && was > 0;
  st.m = Math.max(was, m); st.best = Math.max(st.best, sc);
  saveStore();
  if (!flying && !P.dead) timed(hero, Y.cardFx(runner()).zafer, 2.2);
  const totalKut = Math.round(kut * (has('alkaevli') ? 1.25 : 1) * (1 + bonus.kutPct)), runKut = totalKut - (contPaid?.kut || 0);
  wallet.deposit(runKut);
  let xp = 0, gd = runGold, bonusKut = 0;
  for (let k = was; k < m; k++) xp += MEDAL_XP[k];
  if (first) { bonusKut = n.reward.kut; wallet.deposit(n.reward.kut); wallet.addGD(n.reward.gd); gd += n.reward.gd; xp += n.reward.xp; }
  rec('medals', Math.max(0, m - was));
  if (m === 3 && was < 3) rec('medal_gold');
  if (runHits === 0) rec('flawless');
  let story = '';
  if (!n.extra && n.last) { // bölümün son kısmı: bölüm tamam
    const lvNodes = nodes().filter(x => x.lv === n.lv && !x.extra);
    const stars = Math.min(...lvNodes.map(x => hStore[x.id]?.m || 0));
    const firstThree = stars === 3 && (progress[n.lv] || 0) < 3;
    if (firstThree) { wallet.addGD(3); gd += 3; }
    progress[n.lv] = Math.max(progress[n.lv] || 0, stars);
    try { localStorage.setItem('oguz-levels', JSON.stringify(progress)); } catch {}
    story = EPILOG[n.lv] || '';
  }
  for (const id of ['hud', 'bossbar', 'ride']) $(id).hidden = true;
  $('rname').textContent = n.name;
  const md = $('rmedals');
  [...md.children].forEach((c, i) => { c.className = ''; if (i < m) setTimeout(() => { c.className = ['bz', 'gm', 'al'][i] + ' fill'; sfx(i === 2 ? 'gold' : 'coin2'); }, 500 + i * 450); });
  const rows = [['Skor', sc.toLocaleString('tr-TR')], ['En yüksek kombo', maxCombo], ['Kut', `◆ ${runKut + bonusKut}`], ['XP', `+${runXP() + xp}`], ['Gök Demir', `⬢ ${gd}`]];
  $('rstats').replaceChildren(...rows.map(([k, v]) => { const d = document.createElement('div'); d.append(Object.assign(document.createElement('span'), { textContent: k }), Object.assign(document.createElement('b'), { textContent: v })); return d; }));
  $('rstamp').hidden = !newBest;
  $('rstory').textContent = story;
  const nx = n.extra && !n.gen ? null : nextMain(nodes(), n);
  $('rnext').hidden = !nx;
  $('rnext').onclick = () => { $('result').hidden = true; if (nx) showNodeOnMap(nx); };
  $('result').hidden = false;
  sting('win');
  const paidXP = contPaid?.xp || 0;
  endRunXP(xp, paidXP);
  contPaid = { kut: totalKut, xp: runXP() };
  const need = thresholds(n)[2];
  $('rcont').hidden = m >= 3 || P.dead;
  $('rcont').onclick = () => continueRun(need);
  const after = DLG.DIALOGS['son:' + n.lv];
  if (first && !n.extra && n.last && after) { $('result').hidden = true; showDialog(after, () => { state = 'result'; $('result').hidden = false; }); } // bölüm sonu
}
// Görev bitse de altın madalya skoruna kadar koşuya devam: skor eşiğe varınca ya da ölünce sonuç ekranı yeniden gelir
function continueRun(need) {
  $('result').hidden = true;
  contRun = true; contShown = -1; contNeed = need;
  state = 'run';
  P.inv = Math.max(P.inv, 2);
  hero.play('Sprint_Loop');
  $('hud').hidden = false; $('goals').hidden = false;
  banner(`ALTIN MADALYA: ${need.toLocaleString('tr-TR')} SKOR`);
}
let contNeed = 0;
function showNodeOnMap(n) { openMap(); showNode(n, isOpen(nodes(), n)); }

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
  if (!isUnlocked('boylar')) return start(m, lv); // Boy Seçimi Akıncı Seviyesi 3'te açılır
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
  const rack = () => drawRack($('boyrack'), rack);
  $('boyrack').hidden = !isUnlocked('carsi');
  if (isUnlocked('carsi')) rack();
  $('boyscreen').hidden = false;
}

// Çarşı: otağ tezgâhı; takviyeler, kalıcı yükseltmeler, Gök Demir paketleri (yakında)
let shopTab = 'takviye';
function openShop() {
  state = 'carsi';
  for (const id of ['menu', 'over', 'win']) $(id).hidden = true;
  drawShopTab();
  $('carsi').hidden = false;
}
function drawShopTab() {
  for (const b of document.querySelectorAll('#stabs button')) b.classList.toggle('on', b.dataset.tab === shopTab);
  drawShop($('slist'), shopTab, drawShopTab);
}

// Destan Kitabı: kapak açılır, sol sayfada karakter döner, sağ sayfada destandaki yeri; sayfa çevrilerek gezilir
let page = 0, turning = false;
const CN = '零一二三四五六七八九十';
const cnNum = n => n <= 10 ? CN[n] : n < 20 ? '十' + CN[n - 10] : CN[Math.floor(n / 10)] + '十' + (n % 10 ? CN[n % 10] : '');
function openBook() {
  state = 'book';
  $('menu').hidden = true;
  $('tome').className = 'closed';
  $('book').className = 'closed';
  $('book').hidden = false;
  page = -1; // kitap İçindekiler'den açılır
  fillPage(page);
  book.show({ locked: true });
  book.pedestal(false);
  requestAnimationFrame(bookResize);
}
function openCover() {
  if (!$('tome').classList.contains('closed')) return;
  $('tome').className = 'open';
  $('book').className = '';
  sfx('page');
  setTimeout(() => { bookResize(); showModel(page); }, 700);
}
const showModel = i => { if (i < 0 || BOOK[i].locked || BOOK[i].items) { book.pedestal(false); if (i >= 0 && BOOK[i].items) return book.show(BOOK[i]); book.show({ locked: true }); } else { book.pedestal(true); book.show(BOOK[i]); } };
function closeBook() {
  if ($('tome').classList.contains('closed')) return toMenu();
  book.show({ locked: true }); // karakter de sergi de gizlenir
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
// İçindekiler: iki sayfaya bölünmüş, gruplu, tıklanınca o sayfaya gidilir
function drawToc() {
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const groups = [];
  BOOK.forEach((e, i) => { let g = groups.find(x => x.name === e.group); if (!g) groups.push(g = { name: e.group || 'Diğer', list: [] }); g.list.push([e, i]); });
  const half = Math.ceil(BOOK.length / 2);
  let n = 0;
  const L = [el('h2', 'toch', 'İçindekiler')], R = [];
  for (const g of groups) {
    const col = n < half - 2 ? L : R;
    col.push(el('div', 'tocg', g.name));
    for (const [e, i] of g.list) {
      const b = el('button', 'toce' + (e.locked ? ' locked' : ''));
      b.append(el('span', null, e.name), el('span', 'dots'), el('span', 'pg', String(i * 2 + 4)));
      b.onclick = () => turnTo(i);
      col.push(b);
      n++;
    }
  }
  $('ltoc').replaceChildren(...L);
  $('rtoc').replaceChildren(...R);
}
function fillPage(i) {
  const toc = i < 0;
  $('ltoc').hidden = $('rtoc').hidden = !toc;
  $('lpage').classList.toggle('toc', toc);
  $('bcard').hidden = toc;
  $('btocbtn').hidden = toc;
  if (toc) { drawToc(); $('lfolio').textContent = cnNum(1); $('rfolio').textContent = `2 · ${cnNum(2)}`; return; }
  const e = BOOK[i];
  $('bname').textContent = e.name;
  $('btitle').textContent = e.title;
  $('btext').textContent = e.text;
  $('block').hidden = !e.locked;
  $('block').textContent = e.locked ? `YAKINDA · ${e.locked}` : '';
  $('lfolio').textContent = cnNum(i * 2 + 3);
  $('rfolio').textContent = `${i * 2 + 4} · ${cnNum(i * 2 + 4)}`;
}
// Sayfa çevirme: yaprak N şeride bölünür; her şerit bir öncekinin ucuna bağlıdır. Yaprak ortadan döner,
// şeritler arası küçük açı kâğıdın kıvrılmasını verir; açı arttıkça gölge koyulaşır.
const STRIPS = 12;
function buildLeaf(front, back) { // front: sağ sayfanın görünüşü, back: arka yüz (yeni sol sayfa)
  const leaf = $('leaf'), W = $('rpage').clientWidth, sw = W / STRIPS;
  leaf.replaceChildren();
  let parent = leaf;
  const strips = [];
  for (let k = 0; k < STRIPS; k++) {
    const st = document.createElement('div');
    st.className = 'strip';
    st.style.width = sw + 'px';
    st.style.left = k ? sw + 'px' : '0';
    for (const [cls, src, off] of [['f', front, -k * sw], ['b', back, -(STRIPS - 1 - k) * sw]]) {
      const face = document.createElement('div');
      face.className = cls;
      const inner = document.createElement('div');
      inner.className = 'inner';
      inner.style.width = W + 'px';
      inner.style.left = off + 'px';
      inner.append(src.cloneNode(true));
      const sh = document.createElement('div');
      sh.className = 'sh';
      face.append(inner, sh);
      st.append(face);
    }
    parent.append(st);
    strips.push(st);
    parent = st;
  }
  return strips;
}
function pageShot(sel) { // sayfanın içeriğinin kopyası (3B model hariç: sol sayfa kâğıt)
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;inset:0;background:#efdcb4 linear-gradient(90deg, rgba(90,60,20,.18), transparent 8%, transparent 92%, rgba(90,60,20,.12))';
  for (const n of document.querySelector(sel).children) if (!n.hidden && n.id !== 'btocbtn') d.append(n.cloneNode(true));
  return d;
}
function turnTo(i) {
  if (i < -1) i = BOOK.length - 1;
  if (i >= BOOK.length) i = -1;
  if (turning || i === page || $('tome').classList.contains('closed')) return;
  sfx('page');
  const fwd = i > page;
  turning = true;
  const oldR = pageShot('#rpage'), oldL = pageShot('#lpage');
  page = i;
  fillPage(i);
  const newR = pageShot('#rpage'), newL = pageShot('#lpage');
  // ileri: eski sağ sayfa kalkar, arkasında yeni sol sayfa; geri: yeni sağ sayfa soldan kapanır, arkasında eski sol
  const strips = fwd ? buildLeaf(oldR, newL) : buildLeaf(newR, oldL);
  const leaf = $('leaf');
  leaf.className = 'on';
  if (!fwd) showModel(-1); // geri çevirirken sol sayfadaki model yaprağın altında kalmasın
  else setTimeout(() => showModel(i), 420);
  const t0 = performance.now(), D = 850;
  const step = now => {
    const p = Math.min(1, (now - t0) / D), e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
    const q = fwd ? e : 1 - e; // q: 0 = sağda düz, 1 = solda düz
    const bend = Math.sin(q * Math.PI) * (fwd ? -7 : 7) * (0.6 + 0.4 * Math.sin(p * Math.PI)); // uç önde kalkar
    strips.forEach((st, k) => {
      const a = k === 0 ? -180 * q + bend * 0.5 : bend * (k / STRIPS + 0.3);
      st.style.transform = `rotateY(${a}deg)`;
      const shade = Math.abs(Math.sin(q * Math.PI)) * (0.15 + 0.35 * k / STRIPS);
      for (const sh of st.querySelectorAll(':scope > div > .sh')) sh.style.background = `rgba(40,20,5,${shade.toFixed(3)})`;
    });
    if (p < 1) return requestAnimationFrame(step);
    leaf.className = '';
    leaf.replaceChildren();
    turning = false;
    if (!fwd) showModel(i);
  };
  requestAnimationFrame(step);
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
      recMax('costumes', wallet.owned.length);
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
  $('banner').classList.remove('show');
  const stars = Math.max(1, P.hp);
  const r = relicSave[level];
  const full = r && r.yay && r.ok.every(Boolean) && !r.paid;
  if (full) { r.paid = true; kut += 200; saveRelics(); } // Bozok-Üçok: rüyadaki yay ve üç ok tamam
  wallet.deposit(Math.round(kut * (has('alkaevli') ? 1.25 : 1) * (1 + bonus.kutPct)));
  const firstThree = stars === 3 && (progress[level] || 0) < 3;
  if (firstThree) wallet.addGD(3); // bir bölümü ilk kez 3 yıldızla bitirme ödülü
  progress[level] = Math.max(progress[level] || 0, stars);
  try { localStorage.setItem('oguz-levels', JSON.stringify(progress)); } catch {}
  $('winstars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  $('winstats').textContent = `Skor ${Math.floor(score).toLocaleString('tr-TR')} · Kut ${kut} · Düşman ${kills}` + (LEVELS[level].prisoners ? ` · Kurtarılan esir ${esirs}` : '')
    + (full ? ' · ALTIN YAY VE ÜÇ GÜMÜŞ OK TAMAM! +200 KUT' : '') + (firstThree ? ' · İLK ÜÇ YILDIZ! +3 GÖK DEMİR' : '')
    + ` · +${runXP()} XP`;
  $('winstory').textContent = EPILOG[level] || '';
  { let pb = 0; try { pb = +localStorage.getItem('oguz-best') || 0; if (score > pb) localStorage.setItem('oguz-best', Math.floor(score)); } catch {}
    SMU.endPanel('win', { kind: 'win', cardId: runner()?.id, score, best: pb, newBest: score > pb && pb > 0 }); }
  for (const id of ['hud', 'bossbar', 'ride']) $(id).hidden = true;
  if (!flying) timed(hero, Y.cardFx(runner()).zafer, 2.2); // yiğide özel zafer pozu
  $('win').hidden = false;
  sting('win');
  endRunXP();
}

// ---- eğitim ipuçları ----
// 1. bölümün ilk kısmında sırayla ve güvenli anlarda; sonra her yeni şey ilk görüldüğünde bir kez.
const T_TUTOR = [
  ['goals', { text: 'Görev çiplerindeki hedefleri tamamla (mesafe, kut...). Hepsi bitince boss gelir.', icon: '🎯' }, () => time > 1.2],
  ['lane', { text: 'Sola ya da sağa kaydırarak şerit değiştir.', icon: '⇆', gesture: 'lr', key: '← →' }, () => time > 3.5],
  ['kut', { text: 'Kut topla: koşu sonunda kasana girer, Çarşı ve yiğitler için harcanır.', icon: '◆' }, () => ahead(o => o.kind === 'kut', 14)],
  ['jump', { text: 'Alçak engelin üstünden zıpla: yukarı kaydır.', icon: '⤒', gesture: 'up', key: '↑' }, () => ahead(o => o.def.hit === 'low' && o.lane === P.lane, 18, 8)],
  ['slide', { text: 'Yüksek engelin altından kay: aşağı kaydır.', icon: '⤓', gesture: 'down', key: '↓' }, () => ahead(o => o.def.hit === 'high' && o.lane === P.lane, 18, 8)],
  ['sword', { text: 'Düşmana dokun: kılıçla vur! Yakındakilere atılarak vurursun.', icon: '⚔', gesture: 'tap', key: 'Boşluk' }, () => ahead(o => o.def.foe && o.ready && o.lane === P.lane, 18, 9)],
  ['bow', { text: '⚔/🏹 düğmesiyle yaya geç: uzaktakileri okla vur.', icon: '🏹', key: 'Q' }, () => kills > 0],
];
const T_EVENT = [ // [id, ipucu, önde görülen nesne]
  ['nal', { text: 'Altın nalı al: ata binersin, önündeki her şeyi çiğnersin.', icon: '🐎' }, o => o.kind === 'nal'],
  ['kimiz', { text: 'Şifalı kımız bir can verir.', icon: '🍶' }, o => o.kind === 'kimiz'],
  ['relic', { text: 'Destan eşyası! Havada durur: zıplayarak al.', icon: '🏹', gesture: 'up', key: '↑' }, o => o.kind === 'gumus' || o.kind === 'yay'],
  ['pusu', { text: 'Ünlem: pusu! Düşman atlayacak; şerit değiştir ya da vur.', icon: '!' }, o => o.alert && !o.gold],
  ['kurt', { text: 'Gök Yeleli Kurt: al, önden koşup güvenli yolu gösterir.', icon: '🐺' }, o => o.kind === 'kurt'],
  ['geyik', { text: 'Ak Geyik! Yakalarsan seni kut dolu gizli yola götürür.', icon: '🦌' }, o => o.def.deer],
  ['isabet', { text: 'Altın tamga halkasının içinden geç: İSABET kombosu.', icon: '𐰴' }, o => o.kind === 'tamga'],
  ['kirik', { text: 'Çatlak ahşap engeli kılıçla kır, içinden kut saçılır.', icon: '📦', gesture: 'tap', key: 'Boşluk' }, o => o.def.brk],
  ['kalkanli', { text: 'Kalkanlıya ok işlemez: önce kılıçla kalkanını kır.', icon: '🛡' }, o => o.cfg?.parts.includes('Shield')],
];
// 1. bölümün ilk kısmında önce 'görevler' ve 'şerit' gösterilir; o ikisi görülmeden başka ipucu çıkmaz
setGate(id => id === 'goals' || id === 'lane' || !(level === 1 && floor === 0 && mode === 'level') || (tipSeen('goals') && tipSeen('lane')));
const ahead = (f, far, near = 0) => objs.some(o => !o.dead && !o.done && P.z - o.z > near && P.z - o.z < far && f(o));
const safe = () => !objs.some(o => o.def.hit && !o.dead && P.z - o.z > 0 && P.z - o.z < 10); // önü boşken
let tipT = 0;
function tipScan(dt) {
  if ((tipT -= dt) > 0 || state !== 'run' || fin) return;
  tipT = 0.2;
  if (level === 1 && floor === 0 && mode === 'level' && !boss) { // ilk kısımda sırayla
    const left = T_TUTOR.filter(([id]) => !tipSeen(id));
    const first = left.slice(0, left[0]?.[0] === 'goals' || left[0]?.[0] === 'lane' ? 1 : left.length); // önce görevler ve şerit, sonra hangisi önce gelirse
    const next = first.find(t => t[2]());
    if (next && (['jump', 'slide', 'sword'].includes(next[0]) || safe())) return void tip(next[0], next[1], '', slowmo);
  }
  if (boss) {
    const t = $('tap').hidden ? '' : $('tap').textContent;
    if (/ZIPLA|EĞİL|KAÇ/.test(t)) tip('duel', { text: 'Düello: ekranda yazan hamleyi yap (ZIPLA / EĞİL / YANA KAÇ), sonra VUR!', icon: '⚔' }, '', slowmo);
    return;
  }
  if (!tipSeen('ucurum') && terr.some(t => t.kind === 'pit' && P.z - t.z0 > 5 && P.z - t.z0 < 24)) return void tip('ucurum', { text: 'Uçurum! Kenarında ZIPLA; düşersen bir can gider.', icon: '⛰', gesture: 'up', key: '↑' }, '', slowmo);
  for (const [id, t, f] of T_EVENT) if (!tipSeen(id) && ahead(f, 22, 4)) return void tip(id, t, '', slowmo);
}

// ================= BİR KOŞU DENE =================
// Alınmamış yiğitle 600 m'lik deneme koşusu (Sonsuz Akın'ın ilk bölgesi). Kut, XP, Gök Demir ve Töre sayaçları işlemez.
const TRIAL_M = 600;
function startTrial(id) {
  trial = { id };
  TORE.mute(true);
  $('yigit').hidden = true;
  book.setRank(null);
  dressHero();
  start('endless', 0, true);
  const c = runner();
  banner('DENEME: ' + c.name);
  $('trialtag').hidden = false;
}
function trialTick() {
  $('trialtag').textContent = `DENEME · ${Math.max(0, TRIAL_M - dist())} m`;
  if (dist() >= TRIAL_M) trialEnd();
}
function trialEnd() {
  const c = runner();
  state = 'trialend';
  P.inv = 0; P.dead = false;
  hideTip();
  for (const id of ['hud', 'bossbar', 'ride', 'tap', 'mash', 'trialtag']) $(id).hidden = true;
  timed(hero, Y.cardFx(c).zafer, 2.2);
  const box = $('trialend'), p = Y.buyPrice(c), ok = Y.buyable(c), owned = Y.owned(c.id);
  box.querySelector('h2').textContent = c.name;
  box.querySelector('p').textContent = owned ? 'Artık senin!' : `${dist()} m koştun. Beğendin mi?`;
  const buy = $('trbuy');
  buy.hidden = owned || !ok;
  buy.textContent = p.kut != null ? `◆ ${p.kut} İLE AL` : `⬢ ${p.gd} İLE ÇAĞIR`;
  buy.disabled = p.kut != null ? wallet.bank < p.kut : wallet.gokdemir < p.gd;
  box.hidden = false;
  sting('win');
}
function trialBuy() {
  const c = runner();
  if (!Y.buy(c.id)) return;
  onCards();
  trialEnd();
  toast('★', c.name + ' ordunda!', 'Yiğitler ekranından lider yapabilirsin.');
}
function trialBack() {
  const id = trial?.id;
  $('trialend').hidden = true;
  toMenu();
  if (id) EK.openYigit(id);
}

// Koşu sonu istatistikleri (Töre Defteri)
function recordRun() {
  if (runRecorded) return;
  runRecorded = true;
  rec('dist', dist()); recMax('max_dist', dist()); recMax('max_combo', maxCombo);
  rec('ride_dist', Math.floor(runRide)); rec('fly_dist', Math.floor(runFly));
  if (mode === 'endless') recMax('endless_dist', dist());
}

// Koşu sonu XP'si: mesafe, düşman, boss
function runXP() { return Math.floor(dist() / XP.perMeters) + kills * XP.kill + runBosses * XP.boss; }
function endRunXP(extra = 0, paidXP = 0) {
  if (!paidXP) recordRun();
  const ups = addXP(runXP() - paidXP + extra);
  recMax('level', akinciLevel());
  levelUps(ups, levelBar);
}

function start(m = mode, lv = level, skipIntro = false) {
  mode = m;
  level = m === 'endless' ? 0 : lv;
  if (m === 'endless') { zone = loop = zoneStart = 0; applyZone(); }
  for (const id of ['book', 'map', 'win', 'over', 'menu', 'loading']) $(id).hidden = true;
  if (nodeRun?.extra) { // ek görev: bölümün temasında tek kısımlık, boss'suz görev
    const B0 = LEVELS[nodeRun.lv], F0 = B0.floors[nodeRun.after];
    LEVELS.g = { theme: F0.theme, flight: B0.flight, foeModel: B0.foeModel, prisoners: B0.prisoners, floors: [{ name: nodeRun.name, sub: 'EK GÖREV', theme: F0.theme, boss: null, goals: [nodeRun.cond] }] };
    level = 'g';
  }
  const L = LEVELS[level];
  floor = 0;
  setTheme(cur().theme);
  if (m === 'level' && !skipIntro && !nodeRun?.extra && !(nodeRun?.floor > 0)) {
    ctx.clear();
    return playCine(levelIntro(level), () => start(m, lv, true));
  }
  // Uluğ Türük'le görev öncesi diyalog (düğüm ilk kez oynanırken)
  if (m === 'level' && nodeRun && !nodeRun.extra && !dlgShown && DLG.DIALOGS[nodeRun.id] && !hStore[nodeRun.id]?.m) {
    dlgShown = true;
    return showDialog(DLG.DIALOGS[nodeRun.id], () => start(m, lv, true));
  }
  dlgShown = false;
  flying = !!L.flight;
  sect = eagleAway = null; sectDone = false; sectAt = 300; hideProps();
  markNext = 500; clearMarks(); bestDist = 0; recMarkDone = false;
  if (mode === 'endless') { try { bestDist = JSON.parse(localStorage.getItem('oguz-sonsuz'))?.bestDist || 0; } catch {} }
  hero.root.visible = true;
  hero.root.rotation.set(0, Math.PI, 0);
  for (const o of objs) release(o);
  for (const a of arrows) scene.remove(a.mesh);
  objs = []; arrows = []; pending = [];
  if (boss) endBoss();
  fin = null;
  horse.root.visible = false;
  horseAway = null;
  clearTerrain(); terrNext = rand(140, 220); camGy = 0;
  Object.assign(P, { lane: 1, x: 0, y: 0, gy: 0, vy: 0, slide: 0, inv: 0, hp: 3, speed: has('kayi') ? 13.5 : 12, lock: 0, lunge: 0, ride: 0, sword: 0, dead: false, flip: 0, spin: 0, roll: false, rear: 0 });
  time = kut = score = combo = kills = hoops = maxCombo = runBosses = runParries = runBroken = runGold = endlessBosses = 0;
  contRun = false; contPaid = null;
  comboT = 0; for (const k in runCounts) runCounts[k] = 0;
  runHits = runArrow = runRide = runFly = 0; runRecorded = false;
  for (const id of picks.list) recSet('boys', id);
  collectBonus();
  goldPlan = []; // önden kaçan altın düşman kaldırıldı (kafa karıştırıyordu)
  runZ = P.z; nextZ = P.z - 35; bossAt = cur().goals ? Infinity : L.bossAt; ambushT = 6; esirs = 0;
  goalsDone = false; goalKey = ''; stageT = 0; goalBase = { kill: 0, kut: 0, esir: 0, hoop: 0 };
  pow.kurt = pow.kilic = pow.miknatis = pow.carpan = secret = 0; deer = trail = rain = null; deerDone = godDone = islikDone = false;
  secretTheme = null; wolf.root.visible = deerActor.root.visible = false;
  shield = (has('karaevli') ? 1 : 0) + (has('alayuntli') ? 1 : 0); reviveUsed = smashUsed = false;
  rideTime = 12;
  continues = 0; noRevive = false; maxHp = 3; bereketT = 0;
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
  $('armym').textContent = '×' + Y.armyMult(isUnlocked('ordu')).toFixed(1); // Ordu gücü (SMU Team Power)
  $('zorm').textContent = zorluk() > 1.05 ? 'ZORLUK ×' + zorluk().toFixed(1) : ''; // güçlü ordu: oyun da zorlaşır
  useBoosts();
  if (nodeRun?.floor > 0) { floor = nodeRun.floor - 1; nextFloor(); } // haritadan sonraki bir kısım: o kısmın girişiyle başlar
  rec('runs');
}

// Çarşı'dan rafa konan takviyeler koşu başında harcanır
function useBoosts() {
  if (!isUnlocked('carsi')) return;
  const used = shop.consume();
  rec('boost', used.length);
  for (const id of used) {
    if (id === 'kimiz') { maxHp = 4; P.hp = 4; hearts(); }
    if (id === 'bereket') bereketT = 180;
    if (id === 'nazar') shield++;
    if (id === 'kilic') { pow.kilic = 10; setWeapon('sword'); }
  }
  if (used.length) banner(used.map(id => BOOSTS.find(b => b.id === id).icon).join(' ') + ' TAKVİYE!');
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
    const mdl = cfg.model || LEVELS[level].foeModel || 'kormos';
    actor = pool(mdl).find(f => !f.busy);
    if (!actor) return null;
    if (cfg.parts.includes('Shield2') && !foeBody(actor, extra.variant, mdl)) dualShield(actor, mdl);
    actor.busy = true;
    actor.root.visible = true;
    actor.root.rotation.set(0, 0, 0);
    actor.root.scale.setScalar(cfg.scale || 1);
    foeBody(actor, extra.variant || 'baltaci', mdl);
    setParts(actor, cfg.parts);
    const idle = cfg.idle === 'Sword_Idle' ? pick(FOE_IDLE) : cfg.idle;
    actor.play(extra.phase === 'wait' && extra.variant === 'pusucu' ? 'MX_GS_Crouch' : idle, { fade: 0 }); // pusucu çömelip bekler
    mesh = actor.root;
    extra = { variant: 'baltaci', hp: cfg.hp, cfg, ready: true, idle, atk: cfg.attack === 'Sword_Attack' ? pick(FOE_ATK) : cfg.attack, ...extra };
    if (cfg.rise && extra.phase == null) Object.assign(extra, { y: -1.9, phase: 'lurk', ready: false }); // suyun altında bekler
    else if (cfg.fly && extra.phase == null) { wingUp(actor); Object.assign(extra, { y: 3.3, phase: 'fly', ready: false }); } // kanatlı kul havada
    else if (theme === 'nehir' && !extra.bank) { extra.raft = W.makeSal(1.7, 2.2); scene.add(extra.raft); }
  } else if (def.beam) { // kam ışını: totem yolun sağında ya da solunda
    extra = { side: Math.random() < 0.5 ? -1 : 1, ...extra };
    mesh = W.makeIsin(isinColor(), def.thick, extra.side);
    scene.add(mesh);
  } else {
    mesh = def.make();
    if (HAZARD[kind]) W.hazardGlow(mesh, ...HAZARD[kind]);
    if (def.brk) W.crackify(mesh); // kılıçla kırılabilir: çatlaklı doku
    if (extra.parry) { // geri çalınabilir boss mermisi: hafif altın parıltı
      mesh.add(W.glowSprite(0xffd23f, 2.8, kind === 'feather' ? 0 : 1.2));
      tip('parry', 'Altın parlayan mermiye kılıçla doğru anda vur, geri çal!', '⚔', slowmo);
    }
    scene.add(mesh);
  }
  const o = { kind, def, mesh, actor, lane, x: def.beam ? 0 : LANES[lane], y: 0, z, vz: 0, t: kind === 'pillar' ? 0 : rand(0, 9), gy: groundAt(z), ...extra }; // sütun zamanlaması sıfırdan
  if (o.row != null) { o.fy = HEIGHTS[o.row]; o.y = o.fy + (kind === 'kut' ? 0.8 : 1.6); }
  objs.push(o);
  return o;
}

function release(o) {
  if (o.alert) scene.remove(o.alert);
  if (o.icon) scene.remove(o.icon);
  if (o.raft) scene.remove(o.raft);
  if (o.gold) gild(o.actor, false);
  if (o.actor) { o.actor.busy = false; o.actor.root.visible = false; if (o.def.deer) deer = null; return; }
  scene.remove(o.mesh);
  if (o.kind === 'boulder' || o.kind === 'ice') o.mesh.userData.spin.geometry.dispose(); // her kaya kendi geometrisini üretir
}

// ================= İNİŞ-ÇIKIŞ (SMU'daki çatılar ve uçurumlar) =================
// Yol bazen rampayla sur üstüne çıkar, ikinci kata tırmanır, uçurumlarla bölünür, sonra aşağı iner.
// Parça: { kind: 'ramp' | 'plat' | 'pit', z0 (yakın uç), z1 (uzak uç), h0, h1 }. Uçurumun zemini yoktur: düşülürse can gider.
// P.gy: ayağın altındaki zemin yüksekliği; P.y bunun üstündeki sıçrama yüksekliği.
const TSTYLE = { surlar: 'sur', aksam: 'sur', burc: 'sur', karakol: 'sur', cin: 'sur', bataklik: 'tahta', olu: 'tahta', altay: 'kar', karanlik: 'kar', orman: 'kaya', yeralti: 'bazalt', tamu: 'bazalt', demirhane: 'bazalt', abyss: 'bazalt' };
const H1 = 2.2, H2 = 4.4;
let terr = [], terrNext = 150, noSpawn = [], overPit = false, camGy = 0, diveNext = null;
function terrAt(z) { for (const t of terr) if (z <= t.z0 && z > t.z1) return t; return null; }
function groundAt(z) {
  const t = terrAt(z);
  if (!t) return 0;
  return t.kind === 'pit' ? t.h0 : t.h0 + (t.h1 - t.h0) * (t.z0 - z) / (t.z0 - t.z1);
}
function clearTerrain() {
  for (const t of terr) if (t.mesh) scene.remove(t.mesh);
  terr = []; noSpawn = [];
  P.y += P.gy || 0; P.gy = 0; overPit = false;
}
function terrPlan() {
  const pit = h => ['pit', rand(3.2, 3.8), h, h];
  const r = Math.random();
  if (r < 0.25) return Math.random() < 0.5 ? [pit(0)] : [pit(0), ['flat', rand(18, 26), 0, 0], pit(0)]; // yerde uçurum
  if (r < 0.55) return [['ramp', 11, 0, H1], ['plat', rand(26, 40), H1, H1], ...(Math.random() < 0.65 ? [pit(H1), ['plat', rand(18, 28), H1, H1]] : [])]; // sur üstü, sonunda aşağı atlanır
  if (r < 0.8) return [['ramp', 11, 0, H1], ['plat', 16, H1, H1], ['ramp', 11, H1, H2], ['plat', rand(18, 26), H2, H2], pit(H2), ['plat', 16, H2, H2], ['plat', 18, H1, H1]]; // iki kat
  return [['ramp', 11, 0, H1], ['plat', rand(20, 30), H1, H1], pit(H1), ['plat', 18, H1, H1], ['ramp', 11, H1, 0]]; // çıkış ve rampayla iniş
}
function terrOk(z) {
  const d = runZ - z;
  return TSTYLE[theme] && !flying && !sect && !boss && !secret && !fin && mode !== 'tutorial'
    && !(level === 1 && floor === 0 && mode === 'level' && d < 400) // ilk kısmın başında öğretici
    && !(cur().goals && goalsDone) && (bossAt === Infinity || d < bossAt - 260)
    && !(mode === 'level' && cur().sect && !sectDone && d > cur().sect[1] - 200 && d < cur().sect[1] + 60)
    && !(mode === 'endless' && d > sectAt - 200 && d < sectAt + 60);
}
function buildTerrain(z) {
  const style = TSTYLE[theme];
  let zc = z, prevH = 0;
  for (const [kind, len, h0, h1] of terrPlan()) {
    const t = { kind, z0: zc, z1: zc - len, h0, h1 };
    if (kind === 'ramp' || kind === 'plat') { t.mesh = W.makeTerrain(style, len, h0, h1); t.mesh.position.z = zc; scene.add(t.mesh); }
    if (kind === 'pit') {
      t.mesh = W.makePit(style, len, h0); t.mesh.position.z = zc; scene.add(t.mesh);
      const kl = Math.floor(Math.random() * 3);
      noSpawn.push([zc + 9, t.z1 - 3]);
      for (let i = 0; i < 5; i++) { // uçurumun üstünde kut yayı: zıplayınca toplanır
        const u = (i + 0.5) / 5, zz = zc + 3 - (len + 6) * u;
        add('kut', kl, zz, { y: Math.sin(u * Math.PI) * 1.6, fy: Math.sin(u * Math.PI) * 1.6 + 0.2 });
      }
    }
    if (kind === 'ramp') noSpawn.push([zc + 3, t.z1 - 3]);
    if (h0 < prevH) noSpawn.push([zc + 3, zc - 9]); // aşağı atlanan kenarın dibi
    if (kind !== 'flat') terr.push(t);
    prevH = kind === 'pit' ? prevH : h1;
    zc = t.z1;
  }
  if (prevH > 0) noSpawn.push([zc + 3, zc - 10]);
  terr.sort((a, b) => b.z0 - a.z0);
  return zc;
}
const blocked = z => noSpawn.some(([a, b]) => z <= a && z >= b);
// Oyuncunun zemini: rampada yürür, kenardan düşer, uçurumda zemin yok
function groundStep() {
  const t = terrAt(P.z), abs = P.gy + P.y, h = groundAt(P.z);
  overPit = t?.kind === 'pit';
  if (overPit) {
    P.y = abs - h; P.gy = h;
    if (diveNext && (P.y < -1.6 || P.z < t.z0 - 6)) { const f = diveNext; diveNext = null; clearTerrain(); f(); return; } // kat geçişi: çukurdan kuyuya (zıplasan da düşersin)
    if (!diveNext && P.y < -2.6) fallPit(t);
    return;
  }
  if (P.y <= 0 && Math.abs(h - P.gy) < 1.2) { P.gy = h; return; } // yürüyerek (rampa)
  P.y = abs - h; P.gy = h;
  if (P.y < 0 && P.y > -0.9) P.y = 0; // kenara tutundu
  else if (P.y <= -0.9) fallPit(null);
}
function fallPit(t) {
  const z1 = t ? t.z1 - 1 : P.z - 1;
  if (P.ride) dismount(); else hurt();
  rec('fall');
  P.z = z1;
  P.gy = groundAt(P.z); P.y = 0; P.vy = 0;
  P.inv = Math.max(P.inv, 1.5);
  overPit = false;
  dust.emit(P.x, P.gy + 0.2, P.z, 30, 0xc9a77a, 5, 3);
  pop('UÇURUM!', { x: P.x, y: P.gy + 1, z: P.z });
}
function pruneTerrain() {
  while (terr.length && terr[0].z1 > P.z + 25) { const t = terr.shift(); if (t.mesh) scene.remove(t.mesh); }
  noSpawn = noSpawn.filter(([, b]) => b < P.z + 20);
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
  if (blocked(z)) { // rampa, uçurum kenarı: engel yok, kut dizisi
    if (!terrAt(z) || terrAt(z).kind !== 'pit') { const l = Math.floor(Math.random() * 3); for (let i = 0; i < 4; i++) add('kut', l, z + 3 - i * 2); }
    return;
  }
  if (d > 180 && !sect && !trail && Math.random() < 0.075) { // kam ışını: bütün şeritleri kapatır
    add(Math.random() < 0.4 ? 'kalinisin' : 'isin', 1, z);
    return;
  }
  const free = Math.floor(Math.random() * 3);
  for (let l = 0; l < 3; l++) {
    if (trail && l === trail.lane && z < trail.z0 && z > trail.z1) continue; // kan izi şeridi kılıca kadar boş
    if (l === free) {
      if (relicPlan.length && d >= relicPlan[0][2]) { const [k, i] = relicPlan.shift(); add(k, l, z, { fy: 1.6, ri: i }); } // zıplayarak alınır
      else if (d > 100 && Math.random() < (P.hp < maxHp ? 0.025 : 0.004) * (has('bayindir') ? 2 : 1) * upgVal('kimiz') / 100) add('kimiz', l, z);
      else if (d > 160 && !pow.miknatis && Math.random() < 0.012) add('miknatis', l, z);
      else if (d > 260 && !pow.carpan && Math.random() < 0.01) add('carpan', l, z);
      else if (d > 300 && !islikDone && Math.random() < 0.012) { islikDone = true; add('islik', l, z); }
      else if (LEVELS[level].prisoners && d > 60 && Math.random() < 0.22) add('esir', l, z);
      else if (d > 80 && !sect && Math.random() < 0.07) add('tamga', l, z); // İSABET halkası
      else if (Math.random() < 0.65) for (let i = 0; i < 6; i++) add('kut', l, z + 3 - i * 2);
    } else if (Math.random() < Math.min(0.85, 0.62 * zorluk())) {
      const base = THEMES[theme].foes ?? THEMES[sect?.prev]?.foes;
      const foes = (base?.length && !sect ? [...base, ...EXTRA_FOES] : base)?.filter(f => d >= f[1]);
      if (d < 150 || !foes?.length || Math.random() < 0.5 / zorluk()) add(pick(THEMES[theme].obst), l, z);
      else add('kormos', l, z, { variant: pick(foes)[0] });
    }
  }
  if (theme === 'nehir' && Math.random() < 0.3) { // kıyıdan ok atan okçu: yayla vurulur
    const s = Math.random() < 0.5 ? -1 : 1;
    add('kormos', s < 0 ? 0 : 2, z - 4, { variant: level === 7 ? 'itokcu' : 'okcu', x: s * 6.6, y: 0.1, bank: true, ready: false });
  }
  if (sect) return;
  if (goldPlan.length && d >= goldPlan[0]) { goldPlan.shift(); spawnGold(z); }
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
  if (mode === 'endless') { // Sonsuz Akın: bölgenin bölümündeki eksik destan eşyaları bölgeye dağılır
    const r = (relicSave[relicLv()] ??= { yay: false, ok: [false, false, false] });
    [['gumus', 0], ['gumus', 1], ['yay', 0], ['gumus', 2]].forEach(([k, i], j) => {
      if (k === 'yay' ? r.yay : r.ok[i]) return;
      relicPlan.push([k, i, zoneStart + 300 + j * 280]);
    });
    return;
  }
  if (mode !== 'level' || nodeRun?.extra) return;
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
// Çift kalkanlı: ikinci kalkan sağ ön kola. Duruşu, modelin dinlenme pozunda sol kalkanın aynası alınarak bulunur.
const mirrorCache = {};
function dualShield(a, mdl) {
  if (a.parts.Shield2 || !a.parts.Shield) return;
  const L = (mirrorCache[mdl] ??= (() => {
    const T = A.templates[mdl];
    T.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(T.matrixWorld).invert();
    const ws = inv.clone().multiply(T.getObjectByName('Shield').matrixWorld);
    const wr = inv.clone().multiply(T.getObjectByName('lowerarm_r').matrixWorld);
    const S = new THREE.Matrix4().makeScale(-1, 1, 1);
    return wr.invert().multiply(S.clone().multiply(ws).multiply(S)); // sağ kola göre ayna duruş
  })());
  const s2 = a.parts.Shield.clone();
  s2.name = 'Shield2';
  s2.material = PLAIN.get(a.parts.Shield) ?? a.parts.Shield.material;
  L.decompose(s2.position, s2.quaternion, s2.scale);
  a.bone('lowerarm_r')?.add(s2);
  a.parts.Shield2 = s2;
}
// Kanatlı kul: Kara Kuş'un kanatları sırtına takılır
function wingUp(a) {
  if (!a.wings) {
    const g = new THREE.Group();
    for (const n of ['Wing_L', 'Wing_R']) g.add(A.templates.karakus.getObjectByName(n).clone());
    g.position.set(0, 1.3, -0.2);
    g.scale.setScalar(0.8);
    a.root.add(g);
    a.wings = g;
  }
  a.wings.visible = true;
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
  rec('esir');
  score += 150 * mult() * (has('uregir') ? 2 : 1);
  if (has('uregir')) kut += 5;
  $('esirc').textContent = '⛓ ' + esirs;
  dust.emit(o.x, 1.5, o.z, 25, 0x7a4a24, 5, 4);
  burst(o.x, 1.6, o.z, 1.4);
  pop(pick(['ÖZGÜR!', 'KURTULDU!']), o.mesh.position);
}

function killBird(o) {
  o.dead = true;
  kills++;
  addCombo('vurus', 80);
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
  sfx('hurt');
  AY.vibrate(70);
  runHits++;
  if (nodeRun?.cond?.[0] === 'nohit' && !contRun) return missionFail('DARBE ALDIN!');
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
  if (o.cfg.wall && !pow.kilic && (how === 'sword' || how === 'arrow')) { // kalkan duvarı: yalnız kayarak
    sparks.emit(at.x, at.y + 1.3, at.z + 0.4, 25, 0xfff2a0, 5, 3);
    sfx('parry', { gain: 0.5 });
    pop('KAY ALTINDAN!', at);
    return false;
  }
  if (o.cfg.parts.includes('Shield') && !o.shieldBroken && !has('bukduz') && !pow.kilic && (how === 'sword' || how === 'arrow')) {
    sparks.emit(at.x, 1.4, at.z + 0.4, 25, 0xfff2a0, 5, 3);
    if (how === 'arrow') { pop('KALKAN!', at); return false; }
    o.shieldBroken = true;
    sfx('shieldbreak');
    addCombo('kalkan', 60);
    o.actor.parts.Shield.visible = false;
    o.actor.play('Idle_Shield_Break', { loop: false, speed: 1.5, then: () => o.actor.play('Sword_Idle') });
    o.hp = 1;
    pop('KIRILDI!', at);
    stopT = 0.05;
    return false;
  }
  if ((o.cfg.hp > 1 || o.gold) && how === 'arrow' && (o.hp -= 1) > 0) { pop('DAYANDI!', at); sparks.emit(at.x, 1.4, at.z, 15, 0xffd23f, 4, 2); return false; }
  o.dying = true; o.vz = 0; o.t = 0;
  if (o.alert) { scene.remove(o.alert); o.alert = null; }
  if (o.icon) { scene.remove(o.icon); o.icon = null; }
  timed(o.actor, how === 'horse' || how === 'slide' ? 'Hit_Knockback' : pick(DEATHS), 1.1);
  burst(at.x, at.y + 1.3, at.z, 1.6);
  sparks.emit(at.x, at.y + 1.3, at.z, 30, how === 'arrow' ? 0xffd23f : 0xff7a3a, 6, 3);
  if (!how) return true;
  sfx(how === 'arrow' ? 'arrowhit' : 'hit');
  sfx('death', { gain: 0.7 });
  kills++;
  rec('kill');
  if (how === 'arrow') { rec('kill_arrow'); runArrow++; }
  addCombo('vurus', how === 'horse' ? 50 : 100);
  const COMIC_WORDS = ['GÜM!', 'BAM!', 'SAVRUL!', 'BİÇ!', 'ŞAAK!'];
  pop(how === 'slide' ? 'KAYARAK VURUŞ!' : pick(COMIC_WORDS), at);
  shake = Math.max(shake, how === 'slide' ? 0.22 : 0.18);
  if (how === 'sword') stopT = 0.06;
  else if (how === 'slide') stopT = 0.05;
  if (bonus.foeKut) kut += bonus.foeKut;
  if (has('doger')) kut += 2; // Döğer: avcı
  if (o.gold) goldKilled(o);
  if (how === 'slide') { rec('slidekill'); return true; }
  if (kills % (has('avsar') ? 4 : 6) === 0 && how !== 'horse') { // bitiriş anı: ağır çekim + yakınlaşma
    slowmo(0.25, 0.45);
    fovKick = -12;
    pop('BİTİRİŞ!', at);
    rec('finisher');
  } else pop(pick(['ŞAK!', 'HAP!', 'ÇAT!']), at);
  return true;
}

function updateObj(o, dt) {
  o.t += dt;
  o.z += o.vz * dt;
  const ahead = P.z - o.z;
  if (o.actor && !o.dying && o.def.foe) updateFoe(o, dt, ahead);
  if (o.dying && o.t > 1.4) o.dead = true;
  if (o.dying && o.fall) { o.y = Math.max(0, o.y - dt * 9); o.actor.root.rotation.x = Math.min(1.4, o.actor.root.rotation.x + dt * 5); }
  if (terr.length) { // iniş-çıkış: nesne bulunduğu zeminin üstünde durur; uçurumun üstüne gelen düşman düşer
    const t = terrAt(o.z);
    if (t?.kind !== 'pit') o.gy = groundAt(o.z);
    else if (o.def.foe && !o.cfg.fly && !o.dying && !o.gold) { o.dying = true; o.fall = false; o.t = 0; o.vz = 0; o.pitFall = true; }
    if (o.pitFall) o.y -= dt * 12;
  }
  if (o.freed) { // kurtulan esir yana doğru koşup gider
    o.x += o.side * 5 * dt;
    o.z -= 3 * dt;
    if ((o.ft += dt) > 1.8) o.dead = true;
  }
  if (o.kind === 'kut' && !o.mag && ahead < 7 && ahead > 0 && (has('salur') || (has('kizik') && Math.abs(o.x - P.x) < 2.8) || (upg('miknatis') && Math.abs(o.x - P.x) < 1.1 + upg('miknatis') * 0.35) || (pow.miknatis > 0 && ahead < 16))) o.mag = true; // Çarşı: kut mıknatısı
  if (o.def.foe && !o.phase && !o.dying && !o.bank) o.x += (LANES[o.lane] - o.x) * Math.min(1, dt * 8); // şerit değiştiren düşman
  if (o.raft) o.raft.position.set(o.x, Math.sin(o.t * 2) * 0.05, o.z);
  if (o.def.deer) updateDeer(o, dt, ahead);
  if (o.mag) {
    o.x += (P.x - o.x) * Math.min(1, dt * 12);
    o.z += (P.z - o.z) * Math.min(1, dt * 12);
  }
  o.mesh.position.set(o.x, o.y + (o.gy || 0), o.z);
  o.mesh.userData.anim?.(o.t);
  if (o.def.beam) return updateBeam(o, ahead);
  if (o.mesh.userData.spin) o.mesh.userData.spin.rotation.x -= dt * 5;
  if (o.kind === 'pillar' && o.t > 1.8) o.dead = true;
  o.actor?.update(dt);
  if (o.alert) o.alert.position.set(o.x, o.y + (o.gy || 0) + 2.6, o.z);
  if (o.icon) o.icon.position.set(o.x, o.y + (o.gy || 0) + 2.9, o.z);

  const reach = P.ride ? 1.5 : 0.9;
  if (o.kind === 'pillar') { // alev sadece yandığı anda yakar
    if (o.t > 0.8 && o.t < 1.6 && Math.abs(P.z - o.z) < 1.2 && Math.abs(o.x - P.x) < 1.2) hurt();
  } else if (!o.done && !o.dying && (o.ready ?? true) && Math.abs(P.z - o.z) < reach && Math.abs(o.x - P.x) < 1.1 && (o.fy == null || Math.abs(o.fy - P.y) < 1.3)) {
    o.done = true;
    if (pickup(o)) {}
    else if (o.kind === 'esir') freeEsir(o);
    else if (o.def.foe && o.cfg.icon === 'kay' && P.slide > 0) killFoe(o, 'slide'); // SMU: altından kayınca yere serilir
    else if (!o.def.hit) {}
    else if (P.ride || pow.kilic > 0) { o.hitP = true; trample(o); } // atlıyken ve Tanrı Kılıcı elindeyken önündeki her şey yıkılır
    else if (!dodged(o.def.hit)) {
      o.hitP = true;
      if (has('cavuldur') && !smashUsed && !o.def.foe) { smashUsed = true; trample(o); pop('GÜÇLÜ OMUZ!', o.mesh.position); } // Çavuldur
      else hurt(o);
    }
  }
  if (o.pa > 0 && ahead <= 0) nearMiss(o);
  o.pa = ahead;
  if (o.parried) { // geri çalınan mermi boss'a döner
    if (boss && !fin && o.z <= boss.gz + 1.5) {
      o.dead = true;
      burst(o.x, o.y + 1.4, o.z, 2.4);
      sparks.emit(o.x, o.y + 1.4, o.z, 40, 0xffd23f, 7, 3);
      hitBoss();
    } else if (P.z - o.z > 90) o.dead = true;
    return;
  }
  if (ahead < -8) o.dead = true;
}

// ---- kombo türleri (SMU'daki dört tür): VURUŞ, KIL PAYI, İSABET, KALKAN ----
const COMBO_KIND = { vurus: 'VURUŞ', kilpayi: 'KIL PAYI', isabet: 'İSABET', kalkan: 'KALKAN' };
const runCounts = { vurus: 0, kilpayi: 0, isabet: 0, kalkan: 0 }; // bu koşuda türlere göre sayı (görevler için)
let comboT = 0, comboLabelT = 0;
const comboTime = () => 5 + bonus.comboTime; // 5 sn yeni hareket gelmezse kombo söner
// Kam ışını: yaklaşınca totem yüklenir (titrer), sonra ışın yanar. İnce: kay ya da zıpla. Kalın: zıpla.
function updateBeam(o, ahead) {
  const k = ahead > 46 ? 0 : ahead > 30 ? 0.5 : 1;
  o.mesh.userData.set(k, o.t);
  if (k === 1 && !o.lit) {
    o.lit = true;
    sfx('whistle', { gain: 0.35 });
    tip('isin', { text: o.def.thick ? 'KALIN ışın: altından geçilmez, ZIPLA!' : 'Kam ışını: altından KAY ya da üstünden ZIPLA.', icon: '⚡', gesture: o.def.thick ? 'up' : 'down', key: o.def.thick ? '↑' : '↓ ↑' }, '', slowmo);
  }
  if (!o.done && Math.abs(P.z - o.z) < 0.55 && !flying) {
    o.done = true;
    const ok = o.def.thick ? P.y > 0.75 : P.y > 0.5 || P.slide > 0;
    if (!ok) { o.hitP = true; hurt(); sparks.emit(P.x, P.gy + 1, P.z, 30, 0xffffff, 6, 3); }
    else if (time - Math.max(P.jumpAt ?? -9, P.slideAt ?? -9) <= 0.3) { addCombo('kilpayi', 50, 1 + bonus.nearMiss); pop('KIL PAYI!', { x: P.x, y: P.gy + 1.5, z: P.z }); sfx('near'); }
    else addCombo('kilpayi', 20);
  }
  if (ahead < -8) o.dead = true;
}
const ISIN = { sur: 0xb06aff, tahta: 0x6aff8a, kar: 0x7ad0ff, kaya: 0xffc040, bazalt: 0xff5a10 };
const isinColor = () => (LEVELS[level].foeModel === 'cinli' || theme === 'cin' || theme === 'karakol' ? 0xff3a3a : ISIN[TSTYLE[theme]] ?? 0xb06aff);

function addCombo(kind, pts, n = 1) {
  const prevTier = comboTier();
  combo += n;
  const newTier = comboTier();
  comboT = comboTime();
  maxCombo = Math.max(maxCombo, combo);
  runCounts[kind] += 1;
  if (kind !== 'vurus') rec(kind);
  const gain = Math.round(pts * mult() * (kind === 'vurus' ? 1 : 1 + bonus.comboPts));
  score += gain;
  comboUi(true);
  $('combolabel').textContent = `${COMBO_KIND[kind]}  +${gain.toLocaleString('tr-TR')}`;
  $('combolabel').className = 'show k-' + kind;
  comboLabelT = 1.4;
  if (newTier > prevTier && combo >= 11) {
    const TIER_NAMES = { 2: '2x AKINCI!', 3: '3x FIRTINA!', 4: '4x HİDDET!', 5: '5x DESTANSI!' };
    pop(TIER_NAMES[newTier] || `${newTier}x KOMBO!`, { x: P.x, y: P.gy + 2.2, z: P.z });
    shake = Math.max(shake, 0.25);
    sfx('gold');
    sparks.emit(P.x, P.gy + 1.8, P.z, 35, 0xffd23f, 6, 3);
  }
}
// Kıl payı: yan şeritteki engelin 0.6 m'den yakınından geçmek ya da alçak/yüksek engeli son 0.25 sn'de atlatmak
function nearMiss(o) {
  if (!o.def.hit || o.def.foe || o.hitP || o.parried || o.kind === 'pillar' || P.ride || P.dead || flying) return;
  const dx = Math.abs(o.x - P.x);
  let ok = dx >= 1.1 && dx < 1.7; // çarpışma sınırı 1.1 m: 0.6 m'lik şerit
  if (!ok && dx < 1.1 && (o.def.hit === 'low' || o.def.hit === 'high')) ok = time - (o.def.hit === 'low' ? P.jumpAt : P.slideAt) <= 0.25;
  if (!ok) return;
  addCombo('kilpayi', 50, 1 + bonus.nearMiss);
  pop('KIL PAYI!', o.mesh.position);
  shake = Math.max(shake, 0.14);
  sparks.emit(P.x, P.gy + 1.2, P.z, 20, 0x7ad0ff, 4, 2);
  sfx('near');
  tip('kilpayi', 'Kıl payı! Engelin dibinden geçmek ya da son anda atlamak kombo verir.', '✦', slowmo);
}

// Toplanan eşyalar: true dönerse çarpışma işlendi
function pickup(o) {
  const at = o.mesh.position;
  switch (o.kind) {
    case 'kut': {
      const n = (pow.kurt > 0 && P.lane === guideLane ? 2 : 1) * (time < bereketT ? 2 : 1) * (pow.carpan > 0 ? 2 : 1); // kurdun yolundan gidene iki kat; Bereket Muskası; Çifte Kut
      kut += n; score += 10 * n * mult(); o.dead = true; sfx('kut', { gap: 0.02 }); return true;
    }
    case 'tamga':
      addCombo('isabet', 75);
      pop('İSABET!', at);
      sfx('combo');
      sparks.emit(o.x, 1.6, o.z, 30, 0xffd23f, 5, 2);
      o.mesh.visible = false;
      return true;
    case 'hoop': hoops++; rec('hoop'); score += 50 * mult() * (has('begdili') ? 2 : 1); sparks.emit(o.x, o.y, o.z, 20, 0xffd23f, 5, 2); o.mesh.visible = false; if (sect?.kind === 'kement') addCombo('isabet', 75); return true;
    case 'kimiz':
      sfx('heal');
      rec('kimiz');
      o.dead = true;
      P.hp = Math.min(maxHp, P.hp + (has('yiva') ? 2 : 1));
      hearts();
      banner('ŞİFA! +♥');
      sparks.emit(o.x, 1.5, o.z, 40, 0xff4a6a, 5, 3);
      return true;
    case 'nal': o.dead = true; mount(); return true;
    case 'miknatis': o.dead = true; rec('powerup'); pow.miknatis = SMU_DUR[upg('miknatis') + 1]; banner('KUT MIKNATISI!'); sfx('gold'); sparks.emit(at.x, 1.2, at.z, 40, 0xd7263d, 5, 3); return true;
    case 'carpan': o.dead = true; rec('powerup'); pow.carpan = SMU_DUR[upg('carpan')]; banner('ÇİFTE KUT!'); sfx('gold'); sparks.emit(at.x, 1.2, at.z, 40, 0xffcf3f, 5, 3); slowmo(0.5, 0.3); return true;
    case 'kan': return true;
    case 'kurt': // Gök yeleli kurt: önden koşup güvenli yolu gösterir, pusucuları yakalar
      o.dead = true;
      callWolf();
      sparks.emit(o.x, 1.2, o.z, 40, 0x6ab8ff, 5, 3);
      return true;
    case 'islik': o.dead = true; volley(); return true;
    case 'gumus': case 'yay': {
      sfx('gold');
      o.dead = true;
      const r = relicSave[relicLv()];
      rec(o.kind); rec('relic');
      if (r) { if (o.kind === 'yay') r.yay = true; else r.ok[o.ri] = true; saveRelics(); }
      const n = r ? r.ok.filter(Boolean).length : 0;
      banner(o.kind === 'yay' ? 'ALTIN YAY!' : `GÜMÜŞ OK ${n}/3`);
      score += 500;
      sparks.emit(at.x, 2, at.z, 50, o.kind === 'yay' ? 0xffc83a : 0xcfe8ff, 6, 3);
      return true;
    }
    case 'kilic': // Tanrı Kılıcı
      rec('godsword');
      sfx('gold'); sfx('shieldbreak', { gain: 0.6 });
      o.dead = true;
      trail = null;
      pow.kilic = upgVal('kilic');
      timedOver(hero, 'MX_GS_PowerUp', 0.9);
      setWeapon('sword');
      banner('TANRI KILICI!');
      slowmo(0.3, 0.6);
      sparks.emit(at.x, 1.4, at.z, 70, 0xff3a2a, 8, 4);
      return true;
  }
  return false;
}

function callWolf() {
  rec('wolf');
  pow.kurt = upgVal('kurt'); // Çarşı yükseltmesi: kurt süresi
  wolf.root.visible = true;
  wolf.root.position.set(P.x, 0, P.z - 3);
  wolf.play('Gallop', { speed: 1.4, fade: 0 });
  banner('GÖK YELELİ KURT!');
  sfx('howl');
}

// Mete'nin ıslıklı oku: ok nereye giderse bütün ordu oraya atar — önündeki her şeye ok yağmuru
function volley() {
  sfx('whistle');
  rec('volley');
  banner('ISLIKLI OK! ORDU, ATEŞ!');
  slowmo(0.5, 0.5);
  rain = { t: 0, n: 0, drops: [] };
}
function updateRain(dt) {
  rain.t += dt;
  const drops = upgVal('yagmur'), wide = 70 + (drops - 40) * 2; // Çarşı: ok yağmuru daha yoğun ve uzun
  while (rain.n < drops && rain.n < rain.t * 34 * drops / 40) {
    rain.n++;
    const m = W.makeArrow();
    m.rotation.x = Math.PI / 2;
    const d = { m, x: LANES[rain.n % 3] + rand(-0.6, 0.6), y: rand(14, 20), z: P.z - rand(8, wide) };
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
  if (rain.n >= drops && !rain.drops.length) rain = null;
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
  rec('deer');
  banner('AK GEYİK! GİZLİ YOL!');
  flash();
  secret = 10;
  secretTheme = theme;
  for (const o of objs) if (!o.actor || o.def.foe) o.dead = true;
  setTheme('koru');
}
function flash(color = '#fff') { // beyaz parlama: tema değişimini örter
  const f = $('flash');
  f.style.background = color;
  f.style.transition = 'none';
  f.style.opacity = 1;
  void f.offsetWidth;
  f.style.transition = 'opacity .7s';
  f.style.opacity = 0;
}

function updateFoe(o, dt, ahead) {
  const cfg = o.cfg;
  if (o.gold) { // altın düşman: yaklaşınca sırtını dönüp önden kaçar, zikzak çizer
    if (!o.fleeing && ahead < 26) {
      o.fleeing = true; o.ft = 0;
      o.actor.root.rotation.y = Math.PI;
      o.actor.play(pick(FOE_RUN), { speed: 1.3, fade: 0.1 });
      tip('altin', 'Altın düşman! Kaçmadan yakala: Gök Demir düşürür.', '✨', slowmo);
    }
    if (o.fleeing) {
      o.vz = -P.vz * 0.82;
      if ((o.lt -= dt) <= 0) { o.lt = 0.8 + Math.random() * 0.8; o.lane = clamp(o.lane + pick([-1, 1]), 0, 2); }
      if ((o.ft += dt) > 11) { o.dead = true; dust.emit(o.x, 0.5, o.z, 30, 0xffd23f, 5, 3); pop('KAÇTI!', o.mesh.position); }
    }
    return;
  }
  // SMU simgeleri: ▼ KAY (kalkanlılar) yaklaşınca belirir
  if (cfg.icon === 'kay' && !o.shieldBroken && ahead < 18 && ahead > 0 && !o.icon) {
    o.icon = W.makeActIcon('kay');
    scene.add(o.icon);
    if (cfg.wall) tip('ikikalkan', { text: 'Çift kalkanlı! Kılıç işlemez, üstünden atlanmaz: altından KAY, yere serilir.', icon: '▼', gesture: 'down', key: '↓' }, '', slowmo);
    else tip('kay', { text: 'Mavi ▼ simgesi: düşmanın altından KAY, yere serilir.', icon: '▼', gesture: 'down', key: '↓' }, '', slowmo);
  }
  if (o.icon && (o.shieldBroken || ahead < -1)) { scene.remove(o.icon); o.icon = null; }
  if (cfg.fly) return updateFlyer(o, dt, ahead);
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

// Kanatlı kul: önde süzülür; yaklaşınca ▲ simgesi çıkar. O an zıplanırsa Oğuz sıçrayıp onu havada indirir.
// Zıplanmazsa oyuncunun şeridine mızrak savurur (altından kay) ve uçup gider.
function updateFlyer(o, dt, ahead) {
  const w = o.actor.wings;
  if (w) { const a = Math.sin(o.t * 11) * 0.6; w.children[0].rotation.z = a; w.children[1].rotation.z = -a; }
  if (o.phase === 'fly') {
    o.y = 3.3 + Math.sin(o.t * 3) * 0.2;
    o.vz = ahead > 30 ? 0 : -P.vz * 0.55; // yaklaşınca önden uçmaya başlar
    if (ahead < 12 + P.speed * 0.15) {
      o.phase = 'mark'; o.pt = 0; o.markAt = time;
      o.icon = W.makeActIcon('zipla');
      scene.add(o.icon);
      sfx('whistle', { gain: 0.5 });
      pop(FOE_NAME.kanatli, o.mesh.position);
      tip('kanatli', { text: 'Sarı ▲ simgesi: ŞİMDİ ZIPLA! Oğuz sıçrar, kanatlı kulu havada indirir.', icon: '▲', gesture: 'up', key: '↑' }, '', slowmo);
    }
  } else if (o.phase === 'mark') {
    o.pt += dt;
    o.vz = -P.vz; // oyuncuyla aynı hızda, önünde
    o.y = 3.3 + Math.sin(o.t * 3) * 0.2;
    o.lane = P.lane; // oyuncunun şeridine süzülür
    if (o.icon) o.icon.scale.setScalar(1 + Math.sin(o.pt * 18) * 0.15);
    if ((P.jumpAt ?? -9) > o.markAt - 0.1 && !P.dead) return skyStrike(o);
    if (o.pt > 1.5) { // geç kaldı: mızrak savurur
      o.phase = 'away'; o.pt = 0;
      if (o.icon) { scene.remove(o.icon); o.icon = null; }
      o.actor.play('OverhandThrow', { loop: false, speed: 1.4, fade: 0.08, then: () => o.actor.play('Idle_Loop') });
      if (o.actor.parts.Spear) o.actor.parts.Spear.visible = false;
      add('spear', P.lane, o.z + 1, { vz: 14 });
    }
  } else if (o.phase === 'strike') { // kul Oğuz'un kılıcına doğru dalar, havada buluşurlar
    o.pt += dt;
    o.vz = 0;
    const k = Math.min(1, o.pt / 0.3);
    o.x = lerp(o.sx, P.x, k);
    o.y = lerp(o.sy, (P.gy || 0) + P.y + 0.9 - (o.gy || 0), k); // kılıcın ucu: başının biraz üstü
    o.z = lerp(o.sz, P.z - 1.1, k);
    if (k >= 1) {
      o.fall = true;
      killFoe(o, 'sword');
      const at = o.mesh.position;
      burst(at.x, at.y + 1, at.z, 2.2);
      sparks.emit(at.x, at.y + 1, at.z, 40, 0xffc040, 7, 3);
      pop('HAVADA İNDİRDİ!', at);
      slowmo(0.3, 0.3);
      fovKick = -8;
    }
  } else if (o.phase === 'away') {
    o.pt += dt;
    o.vz = -P.vz * 1.4;
    o.y += dt * 3;
    if (o.pt > 2) o.dead = true;
  }
}
function skyStrike(o) { // zıplayınca Oğuz sıçrar, kul ona doğru dalar; kılıç havada değer
  if (o.icon) { scene.remove(o.icon); o.icon = null; }
  P.vy = Math.max(P.vy, 14);
  P.flip = 0;
  swordMode(true);
  timed(hero, 'MX_GS_Jump', 0.6); // havada kılıcı kaldırıp indirir
  P.lock = 0.55;
  P.sword = 0.8;
  Object.assign(o, { phase: 'strike', pt: 0, sx: o.x, sy: o.y, sz: o.z });
  o.actor.play('Hit_Chest', { loop: false, speed: 1, fade: 0.05 });
  rec('skystrike');
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
  if (tryOrb() || tryParry()) return;
  if (boss && boss.def.tap(B, boss)) return;
  if (sect?.S.fly) return; // eller kartalın pençesinde / düşerken
  if (flying || weapon === 'bow') return throwArrow(); // havada kılıç yok
  const reach = pow.kilic > 0 ? 16 : P.ride ? 3 : 9;
  const inLane = objs.filter(o => o.def.foe && !o.dying && o.ready && Math.abs(o.x - P.x) < 1.3 && P.z - o.z > -0.5 && P.z - o.z < reach).sort((a, b) => b.z - a.z);
  if (!inLane.length) { // önde düşman yoksa yakındaki ahşap engeli kır
    const crate = objs.find(o => o.def.brk && !o.dead && !o.done && Math.abs(o.x - P.x) < 1.3 && P.z - o.z > -0.3 && P.z - o.z < 4.5);
    if (crate && cool <= 0) { slash(null); breakObj(crate); return; }
  }
  slash(inLane[0] || null);
  if (pow.kilic > 0) for (const o of inLane.slice(1)) killFoe(o, 'sword'); // Tanrı Kılıcı: şeritteki herkes
}

// Geri çalma: boss'un altın parlayan mermisi Oğuz'a 0.3 sn kala kılıçla vurulursa boss'a geri seker
function tryParry() {
  if (!boss) return false;
  const o = objs.find(o => o.parry && !o.parried && !o.done && !o.dead && Math.abs(o.x - P.x) < 1.4 && (o.row == null || o.row === P.row)
    && P.z - o.z > -0.3 && (P.z - o.z) / Math.max(1, o.vz + P.vz) <= 0.3);
  if (!o) return false;
  o.parried = o.done = true;
  o.vz = -(P.vz + 34);
  if (flying) timedOver(hero, 'Sword_Regular_B', 0.35); else { cool = 0; slash(null); }
  pop('GERİ ÇALDI!', o.mesh.position);
  slowmo(0.35, 0.45);
  sparks.emit(o.x, o.y + 1.3, o.z, 50, 0xffd23f, 7, 3);
  sfx('parry');
  AY.vibrate(40);
  runParries++;
  rec('parry');
  return true;
}

// Ahşap engel kılıçla parçalanır, 3-5 kut saçar
const chips = [];
function breakObj(o) {
  o.dead = true;
  const at = o.mesh.position;
  const c = W.makeChips(10);
  c.position.set(at.x, 0.8, at.z);
  scene.add(c);
  chips.push({ c, t: 0 });
  dust.emit(at.x, 0.8, at.z, 25, 0x7a4a24, 5, 4);
  burst(at.x, 1, at.z, 1.8);
  pop('ÇAT!', at);
  sfx('crack');
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) add('kut', o.lane, o.z - 1.2 - i * 1.3);
  score += 20 * mult();
  runBroken++;
  rec('broken');
  tip('kirik', 'Çatlak ahşap engelleri kılıçla kır, içinden kut saçılır!', '📦', slowmo);
}
function updateChips(dt) {
  for (const k of chips) {
    k.t += dt;
    for (const m of k.c.children) {
      m.userData.v.y -= 20 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      if (m.position.y < -0.7) { m.position.y = -0.7; m.userData.v.set(0, 0, 0); }
      m.rotation.x += m.userData.r.x * dt; m.rotation.y += m.userData.r.y * dt;
    }
    if (k.t > 1.4) { scene.remove(k.c); k.dead = true; }
  }
  for (let i = chips.length - 1; i >= 0; i--) if (chips[i].dead) chips.splice(i, 1);
}

// ALTIN DÜŞMAN: bölgenin düşmanı altın zırhla; yaklaşınca önden kaçar, öldürülünce Gök Demir düşürür
const GOLD_MAT = new Map();
const PLAIN = new WeakMap(); // mesh -> asıl malzemesi (userData'da tutulmaz: clone() onu JSON'la kopyalar)
function gild(actor, on) {
  actor.root.traverse(m => {
    if (!m.isMesh || m.material?.isMeshBasicMaterial) return;
    if (on) {
      if (!PLAIN.has(m)) PLAIN.set(m, m.material);
      const plain = PLAIN.get(m);
      if (!GOLD_MAT.has(plain)) {
        const g = plain.clone(); // malzeme aynı modeldeki bütün düşmanlarda ortak: kopyala
        g.color = new THREE.Color(0xffc83a);
        g.emissive = new THREE.Color(0x6a4200);
        GOLD_MAT.set(plain, g);
      }
      m.material = GOLD_MAT.get(plain);
    } else if (PLAIN.has(m)) m.material = PLAIN.get(m);
  });
  if (on) actor.root.add(actor.goldGlow ??= W.glowSprite(0xffe7a0, 1.6, 2.3)); // baş üstünde hâle
  else if (actor.goldGlow) actor.root.remove(actor.goldGlow);
}
let goldPlan = [];
function planGold(from = 0) { // her koşuda (Sonsuz Akın'da her bölgede) 1-3 altın düşman, rastgele mesafelerde
  const end = cur().goals?.find(g => g[0] === 'dist')?.[1] ?? ZONE_LEN;
  goldPlan = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => from + Math.round(200 + Math.random() * Math.max(200, end - 250))).sort((a, b) => a - b);
}
function spawnGold(z) {
  const foes = (THEMES[theme].foes ?? THEMES[sect?.prev]?.foes)?.filter(f => !FOE[f[0]].shoot && !FOE[f[0]].bank);
  if (!foes?.length) return;
  const o = add('kormos', Math.floor(Math.random() * 3), z, { variant: foes[0][0] });
  if (!o) return;
  Object.assign(o, { gold: true, phase: null, y: 0, ready: true, hp: 2, lt: 1 });
  gild(o.actor, true);
  o.alert = W.makeAlert();
  scene.add(o.alert);
}
function goldKilled(o) {
  wallet.addGD(1);
  runGold++;
  rec('gold');
  banner('ALTIN AV! +1 GÖK DEMİR');
  sfx('gold');
  sparks.emit(o.x, 1.6, o.z, 70, 0xffd23f, 8, 4);
}

function slash(target, atBoss = false) {
  if (cool > 0) return;
  cool = 0.22;
  sfx('swing');
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
  sfx('bowdraw');
  const sp = BOW_SPEED * (has('yazir') ? 1.3 : 1);
  hero.overlay('Bow_Shoot', { speed: sp }); // çekip bırakma: yayı öne uzatır, kirişi çeker
  pending.push(BOW_RELEASE * BOW_SPEED / sp);
}

const v3 = new THREE.Vector3();
function launchArrow() {
  sfx('bowrelease');
  hero.parts.ArrowNock.visible = false;
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
  sfx('neigh');
  rec('mount');
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
    a.baked = a.setBody(kind);
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
  difficulty: () => zorluk(),
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
  if (!cur().boss) return; // boss'suz kısım
  sfx('roar');
  music('boss');
  const kind = cur().boss, def = BOSSES[kind];
  const { main, extra, mount } = getBossActors(kind);
  const bossHp = Math.round(def.hp * (1 + (zorluk() - 1) * 0.75)); // güçlü orduya karşı boss daha dayanıklı
  boss = { kind, def, hp: bossHp, max: bossHp, state: 'enter', t: 0, time: 0, gz: 0, off: 0, x: 0, y: 0, lane: 1, rot: 0, n: 0, hits: 0, actor: main, extra, mount };
  main.root.visible = true;
  main.root.rotation.set(0, 0, 0);
  def.start(B, boss);
  main.root.rotation.y = boss.rot;
  boss.esc = boss.escMax = def.escape ?? 75; // KAÇIŞ çubuğu: süre biterse boss kaçar
  yadaT = 2.5; boss.rowT = 2.5;
  tip('kacis', { text: 'Mavi KAÇIŞ çubuğu biterse boss kaçar! Hızlı ol.', icon: '⏳' }, '', slowmo);
  $('bossname').textContent = def.name;
  $('bossbar').hidden = false;
  bossBar();
  SMU.bossIntro(def.name);
  bossCam = 2.2;
  slowmo(0.12, 2.2);
}

// Kanat çırpma: kanatlar model kökünde, uzunlamasına (z) eksen etrafında döner; base < 0 kanatları yukarı açar
function flap(root, speed, axis = 'z', base = 0) {
  const L = root.getObjectByName('Wing_L'), R = root.getObjectByName('Wing_R');
  if (!L) return;
  const a = base + Math.sin(time * speed) * 0.55;
  L.rotation[axis] = a;
  R.rotation[axis] = -a;
}

// ================= ZORLUK =================
// Güçlü yiğitler açıldıkça oyun da zorlaşır: ordu gücüne göre 1.0 (başlangıç) → 1.8.
// Sıra sıklığı, düşman oranı, pusu, boss canı ve saldırı hızı buna göre artar. Deneme koşusunda 1.
function zorluk() {
  if (trial) return 1;
  const p = Y.armyPower(isUnlocked('ordu'));
  return 1 + Math.min(0.8, Math.max(0, (p - 100) / 1500));
}
// ================= YADA KÜRESİ (SMU'daki kalkan küresi) =================
// Boss savaşında yolda mavi küreler süzülür. Küre kılıcın erimine gelince DOKUN: Oğuz vurur, küre boss'a uçar,
// Tengri'nin şimşeği iner. Hasar yalnız böyle (ve altın mermiyi geri çalarak) verilir. Toplanmaz, sayılmaz.
let yadaT = 3, flies = [], bolts = [];
const ORB_REACH = 5.2;
function tryOrb() {
  if (!boss || flying || fin || boss.hp <= 0) return false;
  const o = objs.find(o => o.kind === 'yada' && !o.dead && Math.abs(o.x - P.x) < 1.6 && P.z - o.z > -0.6 && P.z - o.z < ORB_REACH);
  if (!o) return false;
  o.dead = true;
  cool = 0;
  swordMode(true);
  P.sword = 0.8;
  slash(null);
  const m = W.makeYada();
  m.userData.stone.position.y = 0;
  scene.add(m);
  flies.push({ m, t: 0, from: new THREE.Vector3(o.x, (o.gy || 0) + 1.3, o.z) });
  sparks.emit(o.x, (o.gy || 0) + 1.3, o.z, 40, 0x9ad0ff, 7, 3);
  pop('VURDU!', o.mesh.position);
  sfx('parry');
  slowmo(0.35, 0.3);
  AY.vibrate(35);
  rec('yada');
  return true;
}
function updateYada(dt) {
  const b = boss;
  if (b && !flying && !fin && b.hp > 0 && b.state !== 'enter' && (yadaT -= dt) <= 0) {
    yadaT = rand(2.6, 3.8);
    const l = Math.random() < 0.5 ? P.lane : Math.floor(Math.random() * 3), z = Math.min(P.z - 12, b.gz + 3);
    if (!objs.some(o => o.lane === l && Math.abs(o.z - z) < 5 && o.def.hit)) add('yada', l, z);
    tip('yada', { text: 'Mavi küre! Şeridine geç, yanına gelince VUR: küre boss\'a uçar.', icon: '⚡', gesture: 'tap', key: 'Boşluk' });
  }
  for (const o of objs) if (o.kind === 'yada' && !o.dead) { // erimdeyse parlar: "şimdi vur"
    const d = P.z - o.z, near = d > -0.6 && d < ORB_REACH && Math.abs(o.x - P.x) < 1.6;
    o.mesh.userData.stone.scale.setScalar(near ? 1.35 + Math.sin(o.t * 30) * 0.1 : 1);
  }
  for (const L of bolts) { L.t += dt; L.m.visible = L.t < 0.35 && Math.floor(L.t * 30) % 3 !== 2; if (L.t > 0.4) scene.remove(L.m); }
  bolts = bolts.filter(L => L.t <= 0.4);
  for (const f of flies) {
    f.t += dt;
    if (!b || fin) { f.done = true; continue; }
    const k = Math.min(1, f.t / 0.45), to = new THREE.Vector3(b.x, (b.def.hitY || 2) + (b.y || 0), b.gz + 0.6);
    f.m.position.lerpVectors(f.from, to, k);
    f.m.position.y += Math.sin(k * Math.PI) * 2;
    f.m.userData.anim(f.t * 4);
    if (k >= 1) { f.done = true; yadaStrike(b, to); }
  }
  for (const f of flies) if (f.done) scene.remove(f.m);
  flies = flies.filter(f => !f.done);
}
function lightning(x, z) {
  const L = W.makeLightning();
  L.position.set(x, 0, z);
  scene.add(L);
  bolts.push({ m: L, t: 0 });
  flash('#e4efff');
  sfx('thunder', { gain: 0.8 });
}
function yadaStrike(b, at) {
  lightning(at.x, at.z);
  shake = 0.4;
  sparks.emit(at.x, at.y, at.z, 60, 0x9ad0ff, 8, 4);
  pop('TENGRİ ÇARPTI!', at);
  b.esc = Math.min(b.escMax, b.esc + 4);
  hitBoss('yada');
}

function hitBoss(src) {
  const b = boss;
  if (!b || b.hp <= 0) return;
  b.hp--;
  addCombo('vurus', 200 * (1 + bonus.bossPts));
  const at = new THREE.Vector3(b.x, (b.def.hitY || 2) + (b.y || 0), b.gz + 1);
  burst(at.x, at.y, at.z, 2.6);
  sparks.emit(at.x, at.y, at.z, 40, 0xff9a3a, 7, 3);
  pop(pick(['ŞAK!', 'GÜM!', 'ÇAT!']), at);
  shake = 0.2;
  stopT = 0.07;
  bossBar();
  if (src === 'yada') { if (b.hp > 0 && !b.def.flying) b.actor.overlay('Hit_Chest', { speed: 1.4 }); } // şimşek: sarsılır, koşusu bozulmaz
  else if (b.hp > 1 && (pow.kilic > 0 || (has('becene') && Math.random() < 0.25))) { b.hp--; pop('ÇİFT!', at); bossBar(); } // Tanrı Kılıcı / Beçene
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
  if (state === 'run' && regionOf(theme)) music(regionOf(theme));
  bossAt = dist() + 2000;
  holdTarget = 1;
  for (const id of ['bossbar', 'tap', 'mash']) $(id).hidden = true;
  warn.visible = false;
  for (const f of flies) scene.remove(f.m);
  flies = [];
}

function updateBoss(dt) {
  const b = boss;
  b.t += dt;
  b.time += dt;
  if (!fin && b.hp > 0) { // düelloda (Oğuz dururken) süre yavaş akar
    b.esc -= dt * (flow < 0.5 ? 0.35 : 1);
    $('esc').style.width = Math.max(0, b.esc / b.escMax) * 100 + '%';
    if (b.esc <= 0) return bossEscape();
  }
  b.off = P.z - b.gz;
  // SMU temposu: boss koşarken yolda engeller sürer (boss'un ayağının dibinden savrulan enkaz)
  if (!fin && b.hp > 0 && !flying && !b.def.duel && flow > 0.8 && b.state !== 'enter' && b.off > 13 && (b.rowT -= dt) <= 0) { b.rowT = rand(1.1, 1.7); bossRow(b); }
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

function bossRow(b) {
  const obst = THEMES[theme].obst, z = b.gz + 2.5;
  if (!obst?.length || P.z - z < 12) return;
  if (objs.some(o => o.def.hit && !o.dead && Math.abs(o.z - z) < 8)) return; // yakında mermi varsa boş bırak: kaçacak yer kalsın
  const n = b.hp / b.max < 0.4 && Math.random() < 0.5 ? 2 : 1;
  for (const l of [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, n)) {
    add(pick(obst), l, z);
    dust.emit(LANES[l], 0.3, z, 14, 0xc9a77a, 3, 2);
  }
}

// Ek görev başarısız (ör. darbesiz görevde darbe)
function missionFail(why) {
  banner(why);
  P.dead = true;
  noRevive = true;
  overTitle = 'GÖREV BAŞARISIZ';
  state = 'dying';
  overT = 1.4;
  timed(hero, pick(HURTS), 0.5);
}

// Kaçış süresi doldu: boss kaçar. Bölümde bölüm kaybedilir; Sonsuz Akın'da koşu sürer, boss ödülü alınmaz.
function bossEscape() {
  const name = boss.def.name;
  sfx('roar');
  banner(`${name} KAÇTI!`);
  for (const o of objs) if (o.parry || o.def.foe) o.dead = true;
  endBoss();
  if (mode === 'endless') return nextZone(); // boss ödülü yok, koşu sürer
  P.dead = true;
  noRevive = true;
  overTitle = `${name} KAÇTI!`;
  state = 'dying';
  overT = 1.8;
  hero.play('Idle_Loop', { fade: 0.3 });
}

// Boss bitirişi (yerdeki boss'lar): ağır çekim; boss durur, döner, sendeler. Oğuz dibine atılır (vuruş erimi
// boss'un boyuna göre hesaplanır, kılıç gövdeye değer), üç vuruş: bacak/gövde, sıçrayıp göğüs, son ağır darbe + şimşek.
// Uçan boss spiral çizerek düşer.
function startFinisher() {
  const b = boss;
  fin = { t: 0, hits: 0 };
  B.tap(null);
  B.mash(null);
  warn.visible = false;
  b.state = 'dying';
  for (const e of b.extra) e.root.visible = false;
  if (b.def.flying) { slowmo(0.4, 1.4); banner(b.def.name + ' DÜŞÜYOR!'); return; }
  const s = b.def.scale || 1.4;
  hero.root.visible = true;
  P.inv = 0;
  if (b.mount) b.mount.root.visible = false; // atlı boss attan iner
  b.y = 0;
  b.rot = 0;
  b.actor.root.rotation.set(0, 0, 0);
  b.actor.play('MX_GS_Impact', { loop: false, speed: 0.7, fade: 0.1 });
  // vuruş noktaları: boss'un önündeki yüzey, alçak (diz-gövde) ve yüksek (göğüs)
  const face = b.gz + 0.28 * s;
  fin.low = new THREE.Vector3(b.x, (b.def.hitY || 2.2) * 0.42, face);
  fin.high = new THREE.Vector3(b.x, (b.def.hitY || 2.2) * 0.85, face);
  fin.stand = face + 0.95; // Oğuz'un durduğu z: kılıç erimi ~0.95 m
  fin.from = new THREE.Vector3(P.x, P.gy || 0, P.z);
  fin.lift = Math.max(0, fin.high.y - 1.45); // göğse ulaşmak için sıçrama yüksekliği
  swordMode(true);
  timed(hero, 'Sword_Dash', 0.35);
  slowmo(0.45, 2);
  pop('BİTİR!', new THREE.Vector3(b.x, (b.def.hitY || 2) + 0.8, b.gz));
}

function finHit(b, at, big) {
  burst(at.x, at.y, at.z + 0.2, big ? 3.4 : 2.4);
  sparks.emit(at.x, at.y, at.z + 0.2, big ? 80 : 50, 0xffc040, big ? 10 : 8, 4);
  pop(pick(['ŞAK!', 'ÇAT!', 'GÜM!']), at);
  shake = big ? 0.45 : 0.25;
  stopT = 0.08;
  sfx('hit');
  if (!big) b.actor.play('Hit_Chest', { loop: false, speed: 1.2, fade: 0.05 });
}

function updateFinisher(dt) {
  fin.t += dt;
  const b = boss, gz = b.gz;
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
    if (flying) flightRig(dt); else hero.update(dt);
    if (fin.t > 2.6) finishDone(b);
    return;
  }
  const t = fin.t;
  // Oğuz'un yeri: 0-0.35 sn atılış, sonra boss'un önünde; ikinci vuruşta göğüs hizasına sıçrar
  const k = Math.min(1, t / 0.35), e = k * k * (3 - 2 * k);
  let y = lerp(fin.from.y, 0, e), z = lerp(fin.from.z, fin.stand, e);
  if (t > 0.95 && t < 1.75) { const u = (t - 0.95) / 0.8; y += Math.sin(u * Math.PI) * (fin.lift + 0.6); z -= Math.sin(u * Math.PI) * 0.3; }
  hero.root.position.set(lerp(fin.from.x, b.x, e), y, z);
  hero.root.rotation.set(0, Math.PI, 0);
  if (fin.hits === 0 && t > 0.35) { timed(hero, 'Sword_Regular_A', 0.45); fin.hits = 0.5; }
  if (fin.hits === 0.5 && t > 0.58) { fin.hits = 1; finHit(b, fin.low); }
  if (fin.hits === 1 && t > 0.95) { timed(hero, 'MX_GS_Jump', 0.8); fin.hits = 1.5; }
  if (fin.hits === 1.5 && t > 1.38) { fin.hits = 2; finHit(b, fin.high); }
  if (fin.hits === 2 && t > 1.8) { timed(hero, 'Sword_Heavy_Combo', 0.9); fin.hits = 2.5; }
  if (fin.hits === 2.5 && t > 2.3) {
    fin.hits = 3;
    finHit(b, fin.high.clone().lerp(fin.low, 0.4), true);
    b.actor.play('Death01', { loop: false, speed: 0.8, fade: 0.1 });
    lightning(b.x, gz);
    pop('TENGRİ ŞAHİT!', new THREE.Vector3(b.x, fin.high.y + 1, gz));
  }
  if (t > 2.9 && t - dt <= 2.9) dust.emit(b.x, 0.3, gz - 2, 80, 0xc9a77a, 10, 5);
  b.actor.root.position.set(b.x, 0, gz);
  b.actor.root.rotation.y = 0;
  b.actor.update(dt);
  hero.update(dt);
  if (t > 3.6) finishDone(b);
}

function finishDone(b) {
  score += 2000;
  runBosses++;
  rec('boss'); rec('boss:' + b.kind); recSet('boss_kinds', b.kind);
  if (mode === 'endless') rec('endless_boss');
  banner(`${b.def.name} YENİLDİ!`);
  endBoss();
  fin = null;
  swordMode(false);
  const fl = LEVELS[level].floors;
  if (nodeRun) { if (!flying) hero.play('Idle_Loop', { fade: 0.3 }); return nodeDone(); }
  if (mode === 'level' && fl && floor < fl.length - 1) return nextFloor();
  if (mode === 'level') { if (!flying) hero.play('Idle_Loop', { fade: 0.3 }); return win(); }
  endlessBosses++;
  nextZone();
}

// Sonsuz Akın'da bölge geçişi: beyaz parlama, kısa sinematik, yeni bölge
function nextZone() {
  zone++;
  if (zone >= ZONES.length) { zone = 0; loop++; }
  zoneStart = dist();
  const Z = ZONES[zone];
  applyZone();
  bossAt = LEVELS[0].bossAt;
  for (const o of objs) release(o);
  objs = [];
  if (P.ride) { P.ride = 0; $('ride').hidden = true; horse.root.visible = false; }
  const z = P.z;
  flash();
  const shot = {
    dur: 2.8,
    enter(c) { c.fade(0); setTheme(Z.theme); c.title([[`${loop + 1}. TUR · ${zone + 1}. BÖLGE`, 'sub'], [Z.name, 'logo']]); c.titleAlpha(0); c.hero.play(pick(RUNS[weapon]), { fade: 0 }); },
    update(c, k, t) {
      const hz = z - 6 - t * 14;
      c.P.z = hz + 6;
      c.show(c.hero, 0, 0, hz, Math.PI);
      c.cam(Math.sin(k * 1.2) * 3, 1.6 + k * 1.5, hz - 5 + k * 1.5, 0, 1.2, hz);
      c.fade(k > 0.85 ? (k - 0.85) * 6 : 0);
      c.titleAlpha(k > 0.1 && k < 0.9 ? 1 : 0, k > 0.1 && k < 0.15);
    },
  };
  playCine([shot], () => enterZone(Z));
}
function enterZone(Z) {
  setTheme(Z.theme);
  flying = !!Z.flight;
  sect = null; hideProps();
  P.row = 1; P.vy = 0; P.y = flying ? HEIGHTS[1] : 0;
  tulpar.root.visible = flying;
  if (flying) tulpar.play('Gallop', { speed: 0.7, fade: 0 });
  $('grid').hidden = !flying;
  $('esirc').hidden = !Z.prisoners;
  nextZ = P.z - 30;
  clearTerrain(); terrNext = runZ - P.z + rand(140, 220);
  sectAt = dist() + 300;
  P.x = LANES[P.lane = 1];
  hero.root.visible = true;
  hero.root.rotation.set(0, Math.PI, 0);
  P.inv = 1.5;
  goldPlan = [];
  planRelics();
  $('fade').style.opacity = 0;
  state = 'run';
  setWeapon(flying ? 'bow' : weapon);
  hero.play(flying ? 'Sitting_Idle_Loop' : 'Sprint_Loop');
  $('hud').hidden = false;
  banner(Z.name);
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
    clearTerrain(); terrNext = rand(140, 220);
    P.x = LANES[P.lane = 1];
    hero.root.visible = true;
    hero.root.rotation.set(0, Math.PI, 0);
    planRelics();
    $('fade').style.opacity = 0;
    P.inv = 1.5;
    if (P.hp < maxHp) { P.hp++; hearts(); } // her katta bir can tazelenir
    state = 'run';
    setWeapon(weapon);
    hero.play('Sprint_Loop');
    $('hud').hidden = false;
    $('goals').hidden = false;
    sectDone = false;
  };
  if (F.fall) { // yolun önünde toprak çöker: Oğuz çukura düşer, kuyudan aşağı iner, dipteki suya dalıp yeni kata çıkar
    banner(F.sub);
    clearTerrain();
    const z0 = P.z - 14;
    const pit = { kind: 'pit', dive: true, z0, z1: z0 - 22, h0: 0, h1: 0, mesh: W.makePit(TSTYLE[theme] || 'kaya', 22, 0) }; // atlanamaz: kat geçişi
    pit.mesh.position.z = z0;
    scene.add(pit.mesh);
    terr.push(pit);
    dust.emit(0, 0.4, z0 - 6, 120, 0x6a5a48, 8, 6);
    shake = 0.5;
    diveNext = () => startSect('dive', () => { enter(); banner(F.name); hero.play('Roll', { loop: false, speed: 1.3, fade: 0.05, then: () => hero.play('Sprint_Loop') }); P.lock = 0.5; });
    state = 'run';
    return;
  }
  playCine([runShot], enter);
}

// ---- koşu içi bölümler ----
function makeEagle() { // Er-Töştük'ün Kara Kuşu: altın-kahve dev kartal
  const g = A.templates.karakus.clone(true);
  const gold = new THREE.Color(0xc8923a);
  g.traverse(o => { if (o.isMesh && !/Iris|Pupil|Beak|Leg/.test(o.material.name)) { o.material = o.material.clone(); o.material.color?.lerp(gold, 0.35); } });
  g.scale.setScalar(1.45); // Oğuz'u taşıyacak kadar büyük
  scene.add(g);
  return g;
}
// Kuyunun dibi: yaklaşan bataklık suyu ve dipteki ışık; yanında düşen taşlar (yukarı kayıyormuş gibi görünür)
let diveWater = null, diveGlow = null, pebbles = [];
function diveProps() {
  if (diveWater) return;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  r.addColorStop(0, '#6a9a7a'); r.addColorStop(0.6, '#2a4a3a'); r.addColorStop(1, '#10201a');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(200,240,220,.35)'; g.lineWidth = 4;
  for (const rr of [40, 75, 110]) { g.beginPath(); g.arc(128, 128, rr, 0, 7); g.stroke(); }
  const m = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) });
  m.userData.outlineParameters = { visible: false };
  diveWater = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), m);
  diveGlow = W.glowSprite(0xbfffd8, 7, 0);
  diveGlow.material.opacity = 0.5;
  scene.add(diveWater, diveGlow);
  diveWater.visible = diveGlow.visible = false;
  for (let i = 0; i < 14; i++) {
    const p = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.18), W.toon(0x4a4038, 'pebble'));
    p.visible = false;
    scene.add(p);
    pebbles.push({ m: p, x: rand(-3.5, 3.5), y: rand(1.5, 8.5), dz: rand(-30, 4) });
  }
}
function divePebbles(dt) { // taşlar Oğuz'dan yavaş düşer: ekranda yukarı doğru akar
  for (const p of pebbles) {
    p.dz += P.vz * 0.55 * dt;
    if (p.dz > 6) { p.dz = rand(-34, -26); p.x = rand(-3.5, 3.5); p.y = rand(1.5, 8.5); }
    p.m.visible = true;
    p.m.position.set(p.x, p.y, P.z + p.dz);
    p.m.rotation.x += dt * 3;
  }
}
function kementProps() { // kement: ip ve parlayan çapa
  if (kementRope) return;
  kementRope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), W.toon(0x8a5a2b, 'kement'));
  kementRope.visible = false;
  scene.add(kementRope);
  kementAnchor = W.glowSprite(0xffd23f, 1.2, 0);
  kementAnchor.visible = false;
  scene.add(kementAnchor);
}
function hideProps() {
  for (const p of [eagle, raft, board, diveWater, diveGlow, kementRope, kementAnchor]) if (p) p.visible = false;
  for (const p of pebbles) p.m.visible = false;
  if (hero) hero.root.rotation.z = 0;
  $('grid').hidden = !LEVELS[level]?.flight;
}
function camMark() { camEase = 1; camFromP.copy(camera.position); camFromQ.copy(camera.quaternion); }
function startSect(kind, after = null) {
  const S = SECTS[kind];
  sect = { kind, S, t: 0, prev: theme, after };
  for (const o of objs) if (P.z - o.z > -2) o.dead = true; // önü temizlenir
  clearTerrain();
  nextZ = P.z - 26;
  if (P.ride) dismount();
  camMark();
  flash();
  setTheme(S.seg);
  if (!after) banner(S.name);
  SMU.modeBand(BAND[kind]);
  P.slide = P.flip = 0; P.lock = 0;
  if (S.fly) {
    swordMode(false);
    flying = true; P.row = 1; P.vy = 0;
    if (kind === 'dive') P.y = HEIGHTS[1];
    $('grid').hidden = false;
  }
  if (kind === 'kartal') { (eagle ??= makeEagle()).visible = true; eagleAway = null; sw.a = sw.v = 0; sw.px = P.x; }
  if (kind === 'kement') { kementProps(); kementRope.visible = kementAnchor.visible = true; kementAx = P.x; sw.a = sw.v = 0; sw.px = P.x; sfx('swing'); }
  if (kind === 'dive') { diveProps(); P.row = 1; P.y = HEIGHTS[1]; sfx('whoosh'); }
  if (kind === 'sal') { (raft ??= (() => { const r = W.makeSal(); scene.add(r); return r; })()).visible = true; P.y = 0; }
  if (kind === 'buz') { (board ??= (() => { const b = W.makeShieldBoard(); scene.add(b); return b; })()).visible = true; }
}
function endSect() {
  const s = sect;
  sect = null;
  SMU.modeBand(null);
  for (const o of objs) if (P.z - o.z > -2) o.dead = true;
  nextZ = P.z - 30;
  terrNext = Math.max(terrNext, runZ - P.z + rand(100, 180));
  camMark();
  flash();
  if (s.kind === 'kartal') { eagleAway = { t: 0, x: eagle.position.x, y: eagle.position.y, z: eagle.position.z }; P.vy = 2; } // bırakır, Oğuz yere süzülür
  if (s.S.fly) flying = false;
  if (s.kind === 'dive') { // suya dalış: sıçrama, kısa beyaz parlama, yeni katta yuvarlanarak kalkar
    P.y = P.vy = 0;
    sparks.emit(P.x, 0.6, P.z - 1, 90, 0xcfeee0, 9, 7);
    dust.emit(P.x, 0.3, P.z - 1, 60, 0x2a4a3a, 6, 4);
    shake = 0.5;
    sfx('land');
  }
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
  else if (mode === 'endless' && dist() >= sectAt) { sectAt += 650; startSect(pick(['buz', 'kement'])); }
}
function sectView(dt) { // view(): bölümdeki duruşlar ve sahne eşyaları
  const r = hero.root, k = sect.kind;
  if (k === 'dive') { // kuyudan düşüş: yüz aşağı (−z), sırtı kameraya, kollar ve bacaklar açık; hafifçe döner
    r.position.set(P.x, P.y + 0.9, P.z - 1.2);
    r.rotation.set(1.45, Math.PI, Math.sin(time * 2.2) * 0.18); // düşüş klibi yere paralel: 90° çevrilince yüzü kuyunun dibine bakar
    // dibe yaklaşırken: su yüzeyi yaklaşır
    const left = sect.S.dur - sect.t;
    if (left < 1.4) { diveWater.visible = true; diveWater.position.set(0, 4.5, P.z - 2 - left * 26); } else diveWater.visible = false;
    diveGlow.position.set(0, 4.5, P.z - 70);
    diveGlow.visible = true;
    divePebbles(dt);
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
  } else if (k === 'kement') {
    const cyc = 1.5, ct = sect.t % cyc;
    if (ct < dt) { kementAx = P.x; sfx('swing', { gain: 0.6 }); } // yeniden tutunma
    const vx = (P.x - sw.px) / Math.max(dt, 1e-3);
    sw.px = P.x;
    sw.v += ((-clamp(vx * 0.05, -0.45, 0.45) - sw.a) * 28 - sw.v * 2.5) * dt; // şerit değişince Oğuz sarkaç gibi sallanır
    sw.a += sw.v * dt;
    const a = sw.a + Math.sin(time * 1.7) * 0.07;
    const arc = -1.2 * Math.sin(Math.PI * ct / cyc); // ileri sarkaç: ortada en alçak
    r.position.set(P.x + Math.sin(a) * 2.1, P.y + arc, P.z);
    hero.bone('hand_r').getWorldPosition(kementV);
    const A = kementA3.set(kementAx, HEIGHTS[P.row] + 9, P.z - 14);
    kementRope.position.copy(kementV).add(A).multiplyScalar(0.5);
    kementRope.scale.set(1, kementV.distanceTo(A), 1);
    kementRope.lookAt(A);
    kementRope.rotateX(Math.PI / 2);
    kementAnchor.position.copy(A);
    r.rotation.set(Math.atan2(kementV.z - A.z, A.y - kementV.y), Math.PI, -a); // gövde ipin açısına yatar
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
function goalVal(k) { return { dist: dist(), kill: kills - goalBase.kill, kut: kut - goalBase.kut, esir: esirs - goalBase.esir, hoop: hoops - goalBase.hoop, combo: maxCombo, kilpayi: runCounts.kilpayi, ride_dist: Math.floor(runRide), nohit: dist(), kill_arrow: runArrow, isabet: runCounts.isabet }[k]; }
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
  if (pow.miknatis > 0 && (pow.miknatis -= dt) <= 0) banner('MIKNATIS BİTTİ');
  if (pow.carpan > 0 && (pow.carpan -= dt) <= 0) banner('ÇİFTE KUT BİTTİ');
  if (secret > 0 && (secret -= dt) <= 0) { flash(); setTheme(secretTheme); for (const o of objs) if (o.kind === 'kut') o.dead = true; }
  godGlow ??= (() => { const g = W.glowSprite(0xff3a2a, 1.6, 0); scene.add(g); return g; })(); // kızıl parlayan kılıç
  godGlow.visible = pow.kilic > 0 && weapon === 'sword';
  if (godGlow.visible) { hero.bone('hand_r').getWorldPosition(godGlow.position); godGlow.position.z -= 0.4; }
  const items = [];
  if (pow.kurt > 0) items.push(`🐺 ${Math.ceil(pow.kurt)}` + (P.lane === guideLane ? ' ×2' : ''));
  if (pow.kilic > 0) items.push(`⚔ ${Math.ceil(pow.kilic)}`);
  if (pow.miknatis > 0) items.push(`🧲 ${Math.ceil(pow.miknatis)}`);
  if (pow.carpan > 0) items.push(`✖2 ${Math.ceil(pow.carpan)}`);
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

// ---- mesafe tabelaları (SMU pankartları): 500 m'de bir ----
function dropMark(m) {
  scene.remove(m.mesh);
  const s = m.mesh.userData.sign;
  s.material.map.dispose(); s.material.dispose(); s.geometry.dispose();
}
function clearMarks() {
  for (const m of marks) dropMark(m);
  marks = [];
  if (recMark) { dropMark(recMark); recMark = null; }
}
function updateMarks() {
  if (flying || sect || boss) { if (dist() >= markNext) markNext += 500; }
  else if (dist() + 70 >= markNext) {
    const z = runZ - markNext;
    const mesh = W.makeMarker(markNext + ' METRE');
    mesh.position.z = z;
    scene.add(mesh);
    marks.push({ n: markNext, z, mesh, done: false });
    markNext += 500;
  }
  if (bestDist > 0 && !recMarkDone && !recMark && dist() + 70 >= bestDist) {
    const z = runZ - bestDist;
    const mesh = W.makeMarker('REKOR ' + bestDist + ' M', true);
    mesh.position.z = z;
    scene.add(mesh);
    recMark = { n: bestDist, z, mesh, done: false };
  }
  for (const m of marks) {
    if (!m.done && P.z < m.z) { m.done = true; pop(`${m.n} M!`, { x: P.x, y: 1.5, z: P.z }); sfx('combo'); score += 100 * mult(); }
    if (P.z < m.z - 20) { dropMark(m); m.dead = true; }
  }
  marks = marks.filter(m => !m.dead);
  if (recMark && !recMark.done && P.z < recMark.z) { recMark.done = true; pop('REKOR!', { x: P.x, y: 1.5, z: P.z }); sfx('gold'); }
  if (recMark && P.z < recMark.z - 20) { dropMark(recMark); recMark = null; recMarkDone = true; }
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
  if (state === 'book' || state === 'wardrobe' || state === 'yigit') { book.update(dt); return; }
  if (state === 'sefer' && Math.floor(time) !== Math.floor(time - dt)) EK.drawSefer(); // süreler akar
  if (state === 'menu' || state === 'map' || state === 'gate' || state === 'win' || state === 'boylar' || state === 'carsi' || state === 'result' || state === 'tore' || state === 'kademe' || state === 'sefer' || state === 'dialog' || state === 'ayar' || state === 'trialend') { hero.update(dt); return; }
  if (state === 'dying') {
    hero.update(dt);
    if ((overT -= dt) <= 0) { if (contRun) nodeDone(); else if (trial) trialEnd(); else if (!noRevive && continues < 3) showRevive(); else gameOver(); }
    return;
  }
  if (state === 'revive') { reviveTick(dt); return; }
  if (state !== 'run') return;
  if (fin) { updateFinisher(dt); if (boss && (flies.length || bolts.length)) updateYada(dt); sparks.update(dt); dust.update(dt); return; }

  if (!boss) P.speed = mode === 'endless' // Sonsuz Akın: her bölgede ve her turda daha hızlı
    ? Math.min(24 + loop * 3, (has('kayi') ? 13.5 : 12) + loop * 2.5 + zone * 0.4 + (dist() - zoneStart) * 0.004)
    : Math.min(24 + (zorluk() - 1) * 4, (has('kayi') ? 13.5 : 12) * (0.9 + zorluk() * 0.1) + time * 0.1);
  flow += (holdTarget - flow) * Math.min(1, dt * 6);
  const speed = P.speed * (P.ride ? 1.45 : 1) * flow * (sect?.S.fast || 1);
  P.vz = speed;
  const dz = speed * dt;
  P.z -= dz;
  if (P.ride) runRide += dz;
  if (flying) runFly += dz;
  score += dz * mult();
  P.x += (LANES[P.lane] - P.x) * Math.min(1, dt * (sect?.S.slip || 14)); // buzda kaygan: şerit gecikmeli oturur
  if (flying) P.y += ((sect?.kind === 'kartal' && sect.t < 0.6 ? 0 : HEIGHTS[P.row]) - P.y) * Math.min(1, dt * 7); // kartal önce iner, sonra kaldırır
  else {
    P.vy -= 38 * dt;
    P.y += P.vy * dt;
    if (terr.length || P.gy) groundStep();
  }
  if (!flying && P.y <= 0 && !overPit) {
    if (P.vy < -2 && !P.ride && P.lock <= 0 && P.slide <= 0) {
      hero.play('NinjaJump_Land', { loop: false, speed: 2.4, fade: 0.05 });
      sfx('land');
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
  if (P.ride && (gallopT -= dt) <= 0) { gallopT = 0.38; sfx('gallop', { gain: 0.6 }); } // dörtnala nal sesi
  if (P.ride && (P.ride -= dt) <= 0) dismount();
  $('ridebar').style.width = (P.ride / rideTime) * 100 + '%';
  cool -= dt;
  if (combo > 0 && (comboT -= dt) <= 0) { combo = 0; comboUi(); } // kombo söndü
  comboRing();
  pending = pending.map(t => t - dt);
  while (pending.length && pending[0] <= 0) { pending.shift(); launchArrow(); }

  while (nextZ > P.z - 110) {
    if (runZ - nextZ > terrNext && terrOk(nextZ)) { const end = buildTerrain(nextZ - 6); terrNext = runZ - end + rand(160, 300); }
    if (sect || (!boss && (cur().goals ? !goalsDone || contRun : runZ - nextZ < bossAt - 40))) (flying ? spawnSky : spawnRow)(nextZ);
    nextZ -= (rand(9, 13) + P.speed * 0.28) / Math.sqrt(zorluk()); // SMU temposu: her saniye bir sıra; güçlü orduda daha sık
  }
  if (terr.length) pruneTerrain();
  if (!sect?.after) updateGoals(); // kat geçişi inişinde görevler sayılmaz
  if (contRun && state === 'run') {
    const v = Math.min(contNeed, Math.floor(score));
    if (v !== contShown) { contShown = v; const d = document.createElement('div'); d.textContent = `★ ${v.toLocaleString('tr-TR')}/${contNeed.toLocaleString('tr-TR')}`; $('goals').replaceChildren(d); }
    if (score >= contNeed) { hero.play('Idle_Loop', { fade: 0.3 }); return nodeDone(); }
  }
  if (trial) { trialTick(); if (state !== 'run') return; }
  sectTick(dt);
  updateMarks();
  W.flowWater(dt);
  if (stageT > 0 && !sect && (stageT -= dt) <= 0) {
    if (nodeRun) return nodeDone();
    const fl = LEVELS[level].floors;
    if (mode === 'level' && fl && floor < fl.length - 1) nextFloor(); else win();
  }
  updatePowers(dt);
  tipScan(dt);
  if (rain) updateRain(dt);
  if (!boss && !sect && dist() > bossAt && !P.ride && !terr.some(t => t.z1 < P.z + 5)) startBoss(); // boss düz yerde karşılanır
  if (!boss && !flying && !sect && dist() > 250 && (ambushT -= dt) <= 0) { ambushT = rand(3, 6) / zorluk(); if (!blocked(P.z - P.speed * 1.5) && !terrAt(P.z - P.speed * 1.5)) spawnAmbush(); }

  for (const o of objs) updateObj(o, dt);
  for (const a of arrows) updateArrow(a, dt);
  if (boss) updateBoss(dt);
  if (boss || flies.length || bolts.length) updateYada(dt);
  for (const o of objs) if (o.dead) release(o);
  for (const a of arrows) if (a.dead) scene.remove(a.mesh);
  objs = objs.filter(o => !o.dead);
  arrows = arrows.filter(a => !a.dead);

  heroAnim();
  if (flying) { if (sect) hero.update(dt); else flightRig(dt); skyGrid(); }
  else hero.update(dt);
  sway(hero, dt, P.ride || flying ? P.speed * 1.2 : P.speed, P.vy);
  heroTrail(dt);
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
  updateChips(dt);
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
    hero.root.position.set(P.x, (P.gy || 0) + P.y + (P.ride || flying ? SEAT : 0), P.z - lungeZ);
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
    horse.root.position.set(P.x, (P.gy || 0) + P.y + rear * 0.9, P.z + 0.15 + rear * 0.6);
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
  sky.userData.u.t.value = performance.now() / 1000; // bulutlar yavaşça kayar
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
  } else if (bossCam > 0 && boss && state === 'run') { // boss tanıtımı: kamera boss'un önünde, yüzüne doğru yaklaşır
    bossCam -= realDt;
    const s2 = boss.def.scale || 1.4, hy = (boss.def.hitY || 2) * 0.85 + (boss.y || 0), k = 1 - bossCam / 2.2;
    camera.position.set(boss.x + 1.2 * s2, hy + 0.4, boss.gz - (4.5 - k * 1.2) * Math.max(1, s2 * 0.7)); // yüzünün önünden (boss oyuncuya bakmıyorsa sırtı görünür: önden çekilir)
    camera.lookAt(boss.x, hy, boss.gz);
    if (bossCam <= 0) camMark(); // oyun kamerasına yumuşak dönüş
  } else if (fin && boss) {
    const gz = boss.gz, s = boss.def.scale || 1.4, mid = gz + 1;
    if (boss.def.flying) {
      const a = lerp(0.35, 1.5, Math.min(1, fin.t / 3));
      camera.position.set(boss.x + Math.sin(a) * 9, 3.2, mid + Math.cos(a) * 9);
      camera.lookAt(boss.x, 2.4, mid);
    } else { // yolun içinde, Oğuz'un arkasından çapraz: surlar görüşü kesmez, kılıç gövdeye değerken görünür
      const side = boss.x > 0.5 ? -1 : 1, k = Math.min(1, fin.t / 3.2);
      const hy = (boss.def.hitY || 2) * 0.62;
      camera.position.set(boss.x + side * (2.6 + k * 0.6), hy + 0.9 + s * 0.35, mid + 4.2 + s * 1.3 - k * 0.8);
      camera.lookAt(boss.x - side * 0.3, hy, mid - 0.3);
    }
  } else if (sect?.kind === 'dive') { // kuyunun içinden aşağı bakış: kamera düşen Oğuz'un üstünde, tam ortada
    const cy = 4.6 + (P.y - 3.5) * 0.35, roll = Math.sin(time * 1.3) * 0.06;
    camera.position.set(P.x * 0.35 + rand(-s, s), cy + rand(-s, s), P.z + 5.2);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(P.x * 0.35, cy - 0.2, P.z - 30);
    camera.up.set(0, 1, 0);
  } else if (sect?.kind === 'kartal') {
    camera.position.set(camX + rand(-s, s), P.y + 5.6, P.z + 8);
    camera.lookAt(camX, P.y + 1.4, P.z - 9);
  } else if (flying) {
    camera.position.set(camX + rand(-s, s), P.y + 3.4 + rand(-s, s), P.z + 7);
    camera.lookAt(camX, P.y + 1.6 + (boss ? 1 : 0), P.z - 8);
  } else {
    const h = P.ride ? 3.6 : 2.8;
    camGy += ((P.gy || 0) - camGy) * Math.min(1, realDt * 5); // iniş-çıkışta kamera yumuşak izler
    const gy = camGy + Math.min(0, P.y) * 0.5; // uçuruma düşerken biraz aşağı bakar
    camera.position.set(camX + rand(-s, s), gy + h + Math.max(0, P.y) * 0.45 + rand(-s, s), P.z + (P.ride ? 6 : 5));
    camera.lookAt(camX, gy + 1.6 + Math.max(0, P.y) * 0.3 + (boss ? 0.8 : 0) + (P.ride ? 0.6 : 0), P.z - 6);
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
function hearts() { $('hearts').textContent = '♥'.repeat(Math.max(0, P.hp)) + '♡'.repeat(Math.max(0, maxHp - P.hp)); }
function bossBar() { $('bosshp').style.width = (Math.max(0, boss.hp) / boss.max) * 100 + '%'; }
function banner(text) { $('banner').textContent = text; $('banner').classList.add('show'); bannerT = 2.2; }

let praiseT;
function comboRing() {
  const r = $('comboring');
  r.hidden = $('combo').hidden;
  if (!r.hidden) r.style.setProperty('--k', Math.max(0, comboT / comboTime()));
  if (comboLabelT > 0 && (comboLabelT -= 1 / 60) <= 0) $('combolabel').className = '';
}
function comboUi(bump) {
  const tier = comboTier();
  $('combo').hidden = combo < 2;
  $('combon').textContent = combo;
  $('combo').dataset.tier = tier;
  if ($('combotier')) $('combotier').textContent = 'x' + tier;
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

// Sonsuz Akın rekorları: en iyi skor, en uzun mesafe, yenilen boss; günün en iyisi gece yarısı sıfırlanır.
// Günlük kayıt ileride çevrim içi sıralamaya (Kurultay) gönderilecek koşu özetini de tutar.
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function endlessRecords() {
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const rec = load('oguz-sonsuz', { bestScore: 0, bestDist: 0, bosses: 0, daily: null });
  const sc = Math.floor(score), run = { date: today(), score: sc, dist: dist(), kills, bosses: endlessBosses, time: Math.round(time), zone, loop };
  if (rec.daily?.date !== today()) rec.daily = null; // yeni gün
  const newAll = sc > rec.bestScore, newDay = !rec.daily || sc > rec.daily.score;
  rec.bestScore = Math.max(rec.bestScore, sc);
  rec.bestDist = Math.max(rec.bestDist, dist());
  rec.bosses += endlessBosses;
  if (newDay) rec.daily = run;
  try { localStorage.setItem('oguz-sonsuz', JSON.stringify(rec)); } catch {}
  return [
    ['Mesafe', dist() + ' m'], ['Bölge', `${loop + 1}. tur · ${ZONES[zone].name}`], ['Yenilen boss', endlessBosses], ['Kut', kut], ['Düşman', kills], ['Skor', sc.toLocaleString('tr-TR')], ['XP', '+' + runXP()],
    [null, newAll ? 'YENİ REKOR!' : newDay ? 'GÜNÜN REKORU!' : '', 'stamp'],
    ['Bugünün en iyisi', rec.daily.score.toLocaleString('tr-TR'), 'rec'], ['Tüm zamanların en iyisi', `${rec.bestScore.toLocaleString('tr-TR')} · ${rec.bestDist} m · ${rec.bosses} boss`, 'rec'],
  ];
}

// HAYAT SUYU İLE DEVAM ET: destanda Er-Sogotoh'u dirilten su (Ögel, s.99). Gök Demir ile 1 → 2 → 4, koşu başına en çok 3.
const REVIVE_PRICE = [1, 2, 4];
function showRevive() {
  state = 'revive';
  reviveT = 5;
  const price = REVIVE_PRICE[continues], can = wallet.gokdemir >= price;
  $('rvprice').textContent = price;
  $('rvgo').classList.toggle('dim', !can);
  $('rvshop').hidden = can;
  $('rvleft').textContent = `${3 - continues} hakkın kaldı`;
  $('revive').hidden = false;
  $('hud').hidden = true;
  tip('hayatsuyu', { text: 'Gök Demirle Hayat Suyu içip kaldığın yerden devam edebilirsin.', icon: '⬢' });
}
function reviveTick(dt) {
  hero.update(dt);
  reviveT -= dt;
  $('rvring').style.setProperty('--k', Math.max(0, reviveT / 5));
  $('rvsec').textContent = Math.ceil(Math.max(0, reviveT));
  if (reviveT <= 0) declineRevive();
}
function doRevive() {
  const price = REVIVE_PRICE[continues];
  if (!wallet.spendGD(price)) { toast('⬢', 'Gök Demir yetmiyor', 'Altın düşmanlardan, görevlerden ve başarımlardan kazanılır.'); return; }
  continues++;
  rec('revive');
  $('revive').hidden = true;
  $('hud').hidden = false;
  state = 'run';
  P.dead = false;
  P.hp = maxHp;
  P.inv = 6.0; // SMU ReviveInvincibleTime: 6000 ms
  slowmo(0.35, 1.0); // SMU ContinueRunSlomotion: 1000 ms
  for (const o of objs) if (P.z - o.z > -2 && P.z - o.z < 35 && !o.def.esir) o.dead = true; // SMU güvenli alan: önündeki 35 m temizlenir
  hearts();
  banner('HAYAT SUYU!');
  flash('#7dff9a');
  sparks.emit(P.x, 1.4, P.z, 80, 0x7dff9a, 7, 4);
  sfx('revive');
  hero.play(flying || P.ride ? 'Sitting_Idle_Loop' : 'Sprint_Loop', { fade: 0.2 });
}
function declineRevive() {
  $('revive').hidden = true;
  gameOver();
}

let overTitle = null;
function gameOver() {
  state = 'over';
  $('banner').classList.remove('show');
  hideTip();
  $('over').querySelector('h1').textContent = overTitle || 'YENİLDİN!';
  overTitle = null;
  wallet.deposit(Math.round(kut * (1 + bonus.kutPct)));
  let best = Math.floor(score), prevBest = 0;
  try { prevBest = +localStorage.getItem('oguz-best') || 0; best = Math.max(best, prevBest); localStorage.setItem('oguz-best', best); } catch {}
  SMU.endPanel('over', { kind: 'over', cardId: runner()?.id, score, best: prevBest, newBest: score > prevBest && prevBest > 0 });
  const f = $('final');
  f.replaceChildren();
  const rows = mode === 'endless' ? endlessRecords() : [['Mesafe', dist() + ' m'], ['Kut', kut], ['Düşman', kills], ['Skor', Math.floor(score)], ['En iyi', best], ['XP', '+' + runXP()]];
  for (const [k, v, cls] of rows) {
    const row = document.createElement('div');
    row.textContent = k ? `${k}: ${v}` : v;
    if (cls) row.className = cls;
    f.append(row);
  }
  $('over').hidden = false;
  sting('lose');
  endRunXP();
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
    P.vy = P.ride ? 11 : has('karkin') ? 14.5 : 12.5; P.slide = 0; P.jumpAt = time;
    if (P.ride) horse.play('Gallop_Jump', { loop: false, speed: 1.4, fade: 0.05, then: () => horse.play('Gallop', { speed: 1.5 }) });
    else { // üç çeşit zıplama: ninja, öne takla, burgu
      P.lock = 0.15;
      const r = Math.random(), jc = r < 0.22 ? 'MX_FrontFlip' : r < 0.36 ? 'MX_TwistFlip' : r < 0.5 && weapon === 'sword' ? 'MX_GS_Jump' : null;
      P.flip = jc ? FLIP_T : 0;
      sfx(jc ? 'flip' : 'jump');
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
    if (P.slide <= 0) sfx('slide');
    P.slide = 0.8; P.slideAt = time;
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
addEventListener('click', e => { if (e.target.closest('button')) sfx('click'); }, true);
$('start').onclick = openMap;
$('carsibtn').onclick = () => locked('carsi') || openShop();
$('torebtn').onclick = openTore;
$('ayarbtn').onclick = () => AY.open();
$('yigitbtn').onclick = () => EK.openYigit();
$('yback').onclick = EK.closeYigit;
$('ydrum').onclick = EK.drumRoll;
$('ybuydrum').onclick = EK.buyDrum;
$('seferbtn').onclick = () => locked('seferler') || EK.openSefer();
$('seferback').onclick = toMenu;
$('kbadge').onclick = EK.openKademe;
$('kademeback').onclick = toMenu;
$('kolbtn').onclick = EK.openKoleksiyon;
$('kolback').onclick = () => { $('koleksiyon').hidden = true; };
$('toreback').onclick = toMenu;
for (const b of document.querySelectorAll('#ttabs button')) b.onclick = () => { toreTab = b.dataset.tab; drawTore(); };
$('carsiback').onclick = toMenu;
for (const b of document.querySelectorAll('#stabs button')) b.onclick = () => { shopTab = b.dataset.tab; drawShopTab(); };
$('rvgo').onclick = doRevive;
$('rvno').onclick = declineRevive;
$('rvshop').onclick = () => { declineRevive(); if (isUnlocked('carsi')) { shopTab = 'gokdemir'; openShop(); } };
$('endless').onclick = () => { if (locked('endless')) return; nodeRun = null; openBoylar('endless', 0); };
$('again').onclick = () => start();
$('wagain').onclick = () => start('level', level);
$('ragain').onclick = () => { $('result').hidden = true; start('level', nodeRun.lv, true); };
$('rmap').onclick = openMap;
$('storybtn').onclick = () => playComic(PROLOG_PAGES);
$('boygo').onclick = () => {
  if (nodeRun?.req?.boy && !picks.list.includes(nodeRun.req.boy)) return toast('🏹', 'Boy şartı', reqText(nodeRun));
  $('boyscreen').hidden = true; boyAfter();
};
$('boyback').onclick = openMap;
$('bookbtn').onclick = openBook;
$('wardbtn').onclick = openWardrobe;
$('wardback').onclick = closeWardrobe;
$('enter').onclick = () => { music('menu'); playCine(JENERIK, () => playComic(PROLOG_PAGES)); };
$('skip').onclick = () => cine.skip();
for (const id of ['mapback', 'overmenu', 'pausemenu', 'wmenu']) $(id).onclick = toMenu;
for (const [id, ic] of Object.entries({ torebtn: 'tore', carsibtn: 'carsi', yigitbtn: 'yigit', seferbtn: 'sefer', wardbtn: 'kostum', bookbtn: 'destan', storybtn: 'hikaye', ayarbtn: 'ayar' })) $(id)?.querySelector('.ticon')?.replaceChildren(svg(ic, 36)); // menü simgeleri (emoji yerine)
$('mapshade').onclick = () => { $('mapdetail').hidden = $('mapshade').hidden = true; };
$('bookback').onclick = closeBook;
$('cover').onclick = openCover;
$('bprev').onclick = () => turnTo(page - 1);
$('bnext').onclick = () => turnTo(page + 1);
$('btocbtn').onclick = () => turnTo(-1);
$('wmap').onclick = openMap;
$('pause').onclick = () => setPaused(true);
$('weapon').onclick = () => act('weapon');
$('trbuy').onclick = trialBuy;
$('trback').onclick = trialBack;
$('resume').onclick = () => setPaused(false);
addEventListener('blur', () => setPaused(true));

let baseFov = 55;
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (state === 'book') requestAnimationFrame(bookResize); else if (state === 'yigit') EK.resizeYigit(); else book?.resize(innerWidth, innerHeight);
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
  probeFps(realDt);
  updateDynRes(realDt);
  let k = 1;
  if (stopT > 0) { stopT -= realDt; k = 0.03; }
  else if (slowT > 0) { slowT -= realDt; k = slowK; }
  update(realDt * k);
  view(realDt * k, realDt);
  const showcase = state === 'book' || state === 'wardrobe' || state === 'yigit';
  active.scene = showcase ? book.scene : scene;
  active.camera = showcase ? book.camera : camera;
  if (!norender) composer.render();
  if (cine?.comic) cine.comic.draw(realDt, cine.shot?.text, cine.t, titleLines());
}
let frozen = false, norender = false; // test: zaman durur, sadece çizilir / çizmeden hızlı oynat
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (frozen) { if (!norender) composer.render(); } // test botu: dondurulmuşken kareleri kendisi ilerletir
  else frame(dt);
});

// test kancası (tarayıcı konsolundan oyunu adım adım sürmek için)
window.__game = {
  THREE, W, DEF, FOE, THEMES, Actor, setParts, makeBird, makeWolfToken, get A() { return A; }, BOSSES_DEF: BOSSES,
  AYR: AYRINTI, // karakter ayrıntısı ayarları (önce/sonra görüntüleri için)
  renderer, AY, applyGfx, get fps() { return fpsProbe; }, get dyn() { return dyn; }, setDynRes,
  resetTips, tipSeen,
  DLG, showDialog, get portraits() { return portraits; },
  Y, EK, KO, dressHero,
  TORE, openTore, get nodes() { return nodes(); }, playNode, hStore, get nodeRun() { return nodeRun; }, set nodeRun(v) { nodeRun = v; },
  get zone() { return zone; }, get loop() { return loop; }, nextZone, shop, openShop, showRevive, doRevive, get continues() { return continues; },
  startBoss, get objs2() { return objs; },
  get terr() { return terr; }, groundAt, terrAt, buildTerrain, clearTerrain, tryOrb, get overPit() { return overPit; },
  get runCounts() { return runCounts; }, get bonus() { return bonus; }, spawnGold, get runStats() { return { parries: runParries, broken: runBroken, gold: runGold, bosses: runBosses }; },
  sfx, music, sting, SOUND,
  unlockAll, addXP, levelUps, toast,
  get warnLane() { return warn.visible ? LANES.indexOf(warn.position.x) : -1; }, get flow() { return flow; }, get time() { return time; }, get dist() { return dist(); }, get level() { return level; }, get mode() { return mode; }, get kills() { return kills; }, get combo() { return combo; }, get score() { return score; }, set score(v) { score = v; }, get kut() { return kut; },
  get boss2() { return boss; }, get bossCam() { return bossCam; }, startBoss, gameOver, win, get flying() { return flying; }, get sect() { return sect; }, startSect, get theme() { return theme; }, setTheme, LEVELS,
  P, get state() { return state; }, get boss() { return boss; }, get objs() { return objs; }, get fin() { return fin; },
  get hero() { return hero; }, get book() { return book; }, get weapon() { return weapon; }, setWeapon, add, pow, get relics() { return relicSave; }, volley, enterSecret, get goalsDone() { return goalsDone; }, get floor() { return floor; }, nextFloor, set cam(v) { debugCam = v; }, set frozen(v) { frozen = v; }, set norender(v) { norender = v; }, get cine() { return cine; }, get comic() { return comic; }, playComic, recordComic, wallet, openWardrobe, playCine, openBook, openMap, toMenu, start, act, tick: frame, mount, spawnAmbush,
};
