export const PRIME_CHECKOUT = 'https://vendas.online.sistemapacto.com.br/checkout?un=1&k=6e2660773cc378e250e6a8731d6830e5&pl=2&cupom=0,99_IZI';
const storageKey = 'izi:checkout-attribution:v1';
const isCampaignKey = (key: string) => /^utm_[a-z0-9_]+$/.test(key) || key === 'gclid' || key === 'fbclid';

type Campaign = Record<string, string>;
export function readCampaign(search: string, storage: Pick<Storage, 'getItem' | 'setItem'>): Campaign {
  const arrival = Object.fromEntries([...new URLSearchParams(search)].filter(([key, value]) => isCampaignKey(key) && value));
  if (Object.keys(arrival).length) {
    try { storage.setItem(storageKey, JSON.stringify(arrival)); } catch { /* Keep the current arrival when storage is unavailable. */ }
    return arrival;
  }
  try {
    const stored = JSON.parse(storage.getItem(storageKey) || '{}');
    if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
    return Object.fromEntries(Object.entries(stored).filter(([key, value]) => isCampaignKey(key) && typeof value === 'string' && value)) as Campaign;
  } catch { return {}; }
}

export function checkoutUrl(campaign: Campaign): string {
  const destination = new URL(PRIME_CHECKOUT);
  for (const [key, value] of Object.entries(campaign)) {
    if (isCampaignKey(key) && value) destination.searchParams.set(key, value);
  }
  return destination.href;
}

export function setupCheckoutLinks(): void {
  // Storage can be disabled by browser privacy settings; direct checkout still works.
  let storage: Pick<Storage, 'getItem' | 'setItem'>;
  try { storage = window.sessionStorage; } catch { storage = { getItem: () => null, setItem: () => {} }; }
  let campaign = readCampaign(location.search, storage);
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-checkout]')];
  const refresh = () => {
    campaign = readCampaign(location.search, storage);
    links.forEach(link => { link.href = checkoutUrl(campaign); });
  };
  refresh();
  window.addEventListener('pageshow', refresh);
  links.forEach(link => link.addEventListener('click', () => {
    refresh();
    const tracking = window as Window & { dataLayer?: unknown[]; fbq?: (action: string, event: string) => void };
    tracking.dataLayer ||= [];
    tracking.dataLayer.push({ event: 'checkout_click', placement: link.dataset.checkout, checkout_url: link.href, ...campaign });
    tracking.fbq?.('track', 'InitiateCheckout');
  }));
}
