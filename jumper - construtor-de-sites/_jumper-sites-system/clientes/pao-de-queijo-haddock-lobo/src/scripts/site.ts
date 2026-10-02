import { initSlideshow } from './slideshow';
import { initMotion } from './motion';
import { initStoreSwipe } from './store-swipe';
import { initMenuIndex } from './menu-index';

const menu = document.querySelector<HTMLDialogElement>('#mobile-navigation');
const toggle = document.querySelector<HTMLButtonElement>('#menu-toggle');
const closeMenu = () => { menu?.close(); toggle?.focus(); };
toggle?.addEventListener('click', () => menu?.showModal());
document.querySelector('[data-close-menu]')?.addEventListener('click', closeMenu);
menu?.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => menu.close()));
menu?.addEventListener('click', event => { if (event.target === menu && event.clientX < menu.getBoundingClientRect().left) closeMenu(); });
menu?.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...menu.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')];
  const first = controls[0], last = controls[controls.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
});

const dialog = document.querySelector<HTMLDialogElement>('#photo-dialog');
const expanded = document.querySelector<HTMLImageElement>('#expanded-photo');
const caption = document.querySelector('#photo-caption');
const photoStatus = document.querySelector<HTMLElement>('#photo-load-status');
let photoTrigger: HTMLElement | null = null;
let photoRevision = 0;
document.querySelectorAll<HTMLButtonElement>('[data-zoom-src]').forEach(button => {
  button.disabled = false;
  button.addEventListener('click', () => {
    if (!dialog || !expanded || !caption || !photoStatus || dialog.open) return;
    const revision = ++photoRevision;
    photoTrigger = button;
    expanded.hidden = true;
    expanded.removeAttribute('src');
    expanded.src = button.dataset.zoomSrc || '';
    expanded.alt = button.dataset.zoomAlt || '';
    caption.textContent = button.dataset.zoomCaption || '';
    dialog.dataset.zoomCrop = button.dataset.zoomCrop || '';
    dialog.dataset.zoomMenu = String(button.hasAttribute('data-menu-photo'));
    dialog.setAttribute('aria-busy', 'true');
    photoStatus.textContent = 'Carregando fotografia…';
    photoStatus.hidden = false;
    dialog.showModal();
    expanded.decode().then(() => {
      if (revision !== photoRevision || !dialog.open) return;
      expanded.hidden = false;
      photoStatus.hidden = true;
      dialog.setAttribute('aria-busy', 'false');
    }).catch(() => {
      if (revision !== photoRevision || !dialog.open) return;
      photoStatus.textContent = 'Não foi possível carregar a fotografia. Feche e tente novamente.';
      dialog.setAttribute('aria-busy', 'false');
    });
  });
});
const closePhoto = () => dialog?.close();
document.querySelector('[data-close-photo]')?.addEventListener('click', closePhoto);
dialog?.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closePhoto();
});
dialog?.addEventListener('close', () => {
  // The native close event can arrive after a new opening in the same task.
  if (dialog.open) return;
  photoRevision++;
  expanded?.removeAttribute('src');
  if (expanded) expanded.hidden = true;
  photoTrigger?.focus();
});
dialog?.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const close = dialog.querySelector<HTMLButtonElement>('[data-close-photo]');
  if (!close) return;
  // This viewer has one control; keep Tab/Shift+Tab on its close action.
  event.preventDefault();
  close.focus();
});

const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-store-id]')];
const tablist = document.querySelector<HTMLElement>('.store-tabs');
const alignTabs = () => tablist?.setAttribute('aria-orientation', matchMedia('(max-width:700px)').matches ? 'horizontal':'vertical');
alignTabs();
window.addEventListener('resize', alignTabs, {passive:true});
function selectStore(tab: HTMLButtonElement, focus = false) {
  tabs.forEach(button => {
    const selected = button === tab;
    button.setAttribute('aria-selected', String(selected));
    button.classList.toggle('is-selected', selected);
    button.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(`panel-${button.dataset.storeId}`);
    if (panel) panel.hidden = !selected;
  });
  if (focus) tab.focus();
  if (tablist?.getAttribute('aria-orientation') === 'horizontal') {
    const strip = tablist.getBoundingClientRect(), selected = tab.getBoundingClientRect();
    // Scroll the tab strip only; scrollIntoView would also move the document.
    tablist.scrollLeft += selected.left - strip.left - (tablist.clientWidth - selected.width) / 2;
  }
}
initStoreSwipe(tabs, selectStore);
tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => selectStore(tab));
  tab.addEventListener('keydown', event => {
    let next = index;
    const horizontal = tablist?.getAttribute('aria-orientation') === 'horizontal';
    if (event.key === (horizontal ? 'ArrowRight':'ArrowDown')) next = (index+1)%tabs.length;
    else if (event.key === (horizontal ? 'ArrowLeft':'ArrowUp')) next = (index-1+tabs.length)%tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length-1;
    else return;
    event.preventDefault();
    selectStore(tabs[next], true);
  });
});

const cityFilters = [...document.querySelectorAll<HTMLButtonElement>('[data-city]')];
const locations = [...document.querySelectorAll<HTMLElement>('[data-location-region]')];
cityFilters.forEach(button => button.addEventListener('click', () => {
  let count = 0;
  cityFilters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  locations.forEach(location => {
    location.hidden = button.dataset.city !== 'all' && location.dataset.locationRegion !== button.dataset.city;
    if (!location.hidden) count++;
  });
  const status = document.querySelector('[data-location-count]');
  if (status) status.textContent = `${count} ${count===1?'loja':'lojas'} para visitar`;
}));

const search = document.querySelector<HTMLInputElement>('#menu-search-input');
const items = [...document.querySelectorAll<HTMLElement>('[data-menu-item]')];
const categories = [...document.querySelectorAll<HTMLElement>('[data-menu-category]')];
const categoryLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-category-link]')];
const refreshMenuIndex = initMenuIndex(categories, categoryLinks);
const clear = document.querySelector<HTMLButtonElement>('[data-clear-search]');
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const searchIndex = new Map(items.map(item => [item, normalize(item.dataset.search || '')]));
function filterMenu() {
  const query = normalize(search?.value || '');
  let count = 0;
  items.forEach(item => {
    const categoryName = normalize(item.closest('[data-menu-category]')?.querySelector('h3')?.textContent || '');
    item.hidden = !(query === categoryName || searchIndex.get(item)?.includes(query));
    if (!item.hidden) count++;
  });
  categories.forEach(category => {
    category.hidden = !category.querySelector('[data-menu-item]:not([hidden])');
    const link = categoryLinks.find(link => link.dataset.categoryLink === category.dataset.menuCategory);
    if (link) link.hidden = category.hidden;
  });
  const status = document.querySelector('[data-menu-status]');
  const empty = document.querySelector<HTMLElement>('[data-menu-empty]');
  if (status) status.textContent = query ? `${count} ${count===1?'item encontrado':'itens encontrados'}` : `${count} itens no cardápio`;
  status?.classList.toggle('sr-only', !query);
  if (empty) empty.hidden = count>0;
  if (clear) clear.hidden = !query;
  refreshMenuIndex();
}
search?.addEventListener('input', filterMenu);
function resetMenu() { if (search) search.value=''; filterMenu(); search?.focus(); }
clear?.addEventListener('click',resetMenu);
document.querySelector('[data-reset-menu]')?.addEventListener('click',resetMenu);
const legacyHashes: Record<string,string> = {'#sopa':'#tortas','#colageno':'#bebidas'};
function redirectLegacyHash() {
  const destination = legacyHashes[location.hash];
  if (destination) location.replace(destination);
}
window.addEventListener('hashchange',redirectLegacyHash);
redirectLegacyHash();

initMotion();
initSlideshow();
