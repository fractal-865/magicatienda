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
