import type { APIRoute } from 'astro';

/* Manifest de la app: se genera en el build para que las rutas respeten el
   `base` de astro.config (hoy /magicatienda). Se usa al "agregar a inicio". */
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: 'La Mágica Tienda de Disfraces',
        short_name: 'La Mágica',
        description: 'Arriendo de disfraces para adultos en Punta Arenas.',
        start_url: `${base}/`,
        scope: `${base}/`,
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#5a2a9c',
        icons: [
          { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
