// Karakter malzemelerinin ayrıntısı: modeli değiştirmeden yüzeyi zenginleştirir.
//  1. Ayrıntı dokusu (kumaş, deri, kürk, keçe, ahşap, metal, altın, kemik): gri tonlu, kostüm rengini çarpar.
//     UV'si olmayan parçalar için üç yönlü (triplanar) kaplama: doku, parçanın bağlanma (iskelet öncesi) konumuna göre
//     üç eksenden izdüşürülür; karakter koşarken doku gövdeye yapışık kalır.
//  2. Parlama: metal, altın, mücevher ve cilada çizgi film tarzı keskin ışık lekesi.
//  3. Gölge boşlukları (AO): kol altı, kıvrım, yaka altı. tools/karakter_ao.py ile Blender'da köşe başına hesaplanır,
//     src/assets/ao.json'da durur (model dosyalarına dokunulmaz). Modelle eşleşmeyen parçada kendiliğinden kapalıdır.
//  4. Kenar ışığı (yalnız Oğuz): assets.js'deki RIM ile.
import * as THREE from 'three';

const DOKU = import.meta.glob('./assets/doku/detay_*.jpg', { eager: true, query: '?url', import: 'default' });
const yukle = new THREE.TextureLoader();
const dokular = {};
function doku(ad) {
  if (dokular[ad] !== undefined) return dokular[ad];
  const u = DOKU[`./assets/doku/detay_${ad}.jpg`];
  if (!u || typeof document === 'undefined') return (dokular[ad] = null);
  const t = yukle.load(u);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace; // veri dokusu: gri ton doğrudan çarpan
  t.anisotropy = 4;
  return (dokular[ad] = t);
}

// ---- boyalı ayrıntı (tools/boya.py): T duruşunda önden/arkadan yapay zekâ boyamasının gri oran haritası ----
// Oğuz'un iskelete giydirilmiş örgülerine bağlanma konumundan (iskelet öncesi) izdüşürülür: önden bakan yüz ön haritayı,
// arkaya bakan arka haritayı alır, yanlara doğru etkisi söner. Yüz, saç ve kemiğe takılı başlıklar almaz.
const BOYA = import.meta.glob('./assets/doku/boya*', { eager: true, query: '?url', import: 'default' });
const BOYA_CER = import.meta.glob('./assets/doku/boya.json', { eager: true, import: 'default' })['./assets/doku/boya.json'];
let boyaTx = null;
function boyaDoku() {
  if (boyaTx !== null) return boyaTx;
  const on = BOYA['./assets/doku/boya_on.jpg'], arka = BOYA['./assets/doku/boya_arka.jpg'];
  if (!on || !arka || !BOYA_CER || typeof document === 'undefined') return (boyaTx = false);
  const y = t => { const x = yukle.load(t); x.colorSpace = THREE.NoColorSpace; x.anisotropy = 4; return x; };
  return (boyaTx = { on: y(on), arka: y(arka) });
}

// malzeme adı (".001" ekleri atılır) -> [doku, ölçek (tekrar/birim), güç, parlama]
// Karakterler ~2.5 birim boyunda: ölçek 6 ≈ kumaşta 15 cm'lik doku karesi.
const TUR = [
  [/^(M_Cloth|M_Kaftan|M_Trouser|M_Coat\d|M_Rag|M_Cape|M_Sash)$/, 'kumas', 13, 0.4, 0],
  [/^(M_Leather|M_Boot|M_Hide)$/, 'deri', 5, 0.6, 0.15],
  [/^(M_Fur|M_DarkFur|M_Pelt2?|M_Kurk)$/, 'kurk', 4, 0.8, 0],
  [/^M_Bork$/, 'kece', 5, 0.5, 0],
  [/^(M_Wood|LightWood|DarkWood)$/, 'ahsap', 3, 0.6, 0.1],
  [/^(M_Iron|M_Steel|Steel|LightSteel)$/, 'metal', 5, 0.5, 0.3],
  [/^(M_Gold|M_GoldDark|M_GoldHorn|M_Copper)$/, 'altin', 4, 0.6, 0.6],
  [/^(M_Bone|M_Horn)$/, 'kemik', 4, 0.5, 0.15],
  [/^(M_Jewel|M_Lacquer)$/, null, 0, 0, 1],
];
export function tur(ad) {
  const a = (ad || '').replace(/\.\d+$/, '');
  for (const [re, d, olcek, guc, parlak] of TUR) if (re.test(a)) return { d, olcek, guc, parlak };
  return null;
}

// Gölge boşlukları: model adı -> { anahtar: Uint8Array }. Anahtar: köşe sayısı + ilk köşenin konumu (3 basamak).
let AO = {};
export function aoYukle(veri) {
  AO = {};
  for (const [m, parcalar] of Object.entries(veri || {})) {
    AO[m] = {};
    for (const [k, b64] of Object.entries(parcalar)) {
      const s = atob(b64), a = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
      AO[m][k] = a;
    }
  }
}
export function aoAnahtar(geo) {
  const p = geo.attributes.position, f = x => (Math.round(x * 1000) / 1000).toFixed(3);
  return `${p.count}:${f(p.getX(0))},${f(p.getY(0))},${f(p.getZ(0))}`;
}
function aoEkle(geo, model) {
  if (geo.attributes.ao) return true;
  const a = AO[model]?.[aoAnahtar(geo)];
  if (!a || a.length !== geo.attributes.position.count) return false;
  geo.setAttribute('ao', new THREE.BufferAttribute(a, 1, true));
  return true;
}

// ---- kadın biçimi: şablonun iskelete giydirilmiş örgülerine köşe başına kayma (bağlanma duruşunda) ----
// Kollar ve bacaklar kemik eksenine doğru incelir, bel daralır, kalça biraz genişler, kaşlar incelir. Baş, eller, başlıklar
// değişmez (başlıklar kaymasın). Her örgünün kadın biçimli geometri kopyası tutulur; kostüm giyilirken (costumes.js)
// geometri değiştirilir. Böylece kontur çizgisi ve gölge de aynı biçimi görür.
export const KADIN = new WeakMap(), ERKEK = new WeakMap();
export function kadinBicimi(sablon) {
  sablon.updateMatrixWorld(true);
  const V = THREE.Vector3, bas = {};
  sablon.traverse(o => { if (o.isBone) bas[o.name] = o; });
  const kafa = /^(Head|neck_01|hand_|index_|middle_|ring_|pinky_|thumb_)/;
  sablon.traverse(s => {
    if (!s.isSkinnedMesh || KADIN.has(s.geometry)) return;
    const g = s.geometry, pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    if (!si || !sw) return;
    const bones = s.skeleton.bones, bind = s.bindMatrix, binv = new THREE.Matrix4().copy(bind).invert();
    const bw = bones.map((b, i) => new V().setFromMatrixPosition(new THREE.Matrix4().copy(s.skeleton.boneInverses[i]).invert()));
    const ucu = i => { const b = bones[i]; const c = b.children.find(x => x.isBone); return c ? bw[bones.indexOf(c)] ?? null : null; };
    const ofs = new Float32Array(pos.count * 3), p = new V(), d = new V(), a = new V(), t = new V();
    const kas = s.name === 'Eyebrows' || /Eyebrow/.test(s.name);
    let km = null;
    if (kas) { km = new V(); for (let k = 0; k < pos.count; k++) km.add(p.fromBufferAttribute(pos, k).applyMatrix4(bind)); km.multiplyScalar(1 / pos.count); }
    for (let k = 0; k < pos.count; k++) {
      p.fromBufferAttribute(pos, k).applyMatrix4(bind); d.set(0, 0, 0);
      if (kas) { d.set(0, (km.y - p.y) * 0.45, 0); }
      else {
        let top = 0;
        for (let j = 0; j < 4; j++) {
          const w = sw.getComponent(k, j); if (w <= 0) continue;
          const bi = si.getComponent(k, j), ad = bones[bi]?.name || '';
          if (kafa.test(ad)) continue;
          let e = null;
          if (/^(upperarm|lowerarm)_/.test(ad)) e = 0.2;            // kollar %20 incelir
          else if (/^(thigh|calf)_/.test(ad)) e = 0.1;              // bacaklar %10
          if (e != null) { const u = ucu(bi); if (!u) continue; a.copy(bw[bi]); t.copy(u).sub(a).normalize();
            const proj = a.clone().add(t.clone().multiplyScalar(p.clone().sub(a).dot(t))); d.add(proj.sub(p).multiplyScalar(e * w)); top += w; continue; }
          if (/^(spine_02|spine_03|clavicle_)/.test(ad)) { d.x += -p.x * 0.1 * w; d.z += -(p.z - bw[bi].z) * 0.05 * w; }  // göğüs ve sırt daralır
          else if (/^spine_01$/.test(ad)) d.x += -p.x * 0.14 * w;   // bel
          else if (/^pelvis$/.test(ad)) d.x += p.x * 0.04 * w;      // kalça
        }
      }
      t.copy(d).applyMatrix3(new THREE.Matrix3().setFromMatrix4(binv));
      ofs[k * 3] = t.x; ofs[k * 3 + 1] = t.y; ofs[k * 3 + 2] = t.z;
    }
    const gk = g.clone(), kp = gk.attributes.position;
    for (let k = 0; k < kp.count; k++) kp.setXYZ(k, kp.getX(k) + ofs[k * 3], kp.getY(k) + ofs[k * 3 + 1], kp.getZ(k) + ofs[k * 3 + 2]);
    KADIN.set(g, gk); ERKEK.set(gk, g);
  });
}

export const AYAR = { ao: { value: 0.75 }, detay: { value: 1 }, parlak: { value: 1 }, boya: { value: 0.85 } }; // ayarlardan kısılabilir (düşük grafik)

// m: MeshToonMaterial, geo: parçanın geometrisi, model: 'oguz' gibi, rim: { color, power } (yalnız Oğuz),
// boyaM: bağlanma konumunu model uzayına götüren matris (yalnız Oğuz'un giydirilmiş örgülerinde; boyalı ayrıntı)
export function ayrintila(m, geo, model, rim, boyaM) {
  const t = tur(m.name), tx = t?.d ? doku(t.d) : null;
  const ao = aoEkle(geo, model), parlak = t?.parlak || 0;
  const bt = boyaM && !/^(MI_|M_Black|M_BeardWhite)/.test(m.name) ? boyaDoku() : null;
  if (!tx && !ao && !parlak && !rim && !bt) return;
  const anahtar = ['ayr', tx ? t.d : '', ao ? 'ao' : '', parlak ? 'p' : '', rim ? 'rim' : '', bt ? 'b' : ''].join('|');
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uAo: AYAR.ao, uDetGuc: AYAR.detay });
    let v = sh.vertexShader, f = sh.fragmentShader;
    let vd = '', fd = '', vb = '', fm = '', fo = '';
    if (tx) {
      Object.assign(sh.uniforms, { uDet: { value: tx }, uDetOlcek: { value: t.olcek }, uDetK: { value: t.guc } });
      vd += 'varying vec3 vTriP;\nvarying vec3 vTriN;\n';
      vb += 'vTriP = position; vTriN = normal;\n'; // iskelet öncesi (bağlanma) konumu: doku gövdeye yapışık
      fd += 'uniform sampler2D uDet;\nuniform float uDetOlcek;\nuniform float uDetK;\nuniform float uDetGuc;\nvarying vec3 vTriP;\nvarying vec3 vTriN;\n';
      fm += `{ vec3 tw = pow(abs(normalize(vTriN)), vec3(4.0)); tw /= (tw.x + tw.y + tw.z + 1e-5);
        vec3 tp = vTriP * uDetOlcek;
        float dd = texture2D(uDet, tp.yz).r * tw.x + texture2D(uDet, tp.xz).r * tw.y + texture2D(uDet, tp.xy).r * tw.z;
        diffuseColor.rgb *= 1.0 + (dd - 0.5) * 2.0 * uDetK * uDetGuc; }\n`;
    }
    if (ao) {
      vd += 'attribute float ao;\nvarying float vAo;\n';
      vb += 'vAo = ao;\n';
      fd += 'varying float vAo;\nuniform float uAo;\n';
      fm += 'diffuseColor.rgb *= mix(1.0, vAo, uAo);\n';
    }
    if (bt) {
      Object.assign(sh.uniforms, { uBoyaOn: { value: bt.on }, uBoyaArka: { value: bt.arka }, uBoyaM: { value: boyaM }, uBoyaGuc: AYAR.boya,
        uBoyaC: { value: new THREE.Vector3(BOYA_CER.cx, BOYA_CER.cy, BOYA_CER.H) } });
      vd += 'uniform mat4 uBoyaM;\nvarying vec3 vBoyaP;\nvarying vec3 vBoyaN;\n';
      vb += 'vBoyaP = (uBoyaM * vec4(position, 1.0)).xyz; vBoyaN = mat3(uBoyaM) * normal;\n';
      fd += 'uniform sampler2D uBoyaOn;\nuniform sampler2D uBoyaArka;\nuniform float uBoyaGuc;\nuniform vec3 uBoyaC;\nvarying vec3 vBoyaP;\nvarying vec3 vBoyaN;\n';
      fm += `{ vec3 bn = normalize(vBoyaN);
        float v = (vBoyaP.y - uBoyaC.y) / uBoyaC.z + 0.5;
        float to = texture2D(uBoyaOn, vec2((vBoyaP.x - uBoyaC.x) / uBoyaC.z + 0.5, v)).r;
        float ta = texture2D(uBoyaArka, vec2((-vBoyaP.x - uBoyaC.x) / uBoyaC.z + 0.5, v)).r;
        float wo = smoothstep(0.15, 0.55, bn.z), wa = smoothstep(0.15, 0.55, -bn.z);
        float oran = 1.0 + (0.6 + to * 0.8 - 1.0) * wo + (0.6 + ta * 0.8 - 1.0) * wa;
        diffuseColor.rgb *= 1.0 + (oran - 1.0) * uBoyaGuc; }\n`;
    }
    if (parlak) { // çizgi film parlaması: güneş yönünde keskin, yumuşak kenarlı leke + kenarda hafif metal yansıması
      Object.assign(sh.uniforms, { uParlak: { value: parlak }, uParlakGuc: AYAR.parlak });
      fd += 'uniform float uParlak;\nuniform float uParlakGuc;\n';
      fo += `#if NUM_DIR_LIGHTS > 0
        { vec3 hv = normalize(directionalLights[0].direction + normalize(vViewPosition));
          float sp = pow(max(dot(normal, hv), 0.0), 40.0);
          outgoingLight += directionalLights[0].color * smoothstep(0.25, 0.55, sp) * 0.32 * uParlak * uParlakGuc;
          float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 2.0);
          outgoingLight += diffuseColor.rgb * fr * 0.35 * uParlak * uParlakGuc; }
        #endif\n`;
    }
    if (rim) {
      Object.assign(sh.uniforms, { rimColor: rim.color, rimPower: rim.power });
      fd += 'uniform vec3 rimColor;\nuniform float rimPower;\n';
      fo += 'float rimK = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);\noutgoingLight += rimColor * rimK * rimPower;\n';
    }
    v = v.replace('#include <common>', '#include <common>\n' + vd).replace('#include <begin_vertex>', '#include <begin_vertex>\n' + vb);
    f = f.replace('#include <common>', '#include <common>\n' + fd).replace('#include <map_fragment>', '#include <map_fragment>\n' + fm)
      .replace('#include <opaque_fragment>', fo + '#include <opaque_fragment>');
    sh.vertexShader = v; sh.fragmentShader = f;
  };
  m.customProgramCacheKey = () => anahtar;
}
