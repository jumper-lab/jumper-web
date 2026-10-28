document.querySelectorAll<HTMLFormElement>('[data-service-form]').forEach(form => {
  const status = form.querySelector<HTMLElement>('[data-service-status]')!;
  const button = document.querySelector<HTMLButtonElement>(`button[form="${form.id}"]`)!;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Enviando sua mensagem…';
    try {
      const fields = new URLSearchParams(Array.from(new FormData(form), ([key, value]) => [key, String(value)]));
      const response = await fetch(form.action, { method: 'POST', body: fields, signal: AbortSignal.timeout(25000) });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || 'Não foi possível confirmar o envio. Entre em contato pelo telefone (11) 3474-1333.');
      status.textContent = 'Mensagem enviada. A equipe do Rodeio recebeu sua solicitação.';
      form.reset();
    } catch (error) {
      status.textContent = error instanceof Error && error.name !== 'TimeoutError' && !(error instanceof TypeError)
        ? error.message
        : 'Não foi possível confirmar o envio. Entre em contato pelo telefone (11) 3474-1333.';
    } finally { button.disabled = false; }
    status.scrollIntoView({ block: 'nearest' });
  });
});
