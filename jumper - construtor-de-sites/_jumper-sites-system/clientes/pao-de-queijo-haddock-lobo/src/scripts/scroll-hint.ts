/** Show only the directions in which the category strip can still scroll. */
export function initScrollHint(container: Element | null) {
  const nav = container?.querySelector<HTMLElement>('nav');
  const hint = container?.querySelector<HTMLElement>('[data-scroll-hint]');
  if (!nav || !hint) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = Math.max(0, nav.scrollWidth - nav.clientWidth);
    hint.toggleAttribute('data-can-left', nav.clientWidth > 0 && nav.scrollLeft > 1);
    hint.toggleAttribute('data-can-right', nav.clientWidth > 0 && max - nav.scrollLeft > 1);
  };
  const refresh = () => { if (!frame) frame = requestAnimationFrame(update); };
  nav.addEventListener('scroll', refresh, {passive:true});
  window.addEventListener('resize', refresh, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(refresh).observe(nav);
  new MutationObserver(refresh).observe(nav, {childList:true, subtree:true, attributes:true, attributeFilter:['hidden']});
  refresh();
}
