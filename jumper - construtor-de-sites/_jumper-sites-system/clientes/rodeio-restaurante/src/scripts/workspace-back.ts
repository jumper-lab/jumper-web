export {};
const back = document.querySelector<HTMLAnchorElement>('[data-workspace-back]');
if (back && document.referrer) {
  const previous = new URL(document.referrer);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (previous.origin === location.origin && (!base || previous.pathname.startsWith(base + '/')) && previous.href !== location.href) {
    // Return to the actual source page, including its query string, even when
    // the embedded provider has added its own browser history entries.
    back.href = previous.href;
  }
}
