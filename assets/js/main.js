(() => {
  const body = document.body;
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');

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
      el.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
      observer.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  const introLogo = document.querySelector('.intro-logo-wrap');
  const intro = document.querySelector('.intro');
  const balloon = document.querySelector('.scroll-balloon');
  const star = document.querySelector('.scroll-star');
  const isHome = body.dataset.page === 'home';
  let ticking = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  const points = [
    { p: 0.00, x: 72, y: 42, s: 1.02, r: -7, o: 0.95 },
    { p: 0.14, x: 61, y: 24, s: 0.83, r: 6, o: 0.88 },
    { p: 0.30, x: 12, y: 58, s: 0.78, r: -12, o: 0.82 },
    { p: 0.48, x: 70, y: 60, s: 0.62, r: 10, o: 0.72 },
    { p: 0.68, x: 14, y: 26, s: 0.54, r: -6, o: 0.62 },
    { p: 0.86, x: 78, y: 30, s: 0.45, r: 9, o: 0.55 },
    { p: 1.00, x: 64, y: 68, s: 0.40, r: -4, o: 0.44 }
  ];

  function interpolatePath(progress) {
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

  function updateScrollAnimations() {
    const scrollY = window.scrollY || window.pageYOffset;
    const doc = document.documentElement;
    const maxScroll = Math.max(doc.scrollHeight - window.innerHeight, 1);

    if (isHome && intro && introLogo) {
      const introHeight = intro.offsetHeight || window.innerHeight;
      const introProgress = clamp(scrollY / introHeight, 0, 1);
      const scale = lerp(1, 0.42, introProgress);
      const y = lerp(0, -230, introProgress);
      const opacity = lerp(1, 0, clamp((introProgress - 0.54) / 0.46, 0, 1));
      introLogo.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
      introLogo.style.opacity = opacity.toFixed(3);
    }

    if (isHome && balloon && window.innerWidth > 720) {
      const heroOffset = intro ? intro.offsetHeight : 0;
      const progress = clamp((scrollY - heroOffset * 0.18) / Math.max(maxScroll - heroOffset * 0.18, 1), 0, 1);
      const current = interpolatePath(progress);
      const bob = Math.sin(scrollY * 0.008) * 8;
      balloon.style.left = `${current.x}vw`;
      balloon.style.top = `${current.y}vh`;
      balloon.style.opacity = current.o.toFixed(2);
      balloon.style.transform = `translate3d(-50%, calc(-50% + ${bob}px), 0) scale(${current.s}) rotate(${current.r}deg)`;

      if (star) {
        star.style.left = `${clamp(current.x + 11, 7, 88)}vw`;
        star.style.top = `${clamp(current.y - 15, 9, 75)}vh`;
        star.style.opacity = clamp(current.o - 0.12, 0.18, 0.8).toFixed(2);
        star.style.transform = `translate3d(-50%, -50%, 0) scale(${clamp(current.s * 0.8, 0.38, 0.78)}) rotate(${current.r * -1.5}deg)`;
      }
    }
    ticking = false;
  }

  function requestUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollAnimations);
      ticking = true;
    }
  }
  updateScrollAnimations();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);

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
