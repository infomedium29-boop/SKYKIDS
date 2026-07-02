(() => {
  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const header = document.querySelector('.site-header');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 6, 5) * 55}ms`;
      observer.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  const page = body.dataset.page || '';
  const introLogo = document.querySelector('.intro-logo-wrap');
  const intro = document.querySelector('.intro');
  const balloon = document.querySelector('.scroll-balloon');
  const aboutStar = document.querySelector('.scroll-star-page');
  const galleryPlane = document.querySelector('.scroll-plane-page');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;
  let metrics = {
    maxScroll: 1,
    introDistance: 1,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const isMobile = () => metrics.viewportW <= 720;

  const pathHome = [
    { p: 0.00, x: 78, y: 48, s: 1.00, r: -7, o: 0.00 },
    { p: 0.08, x: 71, y: 27, s: 0.95, r: 5, o: 0.88 },
    { p: 0.24, x: 13, y: 55, s: 0.82, r: -13, o: 0.82 },
    { p: 0.43, x: 72, y: 62, s: 0.70, r: 10, o: 0.74 },
    { p: 0.62, x: 15, y: 30, s: 0.58, r: -7, o: 0.66 },
    { p: 0.82, x: 80, y: 35, s: 0.48, r: 8, o: 0.56 },
    { p: 1.00, x: 65, y: 70, s: 0.42, r: -4, o: 0.44 }
  ];

  const pathAbout = [
    { p: 0.00, x: 83, y: 26, s: 0.90, r: 0, o: 0.76 },
    { p: 0.20, x: 68, y: 58, s: 0.75, r: 18, o: 0.70 },
    { p: 0.42, x: 18, y: 35, s: 0.72, r: -16, o: 0.65 },
    { p: 0.63, x: 22, y: 72, s: 0.60, r: 20, o: 0.55 },
    { p: 0.82, x: 80, y: 54, s: 0.70, r: -12, o: 0.52 },
    { p: 1.00, x: 58, y: 22, s: 0.55, r: 10, o: 0.44 }
  ];

  const pathGallery = [
    { p: 0.00, x: 8, y: 34, s: 0.88, r: -5, o: 0.78 },
    { p: 0.18, x: 64, y: 22, s: 0.78, r: 8, o: 0.74 },
    { p: 0.36, x: 82, y: 62, s: 0.72, r: -10, o: 0.66 },
    { p: 0.56, x: 18, y: 70, s: 0.62, r: 7, o: 0.58 },
    { p: 0.78, x: 70, y: 42, s: 0.58, r: -8, o: 0.52 },
    { p: 1.00, x: 92, y: 26, s: 0.44, r: 5, o: 0.38 }
  ];

  function updateMetrics() {
    const doc = document.documentElement;
    metrics.viewportW = window.innerWidth;
    metrics.viewportH = window.innerHeight;
    metrics.maxScroll = Math.max(doc.scrollHeight - metrics.viewportH, 1);
    metrics.introDistance = intro ? Math.max(intro.offsetHeight - metrics.viewportH, 1) : 1;
  }

  function interpolatePath(points, progress) {
    const p = clamp(progress, 0, 1);
    let a = points[0];
    let b = points[points.length - 1];
    for (let i = 0; i < points.length - 1; i += 1) {
      if (p >= points[i].p && p <= points[i + 1].p) {
        a = points[i];
        b = points[i + 1];
        break;
      }
    }
    const local = (p - a.p) / Math.max((b.p - a.p), 0.0001);
    return {
      x: lerp(a.x, b.x, local),
      y: lerp(a.y, b.y, local),
      s: lerp(a.s, b.s, local),
      r: lerp(a.r, b.r, local),
      o: lerp(a.o, b.o, local)
    };
  }

  function pageProgress(offsetStart = 0) {
    return clamp(((window.scrollY || window.pageYOffset) - offsetStart) / Math.max(metrics.maxScroll - offsetStart, 1), 0, 1);
  }

  function renderMotion(el, current, options = {}) {
    if (!el) return;
    const mobile = isMobile();
    const edgeClampMin = mobile ? 11 : 6;
    const edgeClampMax = mobile ? 89 : 94;
    const x = clamp(current.x, edgeClampMin, edgeClampMax);
    const y = clamp(current.y, mobile ? 14 : 12, mobile ? 78 : 82);
    const bob = mobile ? 0 : (options.bob || 0);
    const scaleMultiplier = mobile ? (options.mobileScale || 0.68) : 1;
    const scaleX = options.flip ? -1 : 1;
    const opacity = typeof options.opacity === 'number' ? options.opacity : current.o;

    el.style.opacity = clamp(opacity, 0, 1).toFixed(2);
    el.style.transform = `translate3d(calc(${x}vw - 50%), calc(${y}vh - 50% + ${bob}px), 0) scaleX(${scaleX}) scale(${current.s * scaleMultiplier}) rotate(${current.r}deg)`;
  }

  function updateScrollAnimations() {
    const scrollY = window.scrollY || window.pageYOffset;
    const mobile = isMobile();

    if (reducedMotion.matches) {
      ticking = false;
      return;
    }

    if (page === 'home' && intro && introLogo) {
      const introProgress = clamp(scrollY / metrics.introDistance, 0, 1);
      const scale = mobile ? lerp(1.02, 0.32, introProgress) : lerp(1.08, 0.26, introProgress);
      const y = mobile ? lerp(0, -185, introProgress) : lerp(0, -265, introProgress);
      const opacity = lerp(1, 0, clamp((introProgress - 0.78) / 0.22, 0, 1));
      introLogo.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      introLogo.style.opacity = opacity.toFixed(3);

      if (header) {
        const headerProgress = clamp((introProgress - 0.70) / 0.30, 0, 1);
        header.classList.toggle('is-visible', headerProgress > 0.02 || scrollY > metrics.introDistance);
        header.style.opacity = headerProgress.toFixed(3);
        header.style.transform = `translate3d(0, ${lerp(-14, 0, headerProgress)}px, 0)`;
        header.style.pointerEvents = headerProgress > 0.86 ? 'auto' : 'none';
      }

      if (balloon) {
        const start = metrics.introDistance + 30;
        const progress = pageProgress(start);
        const current = interpolatePath(pathHome, progress);
        const reveal = clamp((scrollY - start) / 220, 0, 1);
        const bob = Math.sin(scrollY * 0.008) * 8;
        renderMotion(balloon, current, {
          bob,
          mobileScale: 0.56,
          opacity: current.o * reveal
        });
      }
    }

    if (page === 'about' && aboutStar) {
      const current = interpolatePath(pathAbout, pageProgress(0));
      renderMotion(aboutStar, current, {
        bob: Math.sin(scrollY * 0.01) * 7,
        mobileScale: 0.62
      });
    }

    if (page === 'gallery' && galleryPlane) {
      const current = interpolatePath(pathGallery, pageProgress(0));
      renderMotion(galleryPlane, current, {
        bob: Math.sin(scrollY * 0.008) * 10,
        mobileScale: 0.58
      });
    }

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollAnimations);
      ticking = true;
    }
  }

  updateMetrics();
  updateScrollAnimations();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', () => {
    updateMetrics();
    requestUpdate();
  }, { passive: true });
  window.addEventListener('load', () => {
    updateMetrics();
    requestUpdate();
  });

  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const img = lightbox.querySelector('img');
    const close = lightbox.querySelector('button');
    document.querySelectorAll('.gallery-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        img.src = item.getAttribute('href');
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      img.src = '';
    };
    close?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

  const form = document.querySelector('.reservation-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      const key = form.querySelector('input[name="access_key"]')?.value || '';
      if (key.includes('YOUR_WEB3FORMS_ACCESS_KEY')) {
        event.preventDefault();
        alert('Forma je spremna, ali prije slanja treba upisati stvarni Web3Forms access key.');
      }
    });
  }
})();
