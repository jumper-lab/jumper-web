import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';

const useLocalProductionServer = process.env.BELIE_LOCAL_PRODUCTION === '1';
const base = process.env.BASE_PATH || undefined;
const site = process.env.SITE_URL || 'https://casabelie.com.br';

export default defineConfig({
  output: 'server',
  adapter: useLocalProductionServer ? node({ mode: 'standalone' }) : vercel(),
  site,
  base,
  devToolbar: { enabled: false },
  build: { inlineStylesheets: 'always' },
});
