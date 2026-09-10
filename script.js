// Mobile burger menu
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
if (burgerBtn && mainNav) {
  burgerBtn.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });
}

// Dropdown "Nos Spécialités" (clic sur mobile, hover géré en CSS sur desktop)
const dropdown = document.querySelector('.has-dropdown');
if (dropdown) {
  const dropdownTrigger = dropdown.querySelector('.dropdown-trigger');
  dropdownTrigger.addEventListener('click', () => {
    const isOpen = dropdown.classList.toggle('open');
    dropdownTrigger.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      dropdownTrigger.setAttribute('aria-expanded', 'false');
    }
  });
}
// Ferme le menu mobile après un clic sur un lien
if (mainNav) {
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    if (burgerBtn) burgerBtn.setAttribute('aria-expanded', 'false');
  }));
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// Animated counters
const counters = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1200;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        el.textContent = Math.round(progress * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.4 });
counters.forEach(el => counterObserver.observe(el));

// Contact form submission feedback (page d'accueil uniquement)
const form = document.getElementById('contactForm');
if (form) {
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Envoi en cours…';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.success) {
        status.textContent = 'Message envoyé. Nous revenons vers vous sous 48h.';
        form.reset();
      } else {
        status.textContent = "Une erreur est survenue. Réessayez ou écrivez-nous directement à contact@algeopartners.fr.";
      }
    } catch (err) {
      status.textContent = "Une erreur est survenue. Réessayez ou écrivez-nous directement à contact@algeopartners.fr.";
    }
  });
}
