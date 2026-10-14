export {};
document.querySelectorAll<HTMLFormElement>('[data-events-form]').forEach(form => {
  const status = form.querySelector<HTMLElement>('[data-events-status]')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    button.disabled = true;
    status.textContent = 'Enviando sua solicitação…';
    try {
      const response = await fetch(form.action, {method: 'POST', body: new URLSearchParams(Array.from(new FormData(form), ([key,value]) => [key,String(value)])), signal: AbortSignal.timeout(25000)});
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || 'Não foi possível enviar. Tente novamente ou ligue (11) 3474-1333.');
      status.textContent = 'Solicitação enviada. A equipe do Rodeio entrará em contato.';
      form.reset();
    } catch (error) {
      status.textContent = error instanceof Error && !(error instanceof TypeError) && error.name !== 'TimeoutError' ? error.message : 'Não foi possível confirmar o envio. Antes de tentar novamente, fale com a equipe pelo (11) 3474-1333.';
    } finally { button.disabled = false; }
  });
});
