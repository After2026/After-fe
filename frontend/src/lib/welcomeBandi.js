import * as THREE from "three";

// Scene, colors, and motion from the supplied Welcome.dc.html export.
export function mountWelcomeBandi(canvas) {
  THREE.ColorManagement.legacyMode = false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputEncoding = THREE.sRGBEncoding;
  let scene = new THREE.Scene();
  let cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  cam.position.set(0, 0.5, 6.6);
  cam.lookAt(0, 0.3, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc4d2f5, 1.0));
  let key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(3, 5, 4);
  scene.add(key);
  let fill = new THREE.DirectionalLight(0xfff4e0, 0.22);
  fill.position.set(-3, 1, 5);
  scene.add(fill);
  let rim = new THREE.DirectionalLight(0x8eaaeb, 0.5);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  function mat(c, o) {
    return new THREE.MeshPhysicalMaterial(
      Object.assign(
        {
          color: c,
          roughness: 0.32,
          metalness: 0,
          clearcoat: 0.7,
          clearcoatRoughness: 0.18,
          sheen: 0.2,
        },
        o || {},
      ),
    );
  }
  function radial(inner, outer) {
    let cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    let g = cv.getContext("2d");
    let gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    let tex = new THREE.CanvasTexture(cv);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  let bandi = new THREE.Group();
  scene.add(bandi);
  let rig = new THREE.Group();
  bandi.add(rig);
  let body = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), mat(0x2350c8));
  body.scale.set(1, 0.95, 0.92);
  rig.add(body);
  let belly = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 72, 72),
    mat(0xeef3ff, { clearcoat: 0.4 }),
  );
  belly.position.set(0, -0.3, 0.6);
  belly.scale.set(1, 0.8, 0.36);
  rig.add(belly);
  let eyes = [];
  [-0.34, 0.34].forEach(function (x) {
    let g = new THREE.Group();
    g.position.set(x, 0.17, 0.8);
    let w = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 48, 48),
      mat(0xffffff, { roughness: 0.15, clearcoat: 1 }),
    );
    w.scale.set(1, 1.15, 0.6);
    g.add(w);
    let p = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 40, 40),
      mat(0x15171c, { roughness: 0.1, clearcoat: 1 }),
    );
    p.position.z = 0.09;
    g.add(p);
    let h = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    h.position.set(0.035, 0.05, 0.11);
    p.add(h);
    g.userData.p = p;
    rig.add(g);
    eyes.push(g);
  });
  let happy = new THREE.Group();
  happy.visible = false;
  rig.add(happy);
  [-0.34, 0.34].forEach(function (x) {
    let arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.035, 16, 40, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    arc.position.set(x, 0.12, 0.9);
    happy.add(arc);
  });
  let grin = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.16,
      40,
      40,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    new THREE.MeshBasicMaterial({ color: 0x1a1c20 }),
  );
  grin.position.set(0, -0.06, 0.86);
  grin.scale.set(1.1, 0.9, 0.5);
  happy.add(grin);
  let smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.028, 16, 48, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.08, 0.9);
  rig.add(smile);
  [-0.58, 0.58].forEach(function (x) {
    let c = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff9c88,
        transparent: true,
        opacity: 0.75,
      }),
    );
    c.position.set(x, -0.05, 0.72);
    c.scale.set(1, 0.55, 0.3);
    rig.add(c);
    rig.userData.cheeks = (rig.userData.cheeks || []).concat([c]);
  });
  let stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.045, 0.5, 24),
    mat(0x163a99),
  );
  stem.position.set(0, 1.12, 0);
  stem.rotation.z = -0.12;
  rig.add(stem);
  let bulbMat = mat(0xffd43b, {
    emissive: 0xffc61a,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    clearcoat: 1,
  });
  let bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 48, 48), bulbMat);
  bulb.position.set(0.04, 1.42, 0);
  rig.add(bulb);
  let halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radial("rgba(255,214,59,0.75)", "rgba(255,214,59,0)"),
      transparent: true,
      depthWrite: false,
    }),
  );
  halo.scale.set(0.95, 0.95, 1);
  halo.position.copy(bulb.position);
  rig.add(halo);
  let glow = new THREE.PointLight(0xffd43b, 0.9, 4);
  glow.position.copy(bulb.position);
  rig.add(glow);
  function arm(x, side) {
    let pivot = new THREE.Group();
    pivot.position.set(x, -0.05, 0.05);
    let a = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.115, 0.34, 16, 32),
      mat(0x2350c8),
    );
    a.position.y = -0.26;
    pivot.add(a);
    pivot.rotation.z = 0.55 * side;
    rig.add(pivot);
    return pivot;
  }
  let armL = arm(-0.88, -1),
    armR = arm(0.88, 1);
  [-0.38, 0.38].forEach(function (x) {
    let f = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 48, 48),
      mat(0x163a99),
    );
    f.position.set(x, -0.96, 0.12);
    f.scale.set(1, 0.52, 1.25);
    rig.add(f);
  });
  let shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 2.4),
    new THREE.MeshBasicMaterial({
      map: radial("rgba(20,28,60,0.32)", "rgba(20,28,60,0)"),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.14;
  bandi.add(shadow);
  let colors = [0x2350c8, 0x8eaaeb, 0xc25a12, 0xffd43b, 0xe6edfc, 0x1f7a4d];
  let geos = [
    new THREE.SphereGeometry(0.12, 32, 32),
    new THREE.CapsuleGeometry(0.07, 0.14, 8, 16),
    new THREE.TorusGeometry(0.12, 0.045, 16, 40),
    new THREE.IcosahedronGeometry(0.14, 1),
  ];
  let bits = [];
  for (let i = 0; i < 18; i++) {
    let m = new THREE.Mesh(
      geos[i % geos.length],
      mat(colors[i % colors.length], { roughness: 0.35 }),
    );
    let r = 1.5 + (i % 5) * 0.22,
      ang = (i / 18) * Math.PI * 2;
    m.userData = {
      r: r,
      ang: ang,
      y: -0.9 + ((i * 37) % 26) / 10,
      sp: 0.12 + (i % 4) * 0.04,
      rot: 0.6 + (i % 3) * 0.4,
    };
    scene.add(m);
    bits.push(m);
  }
  let tx = 0,
    ty = 0,
    rx = 0,
    ry = 0,
    waveAmt = 1,
    joy = 0,
    over = false;
  let ray = new THREE.Raycaster(),
    ndc = new THREE.Vector2();
  function onMove(e) {
    let b = canvas.getBoundingClientRect();
    tx = ((e.clientX - b.left) / b.width - 0.5) * 2;
    ty = ((e.clientY - b.top) / b.height - 0.5) * 2;
    let inside =
      e.clientX >= b.left &&
      e.clientX <= b.right &&
      e.clientY >= b.top &&
      e.clientY <= b.bottom;
    if (!inside) {
      over = false;
      return;
    }
    ndc.set(tx, -ty);
    ray.setFromCamera(ndc, cam);
    over = ray.intersectObject(rig, true).length > 0;
  }
  function onLeave() {
    over = false;
  }
  let jump = -1;
  const stage = canvas.parentElement;
  if (!reduce) {
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
  }
  let lw = 0,
    lh = 0;
  function size() {
    let w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (!w || !h || (w === lw && h === lh)) return;
    lw = w;
    lh = h;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  size();
  let clock = new THREE.Clock(),
    raf = 0,
    t0 = 0;
  function backOut(x) {
    let c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }
  function frame() {
    size();
    let dt = Math.min(clock.getDelta(), 0.05);
    t0 += dt;
    let t = reduce ? 0 : t0;
    let intro = reduce ? 1 : Math.min(1, t0 / 0.9),
      s = backOut(intro);
    bandi.scale.setScalar(Math.max(0.001, s));
    rx += (ty * 0.16 - rx) * 0.05;
    ry += (tx * 0.5 - ry) * 0.05;
    rig.rotation.x = rx;
    rig.rotation.y = ry;
    let bob = Math.sin(t * 2.1) * 0.08,
      hop = 0,
      spin = 0;
    if (jump >= 0) {
      jump += dt * 1.25;
      let j = Math.min(1, jump),
        e = j < 0.5 ? 4 * j * j * j : 1 - Math.pow(-2 * j + 2, 3) / 2;
      hop = Math.sin(Math.PI * j) * 0.85;
      spin = e * Math.PI * 2;
      if (jump >= 1) jump = -1;
    }
    rig.position.y = bob + hop;
    rig.rotation.y += spin;
    let squash = 1 + Math.sin(t * 4.2) * 0.02 - hop * 0.05;
    body.scale.set(1 / squash, 0.95 * squash, 0.92 / squash);
    shadow.scale.setScalar(1 - (bob + hop) * 0.3);
    shadow.material.opacity = 1 - hop * 0.45;
    let cyc =
      t < 3.2 ? 1 : Math.max(0, Math.sin(Math.min(1, (t % 6) / 2.6) * Math.PI));
    waveAmt += (cyc - waveAmt) * 0.06;
    armR.rotation.z =
      0.55 +
      Math.sin(t * 2.1) * 0.08 +
      waveAmt * (1.75 + Math.sin(t * 9) * 0.38);
    armL.rotation.z = -0.55 - Math.sin(t * 2.1) * 0.08 - hop * 1.2;
    let bp = (t % 3.6) - 3.42,
      blink =
        bp > 0 ? 1 - Math.sin(Math.min(1, bp / 0.18) * Math.PI) * 0.88 : 1;
    joy += ((jump >= 0 ? 1 : 0) - joy) * 0.3;
    let happyNow = joy > 0.5;
    happy.visible = happyNow;
    smile.visible = !happyNow;
    (rig.userData.cheeks || []).forEach(function (c) {
      c.material.opacity = 0.75 + joy * 0.25;
      c.scale.set(1 + joy * 0.35, 0.55 + joy * 0.2, 0.3);
    });
    eyes.forEach(function (g) {
      g.visible = !happyNow;
      g.scale.y = blink;
      let k = over ? 0.075 : 0.05;
      g.userData.p.position.x = tx * k;
      g.userData.p.position.y = -ty * k * 0.85;
    });
    let pulse = 0.85 + Math.sin(t * 2.2) * 0.22;
    bulbMat.emissiveIntensity = pulse;
    glow.intensity = pulse;
    let hs = 0.95 * (1 + Math.sin(t * 2.2) * 0.1);
    halo.scale.set(hs, hs, 1);
    bits.forEach(function (m) {
      let u = m.userData,
        a = u.ang + t * u.sp;
      m.position.set(
        Math.cos(a) * u.r,
        u.y + Math.sin(t * 1.3 + u.ang) * 0.15,
        Math.sin(a) * u.r * 0.6 - 0.4,
      );
      m.rotation.x = t * u.rot;
      m.rotation.y = t * u.rot * 0.7;
      m.scale.setScalar(
        Math.max(0.001, backOut(Math.min(1, Math.max(0, (t0 - 0.4) / 0.8)))),
      );
    });
    renderer.render(scene, cam);
    if (!reduce) raf = window.requestAnimationFrame(frame);
  }

  frame();
  const resize = new ResizeObserver(() => {
    size();
    if (reduce) renderer.render(scene, cam);
  });
  resize.observe(canvas);

  return {
    hop() {
      if (!reduce) jump = 0;
    },
    dispose() {
      window.cancelAnimationFrame(raf);
      resize.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      const geometries = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        object.material?.map?.dispose();
        object.material?.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      renderer.dispose();
    },
  };
}
