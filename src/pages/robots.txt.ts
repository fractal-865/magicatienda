import type { APIRoute } from 'astro';
import { ORIGIN, BASE } from '../data/site';

/* Deja entrar a todos los buscadores y les indica dónde está el mapa del sitio. */
export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${ORIGIN}${BASE}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
