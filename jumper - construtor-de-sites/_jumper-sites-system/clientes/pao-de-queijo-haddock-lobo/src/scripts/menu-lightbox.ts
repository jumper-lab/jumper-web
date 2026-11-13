import { initScrollHint } from './scroll-hint';

const dialog = document.querySelector<HTMLDialogElement>('#menu-lightbox');
const frame = dialog?.querySelector<HTMLIFrameElement>('.menu-lightbox-frame');
const menuUrl = dialog?.dataset.menuUrl;
const storesUrl = dialog?.dataset.storesUrl;

if (dialog && frame && menuUrl && storesUrl) {
  const embedded = document.documentElement.classList.contains('menu-embedded');
  const paths = [menuUrl, storesUrl].map(url => new URL(url, location.href).pathname.replace(/\/$/, ''));
  const title = dialog.querySelector<HTMLElement>('#menu-lightbox-title');
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-close-menu-lightbox]');
  const categoryBar = dialog.querySelector<HTMLElement>('.menu-lightbox-categories');
  initScrollHint(categoryBar);
  const categoryButtons = [...dialog.querySelectorAll<HTMLButtonElement>('[data-lightbox-category]')];
  let opener: HTMLElement | null = null;
  let closingTimer = 0;
  const close = () => {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { dialog.close(); return; }
    dialog.classList.add('is-closing');
    closingTimer = window.setTimeout(() => dialog.close(), 280);
  };
  const open = (url: URL, trigger?: HTMLElement) => {
    const isStores = url.pathname.replace(/\/$/, '') === paths[1];
    dialog.classList.toggle('is-menu', !isStores);
    if (categoryBar) categoryBar.hidden = false;
    categoryButtons.forEach(button => { button.hidden = false; button.removeAttribute('aria-current'); });
    if (trigger) opener = trigger;
    const label = isStores ? 'Nossas lojas' : 'Cardápio da casa';
    if (title) title.textContent = label;
    closeButton?.setAttribute('aria-label', `Fechar ${isStores ? 'lojas' : 'cardápio'}`);
    frame.title = label;
    url.searchParams.set('lightbox', '1');
    if (!url.hash) url.hash = isStores ? '#unidades' : '#cardapio';
    frame.src = url.href;
    if (!dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add('has-menu-lightbox');
    }
  };
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self') || link.getAttribute('href')?.startsWith('#')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !paths.includes(url.pathname.replace(/\/$/, ''))) return;
    event.preventDefault();
    if (embedded) window.parent.postMessage({ type: 'pdq-open-lightbox', url: url.href }, location.origin);
    else open(url, link);
  });
  if (!embedded) {
    window.addEventListener('message', event => {
      if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type === 'pdq-menu-current') {
        categoryButtons.forEach(button => {
          if (button.dataset.lightboxCategory === event.data.id) button.setAttribute('aria-current','location');
          else button.removeAttribute('aria-current');
        });
        return;
      }
      if (event.data?.type === 'pdq-menu-visible' && Array.isArray(event.data.ids)) {
        categoryButtons.forEach(button => { button.hidden = !event.data.ids.includes(button.dataset.lightboxCategory); });
        if (categoryBar) categoryBar.hidden = event.data.ids.length === 0;
        return;
      }
      if (event.data?.type !== 'pdq-open-lightbox') return;
      try {
        const url = new URL(event.data.url);
        if (url.origin === location.origin && paths.includes(url.pathname.replace(/\/$/, ''))) open(url);
      } catch { /* Ignore invalid messages. */ }
    });
    categoryButtons.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.lightboxCategory;
      if (!id || !frame.contentWindow) return;
      categoryButtons.forEach(item => item.removeAttribute('aria-current'));
      button.setAttribute('aria-current','location');
      if (frame.contentWindow.location.hash === `#${id}`) frame.contentDocument?.getElementById(id)?.scrollIntoView({block:'start',behavior:'smooth'});
      else frame.contentWindow.location.hash = id;
    }));
    closeButton?.addEventListener('click', close);
    dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { clearTimeout(closingTimer); dialog.classList.remove('is-closing'); document.documentElement.classList.remove('has-menu-lightbox'); frame.removeAttribute('src'); opener?.focus(); });
    frame.addEventListener('load', () => {
      try {
        frame.contentDocument?.addEventListener('keydown', event => {
          if (event.key === 'Escape' && !frame.contentDocument?.querySelector('dialog[open]')) { event.preventDefault(); close(); }
        });
      } catch { /* An external destination can have a different origin. */ }
    });
  }
}
