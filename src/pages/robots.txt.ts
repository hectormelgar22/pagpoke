import type { APIRoute } from 'astro';

// robots.txt con el dominio configurado (SITE_URL o astro.config.mjs)
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *
Allow: /
Disallow: /panel/

Sitemap: ${new URL('/sitemap-index.xml', site).href}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
