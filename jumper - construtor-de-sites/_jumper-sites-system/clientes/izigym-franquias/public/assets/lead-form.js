(function () {
  'use strict';
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const storageKey = 'izi:franquias:utm:v1';
  const params = new URLSearchParams(window.location.search);
  let attribution = {};
  try { const stored = JSON.parse(sessionStorage.getItem(storageKey) || '{}'); if (stored && typeof stored === 'object') attribution = stored; } catch (_) {}
  if (utmKeys.some(key => params.has(key))) {
    attribution = Object.fromEntries(utmKeys.map(key => [key, (params.get(key) || '').slice(0, 512)]));
    try { sessionStorage.setItem(storageKey, JSON.stringify(attribution)); } catch (_) {}
  }
  window.handleFormSubmit = async function (event) {
    event.preventDefault();
    const form = event.target;
    if (form.dataset.submitting === 'true') return;
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    const originalText = button.textContent;
    const data = new FormData(form);
    let errorBox = form.querySelector('[data-submit-error]');
    if (!errorBox) {
      errorBox = document.createElement('p');
      errorBox.dataset.submitError = '';
      errorBox.setAttribute('role', 'alert');
      errorBox.style.cssText = 'color:#b91c1c;font:600 13px/1.3 sans-serif;margin-top:6px;text-align:center;';
      button.insertAdjacentElement('afterend', errorBox);
    }
    errorBox.textContent = '';
    const payload = {
      submission_id: form.dataset.submissionId || crypto.randomUUID(),
      nome: data.get('nome'), email: data.get('email'), telefone: data.get('telefone'),
      aceita_whatsapp: data.has('aceita_whatsapp'), cidade: data.get('cidade'), capital: data.get('capital'),
      ...Object.fromEntries(utmKeys.map(key => [key, typeof attribution[key] === 'string' ? attribution[key] : ''])),
      pagina_origem: window.location.href.split('#')[0]
    };
    // Preserve the ID only for retries of the same data (e.g. a lost response).
    const previousPayload = form.dataset.submissionPayload;
    const signature = JSON.stringify({ ...payload, submission_id: '' });
    if (previousPayload && previousPayload !== signature) payload.submission_id = crypto.randomUUID();
    form.dataset.submissionId = payload.submission_id;
    form.dataset.submissionPayload = signature;
    form.dataset.submitting = 'true';
    form.setAttribute('aria-busy', 'true');
    button.disabled = true;
    button.textContent = 'ENVIANDO…';
    try {
      const response = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw Error(result.error || 'Não foi possível salvar seu cadastro. Tente novamente.');
      // Original ZIP conversion events: only fire after D1 acknowledges the write.
      if (typeof fbq === 'function') {
        try { fbq('track', 'Lead'); fbq('track', 'CompleteRegistration'); fbq('trackCustom', 'CADASTRO-LP-CATIVE'); } catch (_) {}
      }
      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        try { window.dataLayer.push({ event: 'lead_form_submitted', conversion_name: 'CADASTRO-LP-CATIVE' }); window.dataLayer.push({ event: 'CADASTRO-LP-CATIVE' }); } catch (_) {}
      }
      setTimeout(function () { window.location.assign('proximos-passos.html'); }, 250);
    } catch (error) {
      errorBox.textContent = error.name === 'TimeoutError' || error instanceof TypeError ? 'Não foi possível confirmar o envio. Verifique sua conexão e tente novamente.' : error.message;
      form.dataset.submitting = 'false';
      form.removeAttribute('aria-busy');
      button.disabled = false;
      button.textContent = originalText;
    }
  };
})();
