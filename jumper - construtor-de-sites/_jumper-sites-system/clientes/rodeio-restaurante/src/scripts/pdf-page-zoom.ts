const MIN_SCALE = 1;
const MAX_SCALE = 4;

const distance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const midpoint = (a: Touch, b: Touch) => ({ x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 });

document.querySelectorAll<HTMLElement>('[data-pdf-page]').forEach((page) => {
  if (page.dataset.pdfZoomReady) return;
  page.dataset.pdfZoomReady = 'true';

  const image = page.querySelector<HTMLImageElement>('img');
  if (!image) return;

  let scale = MIN_SCALE;
  let x = 0;
  let y = 0;
  let startScale = MIN_SCALE;
  let startX = 0;
  let startY = 0;
  let startDistance = 0;
  let startPoint = { x: 0, y: 0 };
  let gesture: 'none' | 'pan' | 'pinch' = 'none';

  const clamp = () => {
    const maxX = page.clientWidth * (scale - 1) / 2;
    const maxY = page.clientHeight * (scale - 1) / 2;
    x = Math.max(-maxX, Math.min(maxX, x));
    y = Math.max(-maxY, Math.min(maxY, y));
  };

  const render = () => {
    if (scale <= 1.01) {
      scale = MIN_SCALE;
      x = 0;
      y = 0;
      delete page.dataset.zoomed;
      image.style.transform = '';
      return;
    }
    clamp();
    page.dataset.zoomed = 'true';
    image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const beginPinch = (touches: TouchList) => {
    const [first, second] = [touches[0], touches[1]];
    const rect = page.getBoundingClientRect();
    const center = midpoint(first, second);
    gesture = 'pinch';
    startScale = scale;
    startX = x;
    startY = y;
    startDistance = Math.max(1, distance(first, second));
    startPoint = { x: center.x - rect.left - rect.width / 2, y: center.y - rect.top - rect.height / 2 };
  };

  const beginPan = (touch: Touch) => {
    gesture = scale > MIN_SCALE ? 'pan' : 'none';
    startPoint = { x: touch.clientX, y: touch.clientY };
    startX = x;
    startY = y;
  };

  page.addEventListener('touchstart', (event) => {
    if (event.touches.length >= 2) {
      event.preventDefault();
      beginPinch(event.touches);
    } else if (event.touches.length === 1) {
      beginPan(event.touches[0]);
    }
  }, { passive: false });

  page.addEventListener('touchmove', (event) => {
    if (event.touches.length >= 2) {
      event.preventDefault();
      if (gesture !== 'pinch') beginPinch(event.touches);
      const [first, second] = [event.touches[0], event.touches[1]];
      const rect = page.getBoundingClientRect();
      const center = midpoint(first, second);
      const centerX = center.x - rect.left - rect.width / 2;
      const centerY = center.y - rect.top - rect.height / 2;
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, startScale * distance(first, second) / startDistance));
      x = centerX - (startPoint.x - startX) * scale / startScale;
      y = centerY - (startPoint.y - startY) * scale / startScale;
      render();
    } else if (event.touches.length === 1 && scale > MIN_SCALE) {
      event.preventDefault();
      if (gesture !== 'pan') beginPan(event.touches[0]);
      x = startX + event.touches[0].clientX - startPoint.x;
      y = startY + event.touches[0].clientY - startPoint.y;
      render();
    }
  }, { passive: false });

  page.addEventListener('touchend', (event) => {
    if (event.touches.length >= 2) beginPinch(event.touches);
    else if (event.touches.length === 1) beginPan(event.touches[0]);
    else gesture = 'none';
  });
  page.addEventListener('touchcancel', () => { gesture = 'none'; });
  window.addEventListener('resize', render);

  // Opening the menu again starts each page at its original size.
  page.closest('dialog')?.addEventListener('close', () => {
    scale = MIN_SCALE;
    render();
  });
});
