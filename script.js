'use strict';
(() => {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  const groups = [...document.querySelectorAll('.nav-group')];
  function closeMenu(returnFocus = false) {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (toggle) toggle.textContent = 'Menu ☰';
    groups.forEach(group => group.open = false);
    if (returnFocus) toggle?.focus();
  }
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Fermer ×' : 'Menu ☰';
  });
  groups.forEach(group => group.addEventListener('toggle', () => {
    if (group.open) groups.forEach(other => { if (group !== other) other.open = false; });
  }));
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const expanded = groups.find(group => group.open);
      if (expanded) { expanded.open = false; expanded.querySelector('summary').focus(); }
      else if (nav?.classList.contains('is-open')) closeMenu(true);
    }
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  window.matchMedia('(min-width: 821px)').addEventListener('change', () => closeMenu());

  const estimator = document.getElementById('offerProfile');
  const offers = {
    sante: ['Professionnels de santé', 'À partir de 120 € HT / mois', 'Tenue comptable et suivi adapté à votre exercice.', 'offres-sante.html'],
    liberales: ['Professions libérales', 'À partir de 120 € HT / mois', 'Comptabilité BNC et accompagnement de votre activité.', 'offres-liberales.html'],
    societe: ['Entrepreneur en société', 'À partir de 200 € HT / mois', 'Comptabilité, bilan et éclairage sur vos décisions.', 'offres-independants.html#societe'],
    micro: ['Micro-entrepreneur', '750 € HT / an', 'Suivi des déclarations, des seuils et de votre évolution.', 'offres-independants.html#micro'],
    lmnp: ['Location meublée', 'À partir de 450 € HT / an', 'Tenue comptable, déclarations et suivi des amortissements.', 'offres-immobilier.html#lmnp'],
    sci: ['SCI', 'Sur devis', 'Un périmètre défini selon le régime fiscal et les besoins de votre SCI.', 'offres-immobilier.html#sci'],
    marchand: ['Marchand de biens', 'À partir de 300 € HT / mois', 'Suivi des opérations, de la TVA applicable et des stocks.', 'offres-immobilier.html#marchand']
  };
  estimator?.addEventListener('change', () => {
    const result = document.getElementById('estimateResult');
    const offer = offers[estimator.value];
    result.hidden = !offer;
    if (!offer) return;
    document.getElementById('estimateLabel').textContent = offer[0];
    document.getElementById('estimatePrice').textContent = offer[1];
    document.getElementById('estimateDescription').textContent = offer[2];
    document.getElementById('estimateLink').href = offer[3];
    document.getElementById('estimateContact').href = `contact.html?besoin=${encodeURIComponent(estimator.value)}#contact`;
  });

  const resourceButtons = document.querySelectorAll('[data-resource-filter]');
  resourceButtons.forEach(button => button.addEventListener('click', () => {
    resourceButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    document.querySelectorAll('[data-resource-type]').forEach(section => {
      section.hidden = button.dataset.resourceFilter !== 'all' && section.dataset.resourceType !== button.dataset.resourceFilter;
    });
  }));

  const form = document.getElementById('contactForm');
  if (!form) return;
  const params = new URLSearchParams(location.search);
  const requested = params.get('besoin');
  const mission = document.getElementById('mission');
  if (requested && [...mission.options].some(option => option.value === requested)) mission.value = requested;
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.elements.botcheck.value) return;
    const button = form.querySelector('[type="submit"]');
    if (button.disabled) return;
    const label = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Envoi en cours…';
    form.setAttribute('aria-busy', 'true');
    status.className = 'form-status';
    status.textContent = 'Votre demande est en cours d’envoi.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {method:'POST', body:new FormData(form), headers:{Accept:'application/json'}, signal:controller.signal});
      const data = await response.json();
      if (!response.ok || data.success !== true) throw new Error('Submission failed');
      status.className = 'form-status success';
      status.textContent = 'Votre demande a bien été envoyée. Le cabinet revient vers vous sous 48 h ouvrées.';
      form.reset();
    } catch (_) {
      status.className = 'form-status error';
      status.textContent = 'L’envoi n’a pas pu être confirmé. Vos informations sont conservées dans le formulaire. Vous pouvez réessayer ou écrire à contact@algeopartners.fr.';
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
      button.innerHTML = label;
      form.removeAttribute('aria-busy');
    }
  });
})();

// Révélation progressive ; les cartes restent visibles sans JavaScript.
(() => {
  const cards = document.querySelectorAll('.universe-card');
  if (!cards.length || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15});
  cards.forEach(card => observer.observe(card));
})();

// Dégager le formulaire et le clavier mobile pendant la saisie.
(() => {
 const panel=document.querySelector('.quick-contact');
 const form=document.getElementById('contactForm');
 if(!panel || !form || !('IntersectionObserver' in window)) return;
 const observer=new IntersectionObserver(entries=>{
   panel.hidden=entries[0].isIntersecting && !panel.contains(document.activeElement);
 }, {threshold:0});
 observer.observe(form);
 form.addEventListener('focusin',()=>{panel.hidden=true;});
})();
