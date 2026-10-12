// Serialized into the official HTML by the Hoster. Keep this function self-contained.
export function bootstrapTracking(tracking) {
  if (window.cerroCoraTracking) return;
  window.cerroCoraTracking = tracking;
  const layer = window.dataLayer = window.dataLayer || [];
  layer.push({
    site_id: tracking.siteId,
    izi_enabled: tracking.izi.enabled,
    cative_enabled: tracking.cative.enabled,
  });

  function loadScript(src) {
    if ([...document.scripts].some(script => script.src === src)) return;
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  // Preserve the direct Cative path until its published GTM replacement is validated.
  const legacyGa4 = tracking.cative.legacy.ga4Direct;
  if (tracking.cative.enabled && legacyGa4.enabled) {
    window.gtag = window.gtag || function () { layer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', legacyGa4.measurementId);
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + legacyGa4.measurementId);
  }

  const kits = [tracking.cative, tracking.izi].filter(kit => kit.enabled);
  // Both containers consume the same startup event. A second gtm.js push could
  // refire pageview tags in a container that has already loaded.
  if (kits.length && !layer.some(entry => entry && entry.event === 'gtm.js')) {
    layer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  }
  for (const kit of kits) {
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + kit.gtmId);
  }
}
