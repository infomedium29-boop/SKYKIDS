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

    reveals.forEach((el) => {
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


  const nativeDateInput = document.querySelector('.native-date-input');
  const dateDisplay = document.querySelector('.date-display');
  const formattedDateInput = document.querySelector('#datum-formatirano');
  const datePickerTrigger = document.querySelector('.date-picker-wrap');
  if (nativeDateInput && dateDisplay && formattedDateInput) {
    const formatDate = (value) => {
      if (!value) return '';
      const [year, month, day] = value.split('-');
      if (!year || !month || !day) return '';
      return `${day}.${month}.${year}.`;
    };
    const syncDateDisplay = () => {
      const formatted = formatDate(nativeDateInput.value);
      const placeholder = dateDisplay.dataset.placeholder || 'Odaberite datum';
      dateDisplay.textContent = formatted || placeholder;
      dateDisplay.classList.toggle('is-placeholder', !formatted);
      formattedDateInput.value = formatted;
    };
    syncDateDisplay();
    nativeDateInput.addEventListener('change', syncDateDisplay);

    datePickerTrigger?.addEventListener('click', (event) => {
      if (typeof nativeDateInput.showPicker === 'function') {
        event.preventDefault();
        nativeDateInput.showPicker();
      }
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


  const consentKey = 'skykids_cookie_consent_v1';
  const hasCookieConsent = () => {
    try {
      return localStorage.getItem(consentKey) === 'accepted';
    } catch (error) {
      return false;
    }
  };

  const saveCookieConsent = () => {
    try {
      localStorage.setItem(consentKey, 'accepted');
    } catch (error) {
      document.cookie = 'skykids_cookie_consent=accepted; max-age=31536000; path=/; SameSite=Lax';
    }
  };

  if (!hasCookieConsent() && !document.querySelector('.cookie-banner')) {
    const cookieBanner = document.createElement('div');
    cookieBanner.className = 'cookie-banner';
    cookieBanner.setAttribute('role', 'dialog');
    cookieBanner.setAttribute('aria-live', 'polite');
    cookieBanner.setAttribute('aria-label', 'Obavijest o kolačićima');
    cookieBanner.innerHTML = `
      <div class="cookie-banner__text">
        <strong>Kolačići</strong>
        <p>Ova stranica koristi kolačiće za bolje korisničko iskustvo i osnovnu funkcionalnost stranice.</p>
      </div>
      <div class="cookie-banner__actions">
        <a href="kolacici.html">Saznaj više</a>
        <button type="button" class="cookie-accept">Prihvaćam</button>
      </div>
    `;
    document.body.appendChild(cookieBanner);

    window.requestAnimationFrame(() => {
      cookieBanner.classList.add('is-visible');
    });

    cookieBanner.querySelector('.cookie-accept')?.addEventListener('click', () => {
      saveCookieConsent();
      cookieBanner.classList.remove('is-visible');
      window.setTimeout(() => cookieBanner.remove(), 280);
    });
  }


})();
