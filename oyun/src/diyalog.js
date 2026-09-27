// Görev öncesi ve sonrası konuşma balonlu diyaloglar (SMU'daki Nick Fury sahneleri gibi).
// Akıl hocası Uluğ Türük: Uygurca Oğuz Kağan Destanı'nda Oğuz'un ak sakallı veziri; altın yay rüyasını yorumlar.
// Paneldeki yüzler oyundaki modellerden çizilir (portre). Her cümle vo/<kimlik>.mp3 ile seslendirilebilir.
import * as THREE from 'three';
import { Actor, GRAD } from './assets.js';
import { applyCostume } from './costumes.js';
import { voId } from './cine.js';
import { duck, vol } from './sound.js';

import { SPEAKERS, DIALOGS } from './diyalog-metin.js';
export { SPEAKERS, DIALOGS };

export const allLines = () => Object.entries(DIALOGS).flatMap(([k, lines]) => lines.map(([sp, t]) => [k, SPEAKERS[sp].name, t]));

// ---------- portreler: modeller ayrı bir sahnede çizilir, görüntü panelde kullanılır ----------
export class Portraits {
  constructor(A, renderer, outline) {
    this.A = A; this.r = renderer; this.outline = outline;
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffe8c8, 0x3a2848, 1.4));
    const key = new THREE.DirectionalLight(0xffe0b0, 2.6);
    key.position.set(2, 4, 5);
    const rim = new THREE.DirectionalLight(0x9ac0ff, 2);
    rim.position.set(-3, 3, -3);
    this.scene.add(key, rim);
    this.cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    this.rt = new THREE.WebGLRenderTarget(256, 256, { samples: 4 });
    this.rt.texture.colorSpace = THREE.SRGBColorSpace;
    this.cache = {};
    this.actors = {};
  }
  actor(model) {
    if (this.actors[model]) return this.actors[model];
    let a;
    if (model === 'ulug') { // Uluğ Türük: yaşlı vezir. Oğuz modelinden: ak saç-sakal, sarık, uzun açık kaftan, asa
      a = new Actor(this.A, 'oguz');
      a.root.traverse(o => { if (o.isMesh) o.material = o.material.clone(); }); // malzemeler kahramanla ortak: kopyala
      applyCostume(a, { parts: ['Sarik'], colors: { M_Kaftan: 0xd8d2c0, M_Trouser: 0x6a6258, M_Boot: 0x3a2c22 } });
      a.root.traverse(o => { if (o.isMesh && o.material.name.startsWith('MI_Hair')) o.material.color.setHex(0xe8e8e0); });
      for (const p of ['SwordHand', 'SwordSheath', 'BowHand', 'BowBack', 'Quiver', 'ArrowNock']) if (a.parts[p]) a.parts[p].visible = false;
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.7, 8), new THREE.MeshToonMaterial({ color: 0x7a4a24, gradientMap: GRAD }));
      staff.position.set(0, 0.2, 0);
      a.bone('hand_l')?.add(staff);
      a.play('Idle_Loop', { fade: 0 });
    } else if (model === 'karakus') {
      a = { root: this.A.templates.karakus.clone(true), update() {} };
    } else {
      a = new Actor(this.A, model);
      for (const p of ['Axe', 'Shield', 'Spear', 'Club', 'Dao']) if (a.parts[p]) a.parts[p].visible = false;
      a.play(Object.keys(a.clips).includes('Idle_Loop') ? 'Idle_Loop' : 'Sword_Idle', { fade: 0 });
    }
    a.root.visible = false;
    this.scene.add(a.root);
    return (this.actors[model] = a);
  }
  // look: Oğuz'un portresi için liderin görünüşü
  get(id, look) {
    const key = id + (id === 'oguz' ? JSON.stringify(look?.parts) + JSON.stringify(look?.colors) : '');
    if (this.cache[key]) return this.cache[key];
    const S = SPEAKERS[id], a = this.actor(S.model);
    if (id === 'oguz' && look) { applyCostume(a, look); for (const p of ['BowHand', 'ArrowNock', 'SwordHand']) if (a.parts[p]) a.parts[p].visible = false; }
    for (const x of Object.values(this.actors)) x.root.visible = false;
    a.root.visible = true;
    a.root.rotation.y = 0.35;
    a.update(0.4);
    a.root.updateMatrixWorld(true);
    const head = new THREE.Vector3();
    const hb = a.bone?.('Head');
    if (hb) hb.getWorldPosition(head); else new THREE.Box3().setFromObject(a.root).getCenter(head);
    this.cam.position.set(head.x + 0.35, head.y + 0.05, head.z + 1.55);
    this.cam.lookAt(head.x, head.y - 0.12, head.z);
    this.scene.background = new THREE.Color(S.bg);
    const r = this.r;
    r.setRenderTarget(this.rt);
    this.outline.render(this.scene, this.cam);
    const px = new Uint8Array(256 * 256 * 4);
    r.readRenderTargetPixels(this.rt, 0, 0, 256, 256, px);
    r.setRenderTarget(null);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d'), img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) img.data.set(px.subarray((255 - y) * 1024, (256 - y) * 1024), y * 1024); // WebGL alttan yukarı okur
    g.putImageData(img, 0, 0);
    a.root.visible = false;
    return (this.cache[key] = c.toDataURL());
  }
}

// ---------- diyalog ekranı: paneller sırayla dolar; İLERİ / ATLA ----------
let voice = null, typeT = null;
function say(text) {
  voice?.pause();
  const a = (voice = new Audio(`vo/${voId(text)}.mp3`));
  a.volume = vol.voice;
  a.onplay = () => duck(true);
  a.onended = a.onpause = a.onerror = () => duck(false);
  a.play().catch(() => {});
}
export function play(lines, portraits, look, onDone, sfx) {
  const box = document.getElementById('dialog'), page = document.getElementById('dpage');
  page.replaceChildren();
  let i = -1;
  const finish = () => { clearInterval(typeT); voice?.pause(); duck(false); box.hidden = true; document.removeEventListener('keydown', key); onDone(); };
  const next = () => {
    const cur = page.lastChild?.querySelector('.dtext');
    if (cur && cur.textContent !== cur.dataset.full) { clearInterval(typeT); cur.textContent = cur.dataset.full; return; } // önce yazıyı tamamla
    if (++i >= lines.length) return finish();
    const [sp, text] = lines[i], S = SPEAKERS[sp];
    const panel = document.createElement('div');
    panel.className = 'dpanel ' + (sp === 'oguz' ? 'r' : 'l') + (sp.startsWith('ulug') || sp === 'oguz' ? '' : ' foe');
    const img = document.createElement('img');
    img.src = portraits.get(sp, look);
    img.alt = S.name;
    const bal = document.createElement('div');
    bal.className = 'dbal';
    const nm = document.createElement('b');
    nm.textContent = S.name;
    const t = document.createElement('span');
    t.className = 'dtext';
    t.dataset.full = text;
    bal.append(nm, t);
    panel.append(img, bal);
    page.append(panel);
    if (page.children.length > 4) page.firstChild.remove(); // sayfada en çok 4 panel
    let n = 0;
    clearInterval(typeT);
    typeT = setInterval(() => { t.textContent = text.slice(0, (n += 2)); if (n >= text.length) clearInterval(typeT); }, 30);
    say(text);
    sfx?.('page');
  };
  const key = e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); } else if (e.key === 'Escape') finish(); };
  document.addEventListener('keydown', key);
  document.getElementById('dnext').onclick = next;
  document.getElementById('dskip').onclick = finish;
  page.onclick = next;
  box.hidden = false;
  next();
}
