/* ===================================================
   main.js — scramble, reveals, carousels, video
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

  /* ---- Desktop-only enhancements ---- */
  const isTouch = window.matchMedia('(hover: none)').matches;

  if(!isTouch) {
    /* ---- Nav hover scramble ---- */
    document.querySelectorAll('.nr a').forEach(link => {
      const orig = link.textContent;
      link.addEventListener('mouseenter', () => scramble(link, orig, 380));
    });
  }


  /* ---- Client logos: show text fallback if image fails to load ---- */
  document.querySelectorAll('.clogo img').forEach(img => {
    function failed(){ img.closest('.clogo')?.classList.add('img-failed'); }
    if(img.complete && img.naturalWidth === 0) failed();
    else {
      img.addEventListener('error', failed);
      img.addEventListener('load', () => {
        if(img.naturalWidth === 0) failed();
      });
    }
  });

  /* ---- Gallery videos: pause off-screen to save CPU/bandwidth ---- */
  (function(){
    const gvids = document.querySelectorAll('video.pg-img, video.ph-cover');
    if(!gvids.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const v = e.target;
        if(e.isIntersecting){
          const p = v.play();
          if(p && p.catch) p.catch(()=>{});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.15, rootMargin: '900px 0px' });
    gvids.forEach(v => io.observe(v));
  })();

  /* ---- Gallery / hero videos: click to toggle sound (mutes others) ---- */
  (function(){
    const vids = document.querySelectorAll('video.pg-img, video.ph-cover');
    if(!vids.length) return;
    const ICON_OFF = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
    const ICON_ON  = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
    const entries = [];
    vids.forEach(v => {
      const wrap = document.createElement('div');
      wrap.className = 'vid-snd';
      if(v.classList.contains('ph-cover')) wrap.classList.add('vid-snd--cover');
      v.parentNode.insertBefore(wrap, v);
      wrap.appendChild(v);
      const bar = document.createElement('div');
      bar.className = 'vid-snd-bar';
      const hint = document.createElement('span');
      hint.className = 'vid-snd-hint';
      hint.textContent = 'Click to unmute';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vid-snd-btn';
      btn.setAttribute('aria-label', 'Unmute');
      btn.innerHTML = ICON_OFF + '<span class="vid-snd-lbl">Sound</span>';
      bar.appendChild(hint);
      bar.appendChild(btn);
      wrap.appendChild(bar);
      entries.push({ wrap, v, btn });
    });
    function activate(target){
      entries.forEach(({ wrap, v, btn }) => {
        if(v === target){
          v.muted = false; v.volume = 0.8;
          wrap.classList.add('snd-on');
          btn.innerHTML = ICON_ON + '<span class="vid-snd-lbl">On</span>';
          btn.setAttribute('aria-label', 'Mute');
        } else {
          v.muted = true;
          wrap.classList.remove('snd-on');
          btn.innerHTML = ICON_OFF + '<span class="vid-snd-lbl">Sound</span>';
          btn.setAttribute('aria-label', 'Unmute');
        }
        const p = v.play(); if(p && p.catch) p.catch(()=>{});
      });
    }
    function mute(target, btn, wrap){
      target.muted = true;
      wrap.classList.remove('snd-on');
      btn.innerHTML = ICON_OFF + '<span class="vid-snd-lbl">Sound</span>';
      btn.setAttribute('aria-label', 'Unmute');
    }
    entries.forEach(({ wrap, v, btn }) => {
      wrap.addEventListener('click', e => {
        e.preventDefault();
        if(v.muted) activate(v);
        else mute(v, btn, wrap);
      });
    });
  })();

  /* ---- Work grid hover videos: lazy load + play on hover (desktop) or in-view (touch) ---- */
  (function(){
    const vids = document.querySelectorAll('.wc-vid[data-src]');
    if(!vids.length) return;
    const isTouch = window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;

    function load(v){
      if(v.dataset.loaded) return;
      v.dataset.loaded = '1';
      v.src = v.dataset.src;
    }
    function play(v){
      load(v);
      v.muted = true;
      v.setAttribute('playsinline', '');
      const p = v.play();
      if(p && p.catch) p.catch(() => {});
    }

    if(isTouch){
      // Touch (mobile/iPad): no autoplay — show the static poster only (perf).
      return;
    }
    // Desktop: load + play on hover, pause on leave
    vids.forEach(v => {
      const card = v.closest('.wc');
      if(!card) return;
      card.addEventListener('mouseenter', () => play(v));
      card.addEventListener('mouseleave', () => { v.pause(); v.currentTime = 0; });
    });
  })();

  /* ---- Nav: solid backdrop after scroll (RAF-throttled) ---- */
  (function(){
    const nav = document.querySelector('nav');
    if(!nav) return;
    let lastState = false, ticking = false;
    function tick(){
      ticking = false;
      const s = window.scrollY > 40;
      if(s !== lastState){ lastState = s; nav.classList.toggle('scrolled', s); }
    }
    tick();
    window.addEventListener('scroll', () => {
      if(!ticking){ ticking = true; requestAnimationFrame(tick); }
    }, { passive: true });
  })();

  /* ---- Work page hero text reveal (split letters, stagger up) ---- */
  (function(){
    const phTitle = document.querySelector('.ph-title');
    const phTags  = document.querySelectorAll('.ph-tag');
    const phYear  = document.querySelector('.ph-year');
    if(!phTitle && !phYear && !phTags.length) return;

    function splitLetters(el, baseDelay){
      const lines = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = '';
      lines.forEach((line, li) => {
        // strip any inner tags, keep text only
        const tmp = document.createElement('div');
        tmp.innerHTML = line;
        const text = tmp.textContent;

        const lineEl = document.createElement('span');
        lineEl.className = 'ph-tline';
        [...text].forEach((ch, ci) => {
          const sp = document.createElement('span');
          sp.className = 'ph-tletter';
          sp.textContent = (ch === ' ') ? ' ' : ch;
          sp.style.animationDelay = (baseDelay + (li * 0.18) + (ci * 0.035)) + 's';
          lineEl.appendChild(sp);
        });
        el.appendChild(lineEl);
        if(li < lines.length - 1) el.appendChild(document.createElement('br'));
      });
    }

    if(phTitle && !phTitle.dataset.split){
      phTitle.dataset.split = '1';
      splitLetters(phTitle, 0.15);
    }

    if(phTags.length){
      phTags.forEach((tag, i) => {
        tag.style.animationDelay = (0.05 + i * 0.08) + 's';
        tag.classList.add('ph-tag--anim');
      });
    }

    if(phYear){
      phYear.style.animationDelay = '0.6s';
      phYear.classList.add('ph-year--anim');
    }

    // trigger
    requestAnimationFrame(() => {
      if(phTitle) phTitle.classList.add('ph-in');
    });
  })();

  /* ---- Scroll Sequence — simple autoplay loop (scrubbing removed for perf) ---- */
  (function(){
    const video   = document.getElementById('seq-video');
    const section = document.getElementById('scroll-seq');
    const botText = document.querySelector('.seq-text--bot');
    if(!video || !section) return;

    video.loop = true;
    video.muted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('autoplay', '');
    if(botText) botText.classList.add('visible');

    const tryPlay = () => { const p = video.play(); if(p && p.catch) p.catch(()=>{}); };

    // Only play while the section is on screen (saves CPU/GPU + battery)
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if(e.isIntersecting) tryPlay();
          else video.pause();
        });
      }, { threshold: 0.1 });
      io.observe(section);
    } else {
      tryPlay();
    }
  })();

  /* ---- Featured carousel — auto-scroll, infinite, drag, arrows ---- */
  (function(){
    const track  = document.getElementById('fs-track');
    if(!track) return;
    const origCards = Array.from(track.children);
    if(!origCards.length) return;

    /* Split each title into staggered letter spans */
    origCards.forEach(card => {
      const t = card.querySelector('.fs-card-t');
      if(!t || t.dataset.split === '1') return;
      const text = t.textContent;
      t.dataset.split = '1';
      t.innerHTML = '';
      const chars = [...text];
      chars.forEach((ch, i) => {
        const sp = document.createElement('span');
        sp.className = 'fs-letter';
        sp.textContent = (ch === ' ') ? ' ' : ch;
        sp.style.transitionDelay = (i * 0.025) + 's';
        t.appendChild(sp);
      });
    });

    // Duplicate once for seamless wrap-around — clones keep autoplay+loop
    origCards.forEach(c => {
      const clone = c.cloneNode(true);
      clone.dataset.clone = '1';
      track.appendChild(clone);
    });

    // No autoplay (perf): cards show a static poster and only play on hover.
    track.querySelectorAll('video').forEach(v => {
      v.muted = true;
      v.loop  = true;
      v.removeAttribute('autoplay');
      v.setAttribute('playsinline', '');
    });
    track.querySelectorAll('.fs-card').forEach(card => {
      const v = card.querySelector('video');
      if(!v) return;
      card.addEventListener('mouseenter', () => { const p = v.play(); if(p && p.catch) p.catch(()=>{}); });
      card.addEventListener('mouseleave', () => { v.pause(); });
    });

    const cards  = origCards;
    const curEl  = document.getElementById('fs-cur');
    const totEl  = document.getElementById('fs-tot');
    const prev   = document.querySelector('.fs-arrow[data-dir="prev"]');
    const next   = document.querySelector('.fs-arrow[data-dir="next"]');
    const section = document.getElementById('featured');
    if(totEl) totEl.textContent = String(cards.length).padStart(2, '0');

    /* ── State ───────────────────────────────────────────────── */
    const SPEED       = 0.5;
    const PAUSE_MS    = 4000;
    const DRAG_PX     = 5;
    let onScreen   = true;
    let pauseUntil = 0;
    let hovered    = false;
    let dragging   = false;
    let dragMoved  = 0;
    let suppressClick = false;

    function bumpPause(){ pauseUntil = performance.now() + PAUSE_MS; }
    function stepWidth(){
      const c = cards[0];
      if(!c) return 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return c.offsetWidth + gap;
    }
    function halfWidth(){ return track.scrollWidth / 2; }
    function wrap(){
      const h = halfWidth();
      if(track.scrollLeft >= h) track.scrollLeft -= h;
      else if(track.scrollLeft < 0) track.scrollLeft += h;
    }

    /* ── Auto-scroll disabled — manual navigation only (arrows/drag) ── */

    /* ── Arrows ──────────────────────────────────────────────── */
    function go(dir){
      bumpPause();
      track.scrollBy({ left: stepWidth() * dir, behavior: 'smooth' });
    }
    if(prev) prev.addEventListener('click', e => { e.preventDefault(); go(-1); });
    if(next) next.addEventListener('click', e => { e.preventDefault(); go( 1); });

    /* ── Counter ─────────────────────────────────────────────── */
    function updateCounter(){
      const w = stepWidth();
      if(!w) return;
      let i = Math.round(track.scrollLeft / w) % cards.length;
      if(i < 0) i += cards.length;
      if(curEl) curEl.textContent = String(i + 1).padStart(2, '0');
    }
    track.addEventListener('scroll', updateCounter, { passive: true });
    window.addEventListener('resize',  updateCounter);
    updateCounter();

    /* ── Hover pause (only on cards, not whole section) ─────── */
    // attach to live + cloned cards
    track.querySelectorAll('.fs-card').forEach(card => {
      card.addEventListener('mouseenter', () => { hovered = true; });
      card.addEventListener('mouseleave', () => { hovered = false; bumpPause(); });
    });

    /* ── Drag-to-scroll, with click suppression on real drags ─ */
    let startX = 0, startScroll = 0;
    track.addEventListener('mousedown', e => {
      if(e.target.closest('.fs-arrow')) return;  // let arrows handle their click
      dragging  = true;
      dragMoved = 0;
      startX    = e.pageX;
      startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if(!dragging) return;
      const dx = e.pageX - startX;
      dragMoved = Math.abs(dx);
      if(dragMoved > DRAG_PX){
        e.preventDefault();
        track.scrollLeft = startScroll - dx;
        wrap();
      }
    });
    window.addEventListener('mouseup', () => {
      if(!dragging) return;
      dragging = false;
      track.style.cursor = '';
      if(dragMoved > DRAG_PX){
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
      }
      bumpPause();
    });
    // Swallow any click that follows a real drag (so cards don't navigate)
    track.addEventListener('click', e => {
      if(suppressClick){ e.preventDefault(); e.stopPropagation(); }
    }, { capture: true });

    /* ── Touch ───────────────────────────────────────────────── */
    track.addEventListener('touchstart', () => { hovered = true;  }, { passive: true });
    track.addEventListener('touchend',   () => { hovered = false; bumpPause(); }, { passive: true });

    /* ── Off-screen pause ────────────────────────────────────── */
    if(section){
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { onScreen = e.isIntersecting; });
      }, { rootMargin: '50px 0px' });
      io.observe(section);
    }
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

  /* ---- Work pages: replace .pnav with a "More Work" carousel ---- */
  (function(){
    const pnav = document.querySelector('.pnav');
    if(!pnav) return;
    if(!window.location.pathname.includes('/work/')) return;

    const projects = [
      { href:'jean-paul-gaultier.html', name:'Jean Paul Gaultier', tags:'Cinematic · 3D · Luxury', media:'../assets/work/JEAN PAUL GAUTIER/preview_web.mp4?v=8' },
      { href:'ledger.html',             name:'Ledger',             tags:'Motion · 3D · Branding', media:'../assets/work/LEDGER/ledger_hero_web.mp4?v=8' },
      { href:'vibram.html',             name:'Vibram Light ID',    tags:'Product · 3D · Lighting',media:'../assets/work/VIBRAM/3_web.mp4?v=8' },
      { href:'lgc-rising.html',         name:'LGC Rising',         tags:'Motion · 3D',            media:'../assets/work/lgc-rising/lgc_broadcast_web.mp4?v=8' },
      { href:'formule-1.html',          name:'Formula 1 3D',       tags:'CGI · Sport',            media:'../assets/work/formule 1/FORMULE1ROAD.DetailLightingOnly.mp4?v=8' },
      { href:'windows.html',            name:'Windows',            tags:'3D Motion',              media:'../assets/work/Windows/new_win_compressed.mp4?v=8' },
      { href:'apple.html',              name:'Apple',              tags:'Motion · 3D',            media:'../assets/work/apple/apple_cable_web.mp4?v=8' },
      { href:'burberry.html',           name:'Burberry',           tags:'Fashion · 3D',           media:'../assets/work/burberry/burberry_new.mp4?v=8' },
      { href:'oakley.html',             name:'Oakley',             tags:'Sport · 3D',             media:'../assets/work/Oakley/oakley.mp4?v=8' },
      { href:'guerlain.html',           name:'Guerlain',           tags:'Luxury · 3D',            media:'../assets/work/guerlain/1INSTADISLOQUE_2.mp4?v=8' },
      { href:'mbappe-nike.html',        name:'Mbappé Nike',        tags:'Sport · Motion',         media:'../assets/work/MBAPPE nike/mbappe.mp4?v=8' },
      { href:'cardze.html',             name:'Cardze',             tags:'Motion · Branding',      media:'../assets/work/Cardze/CLONER bis.mp4?v=8' },
      { href:'valorant-omen.html',      name:'Valorant Omen',      tags:'Cinematic · CGI',        media:'../assets/work/Valorant Omen cinematic/walk_web.mp4?v=8' },
      { href:'vivienne-westwood-bag.html', name:'Vivienne Westwood', tags:'Fashion · 3D',         media:'../assets/work/Vivienne westwood/gif1.mp4?v=8' },
      { href:'thermos.html',            name:'Thermos',            tags:'Product · 3D',           media:'../assets/work/thermos/thermos_web.mp4?v=8' },
      { href:'truck.html',              name:'Truck',              tags:'3D Motion',              media:'../assets/work/TRUCK/TESTT1_web.mp4?v=8' },
      { href:'prada.html',              name:'Prada Monolith',     tags:'Fashion · 3D',           media:'../assets/work/prada/prada_top_web.mp4?v=8' }
    ];

    // Curated still frames (same covers as the home grid) used as poster images
    const covers = {
      'jean-paul-gaultier.html':'../assets/work/JEAN PAUL GAUTIER/cover.jpg',
      'ledger.html':'../assets/work/LEDGER/IMAGE/1.png',
      'vibram.html':'../assets/work/VIBRAM/light_id_web.jpg',
      'lgc-rising.html':'../assets/work/lgc-rising/cover.jpg',
      'formule-1.html':'../assets/work/formule 1/cover.jpg',
      'windows.html':'../assets/work/Windows/f3d4f822-114f-44f5-860e-eaa4bee86b0c_rw_1920.webp',
      'apple.html':'../assets/work/apple/cover.jpg',
      'burberry.html':'../assets/work/burberry/fc68d6eb-bfdf-4da8-ac81-b415e9d67115_rw_600.png',
      'oakley.html':'../assets/work/Oakley/1.webp',
      'guerlain.html':'../assets/work/guerlain/frame1.jpg',
      'mbappe-nike.html':'../assets/work/MBAPPE nike/cover.jpg',
      'cardze.html':'../assets/work/Cardze/cover.jpg',
      'valorant-omen.html':'../assets/work/Valorant Omen cinematic/cover.jpg',
      'vivienne-westwood-bag.html':'../assets/work/Vivienne westwood/11.webp',
      'thermos.html':'../assets/work/thermos/rendericer_Main_0021.webp',
      'truck.html':'../assets/work/TRUCK/cover.jpg',
      'prada.html':'../assets/work/prada/d3fabd1e-9166-4707-82e6-76c2b685b7fc_rw_1920.jpg',
      'salomon.html':'../assets/work/SALOMON/frame-01.jpg'
    };

    const currentFile = window.location.pathname.split('/').pop();
    const others = projects.filter(p => p.href !== currentFile);

    const section = document.createElement('section');
    section.id = 'work-more';
    section.className = 'work-more-sec';
    section.innerHTML = `
      <div class="fs-head">
        <div class="slb fs-slb">More Work — Explore</div>
        <div class="fs-nav">
          <span class="fs-counter"><b id="wm-cur">01</b><i>/</i><span id="wm-tot">${String(others.length).padStart(2,'0')}</span></span>
          <button class="fs-arrow" data-dir="prev" aria-label="Previous"><span class="fs-arrow-tip">←</span></button>
          <button class="fs-arrow" data-dir="next" aria-label="Next"><span class="fs-arrow-tip">→</span></button>
        </div>
      </div>
      <div class="fs-track" id="wm-track">
        ${others.map((p, i) => `
          <a class="fs-card" href="${p.href}">
            <video class="fs-card-media" src="${p.media}" poster="${covers[p.href] || p.media.replace(/\.mp4$/, '.poster.jpg')}" muted loop playsinline preload="none"></video>
            <div class="fs-card-info">
              <span class="fs-card-tags">${p.tags}</span>
              <span class="fs-card-t">${p.name}</span>
              <span class="fs-card-cta">View case ↗</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;

    pnav.parentNode.replaceChild(section, pnav);

    // Init carousel logic (similar to home's)
    const track  = section.querySelector('#wm-track');
    const cards  = Array.from(track.children);
    const curEl  = section.querySelector('#wm-cur');
    const prev   = section.querySelector('.fs-arrow[data-dir="prev"]');
    const next   = section.querySelector('.fs-arrow[data-dir="next"]');

    // Split letters on card titles for the stagger hover effect
    cards.forEach(card => {
      const t = card.querySelector('.fs-card-t');
      if(!t) return;
      const text = t.textContent;
      t.innerHTML = '';
      [...text].forEach((ch, i) => {
        const sp = document.createElement('span');
        sp.className = 'fs-letter';
        sp.textContent = (ch === ' ') ? ' ' : ch;
        sp.style.transitionDelay = (i * 0.025) + 's';
        t.appendChild(sp);
      });
    });

    // Clone for seamless wrap
    cards.forEach(c => {
      const clone = c.cloneNode(true);
      clone.dataset.clone = '1';
      track.appendChild(clone);
    });
    track.querySelectorAll('video').forEach(v => {
      v.muted = true; v.loop = true;
      v.removeAttribute('autoplay');
      v.setAttribute('playsinline','');
    });
    // No autoplay: play on hover only (static poster otherwise).
    track.querySelectorAll('.fs-card').forEach(card => {
      const v = card.querySelector('video');
      if(!v) return;
      card.addEventListener('mouseenter', () => { const p = v.play(); if(p && p.catch) p.catch(()=>{}); });
      card.addEventListener('mouseleave', () => { v.pause(); });
    });

    const SPEED = 0.5, PAUSE_MS = 4000, DRAG_PX = 5;
    let onScreen = true, pauseUntil = 0, hovered = false, dragging = false, dragMoved = 0, suppressClick = false;
    const bumpPause = () => { pauseUntil = performance.now() + PAUSE_MS; };
    const stepWidth = () => { const c = cards[0]; if(!c) return 0; const gap = parseFloat(getComputedStyle(track).gap)||0; return c.offsetWidth + gap; };
    const halfWidth = () => track.scrollWidth / 2;
    const wrap = () => { const h = halfWidth(); if(track.scrollLeft >= h) track.scrollLeft -= h; else if(track.scrollLeft < 0) track.scrollLeft += h; };

    /* Auto-scroll disabled — manual navigation only (arrows/drag) */

    function go(dir){ bumpPause(); track.scrollBy({ left: stepWidth() * dir, behavior: 'smooth' }); }
    if(prev) prev.addEventListener('click', e => { e.preventDefault(); go(-1); });
    if(next) next.addEventListener('click', e => { e.preventDefault(); go( 1); });

    function updateCounter(){
      const w = stepWidth(); if(!w) return;
      let i = Math.round(track.scrollLeft / w) % cards.length;
      if(i < 0) i += cards.length;
      if(curEl) curEl.textContent = String(i + 1).padStart(2, '0');
    }
    track.addEventListener('scroll', updateCounter, { passive: true });
    window.addEventListener('resize', updateCounter);
    updateCounter();

    track.querySelectorAll('.fs-card').forEach(card => {
      card.addEventListener('mouseenter', () => { hovered = true;  });
      card.addEventListener('mouseleave', () => { hovered = false; bumpPause(); });
    });

    let startX = 0, startScroll = 0;
    track.addEventListener('mousedown', e => {
      if(e.target.closest('.fs-arrow')) return;
      dragging = true; dragMoved = 0;
      startX = e.pageX; startScroll = track.scrollLeft;
      track.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', e => {
      if(!dragging) return;
      const dx = e.pageX - startX;
      dragMoved = Math.abs(dx);
      if(dragMoved > DRAG_PX){ e.preventDefault(); track.scrollLeft = startScroll - dx; wrap(); }
    });
    window.addEventListener('mouseup', () => {
      if(!dragging) return;
      dragging = false; track.style.cursor = '';
      if(dragMoved > DRAG_PX){ suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
      bumpPause();
    });
    track.addEventListener('click', e => { if(suppressClick){ e.preventDefault(); e.stopPropagation(); } }, { capture: true });

    track.addEventListener('touchstart', () => { hovered = true;  }, { passive: true });
    track.addEventListener('touchend',   () => { hovered = false; bumpPause(); }, { passive: true });

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { onScreen = e.isIntersecting; });
    }, { rootMargin: '50px 0px' });
    io.observe(section);
  })();

  /* ---- Page Transition ---- */
  const overlay = document.getElementById('page-transition');
  if(!overlay) return;

  let navigating = false;
  function navigateTo(url) {
    if(navigating) return;
    navigating = true;
    // Prefetch the target page to warm the cache while overlay fades in
    try {
      const pre = document.createElement('link');
      pre.rel = 'prefetch';
      pre.href = url;
      document.head.appendChild(pre);
    } catch(_){}
    overlay.classList.add('active');
    setTimeout(() => { window.location.href = url; }, 260);
  }

  // Hover-prefetch: warm cache as soon as user hovers an internal link
  const prefetched = new Set();
  function prefetch(url){
    if(prefetched.has(url)) return;
    prefetched.add(url);
    const pre = document.createElement('link');
    pre.rel = 'prefetch';
    pre.href = url;
    document.head.appendChild(pre);
  }

  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if(!href) return;
    if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
       href.startsWith('http') || href.startsWith('//') || link.target === '_blank') return;
    link.addEventListener('mouseenter', () => prefetch(link.href), { passive: true });
    link.addEventListener('touchstart',  () => prefetch(link.href), { passive: true });
    link.addEventListener('click', e => { e.preventDefault(); navigateTo(link.href); });
  });

  window.addEventListener('pageshow', e => {
    if(e.persisted) {
      // back/forward cache restore: instantly clear overlay
      overlay.style.animation = 'none';
      overlay.classList.remove('active');
      overlay.style.opacity = '0';
      navigating = false;
    }
  });

  /* ---- Hero scroll — fade text on scroll (RAF-throttled) ---- */
  const heroVid = document.querySelector('.hvid');
  if(heroVid) {
    heroVid.style.transition = 'opacity .35s ease, transform .35s ease';
    let revealed = false, ticking = false;
    function heroTick(){
      ticking = false;
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
    }
    window.addEventListener('scroll', () => {
      if(!ticking){ ticking = true; requestAnimationFrame(heroTick); }
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
