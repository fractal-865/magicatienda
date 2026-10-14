# 🎭 La Mágica Tienda de Disfraces

Sitio web de **arriendo de disfraces para adultos** en Chile, construido con **Astro + Tailwind CSS v4**.

🌐 **Sitio en vivo:** https://fractal-865.github.io/magicatienda/

## ✨ Características

- **51 disfraces reales** con fotos AVIF, tallas, categorías y público (mujer / hombre / unisex)
- **Búsqueda en vivo** con sugerencias y atajos
- **Filtros** por Público, Categoría (con conteo) y Talla
- **Ficha rápida** de cada disfraz con selección de talla y zoom de imagen
- **Carrito de arriendo** con cálculo de total + garantía reintegrable
- **Fechas simplificadas**: eliges el día de retiro y la entrega se calcula sola (+2 días)
- **Cupón `MAGIA15`** y **25% de descuento grupal** desde 7 disfraces
- **Tarifas transparentes** y explicación de la garantía reintegrable
- Secciones: hero, catálogo, promos, pagos, testimonios, FAQ, fechas clave, contacto y mapa
- Todo el contenido en **español (es-CL)**

## 🛠️ Stack

| Tecnología | Uso |
|---|---|
| [Astro](https://astro.build) | Framework estático |
| [Tailwind CSS v4](https://tailwindcss.com) | Estilos (via `@tailwindcss/vite`) |
| `@fontsource` | Fuentes locales (sin CDN) |
| TypeScript | Lógica del sitio (`src/scripts/site.ts`) |

## 🚀 Desarrollo local

```bash
npm install
npm run dev        # servidor de desarrollo
npm run build      # genera el sitio en dist/
npm run preview    # previsualizar el build
```

## 📁 Estructura

```
magicatienda/
├── disfraces.json          # catálogo de 51 disfraces
├── public/img/             # fotos AVIF optimizadas
├── src/
│   ├── components/         # secciones (Header, Catalogo, Tarifas…)
│   ├── data/               # products.ts, site.ts (datos y config)
│   ├── layouts/            # Layout.astro
│   ├── pages/              # index.astro
│   ├── scripts/site.ts     # toda la interactividad
│   └── styles/global.css   # estilos globales y animaciones
└── .github/workflows/      # deploy automático a GitHub Pages
```

## 🌐 Publicación

El sitio se despliega automáticamente en **GitHub Pages** mediante el workflow
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) cada vez que se hace
push a la rama `main`. El build usa `base: '/magicatienda'` para funcionar bajo el
subpath `https://fractal-865.github.io/magicatienda/`.

---

Hecho con 💜 para La Mágica Tienda de Disfraces · [@lamagicatienda](https://instagram.com/lamagicatienda)
