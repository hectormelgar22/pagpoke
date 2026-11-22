// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio público de la web. Cámbialo (o define SITE_URL) antes de publicar para cada tienda.
const site = process.env.SITE_URL || 'https://destello-demo.netlify.app';

// Subcarpeta para GitHub Pages de proyecto (p. ej. BASE_PATH=/pagpoke). Vacío en Netlify o dominio propio.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  prefetch: { defaultStrategy: 'hover' },
  integrations: [sitemap({ filter: (page) => !page.includes('/panel') && !page.includes('/torneos/evento') })],
});
