export function validatePrincipalBuild(html, tracking) {
  const expected = tracking.izi.enabled;
  const bootstrap = [...html.matchAll(/<script\b[^>]*id="izi-principal-tracking"[^>]*>[\s\S]*?<\/script>/g)];
  if (bootstrap.length !== 1 || !bootstrap[0][0].includes(JSON.stringify(tracking))) {
    throw new Error('Build principal: bootstrap/configuração não correspondem ao fonte revisado.');
  }
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
  if (!head?.includes(bootstrap[0][0])) throw new Error('Build principal: bootstrap deve estar no head.');
  if (!html.includes('/assets/') || !html.includes('id="root"')) throw new Error('Build principal não contém a aplicação React oficial.');
  const fallback = [...html.matchAll(/<noscript>\s*<iframe[^>]*src="https:\/\/www\.googletagmanager\.com\/ns\.html\?id=GTM-TGQTFXTN"[\s\S]*?<\/noscript>/g)];
  if (fallback.length !== (expected ? 1 : 0)) throw new Error('Build principal: fallback GTM incorreto.');
  if (expected && !/<body>\s*<noscript>\s*<iframe/.test(html)) throw new Error('Build principal: fallback deve ser o primeiro conteúdo do body.');
  if (html.includes('GTM-N52MH72F') || /googletagmanager\.com\/gtag\/js|connect\.facebook\.net|clarity\.ms\/tag/.test(html)) {
    throw new Error('Build principal contém kit Cative ou instalação direta de plataforma.');
  }
  return html;
}
