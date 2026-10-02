import type { APIRoute } from 'astro';
import { href } from '../lib/site';
export const GET: APIRoute = ({ site }) => new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/sobre/','/lojas/','/menu/'].map(route=>`<url><loc>${new URL(href(route),site).href}</loc></url>`).join('')}</urlset>`, {headers:{'Content-Type':'application/xml'}});
