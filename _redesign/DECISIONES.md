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
