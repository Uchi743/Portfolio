/* ===================================================
   main.js — Cursor, scramble, smooth scroll, reveals
   =================================================== */

(function(){
  'use strict';

  /* ---- Scramble utility ---- */
  const SC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#%&';
  function scramble(el, final, dur, cb) {
    const len = final.length;
    let t0 = null;
    function frame(ts) {
      if(!t0) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      let s = '';
      for(let i = 0; i < len; i++) {
        const c = final[i];
        if(c === ' ' || c === "'" || c === '—' || c === '.' || c === ',') s += c;
        else if(i < Math.floor(p * len * 1.35)) s += c;
        else s += SC[Math.floor(Math.random() * SC.length)];
      }
      el.textContent = s;
      if(p < 1) requestAnimationFrame(frame);
      else { el.textContent = final; cb && cb(); }
    }
    requestAnimationFrame(frame);
  }

  /* ---- Hero title scramble on load ---- */
  const heroTxt = document.getElementById('hero-center');
  if(heroTxt) scramble(heroTxt, "LET'S WORK.", 800);

  /* ---- Custom Cursor + Smooth Scroll (desktop only) ---- */
  const isTouch = window.matchMedia('(hover: none)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(!isTouch) {
    const cur  = document.getElementById('cur');
    const ring = document.getElementById('cur-ring');
    if(cur && ring) {
      let mx=0, my=0, rx=0, ry=0;
      document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cur.style.left = mx+'px'; cur.style.top = my+'px';
      });
      (function ar(){
        rx += (mx-rx)*.15; ry += (my-ry)*.15;
        ring.style.left = rx+'px'; ring.style.top = ry+'px';
        requestAnimationFrame(ar);
      })();
      document.querySelectorAll('a,button,.pi,.bhc,[data-hover]').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('h'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('h'));
      });
    }

    /* ---- Nav hover scramble ---- */
    document.querySelectorAll('.nr a').forEach(link => {
      const orig = link.textContent;
      link.addEventListener('mouseenter', () => scramble(link, orig, 380));
    });

    /* ---- Smooth lerp scroll (désactivé si reduced motion ou perf faible) ---- */
    if(!reducedMotion) (function(){

    // Mesure FPS sur 10 frames avant d'activer le smooth scroll
    let frames = 0, t0 = performance.now();
    function fpsTick(ts) {
      frames++;
      if(frames < 10) { requestAnimationFrame(fpsTick); return; }
      const fps = frames / ((ts - t0) / 1000);
      if(fps < 40) return; // PC trop lent → scroll natif

      let targetY  = window.scrollY;
      let currentY = window.scrollY;

      window.addEventListener('wheel', e => {
        e.preventDefault();
        const max = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.max(0, Math.min(max, targetY + e.deltaY));
      }, { passive: false });

      document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
          const id = a.getAttribute('href').slice(1);
          if(!id) return;
          const dest = document.getElementById(id);
          if(!dest) return;
          e.preventDefault();
          targetY = dest.getBoundingClientRect().top + window.scrollY;
        });
      });

      function lerpTick() {
        currentY += (targetY - currentY) * 0.11;
        if(Math.abs(targetY - currentY) < 0.5) currentY = targetY;
        window.scrollTo(0, currentY);
        requestAnimationFrame(lerpTick);
      }
      requestAnimationFrame(lerpTick);
    }
    requestAnimationFrame(fpsTick);
    })();
  }


  /* ---- Scroll Sequence — Video Scrubbing ---- */
  (function(){
    const video   = document.getElementById('seq-video');
    const section = document.getElementById('scroll-seq');
    const botText = document.querySelector('.seq-text--bot');
    if(!video || !section) return;

    video.pause();

    let targetTime = 0;
    let isSeeking  = false;

    function seek(){
      if(!video.duration || isSeeking) return;
      isSeeking = true;
      video.currentTime = targetTime;
    }

    video.addEventListener('seeked', () => {
      isSeeking = false;
      if(Math.abs(video.currentTime - targetTime) > 0.04) seek();
    });

    window.addEventListener('scroll', () => {
      const top    = section.getBoundingClientRect().top + window.scrollY;
      const height = section.offsetHeight - window.innerHeight;
      const p      = Math.max(0, Math.min(1, (window.scrollY - top) / height));
      targetTime   = p * (video.duration || 0);
      if(botText)  botText.classList.toggle('visible', p > 0.15 && p < 0.82);
      seek();
    }, { passive: true });
  })();

  /* ---- Scroll Reveal ---- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        e.target.classList.add('vis');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -60px 0px' });

  // Regular reveals (exclude pi & rv-h handled separately)
  document.querySelectorAll('.rv').forEach((el, i) => {
    if(el.classList.contains('pi') || el.classList.contains('rv-h')) return;
    el.style.transitionDelay = (i % 5) * .07 + 's';
    revealObs.observe(el);
  });

  // Work grid: stagger by column (3-col layout)
  document.querySelectorAll('.pi').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * 0.08 + 's';
    revealObs.observe(el);
  });

  // Big headings: no forced delay
  document.querySelectorAll('.rv-h').forEach(el => revealObs.observe(el));


  /* ---- Stats count-up ---- */
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(!e.isIntersecting) return;
      const el   = e.target;
      const text = el.textContent.trim();
      const isK  = text.endsWith('K');
      const total = isK ? parseFloat(text) * 1000 : parseInt(text);
      statObs.unobserve(el);
      let t0 = null;
      function tick(ts) {
        if(!t0) t0 = ts;
        const p    = Math.min((ts - t0) / 1500, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const cur  = Math.round(ease * total);
        el.textContent = isK ? Math.round(cur / 1000) + 'K' : cur;
        if(p < 1) requestAnimationFrame(tick);
        else el.textContent = text;
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.asn').forEach(el => statObs.observe(el));

  /* ---- Page Transition ---- */
  const overlay = document.getElementById('page-transition');
  if(!overlay) return;

  let navigating = false;
  function navigateTo(url) {
    if(navigating) return;
    navigating = true;
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = url; }, 420);
  }

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if(!href) return;
    if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
       href.startsWith('http') || href.startsWith('//') || link.target === '_blank') return;
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.href); });
  });

  window.addEventListener('pageshow', e => {
    if(e.persisted) {
      // back/forward cache: fade out the overlay
      overlay.style.transition = 'none';
      overlay.classList.add('active');
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity .4s ease';
        requestAnimationFrame(() => { overlay.classList.remove('active'); navigating = false; });
      });
    } else {
      overlay.classList.remove('active');
      navigating = false;
    }
  });

  /* ---- Hero scroll — fade text on scroll ---- */
  const heroVid = document.querySelector('.hvid');
  if(heroVid) {
    heroVid.style.transition = 'opacity .35s ease, transform .35s ease';
    let revealed = false;
    window.addEventListener('scroll', () => {
      if(window.scrollY > 40 && !revealed) {
        revealed = true;
        heroVid.style.opacity   = '1';
        heroVid.style.transform = 'scale(1.06)';
        if(heroTxt) heroTxt.style.opacity = '0';
      } else if(window.scrollY <= 40 && revealed) {
        revealed = false;
        heroVid.style.opacity   = '0.18';
        heroVid.style.transform = 'scale(1)';
        if(heroTxt) heroTxt.style.opacity = '1';
      }
    }, { passive: true });
  }

  /* ---- Mobile Nav ---- */
  const burger     = document.querySelector('.nav-burger');
  const navOverlay = document.querySelector('.nav-overlay');
  const closeBtn   = document.querySelector('.nav-overlay-close');
  if(burger && navOverlay) {
    burger.addEventListener('click', () => navOverlay.classList.toggle('open'));
    if(closeBtn) closeBtn.addEventListener('click', () => navOverlay.classList.remove('open'));
    navOverlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navOverlay.classList.remove('open'));
    });
  }

})();
