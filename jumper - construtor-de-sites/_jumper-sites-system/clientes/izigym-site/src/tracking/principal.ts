import { readCampaign, trackingCampaign, trackingCheckoutUrl } from "@cerrocora-attribution";
import defaultConfig from "@/data/tracking.json";

type Campaign = Record<string, string>;
type PrincipalConfig = typeof defaultConfig;
type Runtime = { refresh: () => void; dispose: () => void };
declare global {
  interface Window {
    dataLayer?: unknown[];
    iziPrincipalTracking?: PrincipalConfig;
    iziPrincipalTrackingRuntime?: Runtime;
  }
}

const extraClickIds = ["gbraid", "wbraid", "dclid", "msclkid"];
const extraStorageKey = "izi:principal-click-attribution:v1";
const baseStorageKey = "izi:principal-attribution:v1";
const checkoutOrigin = "https://vendas.online.sistemapacto.com.br";
const selector = "a[data-checkout], a[data-whatsapp]";

function storage() {
  try { return window.sessionStorage; }
  catch { return { getItem: () => null, setItem: () => {} }; }
}

function safeExtraClickIds(values: Campaign): Campaign {
  return Object.fromEntries(Object.entries(values).filter(([key, value]) =>
    extraClickIds.includes(key) && typeof value === "string" && !!trackingCampaign({ fbclid: value }).fbclid,
  ));
}

export function principalCampaign(): Campaign {
  const store = storage();
  const query = new URLSearchParams(location.search);
  const baseArrival = [...query].some(([key, value]) => (/^utm_[a-z0-9_]+$/.test(key) || ["gclid", "fbclid"].includes(key)) && value);
  const extra = Object.fromEntries([...query].filter(([key, value]) => extraClickIds.includes(key) && value));
  if (Object.keys(extra).length && !baseArrival) {
    try { store.setItem(baseStorageKey, "{}"); } catch { /* Arrival still works. */ }
  }
  const base = Object.keys(extra).length && !baseArrival ? {} : readCampaign(location.search, {
    getItem: () => store.getItem(baseStorageKey),
    setItem: (_key, value) => store.setItem(baseStorageKey, value),
  });
  // A new campaign replaces the prior optional click identifiers as well.
  if (Object.keys(extra).length || baseArrival) {
    try { store.setItem(extraStorageKey, JSON.stringify(extra)); } catch { /* Arrival still works. */ }
    return { ...base, ...extra };
  }
  try {
    const saved = JSON.parse(store.getItem(extraStorageKey) || "{}");
    return { ...base, ...(saved && !Array.isArray(saved) && typeof saved === "object" ? Object.fromEntries(Object.entries(saved).filter(([key, value]) => extraClickIds.includes(key) && typeof value === "string" && value)) : {}) } as Campaign;
  } catch { return base; }
}

function checkoutDestination(href: string): URL | null {
  try {
    const url = new URL(href);
    return url.origin === checkoutOrigin && ["/planos", "/checkout"].includes(url.pathname) ? url : null;
  } catch { return null; }
}

export function attributedCheckoutHref(href: string, campaign: Campaign): string {
  const url = checkoutDestination(href);
  if (!url) return href;
  for (const [key, value] of Object.entries(campaign)) {
    if ((/^utm_[a-z0-9_]+$/.test(key) || ["gclid", "fbclid", ...extraClickIds].includes(key)) && value) {
      url.searchParams.set(key, value);
    }
  }
  return url.href;
}

export function principalCheckoutTelemetry(href: string) {
  const url = new URL(href);
  const campaign = Object.fromEntries(url.searchParams);
  const attribution = { ...trackingCampaign(campaign), ...safeExtraClickIds(campaign) };
  const safe = new URL(trackingCheckoutUrl(href));
  for (const key of ["un", "pl", "cupom"]) {
    const value = safe.searchParams.get(key);
    if (value && !trackingCampaign({ [key === "cupom" ? "utm_content" : "utm_id"]: value })[key === "cupom" ? "utm_content" : "utm_id"]) safe.searchParams.delete(key);
  }
  for (const [key, value] of Object.entries(safeExtraClickIds(campaign))) safe.searchParams.set(key, value);
  return { checkout_url: safe.href, ...attribution };
}

function isWhatsApp(href: string) {
  try {
    const url = new URL(href);
    return (url.origin === "https://wa.me" && /^\/\d+$/.test(url.pathname)) ||
      (url.origin === "https://api.whatsapp.com" && url.pathname === "/send");
  } catch { return false; }
}

export function setupPrincipalTracking(): Runtime {
  if (window.iziPrincipalTrackingRuntime) return window.iziPrincipalTrackingRuntime;
  const config = window.iziPrincipalTracking || defaultConfig;
  const handled = new WeakSet<Event>();
  const decoration = new WeakMap<HTMLAnchorElement, { original: URLSearchParams; applied: Campaign }>();
  const decorate = (link: HTMLAnchorElement, campaign: Campaign) => {
    const current = checkoutDestination(link.href);
    if (!current) return;
    const previous = decoration.get(link) || { original: new URLSearchParams(current.search), applied: {} };
    // Remove only attribution previously appended by this runtime. Commercial
    // parameters and late Google linker decoration are kept from the live href.
    for (const [key, value] of Object.entries(previous.applied)) {
      if (!(key in campaign) && current.searchParams.get(key) === value) {
        if (previous.original.has(key)) current.searchParams.set(key, previous.original.get(key)!);
        else current.searchParams.delete(key);
      }
    }
    const next = attributedCheckoutHref(current.href, campaign);
    if (next !== link.href) link.href = next;
    decoration.set(link, { original: previous.original, applied: campaign });
  };
  const refresh = () => {
    const campaign = principalCampaign();
    document.querySelectorAll<HTMLAnchorElement>("a[data-checkout]").forEach(link => {
      decorate(link, campaign);
    });
  };
  const activate = (event: MouseEvent) => {
    if (event.defaultPrevented || handled.has(event) || (event.type === "auxclick" ? event.button !== 1 : event.button !== 0)) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(selector) : null;
    if (!link) return;
    let payload: Record<string, unknown>;
    if (link.dataset.checkout && checkoutDestination(link.href)) {
      decorate(link, principalCampaign());
      payload = { event: "checkout_click", site_id: config.siteId, izi_enabled: config.izi.enabled, placement: link.dataset.checkout, ...principalCheckoutTelemetry(link.href) };
    } else if (link.dataset.whatsapp && link.dataset.whatsappChannel === "principal_sales" && isWhatsApp(link.href)) {
      payload = { event: "whatsapp_click", site_id: config.siteId, izi_enabled: config.izi.enabled, placement: link.dataset.whatsapp, channel_id: "principal_sales" };
    } else return;
    handled.add(event);
    try {
      window.dataLayer ||= [];
      window.dataLayer.push(payload);
    } catch { /* A broken or late tool must never block navigation. */ }
  };
  // Delegation survives lazy sections, React remounts and route transitions.
  document.addEventListener("click", activate);
  document.addEventListener("auxclick", activate);
  window.addEventListener("pageshow", refresh);
  window.addEventListener("popstate", refresh);
  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
  const runtime: Runtime = {
    refresh,
    dispose: () => {
      document.removeEventListener("click", activate);
      document.removeEventListener("auxclick", activate);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("popstate", refresh);
      observer.disconnect();
      delete window.iziPrincipalTrackingRuntime;
    },
  };
  window.iziPrincipalTrackingRuntime = runtime;
  refresh();
  return runtime;
}
