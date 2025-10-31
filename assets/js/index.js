// Main app JS cho Blog cá nhân
// Tính năng: hash router, nạp và render bài markdown, dark/light toggle, TOC, search, filter, pagination, copy code
// Viết từng function/module về sau

(function() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  // Icon unicode cho cảm giác auto
  const icons = {
    light: '🌞',
    dark: '🌙',
    auto: '🌓'
  };
  // Kiểm tra localStorage hoặc media query
  function getSavedTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || theme === 'light') return theme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if(btn) btn.textContent = theme === 'dark' ? icons.dark : icons.light;
  }
  // Toggle theme
  function toggleTheme() {
    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }
  // Khởi tạo
  document.addEventListener('DOMContentLoaded', function() {
    if (!btn) return;
    const theme = getSavedTheme();
    applyTheme(theme);
    btn.addEventListener('click', toggleTheme);
  });
})();

// Add copy buttons to code blocks on post pages
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const pres = document.querySelectorAll('main.post pre');
    pres.forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'Copy';
      btn.addEventListener('click', async () => {
        try{
          const code = pre.innerText.replace(/^\s*Copy\s*/,'');
          await navigator.clipboard.writeText(code);
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(()=>{ btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1200);
        }catch(e){ btn.textContent = 'Error'; setTimeout(()=> btn.textContent = 'Copy', 1200); }
      });
      pre.appendChild(btn);
    });
  });
})();

// Typing effect for about title and slogan
(function(){
  function typeElement(el, text, speed, delay){
    const caret = document.createElement('span');
    caret.className = 'typing-caret';
    caret.textContent = '|';
    el.textContent = '';
    el.appendChild(caret);
    let i = 0;
    function tick(){
      if(i < text.length){
        caret.before(document.createTextNode(text.charAt(i++)));
        setTimeout(tick, speed);
      } else {
        caret.remove();
      }
    }
    setTimeout(tick, delay);
  }
  document.addEventListener('DOMContentLoaded', function(){
    const nodes = document.querySelectorAll('[data-typing]');
    nodes.forEach((el, idx)=>{
      const text = el.textContent.trim();
      const delay = parseInt(el.getAttribute('data-typing-delay')||'0',10) + (idx*100);
      const speed = 18; // ms per char
      typeElement(el, text, speed, delay);
    });
  });
})();

// Back to top with progress
(function(){
  const btn = document.getElementById('back-to-top');
  function update(){
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const percent = docH > 0 ? Math.min(100, Math.round((scrollTop/docH)*100)) : 0;
    if(btn){
      btn.style.setProperty('--scroll', percent + '%');
      btn.classList.toggle('show', scrollTop > 200);
    }
  }
  document.addEventListener('scroll', update, { passive: true });
  window.addEventListener('load', update);
  if(btn){
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();

// Hero slider effect: smooth slide transition
(function () {
  const track = document.querySelector('.hero-slider .slides-track');
  const slides = document.querySelectorAll('.hero-slider .slide');
  const dots = document.querySelectorAll('.hero-slider .dot');
  const btnPrev = document.getElementById('prev-slide');
  const btnNext = document.getElementById('next-slide');
  let idx = 0, max = slides.length;
  function showSlide(i) {
    idx = (i+max)%max;
    if(track) track.style.transform = `translateX(-${idx*100}vw)`;
    dots.forEach((d, j) => d.classList.toggle('active', idx===j));
  }
  if(track && slides.length && btnPrev && btnNext) {
    btnPrev.onclick = function(){ showSlide(idx-1); }
    btnNext.onclick = function(){ showSlide(idx+1); }
    dots.forEach((dot, i) => dot.onclick = () => showSlide(i));
    showSlide(idx);
  }
})();

// Featured post slider
(function(){
  const container = document.querySelector('.featured-slider');
  const windowEl = document.querySelector('.featured-slider-window');
  const track = document.querySelector('.featured-slider-track');
  const slides = document.querySelectorAll('.featured-slide');
  const prev = document.querySelector('.featured-slider-prev');
  const next = document.querySelector('.featured-slider-next');
  const dotsWrap = document.querySelector('.featured-slider-dots');
  let dots = [];
  let idx = 0; let timerId = null; const INTERVAL_MS = 3000; let slideW = 0; let perView = 3; let gapPx = 16; let viewportW = 0; let numPages = 1;

  function applyTransform(){ if(track) track.style.transform = `translateX(-${(idx*viewportW)|0}px)`; }

  function measure(){
    if(!windowEl || !track) return;
    // turn off transition during layout
    const prevTransition = track.style.transition;
    track.style.transition = 'none';
    const ww = window.innerWidth;
    perView = ww >= 900 ? 3 : (ww >= 600 ? 2 : 1);
    gapPx = ww >= 900 ? 16 : (ww >= 600 ? 14 : 12);
    viewportW = Math.round(windowEl.getBoundingClientRect().width);
    slideW = Math.round((viewportW - (perView - 1) * gapPx) / perView);
    slides.forEach(s=>{ s.style.minWidth = slideW+'px'; s.style.maxWidth = slideW+'px'; });
    track.style.gap = gapPx + 'px';
    track.style.width = (slides.length * slideW + (slides.length - 1) * gapPx) + 'px';
    numPages = Math.ceil(slides.length / perView);
    buildDots();
    applyTransform();
    // force reflow then restore transition
    void track.offsetHeight; // reflow
    track.style.transition = prevTransition || '';
  }

  function showSlide(i){
    idx = (i + numPages) % numPages;
    applyTransform();
    dots.forEach((d,j)=>d.classList.toggle('active',j===idx));
  }

  function startAuto(){ if(timerId) return; timerId = setInterval(()=> showSlide(idx+1), INTERVAL_MS); }
  function stopAuto(){ if(timerId){ clearInterval(timerId); timerId=null; } }

  function buildDots(){
    if(!dotsWrap) return;
    dotsWrap.innerHTML = '';
    dots = Array.from({length: numPages}).map((_,i)=>{
      const span = document.createElement('span');
      span.className = 'dot' + (i===idx ? ' active' : '');
      span.dataset.slide = String(i+1);
      span.onclick = ()=>{ stopAuto(); showSlide(i); startAuto(); };
      dotsWrap.appendChild(span);
      return span;
    });
  }

  if(track && slides.length && prev && next){
    prev.onclick = ()=>{ stopAuto(); showSlide(idx-1); startAuto(); };
    next.onclick = ()=>{ stopAuto(); showSlide(idx+1); startAuto(); };
    if(container){
      container.addEventListener('mouseenter', stopAuto);
      container.addEventListener('mouseleave', startAuto);
      container.addEventListener('touchstart', stopAuto, {passive:true});
      container.addEventListener('touchend', startAuto, {passive:true});
    }
    window.addEventListener('load', ()=>{ measure(); showSlide(0); startAuto(); });
    window.addEventListener('resize', (function(){ let t; return function(){ clearTimeout(t); t=setTimeout(()=>{ measure(); showSlide(idx); }, 120); }; })());
  }
})();

// One-time intro flyby banner
(function(){
  const flyby = document.querySelector('.intro-flyby');
  const smoke = document.querySelector('.smoke-overlay');
  const seen = localStorage.getItem('introSeen') === 'true';
  function finishIntro(){
    document.body.classList.add('intro-done');
    if(flyby) flyby.style.display = 'none';
    if(smoke) smoke.style.display = 'none';
  }
  if(!flyby || !smoke){
    document.body.classList.add('intro-done');
    return;
  }
  if(seen){
    finishIntro();
    return;
  }
  // Wait smoke fade animation end
  smoke.addEventListener('animationend', function(){
    localStorage.setItem('introSeen','true');
    finishIntro();
  });
})();
