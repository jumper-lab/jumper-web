import { bootstrapTracking } from '../../izigym-lp/src/tracking-bootstrap.mjs';

function replaceOnce(html, pattern, replacement, label) {
  const matches = [...html.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`Cerro Corá: ${label} esperado uma vez; encontrado ${matches.length}.`);
  return html.replace(pattern, () => replacement);
}

export function prepareCerroCoraTracking(html, tracking) {
  if (tracking.siteId !== 'cerrocora') throw new Error('Escopo de tracking diferente de Cerro Corá.');
  if (tracking.izi.gtmId !== 'GTM-TGQTFXTN' || tracking.cative.gtmId !== 'GTM-N52MH72F') {
    throw new Error('Containers diferentes dos revisados para Cerro Corá.');
  }
  if (tracking.cative.legacy.ga4Direct.measurementId !== 'G-7CECXK1LS2'
    || tracking.cative.legacy.metaCheckout.pixelId !== '922916223883872') {
    throw new Error('Destinos legados diferentes dos revisados para Cative.');
  }
  if (![tracking.izi.enabled, tracking.cative.enabled, tracking.cative.legacy.ga4Direct.enabled].every(value => typeof value === 'boolean')
    || !['legacy', 'gtm'].includes(tracking.cative.legacy.metaCheckout.source)) {
    throw new Error('Controles de tracking inválidos.');
  }
  const serialized = JSON.stringify(tracking).replaceAll('<', '\\u003c');
  const bootstrap = `<script id="cerrocora-tracking">(${bootstrapTracking.toString()})(${serialized});</script>`;
  html = replaceOnce(html, /<script\b[^>]*>\(function\(w,d,s,l,i\)[\s\S]*?GTM-N52MH72F[\s\S]*?<\/script>/g, bootstrap, 'bootstrap GTM legado');
  html = replaceOnce(html, /<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-7CECXK1LS2"[^>]*><\/script>/g, '', 'script GA4 legado');
  html = replaceOnce(html, /<script\b[^>]*>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)[\s\S]*?gtag\('config','G-7CECXK1LS2'\);<\/script>/g, '', 'config GA4 legada');
  const noscript = [tracking.cative, tracking.izi].filter(kit => kit.enabled).map(kit =>
    `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${kit.gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>`).join('');
  return replaceOnce(html, /<noscript><iframe\b[^>]*src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-N52MH72F"[^>]*><\/iframe><\/noscript>/g, noscript, 'noscript GTM legado');
}
