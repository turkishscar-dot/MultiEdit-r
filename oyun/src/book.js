// Destan Kitabı vitrini: seçilen karakter kilim kaplı kaide üstünde döner.
import * as THREE from 'three';
import { Actor, GRAD } from './assets.js';
import { applyCostume, wallet } from './costumes.js';

export class Book {
  constructor(assets) {
    this.A = assets;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a1d33);
    this.paper = new THREE.Color(0xefdcb4); // Destan Kitabı'nda karakter sayfaya çizilmiş gibi durur
    this.dark = this.scene.background.clone();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.scene.add(new THREE.HemisphereLight(0xffe8c8, 0x3a2848, 1.3));
    const key = new THREE.DirectionalLight(0xffe0b0, 2.4);
    key.position.set(3, 5, 4);
    const rim = new THREE.DirectionalLight(0x7aa8ff, 2);
    rim.position.set(-4, 3, -4);
    this.scene.add(key, rim);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.25, 40), new THREE.MeshToonMaterial({ color: 0xb3202a, gradientMap: GRAD }));
    base.position.y = -0.125;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.17, 0.06, 8, 48), new THREE.MeshToonMaterial({ color: 0xe3a82b, gradientMap: GRAD }));
    ring.rotation.x = Math.PI / 2;
    this.scene.add(base, ring);
    this.pedestal = on => { base.visible = ring.visible = on; };
    this.actors = {};
    this.current = null;
    this.h = 2;
    this.fill = 0.6;
    this.aspect = 1;
  }

  show(entry) {
    for (const a of Object.values(this.actors)) a.root.visible = false;
    this.current = null;
    if (entry.locked) return;
    const clips = { horse: this.A.horseClips, wolf: this.A.wolfClips, tulpar: this.A.tulparClips, stag: this.A.stagClips }[entry.model] || this.A.clips;
    const a = (this.actors[entry.id] ??= new Actor(this.A, entry.model, clips));
    if (!a.root.parent) {
      this.scene.add(a.root);
      if (entry.model === 'oguz') { applyCostume(a, wallet.worn); a.parts.BowHand.visible = a.parts.ArrowNock.visible = false; }
    }
    a.root.visible = true;
    a.root.scale.setScalar(entry.scale || 1);
    a.root.rotation.y = 0.5;
    for (const c of ['Coat1', 'Coat2', 'Coat3']) if (a.parts[c]) a.parts[c].visible = true;
    for (const p of ['SwordHand', 'SwordSheath', 'Axe', 'Shield', 'Spear', 'Club', 'Dao']) {
      if (!a.parts[p]) continue;
      a.parts[p].visible = entry.model === 'oguz' ? (p === 'SwordHand') === !!entry.sword : !entry.parts || entry.parts.includes(p);
    }
    if (entry.anim) a.play(entry.anim, { fade: 0 }); // Kara Kuş'un iskeleti yok
    this.current = a;
    this.h = entry.h;
    this.frame();
  }

  // Yatay ekranda model sola, dikey ekranda yukarı kaydırılır; kart diğer yarıda durur.
  // rect verilirse (kitabın sol sayfası) model o dikdörtgenin ortasına ve boyuna yerleşir.
  resize(w, h, rect = null) {
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.scene.background = rect ? this.paper : this.dark;
    if (rect) {
      this.camera.setViewOffset(w, h, w / 2 - (rect.left + rect.width / 2), h / 2 - (rect.top + rect.height / 2), w, h);
      this.fill = 0.7 * rect.height / h;
    } else {
      if (this.aspect >= 1) this.camera.setViewOffset(w, h, w * 0.2, 0, w, h);
      else this.camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      this.fill = 1 / (1.25 * (this.aspect >= 1 ? 1.35 : 1.7));
    }
    this.frame();
  }

  frame() {
    const d = (this.h / this.fill) / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)));
    this.camera.position.set(0, this.h * 0.75, d + 1);
    this.camera.lookAt(0, this.h * 0.45, 0);
    this.camera.updateProjectionMatrix();
  }

  update(dt) {
    if (!this.current) return;
    this.current.root.rotation.y += dt * 0.5;
    this.current.update(dt);
  }
}
