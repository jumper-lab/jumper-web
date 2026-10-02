import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://paodequeijohaddocklobo.com.br',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  vite: { build: { assetsInlineLimit: 0 } }
});
