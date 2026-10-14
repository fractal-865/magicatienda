# Resumen del rediseño — La Mágica Tienda de Disfraces

> Rama: `redesign/impeccable` (7 commits sobre `main`) · Fecha: 2026-10-14 · **Sin push** (producción se despliega al hacer push a `main`).
> Ver en local: `npm run dev` → **http://localhost:4321/magicatienda/** (el dev server quedó corriendo).

---

## Qué cambió (5 minutos de lectura)

1. **El sitio ahora tiene H1 y promesa única.** El primer frame ya no es un contador de Halloween: es "Tu transformación empieza aquí" con el CTA ámbar dominante y el verde WhatsApp secundario. La temporada sigue viva en la barra de urgencia y en la slide 2 *(Revisión: SÍ)*.
2. **Prueba social real.** Los 4 testimonios que existían en los datos (Carolina M., Vale & Nico, Rodrigo P., Paulina S.) ahora se ven entre el catálogo y las tarifas *(Revisión: SÍ)*.
3. **Armar la lista dejó de ser un dolor.** El panel "Tu arriendo" se auto-abre solo en el primer agregado; después avisan el badge, la barra pegajosa y el toast — no 4 interrupiones con scroll bloqueado.
4. **La solicitud transmite tranquilidad.** Encabezado ("te respondemos por WhatsApp, no se paga en línea"), la reserva no reembolsable visible junto al botón, y validación de nombre/RUT/correo/teléfono antes de abrir WhatsApp.
5. **Domingo cerrado ya no se puede reservar** *(Revisión: SÍ)*: si eligen domingo, el retiro salta al lunes con aviso.
6. Menos ruido y mejor orden: burger fuera del escritorio, títulos jerarquizados, animaciones sin propósito eliminadas, ~50 líneas de código muerto fuera, y accesibilidad básica arreglada (labels, foco, contraste, aria-live único).

## Revisión del dueño (las 4 con Revisión: SÍ)

| Decisión | Dónde | Qué mirar |
|---|---|---|
| Hero con H1, sin Halloween primero | Primer frame | ¿Te gusta que la promesa mande y la temporada viva en la barra superior? |
| Testimonios en la home | Entre catálogo y tarifas | Son textos y nombres reales de tus datos: confirma que se puedan publicar tal cual. |
| Domingo → lunes en retiro | Carrito y solicitud | Confirma que el domingo sigue cerrado (si cambia el horario, avisa). |
| Footer "Maqueta demostrativa" | Footer | **No se tocó** (decisión 0.4): está en producción y puede ser intencional. |

Detalle completo de cada decisión: `_redesign/DECISIONES.md`.

## Pendientes (no incluidos por conservadurismo o falta de datos del dueño)

- Banner de Halloween hardcodeado: debería mostrar solo en temporada (su lógica de "temporada" ya existe en el código). Requiere definir fechas con el dueño.
- Normalización total de la escala tipográfica (~44 tamaños únicos) y radios fuera de escala: deuda preexistente, `impeccable detect` la mide (210 advisories, 0 error). Snapshot: `_redesign/detect-final.json`.
- Favicon y `og:image` (el sitio se comparte por WhatsApp/Instagram): requiere el activo de marca del dueño.
- README desactualizado (cupón MAGIA15 ya eliminado).
- `ACC` (6 accesorios con datos y sin UI): ¿se ofrece o se borra? Decisión del dueño.

## Cómo verificar

- Capturas antes/después: `_redesign/shots/fase-2-*-antes.png` vs `fase-2-desktop.png` / `fase-2-movil.png` (también `fase-3-full-*`, `check-solicitud.png`).
- Tests automatizados del flujo: `node _redesign/harness/test-req.mjs` y `test-harden.mjs` (drawer, validación, domingo).
- Build: `npm run build` (882 ms, sin errores).

## Commits

```
9e5fd77 fase 4 (harden): labels+autocompletado, aria-live único, inert+foco, domingo cerrado, contraste
ec79865 fase 3 (craft): jerarquía sec/sec-sm, fuera animaciones sin propósito y código muerto
179cfb0 fase 2c (clarify): solicitud con confianza, reserva visible, validación
2e02929 fase 2b (impacto): H1 y promesa única, drawer 1 sola auto-apertura, testimonios
56431f1 fase 2a (adapt): burger oculto en escritorio, toasts sobre sticky bar
ffd4d3a fase 1: crítica UX (27/40) y auditoría técnica (11/20)
1cee855 fase 0: PRODUCT.md y DESIGN.md
```
