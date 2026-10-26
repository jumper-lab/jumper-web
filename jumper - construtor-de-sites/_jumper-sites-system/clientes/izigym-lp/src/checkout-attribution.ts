export const PRIME_CHECKOUT = 'https://vendas.online.sistemapacto.com.br/checkout?un=1&k=6e2660773cc378e250e6a8731d6830e5&pl=2&cupom=0,99_IZI';
const storageKey = 'izi:checkout-attribution:v1';
const isCampaignKey = (key: string) => /^utm_[a-z0-9_]+$/.test(key) || key === 'gclid' || key === 'fbclid';
const personalCampaignKey = /^utm_(?:e_?mail|phone|telephone|telefone|celular|whatsapp|cpf|cnpj|rg|nome|name|first_name|last_name|full_name|address|endereco|user_id|customer_id|contact_id|subscriber_id)(?:_|$)/;

function isTrackingCampaignEntry(key: string, value: string): boolean {
  if (!isCampaignKey(key) || personalCampaignKey.test(key)) return false;
  // Check encoded values too, without changing campaign values used by checkout.
  let inspected = value;
  for (let pass = 0; pass < 2; pass++) {
    try { inspected = decodeURIComponent(inspected); } catch { break; }
  }
  if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(inspected)) return false;
  if (/\+\d[\d ().-]{8,}\d|\(\d{2,3}\)\s*\d{4,5}[\s.-]?\d{4}|\b\d{2}[\s.-]\d{4,5}[\s.-]\d{4}\b/.test(inspected)) return false;
  if (/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/.test(inspected)) return false;
  // Numeric campaign/ad identifiers remain valid; free-text UTM fields cannot
  // carry a bare phone/document number instead of campaign metadata.
  if (key.startsWith('utm_') && key !== 'utm_id' && /^\d{10,14}$/.test(inspected.trim())) return false;
  return true;
}

type Campaign = Record<string, string>;
type CerroCoraTracking = {
  siteId: string;
  izi: { enabled: boolean };
  cative: { enabled: boolean; legacy: { metaCheckout: { source: 'legacy' | 'gtm'; pixelId: string } } };
};
type TrackingWindow = Window & {
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
  cerroCoraTracking?: CerroCoraTracking;
};
const boundLinks = new WeakSet<HTMLAnchorElement>();

export function trackingCampaign(campaign: Campaign): Campaign {
  return Object.fromEntries(Object.entries(campaign).filter(([key, value]) => isTrackingCampaignEntry(key, value)));
}

// The commercial link retains its account key; analytics only receives the
// destination and campaign parameters, without the key or unrelated URL data.
export function trackingCheckoutUrl(href: string): string {
  const source = new URL(href);
  const safe = new URL(source.origin + source.pathname);
  for (const [key, value] of source.searchParams) {
    if (['un', 'pl', 'cupom'].includes(key) || isTrackingCampaignEntry(key, value)) safe.searchParams.set(key, value);
  }
  return safe.href;
}
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

export function trackCheckout(placement: string, campaign: Campaign, href: string): void {
  const tracking = window as TrackingWindow;
  tracking.dataLayer ||= [];
  const kits = tracking.cerroCoraTracking;
  tracking.dataLayer.push({
    event: 'checkout_click',
    placement,
    checkout_url: kits ? trackingCheckoutUrl(href) : href,
    ...(kits ? trackingCampaign(campaign) : campaign),
    ...(kits ? {
      site_id: kits.siteId,
      izi_enabled: kits.izi.enabled,
      cative_enabled: kits.cative.enabled,
      cative_checkout_source: kits.cative.legacy.metaCheckout.source,
    } : {}),
  });
  if (kits) {
    // Transitional Cative emitter. GTM must explicitly require source=gtm
    // before this mode can change, including while older pages remain open.
    if (kits.cative.enabled && kits.cative.legacy.metaCheckout.source === 'legacy') {
      tracking.fbq?.('trackSingle', kits.cative.legacy.metaCheckout.pixelId, 'InitiateCheckout');
    }
  } else {
    // Existing previews keep their behavior; only the official HTML opts in.
    tracking.fbq?.('track', 'InitiateCheckout');
  }
}

export function setupCheckoutLinks(openEnrollment?: (campaign: Campaign, placement: string, opener: HTMLAnchorElement) => void): void {
  // Storage can be disabled by browser privacy settings; direct checkout still works.
  let storage: Pick<Storage, 'getItem' | 'setItem'>;
  try { storage = window.sessionStorage; } catch { storage = { getItem: () => null, setItem: () => {} }; }
  let campaign = readCampaign(location.search, storage);
  const links = [...document.querySelectorAll<HTMLAnchorElement>('a[data-checkout]')];
  const refresh = () => {
    campaign = readCampaign(location.search, storage);
    links.forEach(link => { link.href = openEnrollment ? '#inscricao' : checkoutUrl(campaign); });
  };
  refresh();
  const unboundLinks = links.filter(link => !boundLinks.has(link));
  if (!unboundLinks.length) return;
  window.addEventListener('pageshow', refresh);
  unboundLinks.forEach(link => {
    boundLinks.add(link);
    link.addEventListener('click', event => {
      refresh();
      if (openEnrollment) {
        event.preventDefault();
        openEnrollment(campaign, link.dataset.checkout || '', link);
        return;
      }
      trackCheckout(link.dataset.checkout || '', campaign, link.href);
    });
  });
}
