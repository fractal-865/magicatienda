---
name: La Mágica Tienda de Disfraces
description: Sistema visual "puesto de feria hechizado" — morado noche, ámbar fiesta y script manuscrito para arriendo de disfraces solo para adultos.
colors:
  violeta-noche: "#2b0d5e"
  púrpura-profundo: "#3c1481"
  morado-real: "#4a1b96"
  mago: "#5a2a9c"
  lila: "#7a4fd0"
  lavanda-niebla: "#efe7ff"
  línea-lila: "#e8dff8"
  neblina: "#f6f1ff"
  ámbar-fiesta: "#ffd23f"
  rosa-chicle: "#ff5fa2"
  turquesa: "#0fae9f"
  menta: "#2ee6d6"
  tinta-berenjena: "#2a1155"
  tinta-media: "#66539c"
  wsp-verde: "#25D366"
typography:
  display:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.15
  display-compact:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.8vw, 2.15rem)"
    fontWeight: 700
    lineHeight: 1.15
  section:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.15
  headline:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(2rem, 2.6vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.15
  plan-title:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
  subhead:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
  banner-display:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "3.1rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.25
  lead:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-strong:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.5
  small:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Nunito, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    letterSpacing: "0.06em"
  price:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1
  price-lg:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2rem)"
    fontWeight: 700
    lineHeight: 1
  price-plan:
    fontFamily: "Fredoka, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 2.8rem)"
    fontWeight: 700
    lineHeight: 1
  script:
    fontFamily: "Caveat, cursive"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1
  script-lg:
    fontFamily: "Caveat, cursive"
    fontSize: "1.8rem"
    fontWeight: 600
    lineHeight: 1
  script-sm:
    fontFamily: "Caveat, cursive"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  pill: "999px"
spacing:
  section: "46px"
  container: "1220px"
components:
  button-primary:
    backgroundColor: "{colors.ámbar-fiesta}"
    textColor: "{colors.violeta-noche}"
    typography: "Fredoka 600 1rem"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-primary-hover:
    backgroundColor: "#ffdb60"
    textColor: "{colors.violeta-noche}"
  button-whatsapp:
    backgroundColor: "{colors.wsp-verde}"
    textColor: "#ffffff"
    typography: "Fredoka 700 1rem"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  button-ghost:
    backgroundColor: "#ffffff"
    textColor: "{colors.morado-real}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
  chip-filter:
    backgroundColor: "#ffffff"
    textColor: "{colors.tinta-berenjena}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  chip-filter-on:
    backgroundColor: "{colors.ámbar-fiesta}"
    textColor: "{colors.violeta-noche}"
  card-product:
    backgroundColor: "#ffffff"
    textColor: "{colors.tinta-berenjena}"
    rounded: "{rounded.xl}"
    padding: "14px"
  card-banner:
    backgroundColor: "{colors.morado-real}"
    textColor: "#ffffff"
    rounded: "{rounded.2xl}"
    padding: "28px"
  input-field:
    backgroundColor: "#f9f6ff"
    textColor: "{colors.tinta-berenjena}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
---

# Design System: La Mágica Tienda de Disfraces

## Overview

**Creative North Star: "El Puesto Hechizado de Feria"**

El sistema se imagina como un puesto de carnaval nocturno: terciopelo morado bajo luces ámbar, letreros pintados a mano y globos que flotan. La noche morada (`#2b0d5e`→`#5a2a9c`) es el escenario; el ámbar `#ffd23f` es la bombilla que enciende la acción; el rosa chicle `#ff5fa2` aporta la picardía de fiesta. Todo se apoya en una base clara y lavanda (`#f8f5ff`→`#f2ecfb`) donde vive el contenido, para que 51 fotos de disfraces sean las estrellas.

La personalidad es "mágica pero adulta": redondez generosa (10–24px, botones pill), sombras suaves teñidas de morado (nunca gris puro), tipografía Fredoka redondeada para títulos y Nunito legible para cuerpo, y Caveat manuscrita solo como exclamación decorativa — nunca como texto informativo. La tensión "cute vs. adulto" se resuelve con dosis: script, doodles y confeti son condimento (≤2 usos por pantalla), el peso visual lo llevan las fotos reales y los números (precios, garantía, fechas).

**Key Characteristics:**
- Escenario morado-noche + luz ámbar; base clara lavanda para el contenido.
- Botones pill con "bounce" (cubic-bezier(0.34,1.56,0.64,1)) y sombras moradas.
- Títulos Fredoka 700 con subrayado arcoíris; cuerpo Nunito 400/700/800.
- Script Caveat como grito decorativo con subrayado rosa dibujado a mano.
- Emojis como iconografía (sistema, sin librería de íconos) + doodles SVG flotantes de trazo fino.
- Motion discreto y con propósito; todo bajo guardia `prefers-reduced-motion`.

## Colors

Paleta de fiesta nocturna: fondos lavanda claros, escenarios morados profundos y acentos saturados usados como señales, no como decoración.

### Primary
- **Violeta Noche** (`#2b0d5e`): fondo de la barra de urgencia y banners degradados; texto sobre acentos ámbar.
- **Púrpura Profundo** (`#3c1481`): primer paso de los degradados de banner (Halloween, hero).
- **Morado Real** (`#4a1b96`): botones morados primarios, texto de enlaces activos, borde de inputs enfocados; el "color de marca" institucional.
- **Mago** (`#5a2a9c`): segundo paso de degradados, sombras (rgba(90,42,156,…)), foco global (`outline` 3px).
- **Lila** (`#7a4fd0`): bordes fantasma de botones, hover de tarjetas, puntuaciones punteadas.

### Secondary
- **Ámbar Fiesta** (`#ffd23f`): CTA primario, precios destacados, subrayado de script, badge de "Más popular", borde de garantía. Máximo ~10% de la pantalla: su escasez lo hace brillar.
- **Rosa Chicle** (`#ff5fa2`): segundo acento (badges del carrito, borde inferior del script, urgencia, hover de chips activos).
- **Turquesa** (`#0fae9f`) y **Menta** (`#2ee6d6`): acentos de categorías/degradados puntuales, uso mínimo.
- **Oro legible** (`--color-star`, `#926b00`): estrellas de testimonios. Da 4,86:1 sobre blanco; el ámbar de marca no alcanza para texto pequeño.

### Tertiary
- **Verde WhatsApp** (`#25D366`, degradado `#2ecb6e`→`#128f4a`): exclusivo de acciones de contacto a WhatsApp. Ningún otro elemento usa verde.

### Neutral
- **Lavanda Niebla** (`#efe7ff`): footer, fondos de chips pequeños.
- **Línea Lila** (`#e8dff8`): bordes de tarjetas e inputs (nunca gris).
- **Neblina** (`#f6f1ff`): fondos de bloques internos (guía 3 días, chat).
- **Tinta Berenjena** (`#2a1155`): todo el texto principal.
- **Tinta Media** (`#66539c`): texto secundario. Cuidado: sobre `#f6f1ff` rinde ~4.7:1; no bajar su tamaño por debajo de ~13px en texto informativo.
- **Placeholder** (`--color-placeholder`, `#7a64b5`): solo placeholders de buscador. Rinde 4,55:1 sobre `#f9f6ff`.

### Superficies especiales
Dos superficies no usan el morado de marca y tienen su propia escala en `@theme`. No son excepciones sueltas: cada una se ajusta desde sus tokens, nunca con hex sueltos.
- **Panel "Tu arriendo"** (`--color-dw-*`), violeta neutra: `dw-bg` fondo del panel y del cuerpo; `dw-line` / `dw-line2` bordes de tarjetas y controles; `dw-div` divisores internos; `dw-field` fondo de selects y contadores; `dw-ink` títulos, valores y cifras; `dw-ink2` texto secundario y de controles; `dw-mute` "Desde", unidades e iconos suaves; `dw-accent` precios y contadores; `dw-accent2` enlaces e iconos; `dw-accent-soft` fondos lilas; `dw-focus` borde de foco; `dw-scroll` scrollbar.
- **Barra de filtros pegada** (`--color-fb-*`), pergamino: `fb-bg1..3` degradado de fondo; `fb-hover` hover de chips; `fb-line` / `fb-line2` bordes y separadores; `fb-ink` texto oscuro; `fb-mute` placeholder. Su sombra es `--shadow-fb`.
- **Estados**: `--color-ok` / `ok-soft` / `ok-line` / `ok-ink` (confirmación: copiado, listo, incluido, garantía) en violeta de marca, `--color-warn` / `warn-soft` / `warn-line` (atención: falta un dato, faltan días) en ámbar, y `--color-bad` (dato faltante o error) en rojo. El verde no participa: es de WhatsApp.
- **Sombras**: `--shadow-dw` (tarjetas del panel) y `--shadow-fb` (barra pegada, tinte cálido a juego con el pergamino).

### Named Rules
**The Amber Bulb Rule.** El ámbar es la luz del puesto: CTA primario, precio o garantía. Si una pantalla tiene más de 3 elementos ámbar, quitar uno.
**The Green Means WhatsApp Rule.** Verde = "esto abre WhatsApp". No usar verde para éxito, link ni estado.
**The Violet Means Done Rule.** Lo que el sistema confirma (copiado, completo, incluido, garantía) se dice en violeta sobre lavanda; lo que pide atención (elegir talla, días que faltan) en ámbar. El rojo queda solo para el error.
**The Purple Shadow Rule.** Toda sombra se tiñe de morado (`rgba(90,42,156,·)` o `rgba(60,20,120,·)`). Sombra gris pura está prohibida. La única excepción es `--shadow-fb`, teñida de cálido porque pertenece a la barra pergamino.

### Deuda conocida (auditoría oct. 2026)
- **Verde fuera de WhatsApp:** resuelto en `/impeccable colorize`. `.sum-check`/`.sum-note`, `.loadprog.completo`, `.copybtn.done`, `.dot-ok` de la ficha, los bullets de Tarifas y el badge del mega menú pasaron a violeta (`--color-ok*`); la cuenta regresiva de Fechas, el pulso de "elegir talla" y el aviso de la sección de tallas pasaron a ámbar (`--color-warn*`). Además se eliminó CSS muerto que aún cargaba verde (`.gchip`, `.req-pill.green`, `.datebox.destacar`).
- **Contraste de placeholders:** resuelto en `/impeccable polish`. `--color-placeholder` pasó de `#9a88c9` (2,92:1) a `#7a64b5` (4,55:1 sobre `#f9f6ff`); `--color-fb-mute` de `#a89c88` (2,44:1) a `#746852` (4,94:1 sobre `#f8f3e9`); `--color-dw-mute` de `#9a93ad` (2,63:1) a `#6f677e` (4,80:1 sobre `#f4f1f9`).

## Typography

**Display Font:** Fredoka (500/600/700) con fallback `system-ui, sans-serif`.
**Body Font:** Nunito (400/700/800) con fallback `system-ui, sans-serif`.
**Script Font:** Caveat (600), solo decorativa, con fallback `cursive`.

**Character:** Fredoka redondeada y amable da voz a marca y títulos; Nunito hace el trabajo pesado de lectura con buenos pesos; Caveat acentúa como letra pintada a mano. El trío evoca letreros de feria sin caer en fuente infantil: la adultez viene del cuerpo de texto y la jerarquía, no de endurecer las fuentes.

### Hierarchy
La escala se organiza por rol, no por componente. Los tokens viven en `@theme` (`--text-display`, `--text-display-compact`, `--text-section`, `--text-section-sm`, `--text-headline`, `--text-plan-title`, `--text-subhead`, `--text-banner-display`, `--text-title`, `--text-lead`, `--text-body`, `--text-small`, `--text-micro`, `--text-price`, `--text-price-lg`, `--text-price-plan`, `--text-script-lg`, `--text-script-sm`); cualquier tamaño nuevo se agrega ahí.

- **Display** (Fredoka 700, `clamp(1.75rem,3.2vw,2.5rem)`, lh 1.15): h1 de página. Siempre el titular más grande de su pantalla.
- **Display compact** (Fredoka 700, `clamp(1.6rem,2.8vw,2.15rem)`): h1 del home y titulares de banners, para que el hero no compita con el resto de la página.
- **Section** (Fredoka 700, `clamp(1.5rem,3vw,2rem)`): `h2.sec`, con subrayado arcoíris de 92×6px; `h2.sec-sm` usa `clamp(1.25rem,2.4vw,1.6rem)`. En móvil queda un paso bajo el h1 del hero.
- **Headline** (Fredoka 700, `clamp(2rem,2.6vw,2.4rem)`): h1 de la ficha; `--text-price-lg` (`clamp(1.75rem,4vw,2rem)`) para el precio de la ficha y el total de la solicitud; `--text-price-plan` (`clamp(2.2rem,4vw,2.8rem)`) para el precio de los planes. Solo para nombres de producto y cifras.
- **Title** (Fredoka 600, 1.0625rem, lh 1.25): títulos de tarjetas de producto, pasos, acordeones y `h3–h5`.
- **Lead** (Nunito 400, 1.125rem, lh 1.6): entradilla de sección o bajada destacada; máximo un uso por bloque.
- **Body** (Nunito 400, 1rem, lh 1.6): descripciones, FAQ, condiciones y respuestas. Medida máxima 68ch en párrafos sueltos.
- **Small** (Nunito 400/700, 0.875rem, lh 1.6): metadatos, ayudas, notas legales y texto secundario. Es el piso para cualquier texto informativo.
- **Label** (Nunito 800, 0.75rem, uppercase, tracking 0.06–0.08em): categorías, tags de plan, "Día 1", títulos de grupo de filtros, badges. Es el único rol que puede llegar a 12px.
- **Price** (Fredoka 700, 1.375rem, `tabular-nums`): cifras en tarjetas y resúmenes; los importes alinean dígitos entre filas.
- **Script** (Caveat 600, 1.6rem, rotate −3°): un grito por sección ("¡Elige y brilla!", "Sin letra chica"), siempre con subrayado rosa manuscrito.

### Named Rules
**The One Script Rule.** Máximo un `.script` visible por sección; nunca en botones, precios ni información legal.
**Uppercase is for Labels.** Mayúsculas solo en labels cortos (≤3 palabras); nunca en oraciones.
**The 16px Floor Rule.** El cuerpo de texto nunca baja de 16px; metadatos y ayudas nunca bajan de 14px; solo los labels uppercase pueden usar 12px. Nada informativo por debajo de 12px.
**The Heading Weight Rule.** `h1` y `h2` van en Fredoka 700; `h3–h5` en 600. Todos usan `text-wrap: balance` y nunca heredan 400.
**The 68ch Rule.** Párrafos corridos se limitan a 68ch; los bloques centrados de sección, a 68ch como máximo.
**The Input Zoom Rule.** `input`, `select` y `textarea` se renderizan a 16px para que iOS no haga zoom al enfocar.

## Layout

Contenedor único de `max-width: 1220px` centrado con `padding-inline: 16px`. Ritmo vertical: secciones con `padding-block: 46px` (catálogo usa 30/46). Las cuatro secciones de cierre —pagos, mapa, contacto y faq— usan `--space-section-tight` (32px) para leerse como un solo grupo. Cada sección abre con `script` + `h2.sec` + `sec-sub` (centrados) y cierra con contenido en grilla.

Breakpoints observados (mix de Tailwind `min-*` y media queries en CSS):
- **900px**: umbral principal móvil↔escritorio. Definido por el usuario como "móvil" todo lo inferior (bottom nav, panel de filtros como cajón, 2 columnas de grilla, sticky bar del carrito). También es el corte de `grid-cols-[304px_1fr]` del catálogo.
- **1100px**: las seis tarjetas de "Fechas" pasan de carrusel con snap a una fila de seis columnas; **1024px** los pasos de "Cómo funciona" pasan a 4 columnas; **960px** mapa en dos columnas; **820px** beneficios; **760px** botón WhatsApp etiquetado; **600px** grilla 2 columnas y ajustes de urgencia; **560px** minicart fullscreen, pasos y contacto en 2 columnas; **370px** el precio de la tarjeta de producto baja a dos líneas; **360px** el CTA "Disfraces" del header queda solo con icono.
- Grilla de productos: `repeat(auto-fill, minmax(215px,1fr))` en escritorio; forzada a 2 columnas fijas bajo 600px con `!important` (fotos 2:3 completas, sin recorte, `object-position: center top`).
- Slider de banners promocionales con snap-x en móvil (`min-width: min(350px,84vw)`).
- Zonas fijas: header sticky (z-60), barra de urgencia (z-55), filtros sticky del catálogo (z-40), bottom nav móvil (z-85), flotante WhatsApp (z-88), minicart (z-95), modales (z-110), toasts (z-120), confeti (z-130).

### Named Rules
**The 1220 Rule.** Ningún contenido excede 1220px; dentro, el texto corrido vive en bloques de ≤70ch.
**Mobile Bottom Zone.** En móvil, reservar el zócalo inferior: bottom nav (≈60px) + safe-area; todo elemento fijo se calcula sobre ella (`bottom-[72px]` sticky bar, `pb-[90px]` footer).

## Elevation & Depth

Sistema híbrido: superficies planas con borde lila, elevadas solo por estado (hover, apertura, elemento flotante). Las sombras son siempre moradas y difusas; los degradados morados dan profundidad atmosférica a banners y headers de secciones oscuras. Doodles SVG flotantes con parallax suave aportan capa de fondo sin interferir (`pointer-events: none`, z-0).

### Shadow Vocabulary
- **sh — reposo elevado** (`0 10px 26px rgb(90 42 156 / .12)`): tarjetas de banner, chips flotantes, modales pequeños.
- **sh2 — flotante** (`0 16px 40px rgb(90 42 156 / .18)`): banners, sticky bar, burbuja WhatsApp, popovers.
- **card inline** (`0 8px 20px rgba(90,42,156,.08)`): tarjetas de producto en reposo.
- **hover lift** (`0 16px 30px rgba(90,42,156,.16)` + `translateY(-5…-6px)`): hover de tarjetas y pasos.
- **header scrolled** (`0 6px 24px rgb(90 42 156 / .12)`): solo tras 40px de scroll.
- **dw — panel** (`--shadow-dw`, `0 3px 10px rgb(74 27 150 / .05)`): tarjetas y paneles del drawer "Tu arriendo".
- **fb — barra pegada** (`--shadow-fb`, `0 10px 26px rgb(120 96 60 / .14)`): tinte cálido, a juego con el pergamino; es la única sombra no morada y no debe reutilizarse fuera de esa barra.

### Named Rules
**The Flat-By-Default Rule.** En reposo, tarjetas con borde `#e8dff8` y sombra tenue; la sombra profunda es respuesta a interacción, no estado base.

## Shapes

Lenguaje de esquinas redondeadas amable y consistente: 10px (inputs pequeños, chips de talla), 12px (inputs, select), 14–16px (acordeones, bloques internos, badges), 18–20px (tarjetas de producto, contactos), 22–24px (banners, tarjetas de plan, modales, cajones), pill 999px (todos los botones y chips-filtro). Recurrentes: borde `2px` o `1.5px` en `#e8dff8`; borde izquierdo grueso de 6px coloreado en tarjetas de contacto/pagos; borde punteado lila para bloques "explicativos" (3 días, fechas de retiro); cinta diagonal de precio (`rotate(3deg)`, esquinas izquierdas) sobre la foto del producto.

## Components

### Buttons
- **Shape:** pill (999px), padding 12×22 (`btn-sm` 9×14, `btn-lg` 15×30), Fredoka 600.
- **Primary (btn-ama):** fondo ámbar `#ffd23f`, texto `#2b0d5e`, sombra `0 6px 16px rgba(90,42,156,.18)`. Hover: `translateY(-2px)` + brightness 1.04. Active: `scale(.92)`.
- **WhatsApp (btn-wsp):** degradado `#2ecb6e→#128f4a`, texto blanco, Fredoka 700. Uso exclusivo de acciones que abren wa.me.
- **Morado (btn-mora):** `#4a1b96` sólido, texto blanco (primario de modales/carrito).
- **Ghost (btn-ghost):** blanco con borde 2px lila, texto morado; hover lavanda `#f0eaff`.
- **Focus:** global `outline: 3px solid #5a2a9c; outline-offset: 2px` en `:focus-visible`.

### Chips
- **Filtro:** pill, blanco, borde 1.5px `#e8dff8`, Nunito 700 0.875rem; hover lavanda+lila; activo ámbar sobre texto violeta. Barra rápida (`qf-chips`) los usa a 0.75rem/800.
- **Activo del carrito de filtros (`#activeChips`):** fondo rosa suave `#fff3f9`, borde rosa chicle, texto violeta y ✕ en un círculo rosa. Nombra la categoría activa y la quita con un clic.

### Feedback
- **Aviso de resultados:** pill flotante blanco con borde lila (`toast-filtro`) que dice “Encontramos N disfraces” al cambiar un filtro. Se reemplaza si se vuelve a filtrar, se va solo a los ~2 s, no bloquea clics y se anuncia por `role="status"`.

### Cards / Containers
- **Tarjeta de producto (`pcard`):** 20px radius, borde lila, foto aspect 2:3 sobre degradado de categoría, categoría en label uppercase, título Fredoka con `min-height` antisalto, chips de talla con tooltip de estatura, precio Fredoka 1.375rem en morado con cifras tabulares y botón de arriendo degradado morado. Hover: lift 5px + sombra sh2.
- **Banner promocional:** 24px radius, degradado morado con foto real cubierta por velo oscuro `linear-gradient(115deg, rgba(...) .92→.35)`, texto blanco, script ámbar y CTA ámbar/WhatsApp.
- **Tarjeta de plan (tarifas):** 24px radius; la "hero" invierte a degradado morado con precio ámbar y badge rosa "Más popular".

### Inputs / Fields
- **Style:** fondo `#f9f6ff`, borde 2px `#e8dff8`, radius 12px, Nunito 1rem (16px, evita el zoom de iOS).
- **Focus:** borde lila + halo `0 0 0 4px rgba(122,79,208,.14)` (searchbox) o borde `#7a4fd0` (formularios).
- **Disabled/readonly:** fondo `#f4f1fb`, texto tinta-media (fecha de entrega automática).

### Navigation
- **Header sticky** **oscuro** en todos los tamaños: degradado `120deg #1a0f2e → #2b1a44` con texto blanco y logo blanco. Al pasar 40px de scroll cambia a blanco casi opaco (`#ffffffee`) con blur y sombra morada, y el texto pasa a tinta. Logo emoji 🎭 en cuadrado degradado morado→rosa; nav Fredoka 0.875rem con estado `.on` (lavanda + punto rosa vía scrollspy); mega menú desplegable por hover/teclado con 4 columnas y tarjeta "Cómo llegar".
- **Móvil:** burger que abre drawer full-screen blanco con acordes `details` a 1rem; barra sticky del arriendo a 0.875rem con botón de 0.875rem; menú y carrito en botones de 44×44px.

### Signature Components
- **`script` + subrayado manuscrito:** Caveat ámbar rotada −3° con pseudo-elemento de trazo rosa (border-bottom redondeado irregular). Marca la voz del dueño.
- **Cinta de precio (`pprice`):** chip ámbar rotado 3° pegado a la esquina superior derecha de la foto, con sombra dura y label "ARRIENDO 3 DÍAS".
- **`urg-bar`:** banda morada de próximo evento con punto pulsante rosa y cuenta regresiva viva.
- **Doodles:** 10 SVGs de trazo (estrella, sombrero, máscara, globo, lazo, bombín) flotando con parallax, opacidad .5, color `#e6dbfb`.

## Do's and Don'ts

### Do:
- **Do** usar el degradado morado `#2b0d5e→#5a2a9c` (o variantes con naranja/rosa) como fondo de los momentos "oscuros" de la página: urgencia, banners, plan hero.
- **Do** mantener los CTA de conversión en ámbar (primario) o verde WhatsApp (contacto directo), con copy en verbos: "Cotizar por WhatsApp", "Arrendar disfraz", "Ver disfraces".
- **Do** usar emojis como iconografía (patrón establecido en todo el sitio) y respetar `aria-hidden` cuando son decorativos.
- **Do** redondear todo lo que se toca: botones pill, tarjetas ≥18px, inputs 12px.
- **Do** escribir precios en formato chileno (`$15.000`) vía `clp()`; el valor de referencia es siempre "Desde $15.000" (`PRECIO_DESDE`) y la garantía se escribe "$15.000 o $20.000" (`GAR_SHORT`). Ningún monto se escribe a mano en un componente.
- **Do** usar sombras moradas y estado hover con lift para comunicar interactividad.

### Don't:
- **Don't** introducir gris neutro (#888, #ccc) en bordes, sombras o texto secundario: existe `#e8dff8` y `#66539c` para eso. (Excepción tolerada hoy: texto `#555`/`#666` dentro de modales JS — deuda a corregir.)
- **Don't** usar Caveat para información que el usuario debe leer o actuar (precios, condiciones, errores).
- **Don't** inventar precios, garantías o datos de contacto: salen de `src/data/*.ts` o `disfraces.json`.
- **Don't** agregar animación continua nueva sin propósito de conversión; respetar siempre `prefers-reduced-motion` (ya global).
- **Don't** recortar fotos de producto con `object-fit: cover` sin `object-position` en móvil: las fotos 2:3 deben verse completas (regla ya establecida).
- **Don't** superponer más de dos acentos saturados (ámbar + rosa) en un mismo bloque.
