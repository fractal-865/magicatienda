# Registro de decisiones — Redesign Impeccable

Criterio de resolución (en orden): 1) conversión a WhatsApp, 2) conservador y reversible, 3) alineado a PRODUCT.md, 4) menor riesgo técnico.
"Revisión" = ¿debe mirarlo el dueño al volver? **SÍ** = decisión con impacto en marca/visibilidad/datos.

---

## 2026-10-14 · Fase 0 — Contexto

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| 0.1 | **Entrevista de `init` sustituida por inferencia** del código + brief del dueño; todo hecho inferido está marcado como "supuesto" en PRODUCT.md. | El dueño instruyó explícitamente operar sin preguntas ni esperar confirmaciones. El launcher exige sondear al usuario una vez; la instrucción del dueño equivale a timeout anunciado. | NO (declarado y trazado en PRODUCT.md) |
| 0.2 | **Modo Persuade** registrado para la home (superficie única). | Toda la home empuja a cotizar por WhatsApp: es una landing de conversión, no una app operativa. | NO |
| 0.3 | **Identidad morada existente se REFINA, no se reemplaza** (North Star "El Puesto Hechizado de Feria"). | Directiva del dueño: preservar morado + script + doodles, subiendo el carácter "adulto". | NO |
| 0.4 | Footer dice **"Maqueta demostrativa"** en el sitio publicado en producción. Se **deja igual** y se registra. | Dato factual que no puedo verificar con el dueño; podría ser intencional o un residuo. Cambiarlo sin consultar es riesgo de marca. | **SÍ** |
| 0.5 | `README.md` está **desactualizado** (menciona cupón MAGIA15 y 25% grupal, ya eliminados del código). Se registra; corrección documental pendiente (bajo riesgo). | El README no es contenido del sitio; corregirlo es seguro pero queda para el cierre (polish) para no dispersar el foco de fases. | NO |
| 0.6 | **Testimonios reales (TESTIS, 4) existen en datos pero NO se renderizan** en ninguna parte de la web. Se mantiene así hasta decidir en fases de craft/copy. | Evidencia de prueba social disponible; re-insertarla es decisión de diseño de conversión, no de datos. | NO (decisión de diseño mía) |
| 0.7 | Detectado "mojibake" en descripciones del JSON: **falso positivo** (artefacto de consola PowerShell). Datos verificados limpios con lectura UTF-8 vía Node. | Verificación antes de tocar datos factuales: el JSON está sano. | NO |
| 0.8 | Código huérfano detectado: handlers JS de `#chipsPop` y `#nlForm` (newsletter) sin DOM; `ACC` (acesorios) con datos sin UI. **No se borra todavía.** | Limpieza candidata a fase `distill`/`harden`; borrar JS en Fase 0 sería prematuro. | NO |

## 2026-10-14 · Fase 1 — Diagnóstico

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| 1.1 | **Crítica dual-agent + auditoría persistidas** en `_redesign/CRITICA.md` (27/40) y `_redesign/AUDITORIA.md` (11/20), con mapeo issue→fase. | Base de hechos para todas las fases siguientes; el dueño puede auditar el razonamiento sin releer el código. | NO |
| 1.2 | Capturas baseline de la Fase 1 **no existen** (navegador desconectado para los sub-agentes); se documenta el gap. Las fases 2+ usan Chrome headless vía `_redesign/harness/`. | Transparencia del método de verificación; el harness queda commiteado para repetir las capturas. | NO |

## 2026-10-14 · Fase 2 — Impacto

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| 2a.1 | **Burger del header oculto en escritorio (≥1024px)**. | Navegación doble (burger + 6 enlaces) confundía; en desktop el nav completo ya cubre todo. Reversible: quitar la clase lo restaura. | NO |
| 2a.2 | **Toasts móviles subidos a `bottom-[132px]`** (antes `bottom-20`). | Caían encima de la barra pegajosa de arriendo; ahora aparecen por sobre ella. | NO |
| 2b.1 | **Dirección elegida: "quieter con un momento bolder"** — menos interrupciones (drawer) + una primera pantalla con promesa única. | El diagnóstico mostró sobreestimulación (drawer auto-open) Y una primera pantalla genérica sin H1: bajar el ruido donde estorba y subir el carácter donde convierte. | NO |
| 2b.2 | **Drawer "Tu arriendo" se auto-abre solo en el primer agregado**; después avisan badge + barra pegajosa + toast. Nunca se abre detrás del modal de solicitud. | P0-2: armar 4 disfraces = 4 interrupciones full-screen con scroll bloqueado. Fix acordado en CRITICA (quieter). | NO |
| 2b.3 | **El banner de la promesa ("Tu transformación empieza aquí") pasó a la slide 1 y su título ahora es el `<h1>` de la página**; el banner de Halloween quedó segundo. Imagen del hero con `loading="eager"` + `fetchpriority="high"`. | P0-1 + auditoría P1 (LCP con lazy): el sitio no tenía H1 y el primer frame era una campaña de temporada. La temporada sigue presente en la barra de urgencia (ya es date-aware) y en la slide 2. | **SÍ** (primer frame de la marca) |
| 2b.4 | **Nueva sección "💜 Ya arrendaron con nosotros"** con los 4 testimonios reales (TESTIS) entre catálogo y tarifas. | P2-5: para un arriendo con garantía de $20.000, la prueba de que la tienda devuelve la plata es el argumento más barato disponible. Resuelve también la decisión 0.6. | **SÍ** (prueba social nueva en la home) |

## 2026-10-14 · Fase 3 — Craft

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| 3.1 | **Jerarquía de títulos**: nuevo `h2.sec-sm` (más pequeño, subrayado corto) para secciones de soporte (Cómo funciona, Pagos, Cómo llegar, Contacto, FAQ, Testimonios); `h2.sec` completo queda para Catálogo, Tarifas y Fechas. | Los 10 títulos idénticos hacían que "Preguntas frecuentes" pesara igual que el catálogo (heurística 8). Ahora el ojo jerarquiza sin cambiar la identidad. | NO |
| 3.2 | **Fuera el placeholder rotativo del buscador** (cada 2,8s) y el glow infinito del aviso Halloween: el aviso ahora tiene una sola animación de entrada. | Animaciones continuas sin propósito de conversión (DECISIÓN quieter, CRITICA minor). | NO |
| 3.3 | **Código muerto eliminado**: `#fxFecha`, `#chipsPop`, `#nlForm`, `.searchpop`, `TOPMSGS`, `MARQUEE`, `SEARCH_PH` + burbuja `#wspBubble` (markup+CSS+JS, nunca visible). | Auditoría P3-12: 8 features abandonadas verificadas por grep; la burbuja era UI fantasma que jamás se veía. | NO |

## 2026-10-14 · Fase 4 — Cierre (harden/optimize)

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| 4.1 | **Domingo cerrado en el día de retiro**: `min` = primer día hábil y si eligen domingo el sistema lo mueve al lunes con nota "Los domingos la tienda cierra". | P1-4 de CRITICA: se podía "reservar" un domingo y la primera experiencia era un viaje a una tienda cerrada. Reutiliza el horario real del negocio. | **SÍ** (cambia una regla del negocio visible) |
| 4.2 | **`inert` + retorno de foco en drawer, minicart y panel de filtros móvil**; foco al abrir, vuelta al disparador al cerrar. | Auditoría P1-2: el Tab entraba a menús invisibles fuera de pantalla (WCAG 2.1.2/2.4.3). | NO |
| 4.3 | **Labels + `autocomplete` en los 7 campos de la solicitud** (aria-label + name/email/tel/street-address). | Auditoría P1-3: lector de pantalla anunciaba "edición en blanco" en el formulario más importante. | NO |
| 4.4 | **Un solo `aria-live`**: se quitó el de `#grid`; queda el de `#countLabel`. | Auditoría P1-4: cada tecla re-anunciaba el catálogo completo + el conteo. | NO |
| 4.5 | **Contraste**: grises de modales (`#555/#666/#777/#888`) y copyright del footer (`#8a7bb0` = 3,17:1) reemplazados por el token `ink2` (5,77:1 sobre mist). | Auditoría P1-5 + regla propia de DESIGN.md "Don't introduce gray". | NO |
| 4.6 | **h5 del mega menú → párrafo**: los títulos del mega menú declaraban h5 antes que ningún h1/h2 de la página. | Orden de encabezados (auditoría P2-10); el H1 del hero recién agregado no debía venir "después" en el árbol. | NO |
| 4.7 | **Scrollspy con throttle rAF**. | Auditoría P2-7: forced reflow en cada evento scroll. | NO |
| 4.8 | **`impeccable detect` final: 210 hallazgos, 0 error/critical** (158 font-size + 28 color + 16 radio advisory; 8 warnings = bounce-easing del botón (declarado intencional en DESIGN.md), transiciones de acordeón/buscador y subrayados decorativos). Snapshot en `_redesign/detect-final.json`. | El drift de escalas (44 tamaños únicos) es deuda preexistente del sistema; normalizarlo entero excede el presupuesto de conservador y se registra como pendiente para el dueño. | NO |

## 2026-10-15 · Revisión del dueño (feedback en local)

Pedidos directos del dueño sobre la vista local (`localhost:4321/magicatienda/`); cambios puntuales sobre lo ya entregado.

| # | Decisión | Por qué | Revisión |
|---|---|---|---|
| R1 | **Se eliminó el bloque de fechas del mini-carrito** (`.mdates-md`: selector de retiro, nota de entrega y fila de fechas). El selector de "Día de retiro" queda solo en el modal de solicitud (`#rqRet`). | Pedido del dueño al revisar el panel: el panel pasaba a ser "elegir fecha" en vez de "ver lo que arriendo". La fecha se elige un solo lugar, en el paso de solicitud. | **SÍ** (pedido del dueño; quita la fecha del paso previo a la conversión) |
| R2 | **Campo "Día de entrega (auto)" oculto** en el modal de solicitud (`<label style="display:none">`, se mantiene en el DOM para no romper `setRetiro`/`refreshDateRow`). | Pedido del dueño: era ruido un campo readonly que el sistema calcula solo; la fila "Retiro / Entrega" debajo ya muestra la entrega en legible. | NO (oculto, no borrado; reversible quitando el estilo) |
| R3 | **Nota de pago `.paynote` ("El día del retiro pagarás $40.000") fuera del mini-carrito** (`totalsHTML(false)`); sigue presente en el modal de solicitud. | Pedido del dueño: duplicaba el total que ya está arriba y ensuciaba el panel. En el modal conserva la explicación arriendo + garantía. | NO |
| R4 | **`test-harden.mjs` migrado de `#mcRet` a `#rqRet`** (con apertura del modal antes de manipular el campo). | Con R1 el input del minicart ya no existe; el test de domingo→lunes pasa a probar el único selector restante. Cubre igual la regla de negocio de 4.1. | NO |
| R5 | **Modal de solicitud rediseñado estilo "formulario de mensaje para WhatsApp"** (maqueta del dueño, adaptada a los tokens del sitio): productos en tarjeta con pill `$ / arriendo` + tooltip ⓘ; sección de fechas "Retiro en tienda → Devolución (auto)" con pill "Período 3 días"; "Tus datos" (mismos 6 campos + validación RUT/correo/teléfono); "Tu mensaje" editable con contador `N / 1200` y botón de restablecer; caja de totales (arriendo / garantía reembolsable con tooltip / total final en sucursal); CTA "Enviar solicitud por WhatsApp" + línea de confianza. | Pedido del dueño. El mensaje se genera solo (datos + fechas + pedido + totales) y se actualiza en vivo hasta que el usuario lo edita; su texto manual se preserva entre re-renders. Límite `WA_MSG_MAX = 1200` para que la URL de wa.me no se corte y el mensaje llegue completo. Sin cambios a datos factuales; se mantienen validación (4 errores → 0), regla domingo→lunes y textos de confianza/reserva. | **SÍ** (es el paso de conversión a WhatsApp) |
