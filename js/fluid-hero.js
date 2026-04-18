/* ===================================================
   fluid-hero.js — Ink/Fluid WebGL Shader
   Domain-warped noise reacting to mouse in real time
   =================================================== */

(function () {
  const canvas = document.getElementById('cv');
  if (!canvas || typeof THREE === 'undefined') return;

  let W = innerWidth, H = innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Smooth mouse with history for velocity
  const mouse     = new THREE.Vector2(0.5, 0.5);
  const mousePrev = new THREE.Vector2(0.5, 0.5);
  const mouseVel  = new THREE.Vector2(0.0, 0.0);

  const uniforms = {
    uTime:       { value: 0.0 },
    uMouse:      { value: mouse },
    uMouseVel:   { value: mouseVel },
    uRes:        { value: new THREE.Vector2(W, H) },
  };

  const vert = /* glsl */`
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const frag = /* glsl */`
    precision highp float;
    uniform float uTime;
    uniform vec2  uMouse;
    uniform vec2  uMouseVel;
    uniform vec2  uRes;
    varying vec2  vUv;

    /* ── Hash & noise ── */
    float hash(vec2 p){
      p = fract(p * vec2(234.34, 435.345));
      p += dot(p, p + 34.23);
      return fract(p.x * p.y);
    }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      f = f*f*(3.0-2.0*f);
      return mix(
        mix(hash(i),           hash(i+vec2(1,0)), f.x),
        mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
        f.y
      );
    }
    float fbm(vec2 p){
      float v=0.0, a=0.5;
      mat2 rot = mat2(cos(0.5), -sin(0.5), sin(0.5), cos(0.5));
      for(int i=0;i<6;i++){
        v += a * noise(p);
        p  = rot * p * 2.1 + vec2(1.7, 9.2);
        a *= 0.5;
      }
      return v;
    }

    /* ── Domain warp ── */
    float warp(vec2 p, float t){
      vec2 q = vec2(fbm(p + vec2(0.0,0.0) + t*0.12),
                    fbm(p + vec2(5.2,1.3) + t*0.10));
      vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7,9.2) + t*0.08),
                    fbm(p + 4.0*q + vec2(8.3,2.8) + t*0.08));
      return fbm(p + 4.0*r + t*0.05);
    }

    void main(){
      vec2 uv  = vUv;
      float ar = uRes.x / uRes.y;
      vec2  p  = vec2(uv.x * ar, uv.y) * 2.5;

      /* Mouse distortion */
      vec2 m  = vec2(uMouse.x * ar, uMouse.y) * 2.5;
      float md = length(p - m);
      float mStrength = 0.55 * exp(-md * 1.2);
      vec2  mDir = normalize(uMouseVel + vec2(0.001));
      p += mDir * mStrength;

      /* Domain warp layers */
      float n = warp(p, uTime);
      float n2 = warp(p * 1.6 + 3.0, uTime * 0.7);

      /* Color palette — dark ink meets cream */
      vec3 bg  = vec3(0.031, 0.031, 0.031); // #080808
      vec3 ink = vec3(0.06,  0.05,  0.09);  // deep purple-black
      vec3 mid = vec3(0.15,  0.12,  0.18);  // dark violet
      vec3 hi  = vec3(0.94,  0.93,  0.90);  // cream #f0ede6
      vec3 gld = vec3(0.65,  0.52,  0.30);  // gold accent

      float t1 = smoothstep(0.30, 0.55, n);
      float t2 = smoothstep(0.52, 0.72, n);
      float t3 = smoothstep(0.70, 0.90, n);
      float t4 = smoothstep(0.85, 1.00, n2 * n);

      vec3 col = bg;
      col = mix(col, ink, t1 * 0.9);
      col = mix(col, mid, t2 * 0.8);
      col = mix(col, gld, t3 * 0.65);
      col = mix(col, hi,  t4 * 0.9);

      /* Vignette */
      float vig = length(vUv - 0.5) * 1.4;
      col *= 1.0 - vig * vig * 0.7;

      /* Subtle mouse glow */
      float mglow = exp(-md * md * 1.8) * 0.12;
      col += hi * mglow;

      gl_FragColor = vec4(col, 0.92);
    }
  `;

  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vert, fragmentShader: frag, transparent: true });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  // ── Mouse tracking ────────────────────────────────────────────
  window.addEventListener('mousemove', e => {
    mousePrev.copy(mouse);
    mouse.set(e.clientX / W, 1.0 - e.clientY / H);
    mouseVel.set(
      (mouse.x - mousePrev.x) * 8.0,
      (mouse.y - mousePrev.y) * 8.0
    );
  });

  // ── Animate ──────────────────────────────────────────────────
  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();
    // Dampen velocity
    mouseVel.multiplyScalar(0.92);
    renderer.render(scene, cam);
  })();

  // ── Resize ───────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H);
    uniforms.uRes.value.set(W, H);
  });
})();
