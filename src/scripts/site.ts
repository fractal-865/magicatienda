/* ═══════════════════════════════════════════════════════════════
   La Mágica Tienda — interactividad del sitio
   Filtros + buscador + "Tu arriendo" (cotización) + modales
   ═══════════════════════════════════════════════════════════════ */
import { PRODUCTS, CATS, PUBLICOS, OCASIONES, TALLAS, catById, clp, disfrazSlug, thumbSrcset, type Product } from '../data/products';
import { GAR_SHORT, PRECIO_DESDE, waLink, ACC, esTemporadaHalloween } from '../data/site';
import { cardHTML, ONERROR_MINI } from '../lib/card';
import { esc, hl, norm } from '../lib/text';

type Acc = { id: string; n: string; e: string };
type Item = Product | Acc;
type CartItem = { id: string; tipo: 'd' | 'a'; talla: string; qty: number };

const isProduct = (i: Item): i is Product => 'tl' in i;

/* ── utilidades ── */
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll(s)] as T[];
const debounce = <T extends unknown[]>(f: (...a: T) => void, t: number) => {
  let h: ReturnType<typeof setTimeout>;
  return (...a: T) => {
    clearTimeout(h);
    h = setTimeout(() => f(...a), t);
  };
};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => matchMedia('(max-width:899px)').matches;

/* ── En qué página estamos ──
   La portada y /catalogo/ comparten todo el script. El layout marca el body
   con data-page="catalogo" y acá se decide qué enlaces salen del catálogo y
   hacia dónde. */
const enCatalogo = document.body.dataset.page === 'catalogo';
const RAIZ = import.meta.env.BASE_URL.replace(/\/$/, ''); // '/magicatienda'
const byId = (id: string | number): Item | undefined =>
  PRODUCTS.find((p) => p.id === Number(id)) ?? ACC.find((a) => a.id === String(id));
const irADisfraz = (id: string | number) => {
  const p = PRODUCTS.find((x) => x.id === Number(id));
  if (p) location.href = `/disfraz/${disfrazSlug(p)}/`;
};
const pubLabel = (id: string) => PUBLICOS.find((p) => p.id === id)?.n ?? id;
const hay = (c: Product) =>
  norm(
    [String(c.id), c.n, c.cats.map((x) => catById(x).n).join(' '), c.pub, c.tl.join(' '), c.oc.join(' ')].join(' '),
  );

/* Orden aleatorio fijo por visita: así el catálogo se ve distinto cada vez
   (sin re-mezclar al filtrar, para que las tarjetas no "brinquen"). */
const RANDOM_ORDER = new Map<number, number>(
  PRODUCTS.map((p) => [p.id, Math.random()]).sort((a, b) => a[1] - b[1]).map(([id], k) => [id as number, k]),
);

/* Fecha legible: "lunes 19 de octubre" */
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function fmtDate(iso: string): string {
  if (!iso) return '—';
  const dt = new Date(iso + 'T12:00:00');
  if (isNaN(dt.getTime())) return '—';
  return `${DIAS[dt.getDay()]} ${dt.getDate()} de ${MESES[dt.getMonth()]}`;
}
/* Fecha compacta como en el panel: "Mié 21 de octubre" */
function fmtDateCap(iso: string): string {
  if (!iso) return '—';
  const dt = new Date(iso + 'T12:00:00');
  if (isNaN(dt.getTime())) return '—';
  const dia = DIAS[dt.getDay()].slice(0, 3);
  const mes = MESES[dt.getMonth()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${dt.getDate()} de ${mes}`;
}
/* Fecha de hoy en formato YYYY-MM-DD (para precargar y bloquear días pasados) */
function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/* Tope de días para elegir el retiro: hasta 60 días desde hoy */
function maxISO(days = 60): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return todayISO(d);
}
/* La tienda cierra los domingos: el retiro no puede ser un domingo */
function isSunday(iso: string): boolean {
  return new Date(iso + 'T12:00:00').getDay() === 0;
}
function nextMondayISO(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  // domingo (0) → lunes siguiente (+1); cualquier otro día → al lunes de la semana entrante
  d.setDate(d.getDate() + (d.getDay() === 0 ? 1 : 7 - d.getDay() + 1));
  return todayISO(d);
}
/* Primer día hábil de retiro: hoy (si no es domingo) o el lunes siguiente */
function firstRetiroISO(): string {
  const t = todayISO();
  return isSunday(t) ? nextMondayISO(t) : t;
}

/* ── estado ──
   Cuántos disfraces se ven por tanda. En escritorio son 20 (cuatro filas de
   cinco) y en tablet y móvil 12, que es lo que entra cómodo antes del pliegue.
   Es una función, no una constante, para que al girar el teléfono o redimensionar
   la ventana la grilla se vuelva a dibujar con la tanda que corresponde. */
const PANTALLA_CHICA = '(max-width: 899px)';
const PASO_ESCRITORIO = 20;
const PASO_MOVIL = 12;
const paso = () => (matchMedia(PANTALLA_CHICA).matches ? PASO_MOVIL : PASO_ESCRITORIO);

const state = {
  q: '',
  tem: new Set<string>(),
  oca: new Set<string>(),
  pub: new Set<string>(),
  tal: new Set<string>(),
  exFecha: '',
  sort: 'pop',
  page: 1,
  cart: [] as CartItem[],
  req: (() => { const h = firstRetiroISO(); return { nombre: '', retiro: h, uso: addDays(h, 1), entrega: addDays(h, 2) }; })(),
  lastAdd: null as null | { id: string; tipo: 'd' | 'a'; talla: string },
};

/* ── toast ── */
function toast(m: string, ms = 2800) {
  const box = $('#toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast rounded-[14px] border-2 border-m400 bg-white px-[18px] py-3 text-center text-[1rem] font-extrabold text-ink shadow-sh2 max-w-[92vw]';
  t.innerHTML = m;
  box.append(t);
  // rAF pinta el estado inicial antes de la transición; el setTimeout garantiza
  // que se muestre aunque rAF esté pausado (pestaña en segundo plano).
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => t.classList.add('on'), 60);
  setTimeout(() => {
    t.classList.remove('on');
    setTimeout(() => t.remove(), 350);
  }, ms);
}

/* ── confeti ── */
const Confetti = (() => {
  const cv = $('#confettiCanvas') as HTMLCanvasElement | null;
  const cx = cv?.getContext('2d');
  const COL = ['#FFD23F', '#FF5FA2', '#2EE6D6', '#B98AF7', '#7a4fd0'];
  let P: {
    x: number; y: number; vx: number; vy: number; r: number; vr: number; s: number; c: string; l: number;
  }[] = [];
  let raf: number | null = null;
  const size = () => {
    if (!cv) return;
    cv.width = innerWidth;
    cv.height = innerHeight;
  };
  addEventListener('resize', size);
  size();
  function step() {
    if (!cx || !cv) return;
    cx.clearRect(0, 0, cv.width, cv.height);
    P = P.filter((p) => p.l > 0);
    P.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.r += p.vr;
      p.l--;
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.r);
      cx.fillStyle = p.c;
      cx.globalAlpha = Math.min(1, p.l / 20);
      cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
      cx.restore();
    });
    if (P.length) raf = requestAnimationFrame(step);
    else raf = null;
  }
  function burst(x: number, y: number, n = 70) {
    if (reduced()) return;
    for (let i = 0; i < n; i++)
      P.push({
        x, y,
        vx: (Math.random() - 0.5) * 9,
        vy: Math.random() * -8 - 2,
        s: 4 + Math.random() * 6,
        c: COL[i % COL.length],
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        l: 70 + Math.random() * 40,
      });
    if (!raf) raf = requestAnimationFrame(step);
  }
  function rain(n = 120) {
    if (reduced() || !cv) return;
    for (let i = 0; i < n; i++)
      P.push({
        x: Math.random() * cv.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        s: 5 + Math.random() * 6,
        c: COL[i % COL.length],
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        l: 160,
      });
    if (!raf) raf = requestAnimationFrame(step);
  }
  return {
    burst,
    rain,
    at(el: Element | null) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 40);
    },
  };
})();

/* ═══ HEADER ═══ */
addEventListener(
  'scroll',
  () => $('#header')?.classList.toggle('scrolled', scrollY > 40),
  { passive: true },
);

/* doodles de fondo */
(() => {
  const L = $('#doodles');
  if (!L) return;
  const S = ['d-star', 'd-hat', 'd-mask', 'd-balloon', 'd-bow', 'd-bowler', 'd-star', 'd-balloon', 'd-mask', 'd-hat'];
  S.forEach((s, i) => {
    const d = document.createElement('div');
    d.className = 'doodle';
    const sz = 44 + ((i * 37) % 70);
    d.style.cssText = `left:${(i * 23 + 5) % 92}%;top:${(i * 31 + 8) % 94}%;width:${sz}px;height:${sz}px;--d:${6 + (i % 5)}s`;
    d.dataset.depth = (0.04 + (i % 4) * 0.03).toFixed(2);
    d.innerHTML = `<svg><use href="#${s}"></use></svg>`;
    L.append(d);
  });
  let tick = false;
  addEventListener(
    'scroll',
    () => {
      if (tick || reduced()) return;
      tick = true;
      requestAnimationFrame(() => {
        $$('.doodle').forEach((d) => {
          d.style.transform = `translateY(${-scrollY * parseFloat(d.dataset.depth || '0')}px)`;
        });
        tick = false;
      });
    },
    { passive: true },
  );
})();

/* ═══ CUENTA REGRESIVA ═══ */
function nextDate(m: number, d: number) {
  const n = new Date();
  let t = new Date(n.getFullYear(), m, d, 23, 59);
  if (t < n) t = new Date(n.getFullYear() + 1, m, d, 23, 59);
  return t;
}
function cdParts(t: Date) {
  const ms = t.getTime() - Date.now();
  if (ms < 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s / 3600) % 24, m: Math.floor(s / 60) % 60, s: s % 60 };
}
function renderCd(el: HTMLElement, t: Date) {
  const p = cdParts(t);
  if (!p) {
    el.innerHTML = '🎃 ¡Es hoy!';
    return;
  }
  el.innerHTML = `<div class="cd"><b>${p.d}</b><span>DÍAS</span></div><div class="cd"><b>${String(p.h).padStart(2, '0')}</b><span>HRS</span></div><div class="cd"><b>${String(p.m).padStart(2, '0')}</b><span>MIN</span></div><div class="cd"><b>${String(p.s).padStart(2, '0')}</b><span>SEG</span></div>`;
}
const hwDate = nextDate(9, 31);
const tickCd = () => {
  const b = $('#cdBanner');
  if (b) renderCd(b, hwDate);
  const nx = document.querySelector<HTMLElement>('.fecha.next .fcd');
  if (nx) {
    const p = cdParts(nextDate(Number(nx.dataset.m), Number(nx.dataset.d)));
    if (p) nx.textContent = `⏳ ${p.d}d ${p.h}h ${p.m}m`;
  }
};
tickCd();
setInterval(tickCd, 1000);

/* ═══ BARRA DE URGENCIA (cuenta regresiva al próximo evento) ═══ */
(() => {
  const urg = $('#urgencia');
  if (!urg) return;
  const tickUrg = () => {
    $$<HTMLElement>('.urg-cd').forEach((el) => {
      const p = cdParts(nextDate(Number(el.dataset.m), Number(el.dataset.d)));
      el.textContent = p ? `${p.d}d ${p.h}h ${p.m}m` : '¡es hoy!';
    });
  };
  tickUrg();
  setInterval(tickUrg, 30000);
})();

/* ═══ COPIAR DATOS DE PAGO ═══ */
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-copy]') as HTMLElement | null;
  if (!b) return;
  const txt = b.dataset.copy || '';
  const done = () => {
    b.classList.add('done');
    b.textContent = '✅';
    toast('📋 Dato copiado al portapapeles');
    setTimeout(() => {
      b.classList.remove('done');
      b.textContent = '📋';
    }, 1800);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
  } else fallbackCopy(txt, done);
});
function fallbackCopy(txt: string, cb: () => void) {
  const ta = document.createElement('textarea');
  ta.value = txt;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.append(ta);
  ta.select();
  try {
    document.execCommand('copy');
    cb();
  } catch {
    /* noop */
  }
  ta.remove();
}

/* ═══ CATÁLOGO ═══ */
/* "Halloween y terror" es una categoría de escaparate, no del JSON: los
   disfraces vienen marcados como "halloween" o "terror" por separado. Se
   expande acá para que el botón de la portada y los enlaces ?tem=… no queden
   vacíos. */
const TEM_ALIAS: Record<string, string[]> = { 'halloween-y-terror': ['halloween', 'terror'] };
const temMatch = (c: Product, t: string) =>
  c.cats.includes(t) || (TEM_ALIAS[t] ?? []).some((x) => c.cats.includes(x));

function filtered(): Product[] {
  let L = PRODUCTS.filter((c) => {
    if (state.q) {
      const toks = norm(state.q).split(/\s+/).filter(Boolean);
      const h = hay(c);
      if (!toks.every((tk) => h.includes(tk))) return false;
    }
    if (state.tem.size && ![...state.tem].some((t) => temMatch(c, t))) return false;
    if (state.oca.size && ![...state.oca].some((o) => c.oc.includes(o))) return false;
    if (state.pub.size && !state.pub.has(c.pub)) return false;
    if (state.tal.size && ![...state.tal].some((t) => c.tl.includes(t))) return false;
    return true;
  });
  // Orden aleatorio (fijo por visita) para que siempre se vea algo distinto
  L.sort((a, b) => (RANDOM_ORDER.get(a.id) ?? 0) - (RANDOM_ORDER.get(b.id) ?? 0));
  return L;
}

function rent3HTML() {
  return `<div class="my-3 grid gap-2 max-[560px]:grid-cols-1 min-[561px]:grid-cols-3" aria-label="El arriendo dura 3 días">
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">📦</span><b class="my-0.5 block font-ft text-[1rem] text-m600">Día 1 · Retiro</b><small class="block text-[.875rem] leading-[1.4] text-ink2">Pagas la garantía (${GAR_SHORT}) en efectivo o transferencia</small></div>
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">🎉</span><b class="my-0.5 block font-ft text-[1rem] text-m600">Día 2 · Uso</b><small class="block text-[.875rem] leading-[1.4] text-ink2">Tu fiesta o evento</small></div>
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">↩️</span><b class="my-0.5 block font-ft text-[1rem] text-m600">Día 3 · Entrega</b><small class="block text-[.875rem] leading-[1.4] text-ink2">Devolución y reembolso de tu garantía</small></div></div>`;
}

function gnoticeHTML() {
  return `<div class="my-2.5 flex items-start gap-2 rounded-[14px] border-[1.5px] border-ama bg-[#fdf6d9] p-2.5 text-[.875rem] text-[#6b5200]">🛡️ <span><b>Garantía de ${GAR_SHORT} según el disfraz.</b> Se paga el día del retiro, en efectivo o transferencia, y se devuelve al entregar el disfraz en las mismas condiciones. <button class="glink cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 text-[.875rem] font-extrabold text-m600 underline" data-opencond>Ver condiciones de garantía</button></span></div>`;
}

/* ── Encuadre de las fotos ──
   Las fotos no vienen todas en 2:3 (el marco de la tarjeta). Con object-contain
   se ve el disfraz completo, y para que el marco no quede con franjas planas se
   rellena con una copia desenfocada de la propia foto (fondo morado continuo). */
const RATIO_MARCO = 2 / 3;

function ajustarFoto(img: HTMLImageElement) {
  const marco = img.closest<HTMLElement>('.pimg, .qimg');
  if (!marco || !img.naturalWidth) return;
  const r = img.naturalWidth / img.naturalHeight;
  if (Math.abs(r - RATIO_MARCO) <= 0.005) return; // 2:3 exacto: la foto llena el marco sola
  marco.style.setProperty('--foto', `url("${img.currentSrc || img.src}")`);
  marco.classList.add('desborda');
}

function encuadrarFotos() {
  document.querySelectorAll<HTMLImageElement>('.pimg img, .qimg img').forEach((img) => {
    if (img.complete) ajustarFoto(img);
  });
}

document.addEventListener(
  'load',
  (e) => {
    const t = e.target;
    if (t instanceof HTMLImageElement) ajustarFoto(t);
  },
  true,
);

/* Contador, botón de "cargar más" y filtros activos: lo comparten el render
   completo y la carga por tandas. */
function pintarInfo(L: Product[], mostrados: number) {
  const cl = $('#countLabel');
  if (cl) {
    cl.textContent = !L.length
      ? 'Sin resultados'
      : L.length === PRODUCTS.length
        ? `Mostrando ${mostrados} de ${L.length} disfraces`
        : `Mostrando ${mostrados} de ${L.length} disfraces · hay ${PRODUCTS.length} en total`;
  }
  // Paginación: una tanda por carga
  const quedan = L.length - mostrados;
  const wrap = $('#loadWrap');
  const more = $<HTMLButtonElement>('#loadMore');
  const info = $('#loadInfo');
  if (wrap) wrap.classList.toggle('hidden', quedan <= 0);
  if (more) more.textContent = `Cargar más disfraces (${quedan})`;

  /* Indicador de avance: la barrita va llenándose y el texto dice cuántos
     llevas. Sin esto, con 156 disfraces y carga automática, la lista parece
     no terminar nunca. */
  const prog = $('#loadProg');
  const fill = $('#loadFill');
  if (prog) prog.classList.toggle('completo', quedan <= 0);
  if (fill) fill.style.width = L.length ? `${Math.round((mostrados / L.length) * 100)}%` : '0%';
  if (info) {
    info.textContent = !L.length
      ? ''
      : quedan > 0
        ? `Viste ${mostrados} de ${L.length}`
        : `Ya viste los ${L.length} disfraces ✨`;
  }

  // Botón "Limpiar filtros": solo aparece cuando hay algo activo
  const cc = $('#catClear');
  const ccCount = $('#catClearCount');
  const nFiltros = state.tem.size + state.oca.size + state.pub.size + state.tal.size + (state.q ? 1 : 0) + (state.exFecha ? 1 : 0);
  const activo = nFiltros > 0;
  cc?.classList.toggle('hidden', !activo);
  if (ccCount) ccCount.textContent = String(nFiltros);
  $('#catFilters')?.classList.toggle('con-limpiar', activo);
}

/* Chips, alto de la barra, enlace al catálogo y dirección de la página */
function pintarBarra() {
  renderChips();
  ajustarFilasBarra();
  actualizarVerTodos();
  marcarTarjetas();
  sincronizarURL();
}

/* Las tarjetas de categorías del catálogo se encienden cuando su temática
   está filtrada, para que se vea de un vistazo qué está puesto. */
function marcarTarjetas() {
  const box = $('#catCards');
  if (!box) return;
  box.querySelectorAll<HTMLElement>('.ct-card').forEach((a) => {
    const id = a.dataset.tem ?? '';
    const on = !!id && state.tem.has(id);
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  });
}

const VACIO_HTML = `<div class="col-span-full rounded-[20px] border-[1.5px] border-line bg-white p-10 text-center"><div class="text-[3rem]">🔮</div><b class="font-ft">Mmm… no encontramos eso</b><p class="mt-1.5 text-ink2">Prueba con <b>payaso</b>, <b>terror</b> o <b>Halloween</b> ✨</p></div>`;

function renderGrid(reset = true) {
  if (reset) state.page = 1;
  const g = $('#grid');
  if (!g) return;
  // La grilla puede venir del build (data-ssr): desde aquí la manda el navegador.
  g.removeAttribute('data-ssr');
  const L = filtered();
  const mostrados = Math.min(L.length, state.page * paso());
  g.innerHTML = L.length ? L.slice(0, mostrados).map((c, k) => cardHTML(c, k, state.q)).join('') : VACIO_HTML;

  encuadrarFotos();
  pintarInfo(L, mostrados);
  pintarBarra();
}

/* ── Cargar más ──
   Agrega solo las tarjetas nuevas: rehacer toda la grilla hacía parpadear las
   fotos que ya estaban a la vista. */
function cargarMas() {
  const g = $('#grid');
  if (!g) return;
  const L = filtered();
  const ini = state.page * paso();
  const nuevas = L.slice(ini, ini + paso());
  if (!nuevas.length) {
    // Ya no queda nada: dejar el contador en "viste los N" y apagar el aviso
    // de carga (si no, el estado se queda en "Cargando más disfraces…").
    pintarInfo(L, L.length);
    pintarBarra();
    return;
  }
  state.page += 1;
  g.insertAdjacentHTML('beforeend', nuevas.map((c, k) => cardHTML(c, ini + k, state.q)).join(''));
  encuadrarFotos();
  pintarInfo(L, ini + nuevas.length);
  pintarBarra();
}

/* Al cargar solas se enciende el girador. La carga es instantánea (todo está
   en el navegador), así que si se hiciera al tiro el giro duraría un frame y
   no se vería nunca. Por eso la tanda se difiere un instante: el texto dice
   "cargando", y recién después llegan las tarjetas y el contador se actualiza. */
const MIN_MOSTRAR = 450;
function avisarCarga(hacer: () => void) {
  const prog = $('#loadProg');
  const info = $('#loadInfo');
  if (!prog) return hacer();
  prog.classList.add('cargando');
  if (info) info.textContent = 'Cargando más disfraces…';
  setTimeout(() => {
    prog.classList.remove('cargando');
    hacer();
  }, MIN_MOSTRAR);
}

/* ── Dirección de la página del catálogo ──
   Los filtros se escriben en la URL para poder compartir, por ejemplo,
   "todos los de Halloween": /catalogo/?tem=halloween-y-terror */
function queryActual(): string {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  (['tem', 'oca', 'pub', 'tal'] as const).forEach((k) => state[k].forEach((v) => p.append(k, v)));
  const s = p.toString();
  return s ? `?${s}` : '';
}
function sincronizarURL() {
  if (!enCatalogo) return;
  const destino = location.pathname + queryActual();
  if (destino !== location.pathname + location.search) history.replaceState(null, '', destino);
}
/* El enlace "Ver todos los disfraces" de la portada se lleva los filtros puestos */
function actualizarVerTodos() {
  const a = $<HTMLAnchorElement>('#verTodos');
  if (a) a.href = `${RAIZ}/catalogo/${queryActual()}`;
}

/* ── Al abrir el catálogo desde un enlace con filtros (?tem=…&q=…), los aplica ── */
function hidratarDesdeURL() {
  if (!enCatalogo) return;
  const p = new URLSearchParams(location.search);
  const q = p.get('q');
  if (q) state.q = q.trim();
  const valido = (k: string, v: string) =>
    k === 'tem'
      ? CATS.some((c) => c.id === v)
      : k === 'pub'
        ? PUBLICOS.some((x) => x.id === v)
        : k === 'oca'
          ? OCASIONES.some((o) => o.id === v)
          : TALLAS.includes(v);
  (['tem', 'oca', 'pub', 'tal'] as const).forEach((k) =>
    p.getAll(k).forEach((v) => {
      if (valido(k, v)) state[k].add(v);
    }),
  );
  // Si venía una búsqueda escrita, el buscador se muestra desplegado (sin robar el foco)
  if (state.q) {
    $('#catFilters .searchbox')?.classList.add('open');
    const t2 = $('#searchToggle2');
    t2?.setAttribute('aria-expanded', 'true');
    t2?.setAttribute('aria-label', 'Cerrar buscador');
  }
  // Si viene ?buscar=1 (desde página individual), abrir el buscador
  if (p.get('buscar') === '1') {
    $('#catFilters .searchbox')?.classList.add('open');
    const t2 = $('#searchToggle2');
    t2?.setAttribute('aria-expanded', 'true');
    t2?.setAttribute('aria-label', 'Cerrar buscador');
    setTimeout(() => $<HTMLInputElement>('#catSearch')?.focus(), reduced() ? 0 : 300);
  }
  syncFilterUI();

  // Si llegamos con un filtro puesto (desde la portada u otra página), se
  // baja al bloque de los disfraces para que se vean de inmediato, en vez de
  // quedarse arriba en el hero.
  const tieneFiltro = !!(state.q || state.tem.size || state.oca.size || state.pub.size || state.tal.size || state.exFecha);
  if (tieneFiltro) (window as any).__scrollAGrid = true;

  // Procesar parámetros de añadir al carrito desde página de disfraz
  const addId = p.get('add');
  const addTalla = p.get('talla');
  if (addId) {
    const id = Number(addId);
    const prod = PRODUCTS.find((x) => x.id === id);
    if (prod) {
      const talla = addTalla && prod.tl.includes(addTalla) ? addTalla : prod.tl[0];
      addItem(id, 'd', talla, 1);
      history.replaceState(null, '', location.pathname);
    }
  }
}

function renderChips() {
  const box = $('#activeChips');
  if (!box) return;
  const chips: [string, string, string][] = [];
  state.tem.forEach((v) => chips.push(['tem', v, `${catById(v).i} ${catById(v).n}`]));
  state.oca.forEach((v) => chips.push(['oca', v, OCASIONES.find((o) => o.id === v)?.n ?? v]));
  state.pub.forEach((v) => chips.push(['pub', v, pubLabel(v)]));
  state.tal.forEach((v) => chips.push(['tal', v, 'Talla ' + v]));
  if (state.exFecha) chips.push(['exFecha', '1', '📅 ' + state.exFecha]);
  if (state.q) chips.push(['q', '1', '“' + state.q + '”']);
  box.classList.toggle('has', chips.length > 0);
  box.innerHTML = chips
    .map(
      (c) =>
        `<button class="chip" data-k="${c[0]}" data-v="${esc(c[1])}">${esc(c[2])} <b aria-label="Quitar filtro">✕</b></button>`,
    )
    .join('');
}

$('#activeChips')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('.chip') as HTMLButtonElement | null;
  if (!b) return;
  const { k, v } = b.dataset;
  if (k === 'q') state.q = '';
  else if (k === 'exFecha') state.exFecha = ''; else if (k && v && ['tem', 'oca', 'pub', 'tal'].includes(k)) state[k as 'tem'].delete(v);
  syncFilterUI();
  renderGrid();
});

/* Tarjetas de categorías del catálogo: filtran por esa temática.
   Si no hay JS, el enlace lleva igual a /catalogo/?tem=… */
$('#catCards')?.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('[data-tem]') as HTMLElement | null;
  const id = a?.dataset.tem;
  if (!id) return;
  e.preventDefault();
  applyFilter({ tem: id });
});

/* Paginación: el botón y la carga automática agregan la tanda siguiente */
$('#loadMore')?.addEventListener('click', () => avisarCarga(cargarMas));

/* Al cruzar el punto de quiebre (girar el teléfono, redimensionar la ventana)
   la tanda cambia de 20 a 12 o al revés: se repinta la grilla para que el
   número de disfraces a la vista sea el de esa pantalla. */
matchMedia(PANTALLA_CHICA).addEventListener('change', () => {
  if ($('#grid')) renderGrid();
});

/* Carrusel de categorías: las flechas corren una pantalla y se apagan en los
   extremos (en el celular no hay flechas: se arrastra con el dedo) */
(() => {
  const track = $<HTMLElement>('#ctTrack');
  const nav = $$('#catCards .ct-arrow');
  if (!track || !nav.length) return;
  const dirDe = (b: HTMLElement) => Number(b.dataset.ct ?? 1);
  nav.forEach((b) =>
    b.addEventListener('click', () => {
      const paso = Math.max(160, track.clientWidth * 0.9);
      track.scrollBy({ left: dirDe(b) * paso, behavior: reduced() ? 'auto' : 'smooth' });
    }),
  );
  const marcarFlechas = () => {
    const max = track.scrollWidth - track.clientWidth;
    nav.forEach((b) => {
      const aIzq = dirDe(b) < 0;
      b.classList.toggle('off', max <= 4 ? true : aIzq ? track.scrollLeft <= 2 : track.scrollLeft >= max - 2);
    });
  };
  track.addEventListener('scroll', marcarFlechas, { passive: true });
  window.addEventListener('resize', marcarFlechas);
  marcarFlechas();
})();

/* grupos de filtros (marcado estático) */
$<HTMLElement>('#catalogo')?.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.g) {
    const g = el.dataset.g as 'tem' | 'oca' | 'pub' | 'tal';
    const s = state[g];

    // En la portada los filtros no filtran acá: redirigen al catálogo.
    if (!enCatalogo) {
      if (el.checked) location.assign(`${RAIZ}/catalogo/?${g}=${encodeURIComponent(el.value)}`);
      return;
    }

    // Público y talla: selección única.
    if (g === 'pub' || g === 'tal') {
      s.clear();
      if (el.checked) s.add(el.value);
    } else {
      el.checked ? s.add(el.value) : s.delete(el.value);
    }
  }
  syncFilterUI();
  renderGrid();
  scrollToResults();
});
$<HTMLElement>('#catalogo')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('.fchip') as HTMLButtonElement | null;
  if (!b) return;
  const g = b.dataset.g as 'pub' | 'tal';
  const s = state[g];
  const v = b.dataset.v!;

  // En la portada los filtros no filtran acá: redirigen al catálogo con el
  // filtro puesto, para que se vean todos los disfraces de esa selección.
  if (!enCatalogo) {
    location.assign(`${RAIZ}/catalogo/?${g}=${encodeURIComponent(v)}`);
    return;
  }

  // Público y talla: selección única (como radio). Clic en la activa la quita.
  const wasOn = s.has(v);
  s.clear();
  if (!wasOn) s.add(v);
  syncFilterUI();
  renderGrid();
  scrollToResults();
});

function syncFilterUI() {
  $$('#catalogo [data-g]').forEach((el) => {
    const inp = el as HTMLInputElement;
    if (el.tagName === 'INPUT') inp.checked = state[inp.dataset.g as 'tem'].has(inp.value);
    else el.classList.toggle('on', state[(el as HTMLButtonElement).dataset.g as 'pub'].has((el as HTMLButtonElement).dataset.v!));
  });
  const cs = $<HTMLInputElement>('#catSearch');
  if (cs && document.activeElement !== cs) cs.value = state.q;
  // Botón "Categorías": muestra cuántas hay activas
  const cdN = $('#catDropN');
  if (cdN) cdN.textContent = String(state.tem.size);
  cdN?.classList.toggle('hidden', state.tem.size === 0);
  $('#catDropBtn')?.classList.toggle('on', state.tem.size > 0);
  // Igual que el carrito: el contador va oculto y el dato vive en la etiqueta.
  $('#catDropBtn')?.setAttribute(
    'aria-label',
    `Categorías, ${state.tem.size} seleccionada${state.tem.size === 1 ? '' : 's'}`,
  );
  const cc = $('#catClear');
  const hayFiltro = state.tem.size + state.oca.size + state.pub.size + state.tal.size > 0 || !!state.q || !!state.exFecha;
  cc?.classList.toggle('hidden', !hayFiltro);
  $('#catFilters')?.classList.toggle('con-limpiar', hayFiltro);
}

function clearAllFilters() {
  ['tem', 'oca', 'pub', 'tal'].forEach((k) => state[k as 'tem'].clear());
  state.exFecha = '';
  state.q = '';
  const inp = $<HTMLInputElement>('#catSearch');
  if (inp) inp.value = '';
  syncFilterUI();
  renderGrid();
}
$('#clearFilters')?.addEventListener('click', clearAllFilters);
$('#catClear')?.addEventListener('click', clearAllFilters);

/* ═══ La barra de filtros nunca debe pasar de 2 filas ═══
   Cuenta las filas reales que ocupan los controles (los .cf-line son
   display:contents y sus hijos fluyen en la misma caja) y, si en escritorio
   no caben en 2, activa .compacta: cada fila se vuelve una tira deslizable. */
function medirFilasBarra(): number {
  const main = $('#catFilters .cat-filters-main');
  if (!main) return 0;
  const hijos = [...main.children]
    .flatMap((e) => (getComputedStyle(e).display === 'contents' ? [...e.children] : [e]))
    .filter((e) => (e as HTMLElement).offsetWidth > 0 && (e as HTMLElement).offsetHeight > 0)
    .map((e) => {
      const r = e.getBoundingClientRect();
      return [r.top, r.bottom] as [number, number];
    })
    .sort((a, b) => a[0] - b[0]);
  let filas = 0;
  let fin = -Infinity;
  hijos.forEach(([a, b]) => {
    if (a >= fin - 1) {
      filas += 1;
      fin = b;
    } else fin = Math.max(fin, b);
  });
  return filas;
}
function ajustarFilasBarra() {
  const bar = $('#fbar');
  if (!bar) return;
  bar.classList.remove('compacta'); // mide primero el diseño de escritorio
  if (medirFilasBarra() > 2) bar.classList.add('compacta');
}
ajustarFilasBarra();
addEventListener('resize', ajustarFilasBarra);

/* ── buscador + sugerencias ── */
function bindSearch(id: string, sugId?: string) {
  const inp = $<HTMLInputElement>('#' + id);
  if (!inp) return;
  const sug = sugId ? $<HTMLElement>('#' + sugId) : null;

  const show = () => {
    if (!sug) return;
    const q = norm(inp.value.trim());
    if (q.length < 2) {
      sug.classList.remove('open');
      return;
    }
    const L = PRODUCTS.filter((c) => norm(c.n + ' ' + c.tags.join(' ')).includes(q)).slice(0, 6);
    sug.innerHTML = L.length
      ? L.map(
          (c) =>
            `<div class="sug-item" data-id="${c.id}" role="option"><span class="se"><img src="${c.img}" srcset="${thumbSrcset(c.img)}" sizes="44px" data-full="${c.img}" onerror="${ONERROR_MINI}" alt="" width="44" height="44" decoding="async" loading="lazy"></span><span class="flex-1"><span class="sn">${hl(c.n, inp.value.trim())}</span><br><small>${catById(c.t).n} · adultos</small></span><span class="sp">Garantía<br>${GAR_SHORT}</span></div>`,
        ).join('')
      : `<div class="sug-empty">😅 Sin resultados… prueba con “Halloween” o “payaso”.</div>`;
    sug.classList.add('open');
  };

  const deb = debounce(() => {
    state.q = inp.value.trim();
    const other = $<HTMLInputElement>('#catSearch');
    if (other && other !== inp) other.value = state.q;
    renderGrid();
    show();
  }, 220);
  inp.addEventListener('input', deb);

  inp.addEventListener('keydown', (e) => {
    const items = sug ? $$('.sug-item', sug) : [];
    let a = items.findIndex((x) => x.classList.contains('act'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      a = (a + 1) % items.length;
      items.forEach((x, k) => x.classList.toggle('act', k === a));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      a = (a - 1 + items.length) % items.length;
      items.forEach((x, k) => x.classList.toggle('act', k === a));
    } else if (e.key === 'Enter') {
      if (a >= 0 && items[a]) {
        irADisfraz((items[a] as HTMLElement).dataset.id!);
        sug?.classList.remove('open');
      } else {
        sug?.classList.remove('open');
        scrollToCat();
      }
    } else if (e.key === 'Escape') sug?.classList.remove('open');
  });

  if (sug) {
    sug.addEventListener('pointerdown', (e) => {
      const it = (e.target as HTMLElement).closest('.sug-item') as HTMLElement | null;
      if (it) {
        irADisfraz(it.dataset.id!);
        sug.classList.remove('open');
      }
    });
    document.addEventListener('click', (e) => {
      if (!inp.contains(e.target as Node) && !sug.contains(e.target as Node)) sug.classList.remove('open');
    });
  }
}
bindSearch('catSearch', 'sugCat');

/* ── Buscadores del menú ──
   La lupa del header ya no está: ahora hay un campo dentro del mega menú
   (escritorio) y otro en el cajón (móvil y tablet). Los dos escriben la
   búsqueda en la URL y llevan al catálogo, que la aplica al llegar. */
$$('[data-megasearch]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = form.querySelector<HTMLInputElement>('input[type="search"]');
    const q = inp?.value.trim() ?? '';
    if (!q) return;
    // Si ya estamos en el catálogo, se filtra en el sitio sin recargar la URL.
    if (enCatalogo) {
      applyFilter({ q });
      return;
    }
    location.assign(`${RAIZ}/catalogo/?q=${encodeURIComponent(q)}`);
  });
});

/* ── El buscador del catálogo empieza plegado (solo lupa) y se despliega al apretar ── */
(() => {
  const box = $('#catFilters .searchbox');
  const tog = $<HTMLButtonElement>('#searchToggle2');
  const inp = $<HTMLInputElement>('#catSearch');
  if (!box || !tog || !inp) return;
  const setOpen = (v: boolean) => {
    box.classList.toggle('open', v);
    tog.setAttribute('aria-expanded', String(v));
    tog.setAttribute('aria-label', v ? 'Cerrar buscador' : 'Abrir buscador');
    // En móvil la barra se desliza: el buscador vuelve al inicio de su fila
    box.closest('.cf-line')?.scrollTo({ left: 0 });
    if (v) inp.focus();
    else {
      inp.value = '';
      if (state.q) {
        state.q = '';
        renderGrid();
      }
      $('#sugCat')?.classList.remove('open');
    }
    // El buscador cambia de ancho con una transición: remide al terminar
    setTimeout(ajustarFilasBarra, reduced() ? 0 : 380);
  };
  tog.addEventListener('click', () => setOpen(!box.classList.contains('open')));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();

function scrollToCat() {
  const el = $('#catalogo');
  if (!el) return;
  const off = ($('#header')?.offsetHeight ?? 64) + 10;
  const y = Math.max(0, window.scrollY + el.getBoundingClientRect().top - off);
  window.scrollTo({ top: y, behavior: reduced() ? 'auto' : 'smooth' });
}
/* Al filtrar, sube a ver las primeras filas de resultados: deja un margen extra
   para que la barra fija (buscador + Público + Talla) no tape las primeras tarjetas. */
function scrollToResults() {
  const grid = $('#grid');
  if (!grid) return;
  const hdr = $('#header')?.offsetHeight ?? 64;
  // La barra queda pegada justo bajo el header: hay que saltar header + barra
  const bar = $('#fbar')?.offsetHeight ?? $('#catFilters')?.offsetHeight ?? 0;
  const off = hdr + bar + 6;
  const y = Math.max(0, window.scrollY + grid.getBoundingClientRect().top - off);
  // Si la distancia es grande, salto instantáneo (el scroll suave de lejos es lento y se "pierde")
  const lejos = Math.abs(y - window.scrollY) > 1200;
  window.scrollTo({ top: y, behavior: reduced() || lejos ? 'auto' : 'smooth' });
}
function closeAll() {
  $('#megaMenu')?.classList.remove('open');
  $('#drawer')?.classList.remove('open');
  $('#burger')?.classList.remove('x');
  $('#catDrop')?.classList.remove('open');
  $('#catDropBtn')?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
/* Al filtrar: en la portada baja hasta la sección del catálogo; ya en la página
   del catálogo salta directo a las primeras tarjetas de resultado. */
/* Un filtro del menú (Temática, Público, Celebración) sobre una página que no
   es el catálogo —la ficha de un disfraz— no tiene cuadrícula que filtrar, así
   que el clic se lleva al catálogo con el filtro puesto en la URL. */
function irAlCatalogoCon(o: { q?: string; tem?: string; pub?: string; oca?: string }) {
  const p = new URLSearchParams();
  if (o.q) p.set('q', o.q);
  if (o.tem) p.set('tem', o.tem);
  if (o.pub) p.set('pub', o.pub);
  if (o.oca) p.set('oca', o.oca);
  location.assign(`${RAIZ}/catalogo/${p.toString() ? `?${p}` : ''}`);
}

function applyFilter(o: { q?: string; tem?: string; pub?: string; oca?: string }) {
  if (!enCatalogo) return irAlCatalogoCon(o);
  (['tem', 'oca', 'pub', 'tal'] as const).forEach((k) => state[k].clear());
  state.exFecha = '';
  state.q = o.q || '';
  if (o.tem) state.tem.add(o.tem);
  if (o.oca) state.oca.add(o.oca);
  if (o.pub) state.pub.add(o.pub);
  syncFilterUI();
  renderGrid();
  if (enCatalogo) scrollToResults();
  else scrollToCat();
  closeAll();
}

/* ═══ MEGA MENÚ (se abre al pasar el mouse sobre "Catálogo") ═══ */
(() => {
  const btn = $<HTMLElement>('#megaBtn');
  const menu = $('#megaMenu');
  if (!btn || !menu) return;
  // El menú se abre al pasar el mouse; en pantallas táctiles, al tocar
  let mt: ReturnType<typeof setTimeout>;
  const open = (v: boolean) => {
    menu.classList.toggle('open', v);
    btn.setAttribute('aria-expanded', String(v));
    if (v) {
      // Coloca la flecha apuntando al botón "Catálogo"
      const mb = menu.getBoundingClientRect();
      const bb = btn.getBoundingClientRect();
      menu.style.setProperty('--mega-x', `${Math.round(bb.left + bb.width / 2 - mb.left)}px`);
    }
  };
  btn.addEventListener('mouseenter', () => {
    clearTimeout(mt);
    open(true);
  });
  btn.addEventListener('mouseleave', () => {
    mt = setTimeout(() => open(false), 220);
  });
  menu.addEventListener('mouseenter', () => clearTimeout(mt));
  menu.addEventListener('mouseleave', () => {
    mt = setTimeout(() => open(false), 220);
  });
  btn.addEventListener('click', (e) => {
    // Con mouse, el clic lleva al catálogo (el menú ya se abrió al pasar por
    // encima). En táctil, el toque despliega el menú y no navega todavía.
    // Se mira el tipo de puntero en el momento: hay notebooks con pantalla
    // táctil que también reportan mouse, y ahí el toque no abría el menú.
    const tactil = matchMedia('(hover: none)').matches || matchMedia('(pointer: coarse)').matches;
    if (!tactil) {
      open(false);
      return;
    }
    e.preventDefault();
    open(!menu.classList.contains('open'));
  });
  menu.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-opencond]')) {
      e.preventDefault();
      open(false);
      openModal('condModal');
      return;
    }
    const a = t.closest('a[data-tem],a[data-pub],a[data-oca]') as HTMLAnchorElement | null;
    if (a) {
      e.preventDefault();
      open(false);
      applyFilter({ tem: a.dataset.tem, pub: a.dataset.pub, oca: a.dataset.oca });
      return;
    }
    const qv = t.closest('[data-qv]') as HTMLElement | null;
    if (qv) {
      irADisfraz(qv.dataset.qv!);
      open(false);
      return;
    }
    if (t.closest('[data-scroll]')) {
      open(false);
      return;
    }
    if (t.closest('[data-mgo]')) {
      open(false);
      // El mapa vive en la portada. Solo el ancla existe en la portada, así que
      // desde el catálogo o la ficha de un disfraz se vuelve a ella.
      if (enCatalogo || !$('#mapa')) location.assign(`${RAIZ}/#mapa`);
      else $('#mapa')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') open(false);
  });
})();

/* ═══ CAJÓN (MENÚ MÓVIL) ═══ */
(() => {
  const d = $('#drawer');
  if (!d) return;
  const open = (v: boolean) => {
    d.classList.toggle('open', v);
    d.toggleAttribute('inert', !v);
    $('#burger')?.classList.toggle('x', v);
    $('#burger')?.setAttribute('aria-expanded', String(v));
    document.body.style.overflow = v ? 'hidden' : '';
    if (v) ($('#drawerClose') as HTMLButtonElement | null)?.focus();
    else ($('#burger') as HTMLButtonElement | null)?.focus();
  };
  ($('#burger') as HTMLButtonElement | null)?.addEventListener('click', () =>
    open(!d.classList.contains('open')),
  );
  ($('#drawerClose') as HTMLButtonElement | null)?.addEventListener('click', () => open(false));
  d.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-opencond]')) {
      e.preventDefault();
      open(false);
      openModal('condModal');
      return;
    }
    const a = t.closest('[data-tem],[data-pub],[data-oca]') as HTMLElement | null;
    if (a) {
      e.preventDefault();
      applyFilter({ tem: a.dataset.tem, pub: a.dataset.pub, oca: a.dataset.oca });
      open(false);
      return;
    }
    if (t.closest('[data-scroll]')) open(false);
    // Cualquier enlace (una sección, el catálogo completo, WhatsApp o las redes):
    // sin esto el cajón quedaba abierto tapando la página a la que se fue.
    if (t.closest('a[href]')) open(false);
  });
  ($('#drawerReq') as HTMLButtonElement | null)?.addEventListener('click', () => {
    open(false);
    openMini();
  });
})();

/* scroll suave de enlaces internos */
document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest('[data-scroll]') as HTMLElement | null;
  if (a) {
    e.preventDefault();
    (a as HTMLElement & { dataset: { scroll: string } }).dataset &&
      $(a.dataset.scroll!)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  }
});

/* ═══ TU ARRIENDO (CARRITO) ═══ */
const cartQty = () => state.cart.reduce((a, i) => a + i.qty, 0);
const disfQty = () => state.cart.filter((i) => i.tipo === 'd').reduce((a, i) => a + i.qty, 0);

/* Valores de referencia ("desde") de la cotización. El arriendo parte en
   $15.000 —PRECIO_DESDE, definido una sola vez en src/data/site.ts, el mismo
   valor que se declara en la ficha de cada disfraz— y la garantía en $15.000. */
const GAR_DESDE = 15000;

/* ── fechas: retiro seleccionable, uso/entrega automáticas (3 días) ── */
function addDays(v: string, d: number): string {
  if (!v) return '';
  const dt = new Date(v + 'T12:00:00');
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
}
function setRetiro(v: string) {
  // Domingo cerrado: si eligen domingo, se mueve al lunes y se avisa
  if (isSunday(v)) v = nextMondayISO(v);
  state.req.retiro = v;
  state.req.uso = addDays(v, 1);
  state.req.entrega = addDays(v, 2);
}

function addItem(id: string | number, tipo: 'd' | 'a' = 'd', talla?: string, qty = 1, srcEl?: Element | null) {
  const item = byId(id);
  if (!item) return;
  talla = talla || (isProduct(item) ? item.tl[0] : 'único');
  const f = state.cart.find((i) => i.id === String(id) && i.talla === talla && i.tipo === tipo);
  if (f) f.qty += qty;
  else state.cart.push({ id: String(id), tipo, talla, qty });
  state.lastAdd = { id: String(id), tipo, talla };
  afterCart(srcEl, true);
}

function afterCart(srcEl?: Element | null, abrir = false) {
  const n = cartQty();
  const cc = $('#cartCount');
  if (cc) {
    cc.textContent = String(n);
    cc.classList.remove('pop');
    void cc.offsetWidth;
    cc.classList.add('pop');
  }
  // El globito va oculto a los lectores de pantalla; la cuenta se entrega en la
  // etiqueta del botón, así el nombre accesible calza con lo que se ve.
  $('#cartBtn')?.setAttribute(
    'aria-label',
    `Tu arriendo, ${n} ${n === 1 ? 'disfraz' : 'disfraces'}, ver solicitud`,
  );
  if (srcEl && !reduced()) {
    fly(srcEl);
    Confetti.at(srcEl); // estallido visible al agregar
    srcEl.classList.remove('clicked');
    void (srcEl as HTMLElement).offsetWidth;
    srcEl.classList.add('clicked');
  }
  renderMini();
  renderSticky();
  // El único panel lateral se abre siempre al agregar un disfraz.
  if (abrir) openMini();
}

function fly(el: Element) {
  const cb = $('#cartBtn');
  if (!cb) return;
  const r1 = el.getBoundingClientRect();
  const r2 = cb.getBoundingClientRect();
  const d = document.createElement('div');
  d.className = 'flydot';
  d.textContent = '🎭';
  d.style.left = r1.left + r1.width / 2 + 'px';
  d.style.top = r1.top + 'px';
  document.body.append(d);
  requestAnimationFrame(() => {
    d.style.transform = `translate(${r2.left - r1.left}px,${r2.top - r1.top}px) scale(.3)`;
    d.style.opacity = '.2';
  });
  setTimeout(() => d.remove(), 750);
}

function renderMini() {
  const mc = $('#miniCart');
  if (!mc) return;
  const prevBody = mc.querySelector('.cart-body') as HTMLElement | null;
  const scrollTop = prevBody?.scrollTop ?? 0;
  const n = cartQty();
  const nd = disfQty();
  const desdeArriendo = nd * PRECIO_DESDE;
  const desdeGarantia = nd * GAR_DESDE;
  const head = `<div class="cart-head">
    <span class="cart-bag" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
    </span>
    <div class="cart-title">
      <div class="cart-title-row"><b>Tu solicitud</b><span class="cart-n">${n} ${n === 1 ? 'prenda' : 'prendas'}</span></div>
    </div>
    <button class="cart-close" data-act="close" aria-label="Cerrar panel">✕</button>
  </div>`;

  if (!state.cart.length) {
    mc.innerHTML =
      head +
      `<div class="cart-body"><div class="cart-empty"><span>🎭✨</span><b>Tu arriendo está esperando magia</b><p>Agrega disfraces de adultos y los vamos sumando aquí.</p></div></div>
      <div class="cart-foot">
        <button class="btn btn-ghost w-full" data-act="gocat">← Seguir viendo disfraces</button>
        <p class="cart-notes">Garantía en local <i>•</i> Retiro Lun a Sáb <i>•</i> <button data-opencond>Términos y arriendo</button></p>
      </div>`;
    return;
  }

  const color = (i: Item) => (isProduct(i) ? catById(i.t).g : ['#f0eaff', '#e2d4ff']);
  mc.innerHTML =
    head +
    `<div class="cart-body">
      <section class="cart-sec">
        <div class="cart-sec-head"><span>Prendas en arriendo</span><span>Período base de 3 días</span></div>
        ${state.cart
          .map((i, k) => {
            const it = byId(i.id)!;
            const tls = isProduct(it) ? it.tl : ['único'];
            const nuevo = state.lastAdd && state.lastAdd.id === i.id && state.lastAdd.talla === i.talla && state.lastAdd.tipo === i.tipo;
            const g = color(it);
            const precio = isProduct(it)
              ? `<p class="rent-price"><em class="desde">Desde</em> ${clp(PRECIO_DESDE)} <span>/ 3 días</span></p>`
              : `<p class="rent-price">A cotizar</p>`;
            return `<article class="rent-card${nuevo ? ' justadded' : ''}">
              <div class="rent-thumb" style="background:linear-gradient(135deg,${g[0]},${g[1]})">${'img' in it && it.img ? `<img src="${it.img}" srcset="${thumbSrcset(it.img)}" sizes="64px" data-full="${it.img}" onerror="${ONERROR_MINI}" alt="" width="64" height="64" decoding="async" loading="lazy">` : `<span>${it.e}</span>`}</div>
              <div class="rent-info">
                <div class="rent-top">
                  <h2 class="rent-name">${esc(it.n)}</h2>
                  <button type="button" class="rent-del" data-rm="${k}" aria-label="Eliminar ${esc(it.n)}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
                ${precio}
                <div class="rent-actions">
                  <select data-rt="${k}"${tls.length > 1 ? ' class="talla-elegir"' : ''} aria-label="Talla de ${esc(it.n)}">${tls.map((x) => `<option ${x === i.talla ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
                  <span class="rent-qty">
                    <button type="button" data-rq="-" data-k="${k}" aria-label="Quitar una unidad de ${esc(it.n)}">−</button>
                    <span>${i.qty}</span>
                    <button type="button" data-rq="+" data-k="${k}" aria-label="Agregar otra talla de ${esc(it.n)}">+</button>
                  </span>
                </div>
              </div>
            </article>`;
          })
          .join('')}
      </section>

      <section class="rent-panel">
        <label class="rent-label" for="rqNom"><span>Tu nombre completo <b>*</b></span><small>Para tu solicitud</small></label>
        <input id="rqNom" class="rent-input" placeholder="Ej. Constanza Silva" autocomplete="name" required aria-required="true" aria-label="Nombre y apellido (obligatorio)" value="${esc(state.req.nombre)}">
        <div class="rent-period">
          <div class="period-head">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg> Período de uso</span>
            <span class="period-badge">3 días corridos</span>
          </div>
          <div class="period-grid">
            <label class="period-cell">
              <span>1. Retiro en local</span>
              <input type="date" id="rqRet" value="${state.req.retiro}" min="${firstRetiroISO()}" max="${maxISO(60)}" aria-label="Día de retiro en tienda">
            </label>
            <div class="period-cell auto">
              <span>2. Devolución (auto)</span>
              <b id="rqEntTxt">${fmtDateCap(state.req.entrega)}</b>
            </div>
          </div>
        </div>
      </section>

      <section class="sum-panel">
        <h3 class="sum-title">Resumen de valores</h3>
        <div class="sum-row"><span>Arriendo (${nd} ${nd === 1 ? 'disfraz' : 'disfraces'} × 3 días)</span><b><em class="desde">Desde</em> ${clp(desdeArriendo)}</b></div>
        <div class="sum-row"><span>Garantía en tienda</span><b><em class="desde">Desde</em> ${clp(desdeGarantia)}</b></div>
        <div class="sum-note"><span class="sum-check">✓</span><p><b>Garantía 100% reintegrable</b> al devolver las prendas a tiempo y en óptimo estado.</p></div>
        <div class="sum-total"><div><span>Total a pagar al retirar</span><small>Arriendo + Garantía incluida</small></div><b><em class="desde">Desde</em> ${clp(desdeArriendo + desdeGarantia)}</b></div>
        <p class="sum-hint">Es una cotización aproximada: los valores se confirman y revisan por WhatsApp al reservar.</p>
      </section>
    </div>
    <div class="cart-foot">
      <button class="btn btn-wsp btn-lg w-full" id="rqSend">💬 Enviar solicitud por WhatsApp</button>
      <button class="cart-gocat" data-act="gocat">← Seguir explorando disfraces</button>
      <p class="cart-notes">Garantía en local <i>•</i> Retiro Lun a Sáb <i>•</i> <button data-opencond>Términos y arriendo</button></p>
    </div>`;

  // Conserva la posición de lectura al cambiar talla o cantidad
  const bodyNow = mc.querySelector('.cart-body') as HTMLElement | null;
  if (bodyNow) bodyNow.scrollTop = scrollTop;

  // Controles del carrito (se re-renderizan con cada cambio)
  mc.querySelectorAll<HTMLButtonElement>('[data-rq]').forEach((b) =>
    b.addEventListener('click', () => {
      const it = state.cart[Number(b.dataset.k)];
      if (!it) return;
      if (b.dataset.rq === '+') {
        // Nueva línea con el mismo disfraz, para poder elegir otra talla
        const prod = byId(it.id);
        const talla = prod && isProduct(prod) ? (prod.tl[0] ?? 'único') : 'único';
        state.cart.splice(Number(b.dataset.k) + 1, 0, { id: it.id, tipo: it.tipo, talla, qty: 1 });
      } else {
        it.qty--;
        if (it.qty < 1) state.cart.splice(Number(b.dataset.k), 1);
      }
      afterCart();
    }),
  );
  mc.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((b) =>
    b.addEventListener('click', () => {
      state.cart.splice(Number(b.dataset.rm), 1);
      afterCart();
    }),
  );
  mc.querySelectorAll<HTMLSelectElement>('[data-rt]').forEach((s) =>
    s.addEventListener('change', () => {
      const it = state.cart[Number(s.dataset.rt)];
      if (it) it.talla = s.value;
      afterCart();
    }),
  );
  const nom = mc.querySelector<HTMLInputElement>('#rqNom');
  nom?.addEventListener('input', () => {
    state.req.nombre = nom.value;
    if (nom.value.trim()) quitarFalta(nom);
  });
  const ret = mc.querySelector<HTMLInputElement>('#rqRet');
  ret?.addEventListener('input', () => {
    setRetiro(ret.value);
    ret.value = state.req.retiro; // refleja la corrección si era domingo
    const ent = mc.querySelector('#rqEntTxt');
    if (ent) ent.textContent = fmtDateCap(state.req.entrega);
  });
  ret?.addEventListener('click', () => {
    const pick = ret as HTMLInputElement & { showPicker?: () => void };
    try {
      pick.showPicker?.();
    } catch {
      /* si el navegador no lo permite, queda el icono del calendario */
    }
  });
  mc.querySelector('#rqSend')?.addEventListener('click', sendWA);

  // El destello de "recién agregado" se apaga solo, para que la tarjeta no
  // quede marcada para siempre. El aviso de talla (3 latidos de 0.85 s) usa
  // el mismo plazo, así alcanza a completarse.
  const added = state.lastAdd;
  if (added) {
    setTimeout(() => {
      if (state.lastAdd === added) state.lastAdd = null;
      mc.querySelector('.rent-card.justadded')?.classList.remove('justadded');
    }, 2600);
  }
}

$('#miniCart')?.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-opencond]')) {
    openModal('condModal');
    return;
  }
  const act = t.closest('[data-act]') as HTMLElement | null;
  if (!act) return;
  if (act.dataset.act === 'close') closeMini();
  else if (act.dataset.act === 'gocat') {
    closeMini();
    scrollToCat();
  } else if (act.dataset.act === 'wa') sendWA();
});

function openMini() {
  const mc = $('#miniCart');
  mc?.classList.add('open');
  mc?.removeAttribute('inert');
  $('#cartBackdrop')?.classList.add('open');
  document.body.classList.add('drawer-lock');
  ($('#miniCart .cart-close') as HTMLButtonElement | null)?.focus();
}
function closeMini() {
  const mc = $('#miniCart');
  mc?.classList.remove('open');
  mc?.setAttribute('inert', '');
  $('#cartBackdrop')?.classList.remove('open');
  document.body.classList.remove('drawer-lock');
  ($('#cartBtn') as HTMLButtonElement | null)?.focus();
}
(() => {
  $('#cartBtn')?.addEventListener('click', () => {
    $('#miniCart')?.classList.contains('open') ? closeMini() : openMini();
  });
  $('#cartBackdrop')?.addEventListener('click', closeMini);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMini();
  });
})();

function renderSticky() {
  const sb = $('#stickyBar');
  if (!sb) return;
  const visible = !!cartQty() && isMobile();
  sb.classList.toggle('show', visible);
  // El aviso flota por encima de la barra: si no, tapa justo la CTA de seguir.
  $('#toasts')?.classList.toggle('sobre-barra', visible);
  if (visible) {
    const st = $('#stickyTxt');
    if (st) st.textContent = `Tu arriendo (${cartQty()})`;
  }
}
$('#stickySend')?.addEventListener('click', () => openMini());

/* Mensaje de WhatsApp: se arma solo, con lo que el cliente elige en la solicitud.
   Va sin emojis a propósito: los caracteres de 4 bytes UTF-8 (los emojis) se
   dañan al viajar dentro del enlace y llegan como "?" a WhatsApp Web/escritorio. */
function waDraft(): string {
  const r = state.req;
  const pedido = state.cart
    .map((i) => {
      const it = byId(i.id);
      if (!it || !isProduct(it)) return it ? `${i.qty}× ${it.n} (talla ${i.talla})` : '';
      const link = `https://magicatienda.cl/disfraz/${disfrazSlug(it)}/`;
      return `${i.qty}× ${it.n} (#${String(it.id).padStart(3, '0')}) (talla ${i.talla}) — ${link}`;
    })
    .filter(Boolean)
    .join(' · ');
  const L = ['¡Hola! Quiero cotizar el arriendo en La Mágica Tienda:'];
  L.push(`Nombre: ${(r.nombre || '').trim() || '—'}${pedido ? ` · ${pedido}` : ''}`);
  L.push(`Retiro ${cortaFecha(r.retiro)} · Devolución ${cortaFecha(r.entrega)}`);
  L.push('¿Me confirman disponibilidad y valores?');
  return L.join('\n');
}
/* Fecha corta dd/mm/aaaa: el formato largo suma renglones al mensaje */
function cortaFecha(iso: string): string {
  return iso && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—';
}

function sendWA() {
  if (!state.cart.length) {
    toast('🛒 Tu arriendo está vacío. ¡Agrega un disfraz primero!');
    return;
  }
  // Validación mínima antes de abrir WhatsApp: solo el nombre (obligatorio)
  const r = state.req;
  const errs: [string, string][] = [];
  if (!r.nombre.trim()) errs.push(['#rqNom', 'Falta tu nombre (ej: Constanza)']);
  ['#rqNom'].forEach((s) => $<HTMLInputElement>(s)?.classList.remove('border-[#c0392b]', 'campo-falta'));
  document.querySelectorAll('.req-err').forEach((e) => e.remove());
  if (errs.length) {
    errs.forEach(([sel, msg]) => {
      const el = $<HTMLInputElement>(sel);
      if (!el) return;
      el.classList.add('border-[#c0392b]');
      void el.offsetWidth; // reinicia la animación si se insiste sin escribir
      el.classList.add('campo-falta');
      const p = document.createElement('p');
      p.className = 'req-err mt-1 text-[.75rem] font-extrabold text-[#c0392b]';
      p.textContent = `⚠️ ${msg}`;
      el.insertAdjacentElement('afterend', p);
    });
    $<HTMLInputElement>(errs[0][0])?.focus();
    toast('⚠️ Escribe tu nombre para enviar la solicitud');
    return;
  }
  window.open(waLink(waDraft()), '_blank');
}

/* Quita el aviso de "campo obligatorio" en cuanto el campo se completa */
function quitarFalta(el: HTMLInputElement) {
  el.classList.remove('border-[#c0392b]', 'campo-falta');
  const s = el.nextElementSibling;
  if (s && s.classList.contains('req-err')) s.remove();
}

/* clics en la grilla */
$('#grid')?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  // Si se hizo clic en un enlace, dejar que navegue normalmente
  if (target.closest('a')) return;
  const card = target.closest('.pcard') as HTMLElement | null;
  if (!card) return;
  const id = Number(card.dataset.id);
  const act = target.closest('[data-act]') as HTMLElement | null;
  if (act?.dataset.act === 'add') {
    const p = PRODUCTS.find((x) => x.id === id);
    // Se agrega con la primera talla disponible; en el panel se puede cambiar.
    addItem(id, 'd', p?.tl[0], 1, act);
    return;
  }
  // Clic en la tarjeta (fuera de enlace) → ir a la página individual
  const link = card.querySelector('a') as HTMLAnchorElement | null;
  if (link) window.location.href = link.href;
});
$('#grid')?.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  // Enter sobre la tarjeta hace lo mismo que el clic: abrir la ficha.
  // Agregar al arriendo tiene su propio botón (y ahí sí se anuncia).
  if (e.key === 'Enter' && t.classList.contains('pcard')) {
    const link = t.querySelector('a') as HTMLAnchorElement | null;
    if (link) window.location.href = link.href;
  }
});

/* ═══ MODALES ═══
   Mismo trato que el cajón y el minicart: al abrir, el resto de la página queda
   inerte y el foco entra al panel; al cerrar, el foco vuelve al disparador.
   Sin esto, "Condiciones" prometía con aria-modal una contención que no existía. */
const SIN_INERT = '#toasts, #confettiCanvas, script, style';
let modalFoco: HTMLElement | null = null;
let modalInerts: HTMLElement[] = [];

function openModal(id: string) {
  const m = $('#' + id);
  // Un mismo clic puede llegar por dos listeners (el del menú y el delegado del
  // documento): la segunda llamada no debe volver a capturar el fondo, o al
  // cerrar quedaría la página inerte.
  if (!m || m.classList.contains('open')) return;
  modalFoco = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modalInerts = [...document.body.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== m && !el.matches(SIN_INERT) && !el.hasAttribute('inert'),
  );
  modalInerts.forEach((el) => el.setAttribute('inert', ''));
  m.classList.add('open');
  m.removeAttribute('inert');
  document.body.style.overflow = 'hidden';
  const panel = m.querySelector<HTMLElement>('.mpanel');
  const first = panel?.querySelector<HTMLElement>('button, [href], input, select, textarea');
  (first ?? panel)?.focus();
}
function closeModal(id: string) {
  const m = $('#' + id);
  if (!m || !m.classList.contains('open')) return;
  m.classList.remove('open');
  m.setAttribute('inert', '');
  modalInerts.forEach((el) => el.removeAttribute('inert'));
  modalInerts = [];
  document.body.style.overflow = '';
  if (modalFoco?.isConnected) modalFoco.focus();
  modalFoco = null;
}
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const c = t.closest('[data-close]') as HTMLElement | null;
  if (c) closeModal(c.dataset.close!);
  const o = t.closest('[data-opencond]') as HTMLElement | null;
  if (o) {
    e.preventDefault();
    openModal('condModal');
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!document.querySelector('.modal.open')) return;
  // El modal es la capa de arriba: Escape lo cierra y no se lleva por delante
  // al cajón, al menú móvil ni a la barra de categorías, que también oyen Escape.
  e.stopImmediatePropagation();
  ['condModal'].forEach(closeModal);
});

/* La barra del botón de cerrar lleva su propio borde cuando el panel ya se
   desplazó (en el móvil, al bajar). Se marca desde el scroll del panel. */

/* ═══ BARRA DE FILTROS: se pega bajo el header y se expande a todo el ancho ═══
   Se marca .pegada cuando el borde superior de la barra alcanza el header:
   ahí el fondo oscuro se despliega de borde a borde (ver .fbar::before). */
(() => {
  const bar = $('#fbar');
  const hdr = $('#header');
  if (!bar) return;
  let pegada = false;
  const ver = () => {
    // Pegada = la barra está clavada justo bajo el header (sin hueco). Si el
    // usuario sigue de largo, la barra se corre con la sección y deja de estarlo.
    const h = hdr?.offsetHeight ?? 64;
    const v = Math.abs(bar.getBoundingClientRect().top - h) <= 1.5;
    if (v === pegada) return;
    pegada = v;
    bar.classList.toggle('pegada', v);
  };
  ver();
  addEventListener('scroll', ver, { passive: true });
  addEventListener('resize', ver);
})();

/* ═══ CATEGORÍAS: el listado se despliega dentro de la barra de filtros ═══ */
(() => {
  const btn = $<HTMLButtonElement>('#catDropBtn');
  const drop = $('#catDrop');
  if (!btn || !drop) return;
  let rt: ReturnType<typeof setTimeout>;
  // El listado se abre hacia abajo; si no hay espacio, hacia arriba
  const ubicar = () => {
    const r = btn.getBoundingClientRect();
    const abajo = window.innerHeight - r.bottom - 14;
    const arriba = r.top - 14;
    drop.style.setProperty('--drop-max', `${Math.max(170, Math.min(420, Math.max(abajo, arriba)))}px`);
    drop.classList.toggle('arriba', abajo < 250 && arriba > abajo);
  };
  const ubicarLuego = () => {
    clearTimeout(rt);
    rt = setTimeout(ubicar, 130);
  };
  const setOpen = (v: boolean) => {
    if (v) ubicar();
    drop.classList.toggle('open', v);
    btn.setAttribute('aria-expanded', String(v));
  };
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!drop.classList.contains('open'));
  });
  // Se cierra al tocar fuera; al marcar una categoría queda abierto para sumar más
  document.addEventListener('click', (e) => {
    const t = e.target as Node;
    if (!drop.contains(t) && !btn.contains(t)) setOpen(false);
  });
  addEventListener('scroll', () => drop.classList.contains('open') && ubicarLuego(), { passive: true });
  addEventListener('resize', () => drop.classList.contains('open') && ubicar());
})();

/* ═══ FECHAS ═══ */
$('#fechasRow')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-tem]') as HTMLElement | null;
  if (b) applyFilter({ tem: b.dataset.tem });
});

/* Logo: en la portada lleva al inicio de la página; el huevasco del murciélago
   y el confeti secreto se conservan como recompensa de los 5 clics. */
let logoC = 0;
let logoT: ReturnType<typeof setTimeout>;
$('#logoBtn')?.addEventListener('click', () => {
  if (enCatalogo) return;
  // Ir al inicio de la portada
  scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
  // En el celular no hay hover: el truco se dispara al tocar el logo
  const b = $('#logoBtn');
  if (b && matchMedia('(hover: none)').matches) {
    b.classList.remove('truco');
    void b.offsetWidth; // reinicia la animación si se toca de nuevo
    b.classList.add('truco');
    setTimeout(() => b.classList.remove('truco'), 1600);
  }
  logoC++;
  clearTimeout(logoT);
  logoT = setTimeout(() => (logoC = 0), 1500);
  if (logoC >= 5) {
    logoC = 0;
    Confetti.rain(160);
    toast('🔮 ¡Encontraste la magia secreta! #lamagicatienda 💜');
  }
});

/* ═══ SONIDOS DE LOS ZOMBIS DEL PIE ═══
   Se arman con la Web Audio API: ni un archivo de sonido que cargar y pesan
   cero bytes. Cada sonido es un par de osciladores con la envolvente escrita a
   mano —un quejido grave para el zombi, un chillido agudo para el perro.
   El contexto se crea en el primer clic porque el navegador no deja sonar
   nada hasta que el usuario interactúa con la página. */
(() => {
  let ctx: AudioContext | null = null;
  const audio = () => (ctx ??= new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

  /* Una nota con envolvente ADSR muy simple, más un filtro que abre y cierra. */
  const nota = (
    o: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    cutoff: number,
  ) => {
    const ac = audio();
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const filtro = ac.createBiquadFilter();

    osc.type = o;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);

    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(cutoff, t0);
    filtro.frequency.exponentialRampToValueAtTime(Math.max(cutoff * 0.25, 80), t0 + dur);
    filtro.Q.value = 3;

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + dur * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(filtro).connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };

  /* Ruido blanco corto: el "estallido" al caer. */
  const golpe = (vol: number, dur: number) => {
    const ac = audio();
    const t0 = ac.currentTime;
    const n = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, n, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain).connect(ac.destination);
    src.start(t0);
  };

  /* Un quejido grave y arrastrado: el zombi cayendo. */
  const zombi = () => {
    nota('sawtooth', 150, 42, 0.55, 0.16, 620);
    nota('square', 96, 34, 0.7, 0.07, 380);
    golpe(0.09, 0.16);
  };
  /* Un chillido agudo y corto: el perro. Sube, se quiebra y baja. */
  const perro = () => {
    nota('sawtooth', 780, 1650, 0.22, 0.13, 3200);
    nota('sawtooth', 1500, 620, 0.3, 0.11, 2600);
    golpe(0.05, 0.09);
  };

  /* ═══ ZOMBIS DEL PIE: al tocarlos se caen y se desangran ═══
     A los 11 s se vuelven a levantar solos, así se puede repetir. */
  $$('[data-zombi]').forEach((z) => {
    let revive: ReturnType<typeof setTimeout>;
    const nombre = z.getAttribute('aria-label') ?? 'Zombi';
    z.addEventListener('click', () => {
      if (z.classList.contains('muerto')) return;
      // El audio arranca desde un clic, así que el navegador ya lo permite.
      try {
        (z.classList.contains('hf-perro') ? perro : zombi)();
      } catch {
        /* sin audio disponible: el zombi se cae igual */
      }
      clearTimeout(revive);
      z.classList.remove('revive');
      void z.offsetWidth;
      z.classList.add('muerto');
      z.setAttribute('aria-label', `${nombre} (muerto)`);
      revive = setTimeout(
        () => {
          z.classList.remove('muerto');
          z.setAttribute('aria-label', nombre);
          void z.offsetWidth;
          z.classList.add('revive');
        },
        reduced() ? 6000 : 11000,
      );
    });
    z.addEventListener('animationend', (e) => {
      if ((e as AnimationEvent).animationName.startsWith('hfZombiRevive')) z.classList.remove('revive');
    });
  });
})();

/* ═══ MAPA · HORARIO (con temporada Halloween dinámica) ═══ */
(() => {
  const badge = $('#openBadge');
  const to = (t: string) => {
    const [a, b] = t.split(':');
    return Number(a) * 60 + Number(b);
  };
  const pintar = () => {
    const n = new Date();
    const d = n.getDay();
    const mins = n.getHours() * 60 + n.getMinutes();
    const preview = new URLSearchParams(location.search).get('halloween') === '1';
    const hallo = preview || esTemporadaHalloween(n);
    const [o, c] = hallo ? ['12:00', '20:30'] : ['15:00', '20:30'];

    // Textos que se actualizan solos (del 15 al 31 oct sale el de Halloween)
    const etiqueta = hallo
      ? '🎃 Del 15 al 31 oct: 12:00–20:30'
      : 'Lun–Sáb 15:00–20:30 · Dom cerrado';
    $$<HTMLElement>('[data-horario]').forEach((el) => {
      el.textContent = etiqueta;
    });
    // Aviso destacado del horario Halloween (aparece solo en temporada)
    const note = $('#halloHours');
    if (note) note.hidden = !hallo;

    if (!badge) return;
    const set = (st: string, msg: string) => {
      badge.classList.toggle('open', st === 'open');
      badge.classList.toggle('closed', st === 'closed');
      badge.innerHTML = `<span class="dot"></span> ${msg}`;
    };
    if (d === 0) return set('closed', 'Cerrado hoy domingo · volvemos el lunes 15:00');
    const [oi, ci] = [to(o), to(c)];
    const rango = hallo ? '12:00–20:30' : '15:00–20:30';
    const tag = hallo ? ' · horario Halloween 🎃' : '';
    if (mins >= oi && mins < ci) set('open', `Abierto ahora · hoy hasta las ${c}${tag}`);
    else if (mins < oi) set('open', `Hoy abrimos a las ${o}${tag}`);
    else set('closed', `Cerrado · volvemos mañana · ${rango}`);
  };
  pintar();
  setInterval(pintar, 60000);
})();

/* ═══ TOOLTIPS (la "i" de la garantía y la guía de tallas) ═══
   El globito se dibuja en una capa fija colgada del <body>, fuera del modal:
   dentro del panel con scroll quedaba recortado, y el texto de la garantía es
   más ancho que la pantalla. Se sigue del elemento, se acomoda a los bordes y
   si no cabe arriba se muestra debajo. */
const tipPop = document.createElement('div');
tipPop.className = 'tip-pop';
document.body.appendChild(tipPop);

function verTip(el: HTMLElement) {
  const txt = el.dataset.tip;
  if (!txt) return;
  tipPop.textContent = txt;
  const r = el.getBoundingClientRect();
  const w = tipPop.offsetWidth;
  const h = tipPop.offsetHeight;
  const centro = Math.min(Math.max(r.left + r.width / 2, w / 2 + 10), window.innerWidth - w / 2 - 10);
  const abajo = r.top - h - 9 < 8;
  tipPop.classList.toggle('abajo', abajo);
  tipPop.style.left = `${centro}px`;
  tipPop.style.top = `${abajo ? r.bottom + 9 : r.top - 9}px`;
  tipPop.classList.add('on');
}
function ocultarTip() {
  tipPop.classList.remove('on');
}

const tipDe = (t: Event) =>
  ((t.target as HTMLElement | null)?.closest?.('.tip') as HTMLElement | null) ?? null;
document.addEventListener('pointerover', (e) => {
  const el = tipDe(e);
  if (el?.dataset.tip) verTip(el);
  else ocultarTip();
});
document.addEventListener('pointerout', (e) => {
  if (tipDe(e)) ocultarTip();
});
document.addEventListener('focusin', (e) => {
  const el = tipDe(e);
  if (el?.dataset.tip) verTip(el);
});
document.addEventListener('focusout', ocultarTip);
document.addEventListener('pointerdown', ocultarTip);
document.addEventListener('keydown', ocultarTip);
window.addEventListener('scroll', ocultarTip, { capture: true, passive: true });
window.addEventListener('resize', ocultarTip);

/* ═══ CONTACTO / FAQ / NEWSLETTER ═══ */
$('#cForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (id: string) => ($<HTMLInputElement>('#' + id)?.value ?? '');
  // Sin emojis: los caracteres de 4 bytes UTF-8 se dañan al viajar en el enlace
  const m = `¡Hola! Soy ${v('cfNombre')}.\nTeléfono: ${v('cfCel')}\nMensaje: ${v('cfMsg')}`;
  window.open(waLink(m), '_blank');
  toast('💬 Abriendo WhatsApp con tu mensaje…');
});

/* acordeones (FAQ y guía de tallas) */
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('.acc-item > button') as HTMLButtonElement | null;
  if (!b || b.hasAttribute('data-opencond')) return;
  const item = b.parentElement;
  if (!item) return;
  const open = item.classList.toggle('open');
  b.setAttribute('aria-expanded', String(open));
  // La respuesta cerrada no debe quedar en el árbol de accesibilidad.
  item.querySelector('.ab')?.toggleAttribute('inert', !open);
});

/* ═══ FLOTANTES DE CONTACTO ═══ */
(() => {
  const chat = $('#wspChat');
  $('#wspFloat')?.addEventListener('click', () => chat?.classList.toggle('open'));
  $('#waChatClose')?.addEventListener('click', () => chat?.classList.remove('open'));
})();

$('#halloCTA')?.addEventListener('click', () => applyFilter({ tem: 'halloween-y-terror' }));

/* ═══ REVEAL AL HACER SCROLL ═══ */
(() => {
  const els = $$('.rv');
  if (!els.length) return;
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((el) => io.observe(el));
})();

/* ═══ HEADER: buscador popup · inicio · scrollspy · alto del header ═══ */
(() => {
  const hdr = $('#header');
  const setH = () => {
    if (hdr) document.documentElement.style.setProperty('--hdr-h', `${hdr.offsetHeight}px`);
  };
  setH();
  // El alto real cambia cuando cargan las tipografías (el menú deja de pasar a 2
  // líneas): si --hdr-h queda viejo, la barra de filtros se pega con un hueco.
  if (hdr) new ResizeObserver(setH).observe(hdr);
  addEventListener('resize', setH);
  document.fonts?.ready.then(setH).catch(() => {});

  // Menú móvil: se cierra con Escape
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  // Icono de inicio: en la portada sube al tope; en /catalogo/ vuelve a la portada
  $('#topHome')?.addEventListener('click', () => {
    if (enCatalogo) location.assign(`${RAIZ}/`);
    else window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
  });

  // Scrollspy: remarca con un puntito en qué sección del menú estás
  const ids = ['catalogo', 'tarifas', 'fechas', 'como', 'contacto'];
  const links = $$<HTMLAnchorElement>('nav a[data-navsec]');
  const spy = () => {
    const y = window.scrollY + (hdr?.offsetHeight ?? 64) + 150;
    let cur = '';
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= y) cur = id;
    });
    links.forEach((a) => a.classList.toggle('on', a.dataset.navsec === cur));
  };
  // throttle con rAF: el scroll no debe forzar reflow en cada evento
  let spyQueued = false;
  const spyRaf = () => {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(() => {
      spy();
      spyQueued = false;
    });
  };
  spy();
  addEventListener('scroll', spyRaf, { passive: true });
  addEventListener('resize', spyRaf);
})();

/* ═══ ARRANQUE ═══ */
hidratarDesdeURL();
renderGrid();
renderMini();
renderSticky();

// Si llegamos con un filtro puesto, baja suavemente al bloque de disfraces.
if ((window as any).__scrollAGrid) {
  delete (window as any).__scrollAGrid;
  requestAnimationFrame(() => {
    setTimeout(() => scrollToResults(), 120);
  });
}

/* ── Catálogo completo ──
   Al llegar al final de la lista se carga la tanda siguiente sola, para no
   tener que apretar nada en el teléfono. El botón queda como respaldo (y para
   quien navega con teclado o lector de pantalla). */
if (enCatalogo) {
  const wrap = $('#loadWrap');
  if (wrap) {
    let ocupado = false;
    new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting) || ocupado) return;
        // Quedan disfraces por cargar: si no, el observador seguiría pidiendo
        // tanda una y otra vez al final de la lista.
        const L = filtered();
        if (state.page * paso() >= L.length) return;
        ocupado = true;
        avisarCarga(() => {
          cargarMas();
          ocupado = false;
        });
      },
      { rootMargin: '0px 0px 420px 0px' },
    ).observe(wrap);
  }
}

/* Exponer funciones para paginas individuales */
(window as any).addItemToCart = (id: string, talla: string) => addItem(id, 'd', talla, 1);
(window as any).openCartModal = () => openMini();
(window as any).openMiniCart = () => openMini();


