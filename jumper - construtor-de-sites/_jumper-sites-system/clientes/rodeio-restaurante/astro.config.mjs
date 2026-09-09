import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
export default defineConfig({site:process.env.SITE_URL || 'http://localhost:4321',integrations:[sitemap()],output:'static',build:{inlineStylesheets:'always'},trailingSlash:'always',devToolbar:{enabled:false},server:{port:4321}});
