import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// La Mágica Tienda de Disfraces — sitio estático con Astro + Tailwind CSS v4
// `base` permite publicar bajo https://<usuario>.github.io/<repo>/
export default defineConfig({
  base: '/magicatienda',
  site: 'https://lamagicatienda.cl',
  vite: {
    plugins: [tailwindcss()],
  },
});
