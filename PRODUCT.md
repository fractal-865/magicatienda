# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro 7 + Tailwind CSS v4 (`@tailwindcss/vite`) + TypeScript. Sitio 100% estático, sin backend. Publicado en GitHub Pages bajo `https://fractal-865.github.io/magicatienda/` (base path `/magicatienda`), con dominio `lamagicatienda.cl` declarado en `astro.config.mjs` (supuesto: apunta al sitio en vivo real).

## Users

Persona adulta (25–45, **supuesto** provisto por el dueño en el brief) en Punta Arenas / Región de Magallanes que necesita un disfraz para una fiesta o evento próximo (Halloween, cumpleaños, graduación, fiesta de empresa, despedida, Fiestas Patrias). Quiere verse bien sin comprar un disfraz, con poco tiempo y desde el celular. Valora saber de antemano cuánto paga, qué deja en garantía y qué tan fácil es reservar.

El negocio arrienda **solo a personas adultas**: ese es un criterio de producto, no un detalle (supuesto: política fija del negocio, consistente con todo el contenido actual).

## Product Purpose

Arriendo de disfraces para adultos en Punta Arenas. El sitio existe para convertir una visita en una **cotización iniciada por WhatsApp**: no hay carrito de pago en línea, el checkout es una conversación. Éxito = visitante agrega disfraces a "Tu arriendo", completa sus datos y envía la solicitud por WhatsApp (o escribe directo). Éxito secundario: visita la tienda física o llama.

## Positioning

Mecanismo que un competidor no puede copiar de la noche a la mañana: **arriendo por 3 días (retiro, uso y entrega) con garantía reintegrable de $15.000 o $20.000 según el disfraz** — se paga el día del retiro y se devuelve completa si el disfraz vuelve en las mismas condiciones — sobre un **catálogo real de 156 disfraces con fotos propias** y cotización coordinada en minutos por WhatsApp, incluyendo grupos y ajustes de talla gratis en tienda.

## Operating Context

- Tienda física: **Hermann Wiegartt 01194, Punta Arenas** (a pasos del Mall Pionero). Retiro y entrega en tienda.
- Horario: lun–sáb 15:00–20:30, domingo cerrado. En temporada Halloween (15–31 oct) horario especial 12:00–20:30, activado automáticamente por fecha.
- Flujo real: elegir → armar lista "Tu arriendo" → elegir día de retiro (hasta 60 días) → enviar solicitud por WhatsApp → la tienda confirma disponibilidad y cotiza → reserva = valor del arriendo (no reembolsable) → retiro y garantía → devolución y reembolso de garantía.
- Fechas de alta demanda del negocio: Fiestas Patrias (18 sep), Halloween (31 oct), graduaciones (nov–dic), Navidad, fiestas de empresa, Año Nuevo.
- Medios de pago para reserva/garantía: efectivo, transferencia Cuenta RUT Banco Estado o Copec Pay (datos de Sandra Vera Galindo en el sitio).
- Contexto de publicación: deploy automático a GitHub Pages al hacer push a `main`; no hay servidor propio ni entorno de staging.

## Capabilities and Constraints

- Catálogo de 51 disfraces reales (fuente: `disfraces.json`): título, descripción, tallas (XS–XXL o "sin especificar"), categoría, público (mujer/hombre/unisex), foto AVIF propia en `public/img` (53 archivos, ~3,8 MB).
- Tarifa por categoría (tabla interna, `PRICE_BY_CAT` en `src/data/products.ts`): $13.000 (sexy, profesiones) a $20.000 (superhéroes) por 3 días; garantía derivada $15.000 si la tarifa es ≤$17.000 y $20.000 si es mayor. **Lo que se publica** es el valor de referencia "Desde $15.000" (`PRECIO_DESDE` en `src/data/site.ts`) y la garantía "$15.000 o $20.000" (`GAR_SHORT`): decisión del dueño (oct. 2026) de comunicar ese piso. Cualquier cambio de monto se confirma con la dueña antes de tocar datos o textos.
- Búsqueda en vivo con sugerencias, filtros por categoría/público/talla/celebración, paginación de 24 en 24, orden aleatorio fijo por visita.
- Carrito de cotización ("Tu arriendo") con totales (arriendo + garantía), fechas automáticas retiro/entrega y envío por WhatsApp con mensaje armado. Persiste solo en memoria (se pierde al recargar — supuesto: aceptado hoy).
- Ficha rápida de cada disfraz con selección obligatoria de talla y zoom de imagen.
- Accesorios (varita, antifaz, etc.) definidos en datos pero sin UI visible en la home actual (supuesto: deuda conocida).
- Sin backend, sin base de datos, sin pagos en línea, sin CMS: todo contenido vive en `src/data/*.ts` y `disfraces.json`.
- El JS de interactividad es un único bundle (`src/scripts/site.ts`, ~60 KB) cargado al cargar la página.
- Idioma: español de Chile (es-CL) en todo el contenido.

## Brand Commitments

- Nombre: **La Mágica Tienda de Disfraces**, handle `@lamagicatiendadedisfraces` (Instagram/Facebook).
- Voz: cercana, divertida, entusiasta, en español chileno coloquial pero claro ("al tiro", "pa' tu fiesta", "cuequiar"). Nunca infantiliza al cliente adulto (supuesto: tensión reconocida por el dueño en el brief; se refina la voz, no se cambia).
- Promesa: "solo adultos" dicha explícitamente en header, catálogo, tarifas y contacto.
- El sistema visual morado/mágico (script Caveat, doodles, confeti) es identidad de marca a **refinar, no a reemplazar** (directiva del dueño).
- Datos personales de contacto (teléfono +56 9 8433 0378, RUT y datos bancarios de la propietaria) son reales y verificados por el dueño: jamás inventar ni alterar.

## Evidence on Hand

- 51 fotos AVIF reales de disfraces (`public/img/`, verificadas como correctas; el aparente mojibake en descripciones fue artefacto de consola, el JSON está limpio).
- Testimonios reales de clientes en `src/data/site.ts` (`TESTIS`, 4 con nombre y evento). **Hoy no se renderizan en ninguna parte de la web** (supuesto: se eliminó la sección en una simplificación reciente; son prueba social disponible).
- FAQ de 8 preguntas reales y condiciones de arriendo legales (6 bloques) en el modal de condiciones.
- Datos de pago verificados con botones de copiar.
- Ausencias que no se deben fabricar: no hay métricas de conversión, no hay estudios de usuarios, no hay logo gráfico (el "logo" es un emoji 🎭 — supuesto: pendiente de identidad).
- README desactualizado: menciona cupón MAGIA15 y 25% grupal que ya fueron eliminados del código (pendiente de corregir README).

## Product Principles

1. **Conversión por WhatsApp primero.** Cada decisión de diseño se juzga por si acerca al visitante a enviar una cotización por WhatsApp. Nada compite con ese camino.
2. **Transparencia radical sobre la plata.** Precio de arriendo y garantía visibles antes de preguntar; "reintegrable" explicado siempre con palabras simples, sin letra chica.
3. **Adultos, explícitamente.** El sitio nunca se disfraña de tienda infantil: el público se nombra donde importa (header, catálogo, tarifas, contacto).
4. **Datos reales o nada.** Fotos propias, testimonios reales, precios verificados. Si un dato no está confirmado, no se publica.
5. **Móvil es el escenario principal.** La mayoría del tráfico local llega desde el celular (supuesto típico de comercio local; el sitio ya es móvil-first y se mantiene esa prioridad).

## Accessibility & Inclusion

No hay un estándar formal comprometido por el dueño (supuesto). Expectativa mínima razonable para este sitio: usable con teclado y lector de pantalla en los flujos de conversión (buscar, filtrar, abrir ficha, armar cotización, enviar), contraste legible en texto pequeño, y respeto de `prefers-reduced-motion` (ya implementado y que debe preservarse).

## Open Decisions (deliberadamente sin resolver)

- ¿Existe logo gráfico de la marca? (hoy: emoji 🎭).
- ¿Los testimonios deben volver a la página? (datos reales listos, sección eliminada).
- Persistencia del carrito entre recargas (hoy no hay).
- Analytics/métricas de conversión: ninguno instalado (supuesto: decisión pendiente del dueño).
