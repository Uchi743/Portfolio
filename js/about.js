/* ===================================================
   about.js — Magnetic cards + counter stats + portrait parallax
   =================================================== */

(function(){
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch       = window.matchMedia('(hover: none)').matches;

  /* ---- Magnetic hover on data-magnet cards ---- */
  if(!reducedMotion && !isTouch){
    const STRENGTH = 0.18;
    document.querySelectorAll('[data-magnet]').forEach(card => {
      let rx = 0, ry = 0, tx = 0, ty = 0, raf = 0, hovering = false;

      function loop(){
        rx += (tx - rx) * 0.18;
        ry += (ty - ry) * 0.18;
        card.style.transform = `translate(${rx.toFixed(2)}px,${ry.toFixed(2)}px)`;
        if(hovering || Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1){
          raf = requestAnimationFrame(loop);
        } else {
          raf = 0;
          card.style.transform = '';
        }
      }

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width  / 2)) * STRENGTH;
        ty = (e.clientY - (r.top  + r.height / 2)) * STRENGTH;
        hovering = true;
        if(!raf) raf = requestAnimationFrame(loop);
      });

      card.addEventListener('mouseleave', () => {
        tx = 0; ty = 0; hovering = false;
        if(!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* ---- Count-up on stats ---- */
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const isK    = el.textContent.trim().endsWith('K');
      statObs.unobserve(el);

      if(isNaN(target)) return;

      let t0 = null;
      function tick(ts){
        if(!t0) t0 = ts;
        const p    = Math.min((ts - t0) / 1500, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const cur  = Math.round(ease * target);
        if(isK)       el.textContent = Math.round(cur / 1000) + 'K';
        else if(suffix) el.textContent = cur + suffix;
        else          el.textContent = cur;
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.45 });
  document.querySelectorAll('.ax-stat-n[data-count]').forEach(el => statObs.observe(el));

  /* ---- Portrait subtle parallax on mouse ---- */
  if(!reducedMotion && !isTouch){
    const portrait = document.querySelector('.ax-portrait');
    if(portrait){
      let tx = 0, ty = 0, cx = 0, cy = 0;
      portrait.addEventListener('mousemove', e => {
        const r = portrait.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width  - 0.5) * 10;
        ty = ((e.clientY - r.top)  / r.height - 0.5) * 10;
      });
      portrait.addEventListener('mouseleave', () => { tx = 0; ty = 0; });
      (function tick(){
        cx += (tx - cx) * 0.1;
        cy += (ty - cy) * 0.1;
        const img = portrait.querySelector('.ax-portrait-img');
        if(img) img.style.transform = `scale(1.04) translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
        requestAnimationFrame(tick);
      })();
    }
  }
})();
