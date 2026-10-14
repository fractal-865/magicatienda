# Crítica de diseño — Home "La Mágica Tienda de Disfraces"

> Method: dual-agent (A: revisión de diseño asistida por código · B: detector determinista + evidencia de navegador)
> Target: `src/pages/index.astro` (home completa) · Fecha: 2026-10-14 · Rama: `redesign/impeccable`
> Nota: el navegador de escritorio estaba **desconectado** para ambos agents (`browser.disconnected`); Assessment A hizo su revisión 100% por lectura de código y Assessment B aportó mediciones fallback (fetch del HTML SSR + cálculos WCAG por fórmula). La verificación visual en navegador se documenta en cada fase posterior.

---

## Design Health Score (Nielsen)

| # | Heurística | Score | Issue clave |
|---|-----------|-------|-----------|
| 1 | Visibilidad del estado del sistema | 3 | Buenos indicadores (countLabel, badge 🛒, toasts, "Abierto ahora"), pero `sendWA()` abre pestaña sin estado de éxito y `#grid` + `#countLabel` son dos `aria-live` duplicados |
| 2 | Correspondencia con el mundo real | 4 | es-CL impecable: `clp()`, "cuequiar", 3 días, dirección real, fechas chilenas, garantía en palabras simples |
| 3 | Control y libertad del usuario | 2 | Escape funciona y "Limpiar todo" existe; pero el carrito se pierde al recargar sin aviso, `afterCart()` auto-abre el drawer en cada agregado y cerrar el buscador borra la búsqueda sin avisar |
| 4 | Consistencia y estándares | 3 | Sistema pill/emoji consistente; pero burger visible en escritorio junto a 6 enlaces, 2 buscadores con semánticas distintas y 3 colores de CTA compitiendo en la primera pantalla |
| 5 | Prevención de errores | 3 | Tallas obligatorias con nudge, `readonly` en entrega, min/max en fechas; pero cero validación de RUT/correo/teléfono y 🗑 elimina sin confirmar |
| 6 | Reconocimiento vs. recordar | 3 | Chips activos y barra sticky; pero sin total persistente en escritorio y el filtro "Celebración" solo existe en el mega menú |
| 7 | Flexibilidad y eficiencia | 2 | Atajos reales (flechas en sugerencias, chips, mega menú, "Cargar más"); sin deep-link de filtros, sin persistencia |
| 8 | Diseño estético y minimalista | 2 | Los 10 `h2.sec` idénticos con subrayado arcoíris hacen que todo pese igual; chrome fijo móvil saturado (bottom nav + sticky + FAB + speed dial + toasts) |
| 9 | Recuperación de errores | 2 | Estado vacío excelente ("Mmm… no encontramos eso"); pero sin mensajes de error en formularios ni reset desde el propio estado vacío |
| 10 | Ayuda y documentación | 3 | FAQ 8, condiciones, guía de tallas, cómo funciona; pero la reserva no reembolsable no está junto al CTA que la compromete |

**Total: 27/40 (67,5%) → banda: REQUIERE TRABAJO.** (Heurísticas 7 y 10 se puntuaron: en una landing de conversión sí aplican.)
2×P0, 2×P1, 1×P2 en prioridad; ver detalle abajo.

---

## Design Specificity Verdict

**La home es un shell genérico de "landing mágica púrpura" con un motor de arriendo muy específico adentro.** La primera pantalla —la que decide la conversión— es la superficie intercambiable (barra de urgencia + 3 banners de carrusel + 4 tarjetas de beneficios), mientras que todo lo inimitable del negocio (51 fotos reales, garantía reintegrable, fechas chilenas, horario que cambia solo en Halloween, la tienda de Hermann Wiegartt) está bajo el pliegue. Peor: el banner 1 es una campaña de Halloween **hardcodeada** con imagen SVG genérica; en marzo el primer frame del sitio dirá "Halloween se acerca… faltan 300 días". El detalle específico está todo presente; está mal jerarquizado.

**Scan determinista (B):** 208 hallazgos → 199 advisory + 9 warning, 0 error/critical. Concentración: `global.css` 99 (font-sizes arbitrarios ×45, colores hardcodeados ×29 — `#b89af0` ×10 —, radios fuera de escala ×16), `Floaters.astro` 20, `site.ts` 20. Los 9 warnings: 5× bounce-easing (incluye el easing de botones que DESIGN.md declara intencional — falso positivo de dirección), 2× layout-transition (`max-height` de acordeones y `width` del buscador plegable — transiciones de layout inevitables en este patrón), 2× border-accent-on-rounded (subrayado del script y borde de `.urg-item`: decorativos, intencionales). Falsos positivos adicionales: dos "colores" son sombras con alfa; los 154 font-size colapsan a ~44 valores distintos por duplicación de notación (`.85rem` vs `0.85rem`).
**Aportó que A no vio:** drift del design-system (escalas de tipografía no normalizadas, 10 repeticiones de `#b89af0` donde debería usarse el token `m400`). **Aportó que B no vio (y A confirmó con números):** contraste del footer `#8a7bb0` sobre `#efe7ff` = **3,17:1** (FAIL AA a 0.8rem), grises de modal `#555`/`#666`/`#777` bajo umbral.

---

## Cognitive Load (checklist de 8)

Fallos: **single focus** (4 CTA de peso similar en la primera pantalla), **grouping** parcial (filtración repartida en 3 lugares con vocabularios distintos: sidebar "Categorías" ×10, barra "Público/Talla" ×3+8, mega menú "Celebración" ×6 ausente del catálogo), **visual hierarchy** (10 títulos de sección idénticos: "Preguntas frecuentes" pesa igual que el catálogo de 51 productos), **one thing at a time** (el minicart mezcla items + stepper + desglose + "el día del retiro pagarás" + picker + 3 CTAs), **minimal choices** (9 puntos de decisión con >4 opciones: primera pantalla 4 CTA · header escritorio 10 destinos · mega menú ~23 enlaces · panel categorías 10 checkboxes · barra tallas 8 chips · Fechas 6 tarjetas cada una con CTA · Contacto 5+3+2 · ficha hasta 8 tallas + 2 CTA · bottom nav 5 + FAB + dial + sticky). **Working memory** parcial: sin total visible en escritorio tras cerrar el drawer. **Progressive disclosure** parcial: `#infoGuia`/`#infoCond` declaran "desplegable" pero están siempre abiertos (sin toggle).

## Emotional Journey

Pico bien construido y en el lugar correcto: agregar un disfraz dispara fly + confeti + toast + pop del badge + drawer con total. **Problema: el pico se vuelve valle al repetirse** (drawer auto-open con scroll bloqueado 4 veces si eliges 4 disfraces). Y el tramo de mayor apuesta no recibe contención: el formulario de solicitud (7 campos + "reserva no reembolsable" escondida en un párrafo gris al pie) es donde se entregan RUT, teléfono y dirección, y se presenta como trámite administrativo. Valles puntuales: sección Pagos sin explicar por qué le piden plata antes; modal Condiciones ("a criterio de la propietaria"); **mapeo burdo de Fechas** ("Fiestas de empresa" filtra `profesiones` = policía/enfermera); y el final: FAQ plegado + footer "Maqueta demostrativa" — anticlimax en el peak-end. Cero prueba social pese a tener 4 testimonios reales en datos sin renderizar.

---

## Fortalezas

1. **Transparencia de plata de clase mundial.** El mismo rango y las mismas palabras ("se paga el día del retiro… se devuelve completa") en beneficios, tarifas, ficha, minicart y WhatsApp, todo derivado de `GAR_SHORT`/`clp()`. Cero contradicciones; el bloque "El día del retiro pagarás" desactiva la objeción #1.
2. **Microcopy es-CL sin infantilizar y estados vacíos que enseñan.** "Mmm… no encontramos eso · prueba con payaso", tooltips de estatura por talla, "Toca una fecha y te mostramos…". Resuelve la ansiedad real del arriendo (¿me quedará?) donde ocurre.
3. **El sitio sabe que es un negocio real con temporada.** Badge "Abierto ahora" recalculado cada minuto, horario Halloween automático, cuenta regresiva viva al próximo evento chileno: especificidad operativa que ningún template tiene.

---

## Problemas prioritarios

### [P0-1] Primera pantalla sin promesa única ni H1
- **What:** No existe `<h1>` en todo `src/` (0 resultados). Encabeza una barra de urgencia + carrusel de 3 banners con 4 CTA; la slide 1 es campaña de Halloween hardcodeada con imagen genérica, y la propuesta real ("Tu transformación empieza aquí" + "Ver disfraces") está en la slide 2, invisible en móvil.
- **Why:** El visitante de 8 segundos no recibe "arriendo solo adultos, Punta Arenas, 3 días, garantía $13.000–$20.000, 51 disfraces"; recibe un contador de caducidad. En febrero es un mensaje vencido como primer frame de marca. Sin H1 hay peor SEO y peor announcement para lectores de pantalla.
- **Fix:** Un bloque hero único: H1 con la promesa + foto real de producto + 3 datos (3 días · garantía reintegrable · solo adultos) + **un** CTA dominante ámbar con el verde WhatsApp secundario. La temporada pasa a la barra de urgencia (ya es fecha-aware) o al slot 2 del banner.
- **Command:** `layout` (con apoyo de `bolder` para el carácter).

### [P0-2] El panel "Tu arriendo" se abre solo en cada agregado y bloquea el scroll
- **What:** `afterCart()` cierra siempre con `openMini()` + `drawer-lock`. Armar 4 disfraces = 4 interrupciones full-screen con scroll bloqueado y búsqueda de la ✕.
- **Why:** Es el flujo principal de conversión; transforma el pico emocional en fricción acumulada. En móvil se pierde la posición del catálogo cada vez que se explora.
- **Fix:** Feedback no intrusivo ya disponible (badge pop + toast + sticky bar); auto-open solo en el **primer** agregado; después abrir solo con 🛒. Nunca reabrir el drawer desde dentro del modal de solicitud (hoy `afterCart()` lo hace y queda detrás del overlay).
- **Command:** `quieter`.

### [P1-3] El momento de mayor apuesta (solicitud) no transmite tranquilidad
- **What:** `renderReq()` = 7 campos en modal genérico; "la reserva no es reembolsable" solo en FAQ y en un `<p>` gris de 0.9rem; sin validación de RUT/correo/teléfono; sin "quién responde ni en cuánto".
- **Why:** Donde se entregan datos personales y se acepta una condición perdedora de dinero, sin jerarquía de confianza la gente se va a WhatsApp sin armar lista y el negocio pierde el pedido estructurado.
- **Fix:** Encabezado de confianza (qué pasa después, quién responde, en cuántos minutos), campos validados, y la frase "La reserva (valor del arriendo) no es reembolsable" **visible junto al botón**, no en un link.
- **Command:** `clarify`.

### [P1-4] Día de retiro sin validar contra el horario real de la tienda
- **What:** `state.req.retiro = todayISO()` con `min=todayISO()`, sin considerar domingo cerrado ni que hoy ya pasó de las 20:30 — pese a que `pintar()` ya calcula ese estado para `#openBadge`.
- **Why:** Se puede "reservar" un domingo; la primera experiencia con el negocio es un viaje a una tienda cerrada.
- **Fix:** `min` = próximo día hábil con horario abierto + aviso inline ("El domingo cerramos · retira desde el lunes") reutilizando `CONFIG.horario`; deshabilitar domingos si el date picker nativo lo permite.
- **Command:** `harden`.

### [P2-5] Cero prueba social pese a tener datos reales
- **What:** `TESTIS` (Carolina M. — "la garantía me la devolvieron al tiro", Vale & Nico — 8 disfraces, Rodrigo P. — fiesta de empresa, Paulina S. — 12 trajes) está escrito y **no se renderiza**.
- **Why:** Para un arriendo con garantía de $20.000, la prueba de que la tienda devuelve la plata es el argumento más barato disponible; hoy el único testimonio es el confeti.
- **Fix:** Sección corta de 3–4 testimonios entre catálogo y tarifas (tramo donde el usuario ya vio precios y empieza a dudar), peso visual de tarjeta, no carrusel escondido.
- **Command:** `bolder`.

---

## Persona red flags

**Jordan (first-timer):** Tarifas parece planes de suscripción y la tercera tarjeta dice "Varios" en el slot del precio gigante (parece roto); en la ficha, 2 CTA con la única explicación en un párrafo de 0.76rem; descubre "reserva no reembolsable" después de digitar 7 campos o nunca.

**Riley (stress tester):** doble `aria-live` re-anuncia el catálogo completo por cada tecla del buscador; `#drawer` fixed con `translateX(100%)` sin `visibility:hidden`/`inert` → el Tab entra a un menú invisible; modales sin move-focus ni focus-return; recarga = lista perdida sin aviso; código muerto prometiendo features inexistentes (`#fxFecha`, `#chipsPop`, `#nlForm`, `.searchpop`, `TOPMSGS`, `MARQUEE`, `#wspBubble` que nunca recibe `.show`).

**Casey (móvil distraído):** primer frame = slide de carrusel, CTA principal en slide 2; cada agregado abre drawer 92vw con scroll bloqueado; chrome fijo simultáneo (bottom nav + sticky bar + FAB + speed dial + toasts en `bottom-20` que **cae encima de la sticky bar**).

**Daniela, 34, fiesta de empresa en 2 semanas (persona del proyecto):** toca "Fiestas de empresa" y recibe policía/enfermera (mapeo `tem: 'profesiones'`); debe recorrer 4 secciones para encontrar precios; puede elegir domingo como retiro sin aviso; se va a WhatsApp y pierde la lista armada.

---

## Minor observations

- Footer dice **"Maqueta demostrativa"** en producción (decisión #0.4, requiere dueño).
- Sin `<h1>`, sin favicon, sin `og:image`/`og:title`/`canonical` — este sitio se comparte por WhatsApp/Instagram donde el preview es 50% del CTA.
- Skip-link apunta a `#catalogo`, no a `#main`.
- Contraste: footer 3,17:1 FAIL; `#555`/`#666`/`#777` en modales bajo 4,5:1 (viola la regla "Don't introduce gray" de DESIGN.md).
- Burger visible en escritorio junto al nav (navegación doble).
- Cerrar la lupa del catálogo **borra `state.q` sin confirmación**.
- Placeholder rotativo cada 2,8s + `.hallo-hours` glow infinito: 2 animaciones continuas sin propósito de conversión.
- `hl()` desplaza el `<mark>` con tildes (corta el string original con `q.length`).
- `#infoGuia`/`#infoCond` comentados como "desplegable" pero sin toggle.
- Tarifas mezcla "$13.000 **a** $15.000" (arriendo) con "$13.000–$20.000" (garantía) en la misma página.
- `ACC` (6 accesorios) con datos y sin UI; `state.sort`/`#fxFecha`/`#chipsPop`/`#nlForm` muertos.
- Botones `data-rq` −/+ del modal de solicitud sin `aria-label`.
- Detalle detector: `#b89af0` repetido ×10 donde corresponde el token `m400`; escalas de fuente no normalizadas (~44 valores únicos).

## Questions to consider

1. Si el activo inimitable son las 51 fotos reales, ¿por qué el primer frame las muestra a 0px de alto y pone una ilustración SVG de Halloween?
2. La conversión es una conversación de WhatsApp: ¿por qué el camino más largo (7 campos) existe como modal cuando el mensaje final ya se arma solo?
3. ¿Qué nos cuesta poner los 4 testimonios reales ya escritos en el lugar del tercer banner ("Cómo llegar")?

---

## Plan de acción derivado (mapeo a fases del rediseño)

| Issue | Fase donde se ataca |
|---|---|
| P0-1 hero sin H1/promesa | Fase 2 (layout/clarify sobre hero + banner temporada) |
| P0-2 drawer auto-open | Fase 2 (quieter) |
| P1-3 solicitud sin confianza | Fase 2 (clarify) |
| P1-4 retiro sin validar | Fase 4 (harden) |
| P2-5 prueba social | Fase 2/3 (bolder) |
| Contraste footer/grises, aria duplicado, focus trap | Fase 4 (harden/polish) |
| Drift de escalas tipográficas y colores hardcodeados | Fase 3 (typeset/layout) |
| Código muerto | Fase 3 (distill) |
