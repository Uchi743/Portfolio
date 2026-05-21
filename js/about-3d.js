/* ===================================================
   about-3d.js — Scroll-driven Three.js scene
   Glass shard cluster, camera orbits on scroll
   =================================================== */

(function(){
  const canvas = document.getElementById('cv3d');
  if(!canvas || typeof THREE === 'undefined') return;

  let W = innerWidth, H = innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping     = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();

  /* ── Procedural environment map (cheap, single bake) ────────── */
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vP;
      void main(){
        vP = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vP;
      void main(){
        vec3 n = normalize(vP);
        vec3 bot = vec3(0.02, 0.02, 0.04);
        vec3 mid = vec3(0.18, 0.08, 0.22);
        vec3 top = vec3(1.00, 0.85, 0.55);
        float t = n.y * 0.5 + 0.5;
        vec3 col = mix(bot, mid, smoothstep(0.0, 0.55, t));
        col = mix(col, top, smoothstep(0.65, 1.0, t));
        col += vec3(0.30, 0.15, 0.45) * smoothstep(0.0, 1.0,  n.x) * 0.35;
        col += vec3(0.80, 0.55, 0.20) * smoothstep(0.0, 1.0, -n.x) * 0.30;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), envMat));
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  envMat.dispose();
  pmrem.dispose();

  const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
  cam.position.set(0, 0, 7);

  /* ── Frosted-glass material — tinted gold, visible on dark bg ── */
  const glass = new THREE.MeshPhysicalMaterial({
    color:        0xf3e3c4,   // warm cream tint so the verre se voit
    metalness:    0.25,
    roughness:    0.28,        // un peu de "frosted" pour catch la lumière
    transmission: 0.55,        // moins transparent → présence visuelle
    thickness:    0.8,
    ior:          1.5,
    attenuationColor: 0xc9a97a,
    attenuationDistance: 1.5,
    clearcoat:    1.0,
    clearcoatRoughness: 0.18,
    emissive:     0x2a1c10,    // glow chaud subtle
    emissiveIntensity: 0.6,
    transparent:  true,
    envMapIntensity: 1.6,
    flatShading:  true,
    side: THREE.FrontSide
  });

  /* ── Shard cluster ──────────────────────────────────────────── */
  const FRAGMENTS = [];
  const cluster   = new THREE.Group();
  scene.add(cluster);

  const N = 42;
  const geoPool = [
    () => new THREE.TetrahedronGeometry(1, 0),
    () => new THREE.OctahedronGeometry(1, 0),
    () => new THREE.IcosahedronGeometry(1, 0),
    () => new THREE.DodecahedronGeometry(1, 0),
  ];

  for(let i = 0; i < N; i++){
    // Fibonacci-sphere distribution for even spread
    const t   = (i + 0.5) / N;
    const phi = Math.acos(1 - 2 * t);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const R = 1.4;
    const x = R * Math.cos(theta) * Math.sin(phi);
    const y = R * Math.sin(theta) * Math.sin(phi);
    const z = R * Math.cos(phi);

    const size = 0.22 + Math.random() * 0.28;
    const geo  = geoPool[i % geoPool.length]();
    geo.scale(size, size, size);

    const m = new THREE.Mesh(geo, glass);
    m.position.set(x, y, z);
    m.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    const dir = new THREE.Vector3(x, y, z).normalize();
    m.userData = {
      origPos:    m.position.clone(),
      driftDir:   dir,
      driftAmp:   0.5 + Math.random() * 1.6,
      spinAxis:   new THREE.Vector3(
                    Math.random()-0.5, Math.random()-0.5, Math.random()-0.5
                  ).normalize(),
      spinSpeed:  (Math.random() - 0.5) * 1.2,
      phase:      Math.random() * Math.PI * 2
    };
    cluster.add(m);
    FRAGMENTS.push(m);
  }

  /* ── Ghost wireframe sphere — the "implied" whole ───────────── */
  const cage = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.55, 1)),
    new THREE.LineBasicMaterial({ color: 0xfff2d8, transparent: true, opacity: 0.18 })
  );
  cluster.add(cage);

  /* ── Lighting (boosted so frosted glass catches it) ─────────── */
  scene.add(new THREE.AmbientLight(0x6a5a44, 0.7));
  const key = new THREE.DirectionalLight(0xfff0d8, 3.0);
  key.position.set(4, 5, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa07cff, 2.0);
  rim.position.set(-4, 2, -3);
  scene.add(rim);
  const fill = new THREE.PointLight(0xff9a55, 2.2, 14);
  fill.position.set(0, -3, 2);
  scene.add(fill);
  const back = new THREE.PointLight(0xffe2b0, 1.4, 10);
  back.position.set(0, 0, -4);
  scene.add(back);

  /* ── Dust particles ────────────────────────────────────────── */
  const pCount = 180;
  const pGeo   = new THREE.BufferGeometry();
  const pos    = new Float32Array(pCount * 3);
  for(let i = 0; i < pCount; i++){
    pos[i*3+0] = (Math.random() - 0.5) * 14;
    pos[i*3+1] = (Math.random() - 0.5) * 10;
    pos[i*3+2] = (Math.random() - 0.5) * 10;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xfff2d8, size: 0.014, transparent: true, opacity: 0.5, depthWrite: false
  }));
  scene.add(dust);

  /* ── Camera waypoints + dispersion per step ────────────────── */
  const STEPS = [
    { pos: new THREE.Vector3(  0.0,  0.0,  7.0), look: new THREE.Vector3( 2.0,  0.0, 0) },
    { pos: new THREE.Vector3( -5.5,  0.4,  3.8), look: new THREE.Vector3(-1.8,  0.0, 0) },
    { pos: new THREE.Vector3(  0.0,  6.0,  2.5), look: new THREE.Vector3( 0.0,  0.0, 0) },
    { pos: new THREE.Vector3(  0.0,  0.0,  3.6), look: new THREE.Vector3( 0.0,  0.0, 0) },
  ];
  // Start with some dispersion so the shards are distinct from frame 1
  const DISPERSE = [0.25, 0.6, 1.1, 0.35];

  const camPos    = new THREE.Vector3().copy(STEPS[0].pos);
  const camLook   = new THREE.Vector3().copy(STEPS[0].look);
  const targetPos = new THREE.Vector3();
  const targetLook= new THREE.Vector3();

  let scrollP    = 0;
  let scrollPTgt = 0;
  let dispersion = 0.25;
  let dispersionTgt = 0.25;

  function updateScroll(){
    const sections = document.querySelectorAll('.ab3-sec');
    const total    = sections.length;
    if(!total) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    const raw = Math.max(0, Math.min(1, scrollY / max));
    scrollPTgt = raw * (total - 1);

    const fillEl = document.querySelector('.ab3-progress-fill');
    if(fillEl) fillEl.style.setProperty('--p', raw.toFixed(3));

    const idx = Math.round(scrollPTgt);
    document.querySelectorAll('.ab3-progress-dots li').forEach((li, i) => {
      li.classList.toggle('active', i === idx);
    });

    sections.forEach(s => {
      const r = s.getBoundingClientRect();
      const visible = r.top < innerHeight * 0.55 && r.bottom > innerHeight * 0.25;
      s.classList.toggle('in', visible);
    });
  }
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('load',   updateScroll);
  updateScroll();

  window.addEventListener('resize', () => {
    W = innerWidth; H = innerHeight;
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  let mx = 0, my = 0, mxL = 0, myL = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / W - 0.5);
    my = (e.clientY / H - 0.5);
  }, { passive: true });

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();

  (function render(){
    requestAnimationFrame(render);
    const t = clock.getElapsedTime();

    scrollP += (scrollPTgt - scrollP) * 0.07;

    const a = Math.floor(scrollP);
    const b = Math.min(STEPS.length - 1, a + 1);
    const f = scrollP - a;
    const ease = f * f * (3 - 2 * f);

    targetPos.copy(STEPS[a].pos).lerp(STEPS[b].pos, ease);
    targetLook.copy(STEPS[a].look).lerp(STEPS[b].look, ease);
    dispersionTgt = DISPERSE[a] * (1 - ease) + DISPERSE[b] * ease;

    mxL += (mx - mxL) * 0.06;
    myL += (my - myL) * 0.06;
    targetPos.x += mxL * 0.35;
    targetPos.y += -myL * 0.25;

    camPos.lerp(targetPos, 0.1);
    camLook.lerp(targetLook, 0.1);
    cam.position.copy(camPos);
    cam.lookAt(camLook);

    dispersion += (dispersionTgt - dispersion) * 0.05;

    for(let i = 0; i < FRAGMENTS.length; i++){
      const m  = FRAGMENTS[i];
      const ud = m.userData;
      const wobble = Math.sin(t * 0.7 + ud.phase) * 0.04;
      tmp.copy(ud.driftDir)
         .multiplyScalar((dispersion + wobble) * ud.driftAmp);
      m.position.copy(ud.origPos).add(tmp);
      m.rotateOnAxis(ud.spinAxis, ud.spinSpeed * 0.008);
    }

    cluster.rotation.y = t * 0.10;
    cluster.rotation.x = Math.sin(t * 0.13) * 0.16;

    fill.intensity  = 1.1 + Math.sin(t * 1.2) * 0.3;
    dust.rotation.y = t * 0.02;

    renderer.render(scene, cam);
  })();
})();
