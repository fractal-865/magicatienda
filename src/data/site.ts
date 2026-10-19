/* ═══════════════════════════════════════════════════════════════
   Contenido del sitio: configuración, fechas, testimonios, FAQ
   ═══════════════════════════════════════════════════════════════ */

export const CONFIG = {
  wa: '56984330378',
  waDisplay: '+56 9 8433 0378',
  tel: '+56 9 8433 0378',
  telHref: 'tel:+56984330378',
  /* No hay email: el sitio se contacta por WhatsApp y teléfono. */
  dir: 'Hermann Wiegartt 01194, Punta Arenas, Región de Magallanes',
  horario: {
    1: ['15:00', '20:30'],
    2: ['15:00', '20:30'],
    3: ['15:00', '20:30'],
    4: ['15:00', '20:30'],
    5: ['15:00', '20:30'],
    6: ['15:00', '20:30'],
  } as Record<number, [string, string]>,
  redes: [
    { n: 'Instagram', i: '📸', u: 'https://www.instagram.com/lamagicatiendadedisfraces/?hl=es-la' },
    { n: 'Facebook', i: '👍', u: 'https://web.facebook.com/lamagicatiendadedisfraces/?locale=es_LA' },
  ],
  handle: '@lamagicatiendadedisfraces',
};

/* ── Dirección pública del sitio ──
   Todo lo absoluto sale de acá: canónico, sitemap, robots y la imagen para
   compartir. Cambiar ORIGIN basta para mudar de dominio. */
export const ORIGIN = 'https://magicatienda.cl';
export const BASE = ''; // raíz del dominio magicatienda.cl
export const url = (p = '/'): string => `${ORIGIN}${BASE}${p}`;
/* Enlace interno (sin dominio): respeta el `base` de Astro, así funciona igual
   en GitHub Pages (/magicatienda/catalogo/) y el día del dominio propio. */
export const ir = (p = '/'): string => `${BASE}${p.startsWith('/') ? p : `/${p}`}`;

/* ── Enlaces a las secciones de la portada ──
   La portada y el catálogo son las únicas páginas donde esos bloques existen:
   allí `#tarifas` es un ancla interna, pero desde el catálogo o desde la ficha
   de un disfraz hay que volver a la portada. `sec()` lo resuelve en un lugar
   para que el header, el cajón y el pie no puedan quedar descuadrados. */
export const sec = (h: string, pagina: 'inicio' | 'catalogo' | 'disfraz'): string =>
  pagina === 'inicio' ? h : ir(`/${h}`);

/* ── Textos para Google y para compartir ──
   Título bajo 60 caracteres y descripción bajo 155, para que Google no los
   corte. Se prioriza la búsqueda local: "arriendo de disfraces en Punta Arenas". */
export const SEO = {
  title: 'Arriendo de disfraces en Punta Arenas | La Mágica Tienda',
  description:
    'Arriendo de disfraces en Punta Arenas para adultos: más de 150 disfraces, tallas S a XXL, por 3 días, con garantía que se devuelve. Cotiza por WhatsApp y reserva tu look.',
  ogTitle: 'Arriendo de disfraces en Punta Arenas | La Mágica Tienda 🎭',
  ogDescription:
    'Más de 150 disfraces para arrendar en Punta Arenas, tallas S a XXL, por 3 días. Garantía de $15.000 o $20.000 que se devuelve. Cotiza por WhatsApp 💜',
  /* Ubicación de la tienda para las búsquedas locales: Pasaje Hermann Wiegartt,
     Punta Arenas (dato de OpenStreetMap). */
  geo: { lat: -53.1355206, lng: -70.9125253 },
};

/* ── Textos de la página del catálogo completo (/catalogo/) ──
   Apunta a la búsqueda "catálogo de disfraces en Punta Arenas" y a las
   categorías, que es lo que la gente escribe cuando ya sabe qué quiere. */
export const SEO_CAT = {
  title: 'Catálogo de disfraces en Punta Arenas | La Mágica Tienda',
  description:
    'Catálogo de disfraces en Punta Arenas para arrendar: más de 150 disfraces para adultos, tallas S a XXL, por 3 días. Filtra por temática y cotiza por WhatsApp.',
  ogTitle: 'Catálogo de disfraces en Punta Arenas | La Mágica Tienda 🎭',
  ogDescription:
    'Explora el catálogo completo: más de 150 disfraces para arrendar en Punta Arenas, tallas S a XXL, por 3 días. Filtra por temática, público y talla. Cotiza por WhatsApp 💜',
  h1: 'Catálogo de disfraces para arrendar en Punta Arenas',
};

/* Temporada Halloween: del 15 al 31 de octubre el horario cambia y se muestra destacado.
   Pasado octubre vuelve al horario normal automáticamente. */
export const HALLOWEEN_RANGO = { mesIni: 9, diaIni: 15, mesFin: 9, diaFin: 31 }; // mes 0-11
export function esTemporadaHalloween(d = new Date()) {
  const y = d.getFullYear();
  const ini = new Date(y, HALLOWEEN_RANGO.mesIni, HALLOWEEN_RANGO.diaIni, 0, 0, 0);
  const fin = new Date(y, HALLOWEEN_RANGO.mesFin, HALLOWEEN_RANGO.diaFin, 23, 59, 59);
  return d >= ini && d <= fin;
}

/* Valor de referencia del arriendo por 3 días: es el mismo que muestra el sitio
   y el que se declara a Google en la ficha de cada disfraz. El valor final se
   confirma por WhatsApp. */
export const PRECIO_DESDE = 15000;

export const GAR_SHORT = '$15.000 o $20.000';
export const GAR =
  'Garantía de $15.000 o $20.000 según el disfraz. Se paga el día del retiro, en efectivo o transferencia, y se devuelve al entregar el disfraz en las mismas condiciones.';

/* Enlaces de WhatsApp: se usa api.whatsapp.com/send en vez del atajo wa.me.
   wa.me no abre WhatsApp: redirige al servidor, y en ese salto los caracteres
   de 4 bytes UTF-8 (los emojis) se dañan y llegan como "?" en WhatsApp Web y
   de escritorio. Con el enlace directo el mensaje llega intacto. */
export const waLink = (m: string) =>
  `https://api.whatsapp.com/send?phone=${CONFIG.wa}&text=${encodeURIComponent(m)}`;

/* Fechas clave del año → categoría del catálogo con productos disponibles */
export const FECHAS = [
  { n: 'Fiestas Patrias', f: '18 sep', i: '🇨🇱', m: 8, d: 18, fr: '¡A cuequiar se ha dicho!', tem: 'epocas-e-historicos', c: '#FF5FA2' },
  { n: 'Halloween', f: '31 oct', i: '🎃', m: 9, d: 31, fr: 'Dulce o trato, versión adultos 👻', tem: 'halloween-y-terror', c: '#FF7A1A' },
  { n: 'Graduaciones', f: 'nov–dic', i: '🎓', m: 11, d: 10, fr: 'Licenciaturas y fiestas de egreso', tem: 'princesas-y-cuentos', c: '#7a4fd0' },
  { n: 'Navidad', f: '25 dic', i: '🎅', m: 11, d: 25, fr: 'Cenas y fiestas de empresa', tem: 'princesas-y-cuentos', c: '#25D366' },
  { n: 'Año Nuevo', f: '31 dic', i: '🎆', m: 11, d: 31, fr: 'Brilla más que la once 👀', tem: 'sexy', c: '#0fae9f' },
  { n: 'Fiestas de empresa', f: 'dic', i: '🏢', m: 11, d: 15, fr: 'El corvo más esperado del año', tem: 'profesiones', c: '#e8a200' },
];

export const TESTIS = [
  { n: 'Carolina M.', r: 'Cumpleaños 30', t: 'Arrendé el disfraz de sirena para mis 30. Impecable, y la garantía me la devolvieron al tiro al devolverlo. 🙌', s: 5, e: '👩🏻' },
  { n: 'Vale & Nico', r: 'Grupo de amigos', t: 'Pedimos 8 disfraces para una fiesta temática y quedaron todos increíbles. Todo coordinado por WhatsApp en 2 minutos.', s: 5, e: '🧑‍🤝🧑' },
  { n: 'Rodrigo P.', r: 'Fiesta de empresa', t: 'Arrendamos para la fiesta de la oficina y terminó todo el equipo disfrazado de los 80. Épico. 🕺', s: 4, e: '👨' },
  { n: 'Paulina S.', r: 'Graduación', t: 'Arrendamos 12 trajes para la fiesta de egreso. Cero complicaciones con la reserva y la garantía.', s: 5, e: '👩🏽‍' },
];

export const FAQS: [string, string][] = [
  ['¿Cuánto cuesta arrendar un disfraz?', 'El valor de arriendo se confirma en tu cotización por WhatsApp. Además, al retirar dejas una garantía de $15.000 o $20.000 según el disfraz, que se te devuelve al retornarlo en las mismas condiciones.'],
  ['¿Por cuántos días es el arriendo?', 'Por 3 días: día de retiro, día de uso (tu evento) y día de entrega.'],
  ['¿Cómo y cuándo se paga la garantía?', 'El día del retiro, en efectivo o por transferencia (Cuenta RUT Banco Estado o Copec Pay). Se devuelve al entregar el disfraz en las mismas condiciones.'],
  ['¿Qué descuentos puede tener la garantía?', 'Si el disfraz vuelve con roturas, manchas, quemaduras, arreglos, accesorios perdidos o se entrega con retraso, se puede descontar parte o el total de la garantía, a criterio de la propietaria.'],
  ['¿Puedo reservar con anticipación?', '¡Ojalá! La reserva se hace pagando el valor del arriendo y no es reembolsable: con ella te aseguramos el disfraz para tu fecha.'],
  ['¿Hacen ajustes de talla?', 'Sí, ajustes simples gratis en la tienda: basta, cintura, dobladillos.'],
  ['¿Se puede arrendar en grupo?', '¡Sí! Si son varios disfraces en una misma cotización lo coordinamos todo junto por WhatsApp, para que el grupo retire el mismo día y con las tallas resueltas.'],
  ['¿Cómo pago la reserva o la garantía?', 'Reserva: valor del arriendo, coordinado al confirmar. Garantía: efectivo o transferencia/deposito (Cuenta RUT Banco Estado o Copec Pay, datos en "Condiciones de arriendo").'],
];

/* Accesorios que se cotizan junto al arriendo */
export const ACC = [
  { id: 'a1', n: 'Varita mágica', e: '🪄' },
  { id: 'a2', n: 'Antifaz brillante', e: '🎭' },
  { id: 'a3', n: 'Sombrero de copa', e: '🎩' },
  { id: 'a4', n: 'Capa de héroe', e: '🦸' },
  { id: 'a5', n: 'Peluca de color', e: '💇' },
  { id: 'a6', n: 'Maquillaje fantasy', e: '🎨' },
];
