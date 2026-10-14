export {};
const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-reservation-card]'));
const actions = document.querySelectorAll<HTMLAnchorElement>('[data-reservation-unit]');
function markUnit(name: string | null) {
  cards.forEach(card => card.toggleAttribute('data-current', card.dataset.reservationCard === name));
}
function readUnitFromURL() {
  const name = new URL(location.href).searchParams.get('unidade');
  markUnit(name);
  const card = cards.find(item => item.dataset.reservationCard === name);
  // Direct links to a house bring its reservation action into view on small screens.
  if (card && matchMedia('(max-width: 759px)').matches) {
    requestAnimationFrame(() => card.scrollIntoView({block: 'nearest', behavior: 'instant'}));
  }
}
readUnitFromURL();
window.addEventListener('popstate', readUnitFromURL);
actions.forEach(action => action.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const name = action.dataset.reservationUnit!;
  const url = new URL(location.href);
  url.searchParams.set('unidade', name);
  history.replaceState(history.state, '', url);
  markUnit(name);
}));
window.addEventListener('pageshow', event => { if (event.persisted) readUnitFromURL(); });
