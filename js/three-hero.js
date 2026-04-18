/* ===================================================
   three-hero.js — Three.js background animation for home hero
   Requires three.js r128 loaded before this script
   =================================================== */

(function(){
  const canvas = document.getElementById('cv');
  if(!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 100);
  cam.position.z = 5;

  /* Wireframe icosahedron */
  const g1 = new THREE.IcosahedronGeometry(1.6, 1);
  const m1 = new THREE.MeshStandardMaterial({color:0xffffff, wireframe:true, opacity:.06, transparent:true});
  const mesh = new THREE.Mesh(g1, m1);
  scene.add(mesh);

  /* Particle cloud */
  const pts = [];
  for(let i=0; i<200; i++){
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    const r = 2.8+Math.random()*.4;
    pts.push(Math.sin(phi)*Math.cos(theta)*r, Math.sin(phi)*Math.sin(theta)*r, Math.cos(phi)*r);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const pm = new THREE.PointsMaterial({color:0xffffff, size:.03, opacity:.4, transparent:true});
  const points = new THREE.Points(pg, pm);
  scene.add(points);

  /* Torus ring */
  const tg = new THREE.TorusGeometry(2.4, .004, 8, 100);
  const tm = new THREE.MeshBasicMaterial({color:0xffffff, opacity:.04, transparent:true});
  const torus = new THREE.Mesh(tg, tm);
  torus.rotation.x = Math.PI/4;
  scene.add(torus);

  scene.add(new THREE.AmbientLight(0xffffff, .4));
  const pl = new THREE.PointLight(0xffffff, 1, 12);
  pl.position.set(4, 4, 4);
  scene.add(pl);

  let tx=0, ty=0;
  document.addEventListener('mousemove', e=>{
    tx = (e.clientX/innerWidth-.5)*.6;
    ty = (e.clientY/innerHeight-.5)*.4;
  });

  (function anim(){
    requestAnimationFrame(anim);
    mesh.rotation.y += .0025;
    mesh.rotation.x += .001;
    torus.rotation.z += .0018;
    points.rotation.y -= .001;
    mesh.rotation.y += (tx - mesh.rotation.y)*.015;
    mesh.rotation.x += (ty - mesh.rotation.x)*.015;
    renderer.render(scene, cam);
  })();

  window.addEventListener('resize', ()=>{
    cam.aspect = innerWidth/innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
})();
