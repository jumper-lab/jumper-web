/** Keep the reading indicator independent of observer callback order and viewport bands. */
export function initMenuIndex(categories: HTMLElement[], links: HTMLAnchorElement[]) {
  const rail = document.querySelector<HTMLElement>('.menu-index');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!categories.length || !rail || !header) return () => {};
  const horizontal = matchMedia('(max-width:900px)');
  let frame = 0;
  let intent: {id: string; started: number; previousY: number; still: number} | null = null;
  const initialHash = location.hash.slice(1);
  let mayAlignInitialHash = Boolean(initialHash);
  const select = (id: string) => links.forEach(link => {
    if (link.dataset.categoryLink === id) {
      if (!link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'location');
    } else if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
  });
  const sync = () => {
    const visible = categories.filter(category => !category.hidden);
    if (!visible.length) { select(''); return; }
    const headerBottom = header.getBoundingClientRect().bottom;
    const index = rail.getBoundingClientRect();
    // Include the sticky horizontal rail, but not its original position below the hero.
    const line = horizontal.matches && index.top <= headerBottom + 1
      ? index.bottom + 32 : headerBottom + 32;
    let current = visible[0];
    for (const category of visible) {
      if (category.getBoundingClientRect().top <= line + 1) current = category;
      else break;
    }
    select(current.id);
  };
  const tick = (now: number) => {
    frame = 0;
    if (intent) {
      intent.still = Math.abs(scrollY - intent.previousY) < .5 ? intent.still + 1 : 0;
      intent.previousY = scrollY;
      // Native smooth scrolling finishes at rest; reduced motion also reaches this path.
      if ((intent.still >= 3 && now - intent.started > 120) || now - intent.started > 3000) {
        intent = null; sync();
      } else frame = requestAnimationFrame(tick);
    } else sync();
  };
  const refresh = () => { if (!frame) frame = requestAnimationFrame(tick); };
  const navigate = (id: string) => {
    if (!categories.some(category => category.id === id && !category.hidden)) return;
    intent = {id, started: performance.now(), previousY: scrollY, still: 0};
    select(id); refresh();
  };
  links.forEach(link => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    mayAlignInitialHash = false;
    navigate(link.dataset.categoryLink || '');
  }));
  const interrupt = () => { mayAlignInitialHash = false; intent = null; refresh(); };
  window.addEventListener('wheel', interrupt, {passive: true});
  window.addEventListener('touchstart', interrupt, {passive: true});
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
  });
  window.addEventListener('scroll', refresh, {passive: true});
  window.addEventListener('resize', refresh, {passive: true});
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
  const loaded = document.readyState === 'complete' ? Promise.resolve()
    : new Promise<void>(resolve => window.addEventListener('load', () => resolve(), {once: true}));
  Promise.all([loaded, document.fonts.ready]).then(() => requestAnimationFrame(() => {
    // A cross-page fragment may land before web fonts and heading wrappers settle.
    // Correct it once at startup, but never override an interaction already made.
    if (!mayAlignInitialHash || location.hash.slice(1) !== initialHash) return;
    const target = categories.find(category => category.id === initialHash && !category.hidden);
    if (!target) return;
    mayAlignInitialHash = false;
    target.scrollIntoView({block: 'start', inline: 'nearest', behavior: 'instant'});
    navigate(target.id);
  }));
  refresh();
  // Filtering can remove the destination, so release any pending navigation first.
  return interrupt;
}
