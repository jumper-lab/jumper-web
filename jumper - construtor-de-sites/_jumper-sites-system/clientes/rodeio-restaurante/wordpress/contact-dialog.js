/* Contact channel chooser; the existing service controllers continue to own their forms. */
(() => {
  const dialog = document.getElementById('contact-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const close = dialog.querySelector('[data-close-contact]');
  let opener = null;
  let restoreFocus = true;
  const isOpener = link => link.hash === '#fale-com-a-gente';
  document.querySelectorAll('a[href]').forEach(link => {
    if (isOpener(link)) {link.setAttribute('aria-haspopup', 'dialog');link.setAttribute('aria-controls', dialog.id);}
  });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isOpener(link)) {
      event.preventDefault();opener = link;restoreFocus = true;
      if (!dialog.open) dialog.showModal();close?.focus();return;
    }
    if (dialog.contains(link)) {
      const target = link.pathname.replace(/\/$/, '').endsWith('/sac') ? document.getElementById('sac-dialog') : link.pathname.replace(/\/$/, '').endsWith('/compliance') ? document.getElementById('compliance-dialog') : null;
      if (!target) return;
      // Close this chooser before the existing delegated controller opens the selected form.
      restoreFocus = false;dialog.close();
      target.addEventListener('close', () => opener?.focus({preventScroll:true}), {once:true});
    }
  }, true);
  close?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {if (restoreFocus) opener?.focus({preventScroll:true});});
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if(event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll('a[href],button')).filter(el => !el.disabled && el.getClientRects().length);
    const first=controls[0], last=controls[controls.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
  });
})();
