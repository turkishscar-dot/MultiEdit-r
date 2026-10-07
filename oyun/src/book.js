// Destan Kitabı vitrini: seçilen karakter kilim kaplı kaide üstünde döner.
import * as THREE from 'three';
import { Actor, GRAD, RIM } from './assets.js';
import { applyCostume, wallet, sway } from './costumes.js';
import * as W from './world.js';

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
    const front = new THREE.DirectionalLight(0xfff4e8, 1.3); // önden dolgu: Meshy yüzleri karanlıkta kalmasın
    front.position.set(0.5, 2, 6);
    this.scene.add(key, rim, front);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, 0.25, 40), new THREE.MeshToonMaterial({ color: 0xb3202a, gradientMap: GRAD }));
    base.position.y = -0.125;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.17, 0.06, 8, 48), new THREE.MeshToonMaterial({ color: 0xe3a82b, gradientMap: GRAD }));
    ring.rotation.x = Math.PI / 2;
    this.scene.add(base, ring);
    this.ringMat = ring.material;
    // Vitrin: nadirlik rengindeki hâle, yükselen kıvılcımlar ve giyinme parıltısı
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.4, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(c);
    this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55 }));
    this.halo.scale.set(3.2, 4.2, 1);
    this.halo.position.set(0, 1.1, -0.8);
    this.flashS = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    this.flashS.position.set(0, 1, 0.4);
    const N = 46, pos = new Float32Array(N * 3);
    this.motes = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.07, map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    this.motes.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.moteV = Array.from({ length: N }, () => ({ a: Math.random() * 6.3, r: 0.5 + Math.random() * 0.8, y: Math.random() * 2.6, v: 0.3 + Math.random() * 0.6 }));
    for (const o of [this.halo, this.flashS, this.motes]) { o.material.userData.outlineParameters = { visible: false }; this.scene.add(o); }
    this.setRank(null);
    this.spin = 0; this.hold = 0;
    this.pedestal = on => { base.visible = ring.visible = on; };
    this.baseVisible = () => base.visible;
    this.actors = {};
    this.current = null;
    this.h = 2;
    this.fill = 0.6;
    this.aspect = 1;
  }

  show(entry) {
    for (const a of Object.values(this.actors)) a.root.visible = false;
    for (const g of Object.values(this.sets ??= {})) g.visible = false;
    this.current = null; this.set = null; this.wd = 0;
    if (entry.locked) return;
    if (entry.items) return this.showSet(entry);
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

  // Sergi sayfası: engeller, ağaçlar, kayalar, düşman türleri yan yana (gerçek oyun boyutlarıyla). item: { make: 'makeBarricade' } | { env: 'PineTree_aicam1' } | { model, body, anim }
  showSet(entry) {
    let g = this.sets[entry.id];
    if (!g) {
      g = this.sets[entry.id] = new THREE.Group(); g.userData.actors = [];
      const satir = [], cok = entry.items.length >= 4; // 4 ve fazlası iki sıra (raf gibi): sayfaya büyük sığsın
      let x = 0, row = new THREE.Group(); satir.push(row);
      entry.items.forEach((it, i) => {
        if (cok && i === Math.ceil(entry.items.length / 2)) { x = 0; row = new THREE.Group(); satir.push(row); }
        let o;
        if (it.model) {
          const a = new Actor(this.A, it.model);
          if (it.body) a.setBody(it.body);
          a.play(it.anim || 'Idle_Loop', { fade: 0 });
          for (const p of ['Axe', 'Shield', 'Spear', 'Club', 'Dao']) if (a.parts[p]) a.parts[p].visible = !it.body && !!it.parts?.includes(p);
          a.root.rotation.y = 0.35; g.userData.actors.push(a); o = a.root;
        } else o = it.env ? this.A.env[it.env]?.clone() : W[it.make]?.();
        if (!o) return;
        const w = new THREE.Group(); w.add(o);
        if (it.s) o.scale.multiplyScalar(it.s);
        const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3());
        o.position.x -= (b.min.x + b.max.x) / 2; o.position.z -= (b.min.z + b.max.z) / 2; o.position.y -= b.min.y;
        w.position.x = x + sz.x / 2; x += sz.x + (entry.gap ?? 0.6);
        row.add(w);
      });
      let y = 0;
      for (const r of satir.reverse()) { // arka sıra üstte
        const rb = new THREE.Box3().setFromObject(r);
        r.position.set(-(rb.min.x + rb.max.x) / 2, y, 0); y += rb.max.y + 0.4;
        g.add(r);
      }
      const b = new THREE.Box3().setFromObject(g);
      g.userData.h = b.max.y; g.userData.w = b.max.x - b.min.x;
      this.scene.add(g);
    }
    g.visible = true;
    this.set = g;
    this.h = g.userData.h * 1.15;
    this.wd = g.userData.w * 1.1;
    this.frame();
  }

  // Yatay ekranda model sola, dikey ekranda yukarı kaydırılır; kart diğer yarıda durur.
  // rect verilirse (kitabın sol sayfası) model o dikdörtgenin ortasına ve boyuna yerleşir.
  resize(w, h, rect = null) {
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.scene.background = rect ? this.paper : this.dark;
    this.wf = 0.9; // kaidenin sığması gereken ekran genişliği payı
    if (rect) {
      this.camera.setViewOffset(w, h, w / 2 - (rect.left + rect.width / 2), h / 2 - (rect.top + rect.height / 2), w, h);
      this.fill = 0.8 * rect.height / h;
      this.wf = 0.86 * rect.width / w;
    } else {
      if (this.aspect >= 1) this.camera.setViewOffset(w, h, w * 0.2, 0, w, h);
      else this.camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      this.fill = 1 / (1.25 * (this.aspect >= 1 ? 1.35 : 1.7));
    }
    this.frame();
  }

  frame() {
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const base = this.baseVisible() ? 2.75 : 0; // kaidenin çapı (1.3 yarıçap + halka): taşmasın
    const d = Math.max((this.h / this.fill) / (2 * tan), Math.max(base, this.wd || 0) / (this.wf * 2 * tan * this.aspect));
    this.camera.position.set(0, this.h * 0.75, d + 1);
    this.camera.lookAt(0, this.h * 0.45, 0);
    this.camera.updateProjectionMatrix();
  }

  // Nadirlik rengi: hâle, kıvılcımlar, kaide halkası ve kahramanın kenar ışığı. null: sade (Destan Kitabı)
  setRank(color) {
    const on = color != null;
    this.halo.visible = this.motes.visible = on;
    if (!on) { RIM.color.value.set(0xfff0d0); RIM.power.value = 0.28; this.ringMat.color.set(0xe3a82b); return; }
    this.halo.material.color.set(color);
    this.motes.material.color.set(color);
    this.ringMat.color.set(color);
    RIM.color.value.set(color); RIM.power.value = 0.55;
  }
  // Giyinme: kahraman hızla döner, ışık patlaması
  transform() { this.spin = 0.55; this.flashT = 0.6; }
  dragBy(dx) { if (this.current) { this.current.root.rotation.y += dx * 0.012; this.hold = 2.5; } }
  pose(clip, idle) {
    const a = this.current;
    if (!a || !a.clips[clip]) return;
    if (clip === idle || clip.endsWith('_Loop')) a.play(clip, { fade: 0.2 });
    else a.play(clip, { loop: false, fade: 0.1, then: () => a.play(idle, { fade: 0.3 }) });
  }

  update(dt) {
    if (this.set) { // sergi hafifçe sağa-sola salınır
      this.set.rotation.y = Math.sin(performance.now() / 2200) * 0.35;
      for (const a of this.set.userData.actors) a.update(dt);
      return;
    }
    if (!this.current) return;
    if (this.spin > 0) { this.spin -= dt; this.current.root.rotation.y += dt * 22 * Math.max(0, this.spin); }
    if (this.flashT > 0) {
      this.flashT -= dt;
      const k = Math.max(0, this.flashT / 0.6);
      this.flashS.material.opacity = k;
      this.flashS.scale.setScalar(1 + (1 - k) * 4);
    }
    if (this.motes.visible) {
      const p = this.motes.geometry.attributes.position;
      this.moteV.forEach((m, i) => {
        m.y += m.v * dt; m.a += dt * 0.4;
        if (m.y > 2.8) m.y = 0;
        p.setXYZ(i, Math.cos(m.a) * m.r, m.y, Math.sin(m.a) * m.r);
      });
      p.needsUpdate = true;
      this.halo.material.opacity = 0.45 + Math.sin(performance.now() / 600) * 0.1;
    }
    if ((this.hold -= dt) <= 0) this.current.root.rotation.y += dt * 0.5;
    this.current.update(dt);
    sway(this.current, dt, 1.5, 0); // vitrinde pelerin hafifçe dalgalanır
  }
}
