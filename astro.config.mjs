import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// La Mágica Tienda de Disfraces — sitio estático con Astro + Tailwind CSS v4
// `base` permite publicar bajo https://<usuario>.github.io/<repo>/
export default defineConfig({
  base: '/',
  site: 'https://magicatienda.cl',
  vite: {
    plugins: [tailwindcss()],
    // El ZIP de despliegue vive en la raíz del proyecto y se regenera seguido.
    // En Windows/OneDrive el watcher lo encuentra bloqueado y tira EBUSY, lo que
    // reinicia Vite y devuelve 502 en módulos e imágenes (el sitio "a medias").
    server: {
      watch: {
        ignored: ['**/*.zip', '**/dist/**', '**/.astro/**'],
      },
    },
  },
});
