export function prepareInstitutionalPreview(text, slug) {
  if (!['izigym', 'izigym2'].includes(slug)) throw new Error('Slug institucional inválido.');
  // Match origin-root references only; preserve Vite's existing base and external URLs.
  text = text.replace(/(["'`(=,\s])\/(cdn-cgi|assets|images|brand)\//g, `$1/${slug}/$2/`)
    .replace(/(["'`(=,\s])\/(favicon\.png|placeholder\.svg)/g, `$1/${slug}/$2`);
  if (slug === 'izigym') {
    text = text.replaceAll('https://www.izigym.com.br/', 'https://site.jumper.dev.br/izigym/')
      .replaceAll('"izi":{"enabled":true,"gtmId":"GTM-TGQTFXTN"}', '"izi":{"enabled":false,"gtmId":"GTM-TGQTFXTN"}')
      .replace(/<noscript>\s*<iframe[^>]*src="https:\/\/www\.googletagmanager\.com\/ns\.html[^>]*><\/iframe>\s*<\/noscript>/g, '')
      .replace(/(<meta name="(?:robots|googlebot)" content=")[^"]*("\s*\/?>)/g, '$1noindex, nofollow$2');
  } else {
    text = text.replaceAll('https://site.jumper.dev.br/izigym/', 'https://site.jumper.dev.br/izigym2/');
  }
  return text;
}
