# Auditoría técnica — Home "La Mágica Tienda de Disfraces"

> Método: `impeccable audit` (code-level) sobre `src/` + evidencia del Assessment B del critique (detector `impeccable detect --json src/`, mediciones fallback por lectura de código y fetch del HTML SSR). Fecha: 2026-10-14 · Rama: `redesign/impeccable`.

---

## Audit Health Score

| # | Dimensión | Score | Hallazgo clave |
|---|-----------|-------|----------------|
| 1 | Accessibility | 2 | Foco atrapado inexistente en drawer/modales; inputs de la solicitud sin label; doble `aria-live`; contraste footer 3,17:1 |
| 2 | Performance | 2 | Imagen LCP del hero con `loading="lazy"`; canvas de confeti vivo siempre; scrollspy sin throttle; 61 KB de JS en un solo bundle |
| 3 | Theming | 2 | Tokens sólidos en `@theme`, pero 29 colores hardcodeados, ~44 tamaños de fuente únicos y 16 radios fuera de escala |
| 4 | Responsive | 3 | Móvil-first serio (900px, 2 col con fotos 2:3, bottom nav); rough edges: toast sobre sticky bar, burger en escritorio, overflow-x enmascarado |
| 5 | Implementation Integrity | 2 | Sistema coherente y específico en el core, pero código muerto verificado en 8 features y lógica duplicada |
| **Total** | | **11/20** | **Acceptable (10–13): trabajo significativo pendiente, base sana** |

Conteo de issues: **0 P0 · 5 P1 · 6 P2 · 4 P3**.

---

## Implementation Integrity Verdict

**PASS condicionado.** La implementación expresa un sistema de producto coherente: tokens con nombre (`m800`…`mist`), helpers `clp()`/`waLink()` como única fuente de verdad de precios y contacto, plantillas JS con `esc()`, patrón pill/emoji consistente y guardia `prefers-reduced-motion`. Pero arrastra **deuda de features abandonadas verificada por grep** y **drift del design-system** cuantificado por el detector (208 hallazgos: 199 advisory, 9 warning).

Código muerto verificado (grep, 2026-10-14):
- `#fxFecha` (state + 3 referencias en `site.ts`, 0 en markup) — filtro de fecha que nunca existió en el DOM.
- `#chipsPop` (1 listener, 0 markup) — chips de búsqueda rápidos inexistentes.
- `#nlForm` (2 refs, 0 markup) — formulario de newsletter eliminado, listener huérfano.
- `.searchpop` (CSS en `global.css`, 0 markup, 0 JS) — popup de búsqueda del header, estilo muerto.
- `TOPMSGS`, `MARQUEE` (exportados en `data/site.ts`, 0 importaciones).
- `#wspBubble` (markup existe, JS nunca agrega `.show`: burbuja de saludo = UI fantasma que jamás se ve).
- `ACC` (6 accesorios en datos, sin UI que los ofrezca).
- `TESTIS` (4 testimonios reales, sin renderizar — ver CRITICA P2-5).
- Mapa `CORTOS` duplicado idéntico en `Header.astro` y `Drawer.astro`.

## Detailed Findings by Severity

### P1 (fix antes de release)

1. **[P1] Imagen LCP cargada con `loading="lazy"`** — `Promos.astro:26` y `:48`: las dos fotos del hero (slide 1 y 2) tienen `loading="lazy"`, siendo la imagen de la slide 1 el candidato a LCP de la página. *Impacto:* retrasa el paint de la primera imagen visible en móvil y penaliza LCP/Core Web Vitals. *Fix:* `loading="eager"` + `fetchpriority="high"` en la imagen hero (la que quede en slot 1 tras rediseñar el hero), lazy solo en slides posteriores y catálogo. *Command:* `optimize`.
2. **[P1] Sin focus trap ni focus-return en drawer, minicart y modales** — `openModal()` (`site.ts:1254`) solo agrega clase; `#drawer` es `fixed inset-0` con `translateX(100%)` sin `visibility:hidden`/`inert` (`Drawer.astro:20-26`, `global.css:1088`). *Impacto:* con teclado, el Tab entra a un menú invisible fuera de pantalla y el foco queda perdido al cerrar (WCAG 2.4.3 / 2.1.2). *Fix:* `inert`/`visibility` en estados cerrados, focus al abrir, ciclo de foco, devolución al disparador, Escape ya funciona. *Command:* `harden`.
3. **[P1] Inputs de la solicitud sin label** — `site.ts:1196-1202` (`#rqNom`, `#rqRut`, `#rqCor`, `#rqTel`, `#rqDir`, `#rqCom`): solo `placeholder`, cero `label`/`aria-label`. *Impacto:* lector de pantalla announce "edición en blanco" en el formulario más importante del sitio (WCAG 1.3.1/3.3.2). *Fix:* `<label>` visuales o `aria-label` + `autocomplete` (`name`, `email`, `tel`). *Command:* `harden`.
4. **[P1] Doble región `aria-live` anunciando lo mismo** — `Catalogo.astro:96` (`#grid` `aria-live="polite"`) y `:18` (`#countLabel` `aria-live="polite"`). *Impacto:* cada tecla del buscador re-anuncia el catálogo completo + el conteo (annoying para screen readers). *Fix:* `aria-live` solo en `#countLabel`; el grid con `aria-busy` o sin live. *Command:* `harden`.
5. **[P1] Contraste bajo umbral** — Footer copyright `#8a7bb0` sobre `#efe7ff` = **3,17:1** (`Footer.astro:54`, 0.8rem) FAIL AA; textos de modales `#555` (`site.ts:1075`), `#666` (`site.ts:1168`), `#777` (`site.ts:1183`) ~4,9/3,8/4,5:1 con tamaños pequeños; `.copybtn` con `opacity:.55` sobre blanco ≈ 2,6:1. *Impacto:* viola WCAG 1.4.3 y la regla propia "Don't introduce gray" de DESIGN.md. *Fix:* usar `ink2 #66539c` (5,77:1 sobre mist) y subir opacidad mínima. *Command:* `harden`/`polish`.

### P2 (siguiente pasada)

6. **[P2] `prefers-reduced-motion` con kill global `0.01ms !important`** — `global.css:1677-1686`. La audit reference lo marca para revisión: mata también transiciones de feedback (fade de toasts, apertura de acordeón queda instantánea pero correcta). *Impacto:* usuarios con reduced-motion pierden feedback de estado, no solo decoración. *Fix:* mantener kill de animaciones decorativas, pero preservar feedback esencial (toast visible aunque sin fade; ya casi es así). *Command:* `harden`.
7. **[P2] Scrollspy y resize sin throttle** — `site.ts:1449-1460`: `spy()` lee `scrollY`, `offsetHeight` del header y `offsetTop` de 5 secciones en cada scroll event (forced reflow potencial). *Impacto:* jank en dispositivos bajos. *Fix:* rAF-throttle (patrón ya usado en el parallax de doodles). *Command:* `optimize`.
8. **[P2] Burger visible en escritorio** — `Header.astro:74`: `#burger` no está oculto ≥lg pese a que el nav completo ya está visible. *Impacto:* navegación doble, confusión (ver CRITICA heurística 4). *Fix:* `hidden min-[900px]:hidden`→ ocultarlo en desktop. *Command:* `adapt`.
9. **[P2] Toast encima de la sticky bar en móvil** — `Layout.astro:62` (`bottom-20` = 80px) vs `Floaters.astro:33` (sticky bar en `bottom-[72px]`, alto ≈48px): el toast cae sobre la barra del carrito. *Impacto:* feedback tapa la acción. *Fix:* subir toasts cuando la sticky bar está activa (o `bottom-32` en móvil). *Command:* `adapt`.
10. **[P2] Orden de encabezados: `h5` del mega menú antes de cualquier `h1`/`h2`** — `Header.astro:108,124,139`. *Impacto:* navegación por encabezados de lectores de pantalla. *Fix:* convertir a `<p>` con rol visual o mover el mega menú después del `<h1>` (se resuelve de paso con el nuevo hero). *Command:* `harden`.
11. **[P2] Overflow horizontal enmascarado, no resuelto** — `global.css:45` `body { overflow-x: hidden }` escribe el síntoma; carruseles (`.promo-track`, `#fechasRow`) y grilla forzada `repeat(2, …) !important` son candidatos a recortes silenciosos a 320–360px. *Impacto:* contenido cortado sin scroll de rescate en pantallas pequeñas. *Fix:* verificar a 320/360px en navegador y eliminar la dependencia del `overflow-x:hidden` global. *Command:* `adapt`.

### P3 (si hay tiempo)

12. **[P3] Código muerto** (ver verdicto): limpiar `#fxFecha`, `#chipsPop`, `#nlForm`, `.searchpop`, `TOPMSGS`, `MARQUEE`, `#wspBubble` y `ACC` sin UI. *Command:* `distill`.
13. **[P3] Drift de design-system**: `#b89af0` ×10 donde corresponde `var(--color-m400)`; 16 radios fuera de escala (8/9/11/14/22/3px…); ~44 tamaños de fuente únicos. *Command:* `typeset`/`polish`.
14. **[P3] Animaciones continuas sin propósito**: placeholder rotativo cada 2,8s (`site.ts:184-191`) y `.hallo-hours` glow infinito. *Impacto:* ruido; viola regla de DESIGN.md. *Command:* `quieter`.
15. **[P3] `hl()` desalinea `<mark>` con tildes** — `site.ts:341-346`: `indexOf` sobre normalizado + corte sobre string original. *Impacto:* resaltado corrido en búsquedas sin tildes. *Command:* `harden`.

## Patterns & Systemic Issues

- **Escalas no normalizadas**: 45 font-sizes arbitrarios solo en `global.css` (`.85rem` ×13 + `0.85rem` ×7…), 29 colores inline, 16 radios ad-hoc → crear una escala tipográfica canónica (Fase 3 typeset) y plegar radios a la escala de DESIGN.md.
- **Lógica duplicada**: `CORTOS` (Header/Drawer), `nextDate()` (Urgencia.astro / Fechas.astro / site.ts ×1), mensajes `waLink(...)` repetidos con el mismo texto en 6 componentes → centralizar en `data/site.ts`.
- **Estados de superficies ocultas sin `inert`**: drawer, miniCart, filterPanel móvil, speedDial — todos se ocultan con transform/opacity y quedan focusables.

## Positive Findings

- `prefers-reduced-motion` respetado globalmente y además en JS (`reduced()` en confeti, fly, scroll).
- Imágenes de catálogo con `loading="lazy"` y formato AVIF (53 archivos, 3,8 MB total para 51 fotos = ~75 KB promedio).
- Escape cierra todas las superficies; `aria-expanded` bien usado en toggles (burger, urgencia, FAQ, speed dial).
- `esc()` en toda interpolación de datos hacia HTML (XSS-safe por patrón).
- Labels con `for`/`id` correctos en el formulario de contacto; botones ± del carrito SSR con `aria-label`.
- Skip-link presente; foco global visible (`outline: 3px solid m500`).

## Recommended Actions (orden por severidad)

1. **[P1]** `/impeccable harden`: focus traps + inert, labels de solicitud, aria-live único, contraste de grises, botones ±, domingo en retiro (P1-4 de CRITICA).
2. **[P1]** `/impeccable optimize`: LCP hero eager + scrollspy throttled + revisión de bundle.
3. **[P2]** `/impeccable adapt`: burger desktop, toast vs sticky bar, verificación 320px.
4. **[P2]** `/impeccable quieter`: quitar animaciones continuas sin propósito (placeholder glow).
5. **[P3]** `/impeccable distill`: código muerto + duplicaciones.
6. **Final:** `/impeccable polish`.
