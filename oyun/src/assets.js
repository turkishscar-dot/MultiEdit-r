// Blender'da üretilen karakterleri (tools/build_chars.py) yükler, toon malzemeye çevirir, animasyonları oynatır.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { ayrintila, aoYukle } from './ayrinti.js';
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
import dunyaUrl from './assets/dunya.glb?url';
import kiyafetUrl from './assets/kiyafet.glb?url'; // kostüm parçaları (tools/build_kiyafet.py), Oğuz şablonuna eklenir // yapay zekâ ile üretilen engel ve dekor (tools/ai_isle.py paket)

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

function toon(root, name, scenery = false) {
  root.updateMatrixWorld(true);
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
    if (!scenery) ayrintila(o.material, o.geometry, name, name === 'oguz' ? RIM : null, name === 'oguz' && o.isSkinnedMesh ? o.bindMatrix.clone() : null); // ayrıntı, parlama, gölge boşluğu, boyalı ayrıntı
  });
}

// Dokular adres (blob:/data:) kullanmadan çözülür: sıkı güvenlik kuralı olan sayfalarda (claude.ai yayını) da çalışır,
// aynı anda yüklenen modellerde blob adresinin erken silinmesi sorunu da olmaz.
class BitmapTextures {
  constructor(parser) { this.parser = parser; this.name = 'oguz_bitmap_textures'; }
  loadTexture(i) {
    const P = this.parser, json = P.json, def = json.textures[i];
    const ext = def.extensions || {}, src = ext.EXT_texture_webp?.source ?? ext.EXT_texture_avif?.source ?? def.source; // dokular WebP
    const img = json.images[src];
    if (!img) return null;
    if (img.bufferView == null || typeof createImageBitmap !== 'function') return null; // dış dosya: olağan yol
    return P.getDependency('bufferView', img.bufferView)
      .then(buf => createImageBitmap(new Blob([buf], { type: img.mimeType || 'image/png' }), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
      .then(bmp => {
        const t = new THREE.Texture(bmp);
        t.flipY = false;
        t.name = def.name || img.name || '';
        const sm = (json.samplers || [])[def.sampler] || {};
        t.magFilter = sm.magFilter === 9728 ? THREE.NearestFilter : THREE.LinearFilter;
        t.minFilter = sm.minFilter === 9728 ? THREE.NearestFilter : sm.minFilter === 9729 ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
        t.wrapS = sm.wrapS === 33071 ? THREE.ClampToEdgeWrapping : sm.wrapS === 33648 ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        t.wrapT = sm.wrapT === 33071 ? THREE.ClampToEdgeWrapping : sm.wrapT === 33648 ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        t.needsUpdate = true;
        P.associations.set(t, { textures: i });
        return t;
      });
  }
}
// Web paketinde modeller base64 metin (.txt) olarak durur: bazı barındırmalar .glb sunmuyor, data: adreslerini de engelliyor.
async function loadModel(loader, url) {
  if (!url.endsWith('.txt')) return loader.loadAsync(url);
  const r = await fetch(url);
  if (!r.ok) throw new Error('Model indirilemedi: ' + url);
  const s = atob((await r.text()).trim()), n = s.length, b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = s.charCodeAt(i);
  return loader.parseAsync(b.buffer, '');
}

// Kostüm parçalarını (kiyafet.glb) Oğuz şablonuna ekle. İki dosya aynı iskeleti (kemik adlarını) paylaşır:
//  - kemiğe takılı parça (bıyık, sakal, ayna, davul) ya da menteşe zinciri (hizala_C_* <- C_*_Sway): aynı adlı kemiğe taşınır
//  - gövdeye giydirilmiş parça (kemer, kuşak, uzun kaftan, pul zırh, omuzluk, kürk yaka): şablonun kemikleriyle yeniden bağlanır
function kiyafetEkle(hedef, kaynak) {
  const kemikler = {};
  let govde = null;
  hedef.traverse(o => { if (o.isBone) kemikler[o.name] = o; if (o.isSkinnedMesh && !govde) govde = o.parent; });
  const tasinacak = [];
  kaynak.traverse(o => { if (/^(C_|hizala_C_)/.test(o.name) && (o.parent?.isBone || !/^(C_|hizala_)/.test(o.parent?.name || ''))) tasinacak.push(o); });
  for (const o of tasinacak) {
    // çok malzemeli parçanın alt örgüleri C_Belt_1 gibi adlanır: kostüm kodu bunları ayrı parça sanıp gizlemesin
    o.traverse(c => { if (c !== o && c.isMesh && /^C_/.test(c.name)) c.name = 'p_' + c.name; });
    if (o.parent?.isBone) { const k = kemikler[o.parent.name]; if (k) k.add(o); continue; }
    o.traverse(s => {
      if (!s.isSkinnedMesh) return;
      const kem = s.skeleton.bones.map(b => kemikler[b.name]);
      if (kem.some(b => !b)) return;
      s.bind(new THREE.Skeleton(kem, s.skeleton.boneInverses.map(m => m.clone())), s.bindMatrix.clone());
    });
    (govde || hedef).add(o);
  }
}

// Gölge boşlukları (tools/karakter_ao.py): dosya yoksa ya da inmezse ayrıntısız devam
const AO_URL = Object.values(import.meta.glob('./assets/ao.json', { eager: true, query: '?url', import: 'default' }))[0];

export async function loadAssets(onProgress) {
  if (AO_URL) try { const r = await fetch(AO_URL); if (r.ok) aoYukle(await r.json()); } catch { /* ayrıntısız devam */ }
  const loader = new GLTFLoader();
  loader.register(p => new BitmapTextures(p));
  loader.pluginCallbacks.unshift(loader.pluginCallbacks.pop()); // hazır WebP eklentisinden önce çalışsın
  const urls = { oguz: oguzUrl, kormos: kormosUrl, tepegoz: tepegozUrl, horse: horseUrl, wolf: wolfUrl, albasti: albastiUrl, yelbegen: yelbegenUrl, erlik: erlikUrl, tulpar: tulparUrl, karakus: karakusUrl, cinli: cinliUrl, general: generalUrl, esir: esirUrl, stag: stagUrl, itbarak: itbarakUrl, boyali: boyaliUrl, sulu: suluUrl, almas: almasUrl, sulmus: sulmusUrl, kerey: kereyUrl, anims: animsUrl, doga: dogaUrl, kale: kaleUrl, dunya: dunyaUrl, kiyafet: kiyafetUrl };
  const out = {};
  let done = 0;
  await Promise.all(Object.entries(urls).map(async ([k, u]) => {
    out[k] = await loadModel(loader, u);
    onProgress(++done / Object.keys(urls).length);
  }));
  kiyafetEkle(out.oguz.scene, out.kiyafet.scene);
  const templates = {};
  for (const k of Object.keys(urls).filter(k => k !== 'anims' && k !== 'kiyafet')) {
    if (k === 'doga' || k === 'kale' || k === 'dunya') { toon(out[k].scene, k, true); continue; }
    toon(out[k].scene, k);
    templates[k] = out[k].scene;
  }
  const clipMap = gltf => Object.fromEntries(gltf.animations.map(c => [c.name, c]));
  // çevre modelleri: ada göre (doğa: ağaç, çalı, kaya · kale: kule, sur)
  const env = {};
  for (const k of ['doga', 'kale']) for (const o of [...out[k].scene.children]) { o.position.set(0, 0, 0); env[o.name] = o; }
  // yapay zekâ paketi: 'PineTree_aicam1' gibi aile üyeleri eski paketteki aynı ailenin (PineTree_*) yerine geçer,
  // 'Tower', 'Bush' gibi tam adlar eskisinin üstüne yazılır, 'Engel_*' düğümleri engellerdir (gölge düşürür).
  const yeni = [...out.dunya.scene.children], aile = n => n.replace(/ai[a-z0-9]+$/, '');
  const aileler = new Set(yeni.filter(o => /_ai[a-z0-9]+$/.test(o.name)).map(o => aile(o.name)));
  for (const k of Object.keys(env)) if ([...aileler].some(a => k.startsWith(a))) delete env[k];
  for (const o of yeni) {
    o.position.set(0, 0, 0);
    if (o.name.startsWith('Engel_')) o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    env[o.name] = o;
  }
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
