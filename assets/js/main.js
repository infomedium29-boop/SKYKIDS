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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let ticking = false;
  let introDistance = 1;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;
  const isMobile = () => window.innerWidth <= 720;

  function updateMetrics() {
    introDistance = intro ? Math.max(intro.offsetHeight - window.innerHeight, 1) : 1;
  }

  function updateIntro() {
    if (page !== 'home' || !intro || !introLogo || reducedMotion.matches) {
      ticking = false;
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset;
    const progress = clamp(scrollY / introDistance, 0, 1);
    const mobile = isMobile();
    const scale = mobile ? lerp(1.02, 0.32, progress) : lerp(1.08, 0.26, progress);
    const y = mobile ? lerp(0, -185, progress) : lerp(0, -265, progress);
    const opacity = lerp(1, 0, clamp((progress - 0.78) / 0.22, 0, 1));

    introLogo.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    introLogo.style.opacity = opacity.toFixed(3);

    if (header) {
      const headerProgress = clamp((progress - 0.70) / 0.30, 0, 1);
      header.classList.toggle('is-visible', headerProgress > 0.02 || scrollY > introDistance);
      header.style.opacity = headerProgress.toFixed(3);
      header.style.transform = `translate3d(0, ${lerp(-14, 0, headerProgress)}px, 0)`;
      header.style.pointerEvents = headerProgress > 0.86 ? 'auto' : 'none';
    }

    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateIntro);
      ticking = true;
    }
  }

  updateMetrics();
  updateIntro();
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


  // Kratke, lagane page-transition animacije za ključne stranice.
  // Nema scroll animacija i nema stalnog opterećenja mobitela.
  const transitionMap = {
    'o-nama.html': { type: 'balloon', icon: 'assets/img/balon.svg', label: 'SkyKids balon' },
    'paketi.html': { type: 'star', icon: 'assets/img/zvjezda.svg', label: 'SkyKids zvijezda' },
    'galerija.html': { type: 'plane', icon: 'assets/img/avion.svg', label: 'SkyKids avion' }
  };

  function getInternalTarget(link) {
    try {
      const url = new URL(link.getAttribute('href'), window.location.href);
      if (url.origin !== window.location.origin) return null;
      const filename = url.pathname.split('/').pop() || 'index.html';
      if (!transitionMap[filename]) return null;
      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      if (filename === currentFile && !url.hash) return null;
      return { url, ...transitionMap[filename] };
    } catch (error) {
      return null;
    }
  }

  function createTransitionOverlay(data, mode = 'in') {
    const existing = document.querySelector('.page-transition');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = `page-transition page-transition--${data.type} page-transition--${mode}`;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="page-transition__soft page-transition__soft--one"></div>
      <div class="page-transition__soft page-transition__soft--two"></div>
      <img class="page-transition__icon" src="${data.icon}" alt="${data.label}" decoding="async">
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function playTransition(data) {
    if (reducedMotion.matches) return;

    const overlay = createTransitionOverlay(data, 'in');
    window.requestAnimationFrame(() => overlay.classList.add('is-active'));

    window.setTimeout(() => {
      overlay.classList.add('is-leaving');
      window.setTimeout(() => overlay.remove(), 360);
    }, 520);
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    const target = getInternalTarget(link);
    if (!target) return;

    link.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;

      // Ne zaustavljamo klik i ne pokrećemo izlaznu animaciju.
      // Samo zapamtimo koja se ulazna animacija treba prikazati na novoj stranici.
      try {
        sessionStorage.setItem('skykidsPageTransition', JSON.stringify({ type: target.type, icon: target.icon, label: target.label }));
      } catch (error) {}
    });
  });

  try {
    const savedTransition = sessionStorage.getItem('skykidsPageTransition');
    if (savedTransition) {
      sessionStorage.removeItem('skykidsPageTransition');
      const data = JSON.parse(savedTransition);
      if (data && data.icon && data.type) {
        playTransition(data);
      }
    }
  } catch (error) {}

})();
