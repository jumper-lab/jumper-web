export {};
const options = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-unit]'));
const button = document.querySelector<HTMLButtonElement>('#load-reservation')!;
const slot = document.querySelector<HTMLElement>('#widget-slot')!;
const reservationStatus = document.querySelector<HTMLElement>('#reservation-status')!;
let current = options[0];
let requestId = 0;
let timeout: number | undefined;
function resetRequest() {
  requestId++;
  window.clearTimeout(timeout);
  slot.removeAttribute('aria-busy');
}
function select(unit: HTMLButtonElement, updateURL = true) {
  resetRequest();
  current = unit;
  options.forEach(option => option.setAttribute('aria-pressed', String(option === unit)));
  document.querySelector('#selected-address')!.textContent = unit.dataset.address!;
  document.querySelector('#reservation-title')!.textContent = 'Reserva no Rodeio ' + unit.dataset.name;
  document.querySelector<HTMLAnchorElement>('#reservation-fallback')!.href = unit.dataset.url!;
  slot.replaceChildren();
  reservationStatus.textContent = '';
  button.hidden = false;
  button.disabled = false;
  button.textContent = 'Consultar disponibilidade';
  if (updateURL) {
    const url = new URL(location.href);
    url.searchParams.set('unidade', unit.dataset.unit!);
    history.replaceState(history.state, '', url);
  }
}
function selectFromURL() {
  const name = new URL(location.href).searchParams.get('unidade');
  select(options.find(option => option.dataset.unit === name) || options[0], false);
}
selectFromURL();
window.addEventListener('popstate', selectFromURL);
options.forEach(option => option.addEventListener('click', () => select(option)));
button.addEventListener('click', () => {
  resetRequest();
  const id = requestId;
  const frame = document.createElement('iframe');
  frame.src = current.dataset.widget!;
  frame.title = 'Reservas Rodeio ' + current.dataset.name;
  frame.width = '600';
  frame.height = '700';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  slot.setAttribute('aria-busy', 'true');
  reservationStatus.textContent = 'Carregando sistema de reservas…';
  button.disabled = true;
  button.textContent = 'Carregando…';
  function unavailable() {
    if (id !== requestId) return;
    slot.removeAttribute('aria-busy');
    button.disabled = false;
    button.textContent = 'Tentar novamente';
    reservationStatus.textContent = 'Não foi possível abrir o sistema de reservas. Tente novamente ou use o link abaixo.';
  }
  frame.addEventListener('load', () => {
    if (id !== requestId) return;
    window.clearTimeout(timeout);
    slot.removeAttribute('aria-busy');
    reservationStatus.textContent = 'Se o sistema não aparecer, selecione “Abrir reservas em página inteira” para continuar.';
    const shouldFocus = document.activeElement === button;
    button.hidden = true;
    if (shouldFocus) frame.focus();
  });
  frame.addEventListener('error', unavailable);
  slot.replaceChildren(frame);
  timeout = window.setTimeout(unavailable, 12000);
});
window.addEventListener('pagehide', resetRequest);
window.addEventListener('pageshow', event => { if (event.persisted) selectFromURL(); });
