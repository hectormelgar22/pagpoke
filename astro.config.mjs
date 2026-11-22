// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio público de la web. Cámbialo (o define SITE_URL) antes de publicar para cada tienda.
const site = process.env.SITE_URL || 'https://destello-demo.netlify.app';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { defaultStrategy: 'hover' },
  integrations: [sitemap({ filter: (page) => !page.includes('/panel') && !page.includes('/torneos/evento') })],
});
