import type { APIRoute } from 'astro';
import { ORIGIN, BASE } from '../data/site';

/* Deja entrar a todos los buscadores y les indica dónde está el mapa del sitio.
   Ojo: mientras el sitio viva en GitHub Pages esto queda en
   /magicatienda/robots.txt, así que funcionará como archivo raíz recién cuando
   el dominio propio (lamagicatienda.cl) apunte al sitio. */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}${BASE}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
