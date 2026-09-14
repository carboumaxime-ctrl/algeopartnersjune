// Estimateur tarifaire (page Nos offres uniquement)
const estimator = document.getElementById('estimator');
if (estimator) {
  const results = {
    sante: {
      eyebrow: 'Santé',
      price: 'À partir de 120 € HT / mois',
      desc: "Tenue comptable, déclarations fiscales et suivi adapté au statut libéral, SCM ou SEL.",
      link: 'offres-sante.html'
    },
    liberales: {
      eyebrow: 'Profession libérale',
      price: 'À partir de 120 € HT / mois',
      desc: "Tenue comptable et déclarations BNC, adaptées à votre activité libérale.",
      link: 'offres-liberales.html'
    },
    'independants-societe': {
      eyebrow: 'Indépendant en société',
      price: 'À partir de 200 € HT / mois',
      desc: "Comptabilité, bilan, liasse fiscale et optimisation de votre rémunération.",
      link: 'offres-independants.html'
    },
    'independants-micro': {
      eyebrow: 'Micro-entrepreneur',
      price: '750 € HT / an (forfait)',
      desc: "Suivi de vos déclarations de chiffre d'affaires et des seuils applicables.",
      link: 'offres-independants.html'
    },
    'immobilier-lmnp': {
      eyebrow: 'LMNP',
      price: 'À partir de 450 € HT / an (forfait)',
      desc: "Tenue comptable et déclaration de revenus LMNP, suivi des amortissements.",
      link: 'offres-immobilier.html'
    },
    'immobilier-sci': {
      eyebrow: 'SCI',
      price: 'À partir de 100 € HT',
      desc: "Comptabilité adaptée à l'IS ou à la transparence fiscale de votre SCI.",
      link: 'offres-immobilier.html'
    },
    'immobilier-marchand': {
      eyebrow: 'Marchand de biens',
      price: 'À partir de 300 € HT / mois',
      desc: "Suivi des opérations et de la TVA sur marge, gestion des stocks immobiliers.",
      link: 'offres-immobilier.html'
    }
  };

  const steps = estimator.querySelectorAll('.estimator-step');
  const dots = estimator.querySelectorAll('.step-dot');

  function showStep(name) {
    steps.forEach(s => { s.hidden = s.dataset.step !== name; });
  }
  function setProgress(n) {
    dots.forEach(d => d.classList.toggle('active', parseInt(d.dataset.step, 10) <= n));
  }
  function showResult(key) {
    const r = results[key];
    document.getElementById('estimatorEyebrow').textContent = r.eyebrow;
    document.getElementById('estimatorPrice').textContent = r.price;
    document.getElementById('estimatorDesc').textContent = r.desc;
    document.getElementById('estimatorDetailLink').href = r.link;
    showStep('result');
    setProgress(3);
  }

  estimator.querySelectorAll('[data-question="activite"] .estimator-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      if (val === 'independants') { showStep('2-independants'); setProgress(2); }
      else if (val === 'immobilier') { showStep('2-immobilier'); setProgress(2); }
      else { showResult(val); }
    });
  });
  estimator.querySelectorAll('[data-question="sub-independants"] .estimator-option').forEach(btn => {
    btn.addEventListener('click', () => showResult('independants-' + btn.dataset.value));
  });
  estimator.querySelectorAll('[data-question="sub-immobilier"] .estimator-option').forEach(btn => {
    btn.addEventListener('click', () => showResult('immobilier-' + btn.dataset.value));
  });
  estimator.querySelectorAll('.estimator-back').forEach(btn => {
    btn.addEventListener('click', () => { showStep('1'); setProgress(1); });
  });
  estimator.querySelector('.estimator-restart').addEventListener('click', () => {
    showStep('1');
    setProgress(1);
  });
}

// Mobile burger menu
const burgerBtn = document.getElementById('burgerBtn');
const mainNav = document.getElementById('mainNav');
if (burgerBtn && mainNav) {
  burgerBtn.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });
}

// Dropdowns "Nos Spécialités" / "Nos offres" (clic sur mobile, hover géré en CSS sur desktop)
const dropdowns = document.querySelectorAll('.has-dropdown');
dropdowns.forEach(dropdown => {
  const trigger = dropdown.querySelector('.dropdown-trigger');
  trigger.addEventListener('click', () => {
    const isOpen = dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen);
    dropdowns.forEach(other => {
      if (other !== dropdown) {
        other.classList.remove('open');
        other.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
      }
    });
  });
});
document.addEventListener('click', (e) => {
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      dropdown.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
    }
  });
});
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
