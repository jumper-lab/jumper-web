export function initStoreSwipe(tabs: HTMLButtonElement[], select: (tab: HTMLButtonElement) => void) {
  const finder = document.querySelector<HTMLElement>('[data-store-finder]');
  if (!finder || tabs.length < 2 || !('PointerEvent' in window)) return;
  const note = finder.querySelector<HTMLElement>('[data-store-swipe-note]');
  const status = finder.querySelector<HTMLElement>('[data-store-swipe-status]');
  const fingers = new Set<number>();
  type Gesture = { id: number; x: number; y: number; tab: HTMLButtonElement; threshold: number; vertical: boolean };
  let gesture: Gesture | null = null;
  finder.dataset.swipeReady = 'true';
  if (note) note.hidden = false;
  const reset = () => { gesture = null; fingers.clear(); };
  finder.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    fingers.add(event.pointerId);
    if (!event.isPrimary || fingers.size !== 1) { gesture = null; return; }
    const photo = (event.target as Element).closest<HTMLElement>('.store-photo');
    const panel = photo?.closest<HTMLElement>('.store-panel');
    const tab = tabs.find(button => button.getAttribute('aria-selected') === 'true');
    if (!photo || !panel || panel.hidden || !tab) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, tab,
      threshold: Math.max(48, Math.min(80, photo.clientWidth * .18)), vertical: false };
  }, { passive: true });
  finder.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - gesture.x), dy = Math.abs(event.clientY - gesture.y);
    // Once the user starts reading vertically, that gesture never changes a unit.
    if (dy > 10 && dy >= dx) gesture.vertical = true;
  }, { passive: true });
  finder.addEventListener('pointerup', event => {
    const current = gesture;
    fingers.delete(event.pointerId);
    if (!current || current.id !== event.pointerId) return;
    gesture = null;
    const dx = event.clientX - current.x, dy = event.clientY - current.y;
    if (current.vertical || Math.abs(dx) < current.threshold || Math.abs(dx) < Math.abs(dy) * 1.5
      || current.tab.getAttribute('aria-selected') !== 'true') return;
    const next = tabs[(tabs.indexOf(current.tab) + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length];
    select(next);
    if (status) status.textContent = `${next.querySelector('strong')?.textContent}, ${next.querySelector('small')?.textContent}. Unidade ${tabs.indexOf(next) + 1} de ${tabs.length}.`;
  }, { passive: true });
  finder.addEventListener('pointercancel', event => {
    fingers.delete(event.pointerId);
    if (gesture?.id === event.pointerId) gesture = null;
  }, { passive: true });
  window.addEventListener('blur', reset);
  window.addEventListener('resize', reset, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
}
