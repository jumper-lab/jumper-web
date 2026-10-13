import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import eventsApi from './scripts/events-api-middleware.mjs';
export default defineConfig({site:process.env.SITE_URL || 'http://localhost:4321',base:process.env.BASE_PATH || '/',integrations:[sitemap()],vite:{plugins:[eventsApi()]},output:'static',build:{inlineStylesheets:'always'},trailingSlash:'always',devToolbar:{enabled:false},server:{port:4321}});
