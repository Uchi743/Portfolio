/* ===================================================
   main.js — Cursor, scroll reveal, page transitions, mobile nav
   =================================================== */

(function(){
  'use strict';

  /* ---- Custom Cursor (desktop only) ---- */
  const isTouch = window.matchMedia('(hover: none)').matches;
  if(!isTouch){
    const cur = document.getElementById('cur');
    const ring = document.getElementById('cur-ring');
    if(cur && ring){
      let mx=0,my=0,rx=0,ry=0;
      document.addEventListener('mousemove',e=>{
        mx=e.clientX; my=e.clientY;
        cur.style.left=mx+'px'; cur.style.top=my+'px';
      });
      (function ar(){
        rx+=(mx-rx)*.1; ry+=(my-ry)*.1;
        ring.style.left=rx+'px'; ring.style.top=ry+'px';
        requestAnimationFrame(ar);
      })();
      document.querySelectorAll('a,button,.pi,.bhc,[data-hover]').forEach(el=>{
        el.addEventListener('mouseenter',()=>document.body.classList.add('h'));
        el.addEventListener('mouseleave',()=>document.body.classList.remove('h'));
      });
    }
  }

  /* ---- Scroll Reveal ---- */
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('vis');
        obs.unobserve(e.target);
      }
    });
  },{threshold:.08, rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.rv').forEach((el,i)=>{
    el.style.transitionDelay = (i%5)*.07+'s';
    obs.observe(el);
  });

  /* ---- Page Transition ---- */
  const overlay = document.getElementById('page-transition');
  if(!overlay) return;

  let navigating = false;

  function navigateTo(url){
    if(navigating) return;
    navigating = true;
    overlay.classList.add('active');
    setTimeout(()=>{ window.location.href = url; }, 420);
  }

  // Intercept all internal links
  document.querySelectorAll('a[href]').forEach(link=>{
    const href = link.getAttribute('href');
    if(!href) return;
    // Skip anchors, external, mailto, tel
    if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') ||
       href.startsWith('http') || href.startsWith('//') || link.target === '_blank') return;
    link.addEventListener('click',e=>{
      e.preventDefault();
      navigateTo(link.href);
    });
  });

  // Fade in on page load
  window.addEventListener('pageshow',()=>{
    overlay.style.transition = 'none';
    overlay.classList.add('active');
    requestAnimationFrame(()=>{
      overlay.style.transition = 'opacity .4s ease';
      requestAnimationFrame(()=>{ overlay.classList.remove('active'); navigating=false; });
    });
  });

  /* ---- Hero Scroll — instant 3D → video switch ---- */
  const heroCanvas = document.getElementById('cv');
  const heroVid    = document.querySelector('.hvid');
  if(heroCanvas && heroVid){
    heroCanvas.style.transition = 'opacity .35s ease';
    heroVid.style.transition    = 'opacity .35s ease, transform .35s ease';
    let revealed = false;
    window.addEventListener('scroll', ()=>{
      if(window.scrollY > 40 && !revealed){
        revealed = true;
        heroCanvas.style.opacity = '0';
        heroVid.style.opacity    = '1';
        heroVid.style.transform  = 'scale(1.06)';
      } else if(window.scrollY <= 40 && revealed){
        revealed = false;
        heroCanvas.style.opacity = '1';
        heroVid.style.opacity    = '0.18';
        heroVid.style.transform  = 'scale(1)';
      }
    }, { passive: true });
  }

  /* ---- Mobile Nav ---- */
  const burger = document.querySelector('.nav-burger');
  const navOverlay = document.querySelector('.nav-overlay');
  const closeBtn = document.querySelector('.nav-overlay-close');
  if(burger && navOverlay){
    burger.addEventListener('click',()=>navOverlay.classList.toggle('open'));
    if(closeBtn) closeBtn.addEventListener('click',()=>navOverlay.classList.remove('open'));
    navOverlay.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',()=>navOverlay.classList.remove('open'));
    });
  }

})();
