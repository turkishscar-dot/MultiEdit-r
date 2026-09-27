// Blender'da üretilen karakterleri (tools/build_chars.py) yükler, toon malzemeye çevirir, animasyonları oynatır.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import oguzUrl from './assets/oguz.glb?url';
import kormosUrl from './assets/kormos.glb?url';
import tepegozUrl from './assets/tepegoz.glb?url';
import horseUrl from './assets/horse.glb?url';
import wolfUrl from './assets/wolf.glb?url';
import albastiUrl from './assets/albasti.glb?url';
import yelbegenUrl from './assets/yelbegen.glb?url';
import erlikUrl from './assets/erlik.glb?url';
import tulparUrl from './assets/tulpar.glb?url';
import karakusUrl from './assets/karakus.glb?url';
import cinliUrl from './assets/cinli.glb?url';
import generalUrl from './assets/general.glb?url';
import esirUrl from './assets/esir.glb?url';
import stagUrl from './assets/stag.glb?url';
import itbarakUrl from './assets/itbarak.glb?url';
import boyaliUrl from './assets/boyali.glb?url';
import suluUrl from './assets/sulu.glb?url';
import almasUrl from './assets/almas.glb?url';
import sulmusUrl from './assets/sulmus.glb?url';
import kereyUrl from './assets/kerey.glb?url';
import animsUrl from './assets/anims.glb?url';
import dogaUrl from './assets/doga.glb?url';
import kaleUrl from './assets/kale.glb?url';

export const GRAD = new THREE.DataTexture(new Uint8Array([70, 165, 255]), 3, 1, THREE.RedFormat);
GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter;
GRAD.needsUpdate = true;

const SKIN = { oguz: 0xffffff, kormos: 0x6f5f80, tepegoz: 0xa9b890, albasti: 0xd9d4c4, yelbegen: 0x8fa3b8, erlik: 0x564652, itbarak: 0x5a4a3c, boyali: 0x5a4a3c, sulu: 0x7f9a7a, almas: 0x8a6a50, sulmus: 0xa83a24, kerey: 0x5a4450 };
const HAIR = { oguz: 0x2b1d13, kormos: 0x2b1d13, tepegoz: 0x1d1b17, albasti: 0xd9b04a, yelbegen: 0x3a3430, erlik: 0x0e0c10, general: 0x1a1410, esir: 0x3a2a1c, sulu: 0x2a3a24, almas: 0x3a2a1c, kerey: 0x0e0c10 };
const GLOW_EYES = { kormos: 0xff3020, albasti: 0xffd23a, erlik: 0xff2a10, sulu: 0x9aff6a, kerey: 0xff6a10 };
const PARTS = ['SwordHand', 'SwordSheath', 'BowBack', 'Quiver', 'BowHand', 'ArrowNock', 'AltinBork', 'GoldPlates', 'Antlers', 'EagleHat', 'Feathers', 'BearHat', 'ClawL', 'ClawR', 'YakutHat', 'Headband', 'Kalpak', 'HunCap', 'KulTiginTac', 'Tug', 'DogHead', 'Coat1', 'Coat2', 'Coat3', 'CopperNose', 'Weeds', 'Horns', 'Tail', 'Axe', 'Club', 'Shield', 'Spear', 'Saddle', 'Mace', 'Crown', 'Head_L', 'Head_R', 'Head_L2', 'Head_R2', 'Head_L3', 'Head_R3', 'Wing_L', 'Wing_R', 'Skirt', 'Mane', 'Dao', 'Cangue', 'Helmet', 'Mirrors', 'Bork', 'Kavuk', 'Sarik', 'Taj', 'Collar'];
// Üst gövde kemikleri: koşarken ok atma gibi hareketler sadece bunlara uygulanır, bacaklar koşmaya devam eder
const UPPER = /^(spine_0[23]|neck_01|Head|clavicle_|upperarm_|lowerarm_|hand_|thumb_|index_|middle_|ring_|pinky_)/;

// Kahramanın kenar ışığı: bakış açısına göre kenarları aydınlatır, karakteri arka plandan ayırır.
// Vitrinde nadirlik rengine döner (RIM.color), koşuda ılık ve hafif.
export const RIM = { color: { value: new THREE.Color(0xfff0d0) }, power: { value: 0.28 } };
function addRim(m) {
  m.onBeforeCompile = sh => {
    sh.uniforms.rimColor = RIM.color;
    sh.uniforms.rimPower = RIM.power;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimPower;')
      .replace('#include <opaque_fragment>', 'float rimK = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);\noutgoingLight += rimColor * rimK * rimPower;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'rim';
}

function toon(root, name, scenery = false) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = !scenery; // yüzlerce ağacın gölgesi pahalı
    o.receiveShadow = scenery;
    o.frustumCulled = scenery; // animasyonlu gövdenin sınır kutusu güncellenmiyor; sabit ağaçlar kırpılabilir
    const old = o.material;
    if (old.name.startsWith('M_Glow')) { // kor gözler gibi ışık saçan parçalar
      o.material = new THREE.MeshBasicMaterial({ color: old.color });
      return;
    }
    if (old.name === 'MI_Eyes' && GLOW_EYES[name]) {
      o.material = new THREE.MeshBasicMaterial({ color: GLOW_EYES[name] }); // kor gözler
      return;
    }
    const color = old.color.clone();
    if (old.name.startsWith('MI_Superhero')) color.set(SKIN[name]);
    if (old.name.startsWith('MI_Hair')) color.set(HAIR[name]);
    o.material = new THREE.MeshToonMaterial({
      name: old.name, color, map: old.map, gradientMap: GRAD,
      transparent: old.transparent, alphaTest: old.alphaTest, side: old.side,
    });
    if (name === 'oguz') addRim(o.material);
  });
}

export async function loadAssets(onProgress) {
  const loader = new GLTFLoader();
  const urls = { oguz: oguzUrl, kormos: kormosUrl, tepegoz: tepegozUrl, horse: horseUrl, wolf: wolfUrl, albasti: albastiUrl, yelbegen: yelbegenUrl, erlik: erlikUrl, tulpar: tulparUrl, karakus: karakusUrl, cinli: cinliUrl, general: generalUrl, esir: esirUrl, stag: stagUrl, itbarak: itbarakUrl, boyali: boyaliUrl, sulu: suluUrl, almas: almasUrl, sulmus: sulmusUrl, kerey: kereyUrl, anims: animsUrl, doga: dogaUrl, kale: kaleUrl };
  const out = {};
  let done = 0;
  await Promise.all(Object.entries(urls).map(async ([k, u]) => {
    out[k] = await loader.loadAsync(u);
    onProgress(++done / Object.keys(urls).length);
  }));
  const templates = {};
  for (const k of Object.keys(urls).filter(k => k !== 'anims')) {
    if (k === 'doga' || k === 'kale') { toon(out[k].scene, k, true); continue; }
    toon(out[k].scene, k);
    templates[k] = out[k].scene;
  }
  const clipMap = gltf => Object.fromEntries(gltf.animations.map(c => [c.name, c]));
  // çevre modelleri: ada göre (doğa: ağaç, çalı, kaya · kale: kule, sur)
  const env = {};
  for (const k of ['doga', 'kale']) for (const o of [...out[k].scene.children]) { o.position.set(0, 0, 0); env[o.name] = o; }
  return { env, templates, clips: clipMap(out.anims), horseClips: clipMap(out.horse), wolfClips: clipMap(out.wolf), tulparClips: clipMap(out.tulpar), stagClips: clipMap(out.stag) };
}

const upperCache = new Map();
function upperOf(clip) {
  if (!upperCache.has(clip)) {
    upperCache.set(clip, new THREE.AnimationClip(clip.name + '_upper', clip.duration,
      clip.tracks.filter(t => UPPER.test(t.name.split('.')[0]))));
  }
  return upperCache.get(clip);
}

// Bir karakter örneği: kendi iskeleti ve animasyon karıştırıcısı olur.
export class Actor {
  constructor(assets, name, clips = assets.clips) {
    this.root = clone(assets.templates[name]);
    this.clips = clips;
    this.mixer = new THREE.AnimationMixer(this.root);
    this.parts = {};
    // C_ ile başlayan adlar Blender'da eklenen kostüm parçalarıdır (kostum/BLENDER.md); adında Sway geçenler koşarken sallanır
    this.root.traverse(o => { if (PARTS.includes(o.name) || o.name.startsWith('C_')) this.parts[o.name] = o; if (o.name.includes('Sway')) (this.sway ??= []).push(o); });
    this.mixer.addEventListener('finished', e => {
      if (e.action === this.upper) { e.action.fadeOut(0.15); return; }
      if (e.action !== this.current || !this.then) return;
      const f = this.then;
      this.then = null;
      f();
    });
  }

  // Tüm gövde klibi; loop=false olan klip bitince then() çağrılır
  play(clip, { loop = true, fade = 0.15, speed = 1, then = null } = {}) {
    const a = this.mixer.clipAction(this.clips[clip]);
    a.timeScale = speed;
    if (a === this.current && loop) return a;
    a.reset();
    a.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    a.clampWhenFinished = !loop;
    if (this.current && this.current !== a) a.crossFadeFrom(this.current, fade, false);
    a.play();
    this.current = a;
    this.clip = clip;
    this.then = then;
    return a;
  }

  // Sadece üst gövdeye bindirilen tek seferlik klip (ör. koşarken ok fırlatma).
  // Karıştırıcı ağırlıkları normalize ettiği için yüksek ağırlık, alttaki koşunun kollarını bastırır.
  overlay(clip, { speed = 1, fade = 0.06 } = {}) {
    const a = this.mixer.clipAction(upperOf(this.clips[clip]));
    a.reset();
    a.setLoop(THREE.LoopOnce, 1);
    a.clampWhenFinished = true;
    a.timeScale = speed;
    a.weight = 25;
    a.fadeIn(fade).play();
    this.upper = a;
  }

  duration(clip) { return this.clips[clip].duration; }
  bone(name) { return (this.bones ??= {})[name] ??= this.root.getObjectByName(name); }
  update(dt) { this.mixer.update(dt); }
}
