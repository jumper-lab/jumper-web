import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import seo from './data/seo.json' with {type:'json'};
import eventsApi from './scripts/events-api-middleware.mjs';
export default defineConfig({site:process.env.SITE_URL || 'http://localhost:4321',base:process.env.BASE_PATH || '/',integrations:[sitemap({filter:(url)=>{let route=new URL(url).pathname;const prefix=(process.env.BASE_PATH||'/').replace(/\/$/,'');if(prefix&&route.startsWith(prefix+'/'))route=route.slice(prefix.length);return seo.pages[route]?.index===true;}})],vite:{plugins:[eventsApi()]},output:'static',build:{inlineStylesheets:'always'},trailingSlash:'always',devToolbar:{enabled:false},server:{port:4321}});
