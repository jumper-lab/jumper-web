import type { APIRoute } from 'astro';
import { href } from '../lib/site';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\n${site?.hostname === 'site.jumper.dev.br' ? 'Disallow' : 'Allow'}: /\nSitemap: ${new URL(href('/sitemap.xml'),site).href}\n`, {headers:{'Content-Type':'text/plain'}});
