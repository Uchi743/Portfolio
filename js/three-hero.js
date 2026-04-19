/* ===================================================
   three-hero.js — 3D Grid Wave (Option D)
   Perspective grid that breathes with mouse
   =================================================== */

(function () {
  const canvas = document.getElementById('cv');
  if (!canvas || typeof THREE === 'undefined') return;

  let W = innerWidth, H = innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  cam.position.set(0, 6, 14);
  cam.lookAt(0, 0, 0);

  // ── Grid parameters ──────────────────────────────────────────
  const COLS = 48, ROWS = 48;
  const SIZE = 20;
  const N = (COLS + 1) * (ROWS + 1);

  const positions = new Float32Array(N * 3);
  const baseY     = new Float32Array(N);

  // Build grid vertices
  let idx = 0;
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const x = (c / COLS - 0.5) * SIZE;
      const z = (r / ROWS - 0.5) * SIZE;
      positions[idx * 3]     = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = z;
      baseY[idx] = 0;
      idx++;
    }
  }

  // Build line indices (horizontal + vertical)
  const indices = [];
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      indices.push(r * (COLS + 1) + c, r * (COLS + 1) + c + 1);
    }
  }
  for (let c = 0; c <= COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      indices.push(r * (COLS + 1) + c, (r + 1) * (COLS + 1) + c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);

  const mat = new THREE.LineBasicMaterial({
    color: 0xf0ede6,
    transparent: true,
    opacity: 0.12,
  });

  const grid = new THREE.LineSegments(geo, mat);
  scene.add(grid);

  // ── Dot at each vertex ────────────────────────────────────────
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  const dotMat = new THREE.PointsMaterial({
    color: 0xf0ede6,
    size: 1.2,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: false,
  });
  const dots = new THREE.Points(dotGeo, dotMat);
  scene.add(dots);

  // ── Mouse ─────────────────────────────────────────────────────
  let mx = 0, my = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / W - 0.5) * 2;
    my = (e.clientY / H - 0.5) * 2;
  });

  // ── Animate ───────────────────────────────────────────────────
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    const pos  = geo.attributes.position.array;
    const dpos = dotGeo.attributes.position.array;

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const x  = positions[i3];
      const z  = positions[i3 + 2];

      // Wave: layered sine with mouse influence
      const wave =
        Math.sin(x * 0.5 + t * 0.6) * 0.35 +
        Math.sin(z * 0.4 + t * 0.5) * 0.30 +
        Math.sin((x + z) * 0.3 + t * 0.4) * 0.20 +
        Math.sin(x * 0.8 - z * 0.6 + t * 0.7) * 0.15;

      // Mouse ripple
      const mdx = x / SIZE - mx * 0.5;
      const mdz = z / SIZE - my * 0.5;
      const md  = Math.sqrt(mdx * mdx + mdz * mdz);
      const ripple = Math.sin(md * 12 - t * 3) * Math.exp(-md * 3) * 0.8;

      const y = wave + ripple;
      pos[i3 + 1]  = y;
      dpos[i3 + 1] = y;
    }

    geo.attributes.position.needsUpdate = true;
    dotGeo.attributes.position.needsUpdate = true;

    // Slow camera drift with mouse
    cam.position.x += (mx * 1.5 - cam.position.x) * 0.03;
    cam.position.y += (6 - my * 0.8 - cam.position.y) * 0.03;
    cam.lookAt(0, 0, 0);

    renderer.render(scene, cam);
  })();

  // ── Resize ────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    W = innerWidth; H = innerHeight;
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
})();
