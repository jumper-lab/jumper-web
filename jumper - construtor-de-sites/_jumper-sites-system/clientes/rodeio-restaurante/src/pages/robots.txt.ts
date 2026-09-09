import type { APIRoute } from 'astro';
export const GET:APIRoute=()=>new Response(import.meta.env.PUBLIC_LIVE_SITE==='true'?`User-agent: *\nAllow: /\nSitemap: ${import.meta.env.SITE_URL||'http://localhost:4321'}/sitemap-index.xml\n`:'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}});
