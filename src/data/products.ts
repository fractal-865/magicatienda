/* ═══════════════════════════════════════════════════════════════
   Catálogo — fuente de verdad: disfraces.json (51 disfraces reales)
   Cada producto se construye desde el JSON: título, tallas,
   descripción, categorías, género y foto AVIF.
   ═══════════════════════════════════════════════════════════════ */
import raw from '../../disfraces.json';

export interface Cat {
  id: string;
  n: string;
  i: string;
  g: [string, string];
}

export interface Product {
  id: number;
  /** Título exacto del JSON */
  n: string;
  /** Descripción exacta del JSON */
  d: string;
  /** Emoji representativo (según su categoría principal) */
  e: string;
  /** Categoría principal (id slug) */
  t: string;
  /** Todas las categorías del JSON (ids slug) */
  cats: string[];
  /** Celebraciones derivadas de las categorías */
  oc: string[];
  /** Tallas del JSON */
  tl: string[];
  /** Género del JSON: mujer | hombre | unisex */
  pub: string;
  /** Palabras para búsqueda / sugerencias */
  tags: string[];
  /** Ruta de la foto AVIF */
  img: string;
  /** Orden del catálogo (número de foto) */
  pop: number;
  /** Valor de arriendo por 3 días (CLP) */
  price: number;
  /** Garantía reintegrable (CLP), según el disfraz */
  gar: number;
}

/* ── Tarifas por categoría (arriendo 3 días, CLP) ── */
const PRICE_BY_CAT: Record<string, number> = {
  sexy: 13000,
  profesiones: 13000,
  'princesas-y-cuentos': 15000,
  musica: 15000,
  halloween: 15000,
  terror: 15000,
  'epocas-e-historicos': 17000,
  'anime-y-videojuegos': 18000,
  'peliculas-y-series': 18000,
  superheroes: 20000,
};
/* Garantía reintegrable: se devuelve al entregar en buenas condiciones */
const garFor = (price: number): number => (price <= 13000 ? 13000 : price <= 17000 ? 16000 : 20000);

/** Formato CLP: $13.000 */
export const clp = (n: number): string => '$' + n.toLocaleString('es-CL');

/* Slug seguro: "Películas y series" → "peliculas-y-series" */
export const slug = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ── Categorías del JSON (con icono y degradado propios) ── */
export const CATS: Cat[] = [
  { id: 'terror', n: 'Terror', i: '💀', g: ['#3c1481', '#ff7a1a'] },
  { id: 'halloween', n: 'Halloween', i: '🎃', g: ['#1c0840', '#7a3a10'] },
  { id: 'superheroes', n: 'Superhéroes', i: '⚡', g: ['#5a2a9c', '#ff5fa2'] },
  { id: 'peliculas-y-series', n: 'Películas y series', i: '🎬', g: ['#274b9c', '#7a4fd0'] },
  { id: 'anime-y-videojuegos', n: 'Anime y videojuegos', i: '🎮', g: ['#4a1b96', '#0fae9f'] },
  { id: 'princesas-y-cuentos', n: 'Princesas y cuentos', i: '👑', g: ['#7a4fd0', '#2ee6d6'] },
  { id: 'epocas-e-historicos', n: 'Épocas e históricos', i: '⚔️', g: ['#8a5a2a', '#ffd23f'] },
  { id: 'profesiones', n: 'Profesiones', i: '👮', g: ['#274b9c', '#2ee6d6'] },
  { id: 'musica', n: 'Música', i: '🎤', g: ['#c22a4a', '#ff5fa2'] },
  { id: 'sexy', n: 'Sexy', i: '💋', g: ['#ff5fa2', '#5a2a9c'] },
];

export const catById = (id: string): Cat => CATS.find((c) => c.id === id) ?? CATS[0];

/* ── Tallas presentes en el catálogo ── */
const TALLA_LABEL = 'talla sin especificar';
const orderTallas = ['XS', 'S', 'M', 'L', 'L-XL', 'XL', 'XXL', 'Sin especificar'];
export const displayTalla = (t: string): string =>
  t.trim().toLowerCase() === TALLA_LABEL ? 'Sin especificar' : t;

/* ── Celebraciones derivadas de las categorías del JSON ── */
function ocasiones(cats: string[]): string[] {
  const oc = new Set<string>();
  if (cats.includes('halloween') || cats.includes('terror')) oc.add('halloween');
  if (cats.includes('princesas-y-cuentos')) {
    oc.add('cumple');
    oc.add('gradua');
  }
  if (cats.includes('sexy')) {
    oc.add('despedida');
    oc.add('carnaval');
  }
  if (cats.includes('epocas-e-historicos') || cats.includes('profesiones')) oc.add('tematica');
  if (cats.includes('musica')) oc.add('cumple');
  if (cats.includes('superheroes') || cats.includes('peliculas-y-series') || cats.includes('anime-y-videojuegos'))
    oc.add('tematica');
  if (!oc.size) oc.add('tematica');
  return [...oc];
}

const norm = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

type Raw = {
  numero: number;
  titulo: string;
  tallas: string[];
  descripcion: string;
  categorias: string[];
  genero: string;
  archivo: string;
};

/* ── Mapa JSON → productos del sitio ── */
export const PRODUCTS: Product[] = (raw as Raw[]).map((r) => {
  const cats = r.categorias.map(slug);
  const t = cats[0];
  const tl = [...new Set(r.tallas.map((x) => (x.trim().toLowerCase() === TALLA_LABEL ? 'Sin especificar' : x)))];
  return {
    id: r.numero,
    n: r.titulo,
    d: r.descripcion,
    e: catById(t).i,
    t,
    cats,
    oc: ocasiones(cats),
    tl,
    pub: r.genero,
    tags: [...new Set([r.titulo, ...r.categorias].flatMap((s) => norm(s).split(/\s+/)).filter((w) => w.length > 2))],
    img: `${import.meta.env.BASE_URL}/img/${r.archivo}`.replace(/\/{2,}/g, '/'),
    pop: r.numero,
    price: PRICE_BY_CAT[t] ?? 15000,
    gar: garFor(PRICE_BY_CAT[t] ?? 15000),
  };
});

/* Tallas del filtro, en orden y solo las que existen en el catálogo */
export const TALLAS: string[] = orderTallas.filter(
  (t) => t !== 'Sin especificar' && PRODUCTS.some((p) => p.tl.includes(t)),
);

/* Guía de tallas (adultos): estatura recomendada para cada talla */
export const TALLA_GUIA: Record<string, string> = {
  XS: '150 a 160 cm',
  S: '160 a 168 cm',
  M: '168 a 175 cm',
  L: '175 a 182 cm',
  'L-XL': '175 a 185 cm',
  XL: '182 cm o más',
  XXL: '185 cm o más',
  'Sin especificar': 'Sin referencia de estatura',
};

/* Categorías que realmente tienen productos */
export const CATS_ACTIVE: Cat[] = CATS.filter((c) => PRODUCTS.some((p) => p.cats.includes(c.id)));

export const PUBLICOS = [
  { id: 'mujer', n: 'Mujer', i: '👩' },
  { id: 'hombre', n: 'Hombre', i: '👨' },
  { id: 'unisex', n: 'Unisex', i: '🧑' },
];

/* Celebraciones con producto disponible (siempre hay resultados) */
export const OCASIONES = [
  { id: 'halloween', n: 'Halloween', i: '🎃' },
  { id: 'tematica', n: 'Fiesta temática', i: '🪩' },
  { id: 'cumple', n: 'Cumpleaños', i: '🎂' },
  { id: 'carnaval', n: 'Carnaval', i: '🎭' },
  { id: 'gradua', n: 'Graduaciones', i: '🎓' },
  { id: 'despedida', n: 'Despedida de solter@', i: '💍' },
].filter((o) => PRODUCTS.some((p) => p.oc.includes(o.id)));
