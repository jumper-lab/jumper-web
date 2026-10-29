// Serialized into the head by Vite; keep this function self-contained.
export function bootstrapPrincipalTracking(config) {
  if (window.iziPrincipalTracking) return;
  window.iziPrincipalTracking = config;
  const layer = window.dataLayer = window.dataLayer || [];
  layer.push({ site_id: config.siteId, izi_enabled: config.izi.enabled });
  if (!config.izi.enabled) return;
  if (!layer.some(entry => entry && entry.event === 'gtm.js')) {
    layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }
  const installed = [...document.scripts].some(script => {
    try {
      const url = new URL(script.src);
      return url.origin === 'https://www.googletagmanager.com' &&
        url.pathname === '/gtm.js' && url.searchParams.get('id') === config.izi.gtmId;
    } catch { return false; }
  });
  if (installed) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=' + config.izi.gtmId;
  document.head.appendChild(script);
}

export function principalTrackingTags(config) {
  if (config.siteId !== 'principal' || typeof config.izi?.enabled !== 'boolean' || config.izi.gtmId !== 'GTM-TGQTFXTN') {
    throw new Error('Configuração principal Izi inválida.');
  }
  const tags = [{
    tag: 'script', attrs: { id: 'izi-principal-tracking' },
    children: `(${bootstrapPrincipalTracking.toString()})(${JSON.stringify(config).replaceAll('<', '\\u003c')});`,
    injectTo: 'head',
  }];
  if (config.izi.enabled) tags.push({
    tag: 'noscript',
    children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${config.izi.gtmId}" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe>`,
    injectTo: 'body-prepend',
  });
  return tags;
}
