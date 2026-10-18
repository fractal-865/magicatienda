import type { APIRoute } from 'astro';
import { ORIGIN, BASE } from '../data/site';

/* Mapa del sitio para los buscadores. Se genera en el build para que la
   dirección respete el `base` de astro.config y quede correcta sola el día que
   lamagicatienda.cl apunte al sitio. Se envía una vez en Google Search Console. */
export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${ORIGIN}${BASE}/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${ORIGIN}${BASE}/catalogo/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
