import type { APIRoute } from 'astro';
import { ORIGIN, BASE } from '../data/site';
import { PRODUCTS, disfrazSlug } from '../data/products';

/* Mapa del sitio para los buscadores. Se genera en el build para que la
   dirección respete el `base` de astro.config y quede correcta sola el día que
   magicatienda.cl apunte al sitio. Se envía una vez en Google Search Console.

   Incluye la portada, el catálogo y las 156 páginas individuales de disfraces
   (`/disfraz/<n>-<slug>/`), que son las que el sitio quiere posicionar: cada
   disfraz es una página indexable con su propio title, description, canonical
   y Open Graph. La página 404 no se lista (debe quedar fuera del índice). */
export const GET: APIRoute = () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const url = (loc: string, changefreq: string, priority: string) =>
    `  <url>
    <loc>${esc(loc)}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

  const entradas = [
    url(`${ORIGIN}${BASE}/`, 'weekly', '1.0'),
    url(`${ORIGIN}${BASE}/catalogo/`, 'weekly', '0.9'),
    // Una línea por disfraz, en orden de número de catálogo
    ...PRODUCTS.map((p) => url(`${ORIGIN}${BASE}/disfraz/${disfrazSlug(p)}/`, 'monthly', '0.8')),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};