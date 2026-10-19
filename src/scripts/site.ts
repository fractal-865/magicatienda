/* ═══════════════════════════════════════════════════════════════
   La Mágica Tienda — interactividad del sitio
   Filtros + buscador + "Tu arriendo" (cotización) + modales
   ═══════════════════════════════════════════════════════════════ */
import { PRODUCTS, CATS, PUBLICOS, OCASIONES, TALLAS, TALLA_GUIA, catById, clp, type Product } from '../data/products';
import { GAR_SHORT, GAR, waLink, ACC, esTemporadaHalloween } from '../data/site';

type Acc = { id: string; n: string; e: string };
type Item = Product | Acc;
type CartItem = { id: string; tipo: 'd' | 'a'; talla: string; qty: number };

const isProduct = (i: Item): i is Product => 'tl' in i;

/* ── utilidades ── */
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T | null;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll(s)] as T[];
const norm = (s: string) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

/* ── estado ── */
/* Cuántos disfraces se ven de una vez. En la portada el escaparate muestra 25
   (cinco filas de cinco en pantalla grande, sin dejar una tarjeta suelta) y en
   /catalogo/ las tandas de "cargar más" van de 26. */
const PAGE_PORTADA = 25;
const PAGE_CATALOGO = 26;
const PASO = enCatalogo ? PAGE_CATALOGO : PAGE_PORTADA;

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
  t.className = 'toast rounded-[14px] border-2 border-m400 bg-white px-[18px] py-3 text-center text-[.88rem] font-extrabold text-ink shadow-sh2 max-w-[92vw]';
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

/* ═══ BARRA DE URGENCIA (toggle manual) ═══ */
(() => {
  const urg = $('#urgencia');
  if (!urg) return;
  const toggle = $('#urgToggle');
  const panel = $('#urgPanel');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    if (panel) panel.hidden = open;
  });
  // Conteo compacto de cada fecha de la barra
  const tickUrg = () => {
    $$<HTMLElement>('.urg-cd').forEach((el) => {
      const p = cdParts(nextDate(Number(el.dataset.m), Number(el.dataset.d)));
      el.textContent = p ? `${p.d}d ${p.h}h ${p.m}m` : '¡es hoy!';
    });
  };
  tickUrg();
  setInterval(tickUrg, 30000);
  // Clic en una fecha → filtra el catálogo por esa temática
  $$<HTMLElement>('.urg-item').forEach((b) =>
    b.addEventListener('click', () => {
      if (panel) panel.hidden = true;
      toggle?.setAttribute('aria-expanded', 'false');
      applyFilter({ tem: b.dataset.tem });
    }),
  );
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
function filtered(): Product[] {
  let L = PRODUCTS.filter((c) => {
    if (state.q) {
      const toks = norm(state.q).split(/\s+/).filter(Boolean);
      const h = hay(c);
      if (!toks.every((tk) => h.includes(tk))) return false;
    }
    if (state.tem.size && ![...state.tem].some((t) => c.cats.includes(t))) return false;
    if (state.oca.size && ![...state.oca].some((o) => c.oc.includes(o))) return false;
    if (state.pub.size && !state.pub.has(c.pub)) return false;
    if (state.tal.size && ![...state.tal].some((t) => c.tl.includes(t))) return false;
    return true;
  });
  // Orden aleatorio (fijo por visita) para que siempre se vea algo distinto
  L.sort((a, b) => (RANDOM_ORDER.get(a.id) ?? 0) - (RANDOM_ORDER.get(b.id) ?? 0));
  return L;
}

function hl(name: string, q: string) {
  if (!q) return esc(name);
  const i = norm(name).indexOf(norm(q));
  if (i < 0) return esc(name);
  return esc(name.slice(0, i)) + '<mark>' + esc(name.slice(i, i + q.length)) + '</mark>' + esc(name.slice(i + q.length));
}

function rent3HTML() {
  return `<div class="my-3 grid gap-2 max-[560px]:grid-cols-1 min-[561px]:grid-cols-3" aria-label="El arriendo dura 3 días">
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">📦</span><b class="my-0.5 block font-ft text-[.85rem] text-m600">Día 1 · Retiro</b><small class="block text-[.72rem] leading-[1.35] text-ink2">Pagas la garantía (${GAR_SHORT}) en efectivo o transferencia</small></div>
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">🎉</span><b class="my-0.5 block font-ft text-[.85rem] text-m600">Día 2 · Uso</b><small class="block text-[.72rem] leading-[1.35] text-ink2">Tu fiesta o evento</small></div>
  <div class="r3 relative rounded-[14px] border-[1.5px] border-dashed border-m400 bg-mist p-2.5 text-center"><span class="r3i block text-[1.5rem]">↩️</span><b class="my-0.5 block font-ft text-[.85rem] text-m600">Día 3 · Entrega</b><small class="block text-[.72rem] leading-[1.35] text-ink2">Devolución y reembolso de tu garantía</small></div></div>`;
}

function gnoticeHTML() {
  return `<div class="my-2.5 flex items-start gap-2 rounded-[14px] border-[1.5px] border-ama bg-[#fdf6d9] p-2.5 text-[.82rem] text-[#6b5200]">🛡️ <span><b>Garantía de $15.000 o $20.000 según el disfraz.</b> Se paga el día del retiro, en efectivo o transferencia, y se devuelve al entregar el disfraz en las mismas condiciones. <button class="glink cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 text-[.82rem] font-extrabold text-m600 underline" data-opencond>Ver condiciones de garantía</button></span></div>`;
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

function cardHTML(c: Product, k: number) {
  const T = catById(c.t);
  const multiSize = c.tl.length > 1;
  const guia = (t: string) => TALLA_GUIA[t] ? `Estatura recomendada: ${TALLA_GUIA[t]}` : 'Sin referencia de estatura';
  const slug = `${c.id}-${c.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
  const disfrazUrl = `/disfraz/${slug}/`;
  return `<article class="pcard relative flex cursor-pointer flex-col rounded-[20px] border-[1.5px] border-line bg-white shadow-[0_8px_20px_rgba(90,42,156,.08)] transition duration-300 hover:-translate-y-[5px] hover:shadow-sh2" data-id="${c.id}" style="--d:${Math.min(k * 0.05, 0.4)}s" tabindex="0" aria-label="${esc(c.n)}, disfraz para adultos en arriendo">
  <div class="pimg relative aspect-[2/3] shrink-0 overflow-hidden" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})">
    <a href="${disfrazUrl}" class="absolute inset-0 z-[1]" aria-label="Ver ${esc(c.n)}">
      <img src="${c.img}" alt="${esc(c.n)} para arriendo en Punta Arenas" loading="lazy" class="absolute inset-0 h-full w-full object-contain object-center transition duration-500">
    </a>
    <span class="absolute left-2 top-2 z-[2] rounded-full bg-m600/90 px-2 py-0.5 text-[.65rem] font-extrabold text-white shadow-sh"> #${String(c.id).padStart(3, '0')}</span>
    <button type="button" class="quick-view-btn absolute right-2 top-2 z-[2] grid h-9 w-9 place-items-center rounded-full bg-white/90 text-m600 shadow-sh transition hover:bg-m600 hover:text-white" data-quick="${c.id}" aria-label="Vista rápida de ${esc(c.n)}" title="Vista rápida">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
  </div>
  <div class="flex flex-1 flex-col p-3.5 pb-4">
    <span class="block text-[.72rem] font-extrabold uppercase tracking-[.05em] text-m500">${T.i} ${T.n}</span>
    <a href="${disfrazUrl}" class="mb-1 min-h-[2.55rem] text-[1.02rem] font-semibold leading-[1.25] text-ink hover:text-m600">${hl(c.n, state.q)}</a>
    <div class="mb-2.5 flex min-h-[1.6rem] flex-wrap gap-1">${c.tl.map((t) => `<span class="tip cursor-help rounded-[7px] bg-[#f0eaff] px-[7px] py-[3px] text-[.64rem] font-extrabold text-m600" data-tip="${esc(guia(t))}" tabindex="0">${esc(t)}</span>`).join('')}</div>
    <div class="mt-auto">
      <div class="mb-2.5 flex items-baseline justify-between gap-2">
        <span class="font-ft text-[1.3rem] font-bold leading-none text-m600">Desde $15.000</span>
        <button type="button" class="info-dot tip cursor-help" data-tip="Valor según el disfraz. Cotiza por WhatsApp para conocer el precio exacto." aria-label="Sobre los precios">?</button>
        <span class="text-[.68rem] font-bold text-ink2">arriendo 3 días</span>
      </div>
      <button class="addbtn w-full cursor-pointer rounded-xl border-0 bg-[linear-gradient(135deg,var(--color-m600),var(--color-m500))] px-2 py-2.5 font-ft text-[.84rem] font-bold text-white shadow-[0_4px_12px_rgba(90,42,156,.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(90,42,156,.45)] active:scale-[.9]" data-act="add">${multiSize ? '📏 Elegir talla y arrendar' : '🎭 Arrendar disfraz'}</button>
    </div>
  </div>
</article>`;
}

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
  // Paginación: PASO disfraces por carga
  const quedan = L.length - mostrados;
  const wrap = $('#loadWrap');
  const more = $<HTMLButtonElement>('#loadMore');
  const info = $('#loadInfo');
  if (wrap) wrap.classList.toggle('hidden', quedan <= 0);
  if (more) more.textContent = `Cargar más disfraces (${quedan})`;
  if (info) info.textContent = quedan > 0 ? `Te quedan ${quedan} por ver` : `Ya viste los ${L.length} disfraces ✨`;

  // Botón "Limpiar filtros": solo aparece cuando hay algo activo
  const cc = $('#catClear');
  const activo = state.tem.size + state.oca.size + state.pub.size + state.tal.size > 0 || !!state.q || !!state.exFecha;
  cc?.classList.toggle('hidden', !activo);
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
  const L = filtered();
  const mostrados = Math.min(L.length, state.page * PASO);
  g.innerHTML = L.length ? L.slice(0, mostrados).map((c, k) => cardHTML(c, k)).join('') : VACIO_HTML;

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
  const ini = state.page * PASO;
  const nuevas = L.slice(ini, ini + PASO);
  if (!nuevas.length) return;
  state.page += 1;
  g.insertAdjacentHTML('beforeend', nuevas.map((c, k) => cardHTML(c, ini + k)).join(''));
  encuadrarFotos();
  pintarInfo(L, ini + nuevas.length);
  pintarBarra();
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

  // Procesar parámetros de añadir al carrito desde página de disfraz
  const addId = p.get('add');
  const addTalla = p.get('talla');
  if (addId) {
    const id = Number(addId);
    const prod = PRODUCTS.find((x) => x.id === id);
    if (prod) {
      const talla = addTalla || (prod.tl.length === 1 ? prod.tl[0] : '');
      if (talla) {
        addItem(id, 'd', talla, 1);
        // Limpiar la URL
        history.replaceState(null, '', location.pathname);
        toast(`✅ ${prod.n} añadido a tu cotización`);
      } else {
        // Si no hay talla, abrir la ficha rápida
        openQuick(id);
        nudgeSize();
      }
    }
  }

  // Procesar parámetro de vista rápida
  const quickId = p.get('quick');
  if (quickId) {
    const id = Number(quickId);
    if (PRODUCTS.find((x) => x.id === id)) {
      openQuick(id);
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
$('#loadMore')?.addEventListener('click', cargarMas);

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
    const s = state[el.dataset.g as 'tem'];
    el.checked ? s.add(el.value) : s.delete(el.value);
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
  if (g === 'pub') {
    // Público: selección única (como radio). Clickea otra y cambia; la activa la quita.
    const wasOn = s.has(b.dataset.v!);
    s.clear();
    if (!wasOn) s.add(b.dataset.v!);
    syncFilterUI();
  } else {
    s.has(b.dataset.v!) ? s.delete(b.dataset.v!) : s.add(b.dataset.v!);
    b.classList.toggle('on');
  }
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
    .filter((e) => e.offsetWidth > 0 && e.offsetHeight > 0)
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
            `<div class="sug-item" data-id="${c.id}" role="option"><span class="se"><img src="${c.img}" alt=""></span><span class="flex-1"><span class="sn">${hl(c.n, inp.value.trim())}</span><br><small>${catById(c.t).n} · adultos</small></span><span class="sp">Garantía<br>${GAR_SHORT}</span></div>`,
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
        openQuick(Number((items[a] as HTMLElement).dataset.id));
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
        openQuick(Number(it.dataset.id));
        sug.classList.remove('open');
      }
    });
    document.addEventListener('click', (e) => {
      if (!inp.contains(e.target as Node) && !sug.contains(e.target as Node)) sug.classList.remove('open');
    });
  }
}
bindSearch('catSearch', 'sugCat');

/* ── Buscador único: en la cabecera solo la lupa, que baja al buscador del catálogo ── */
$('#searchToggle')?.addEventListener('click', () => {
  if (!enCatalogo) {
    // En páginas individuales, redirigir al catálogo con el buscador abierto
    window.location.href = '/catalogo/?buscar=1';
    return;
  }
  const sb = $('#catFilters .searchbox');
  if (sb && !sb.classList.contains('open')) sb.classList.add('open');
  scrollToCat();
  setTimeout(() => $<HTMLInputElement>('#catSearch')?.focus(), reduced() ? 0 : 520);
  setTimeout(ajustarFilasBarra, reduced() ? 0 : 420);
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
function applyFilter(o: { q?: string; tem?: string; pub?: string; oca?: string }) {
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
      openQuick(Number(qv.dataset.qv));
      open(false);
      return;
    }
    if (t.closest('[data-scroll]')) {
      open(false);
      return;
    }
    if (t.closest('[data-mgo]')) {
      open(false);
      // El mapa vive en la portada: si estamos en /catalogo/, volvemos allá
      if (enCatalogo) location.assign(`${RAIZ}/#mapa`);
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
    openReq();
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

/* navegación inferior móvil. En /catalogo/, Inicio y Fechas viven en la portada. */
$('#bottomNav')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-nav]') as HTMLElement | null;
  if (!b) return;
  const n = b.dataset.nav;
  if (n === 'top') {
    if (enCatalogo) location.assign(`${RAIZ}/`);
    else scrollTo({ top: 0, behavior: 'smooth' });
  } else if (n === 'cat') scrollToCat();
  else if (n === 'fecha') {
    if (enCatalogo) location.assign(`${RAIZ}/#fechas`);
    else $('#fechas')?.scrollIntoView({ behavior: 'smooth' });
  } else if (n === 'req') openReq();
  else ($('#burger') as HTMLButtonElement | null)?.click();
});

/* ═══ TU ARRIENDO (CARRITO) ═══ */
const cartQty = () => state.cart.reduce((a, i) => a + i.qty, 0);
const disfQty = () => state.cart.filter((i) => i.tipo === 'd').reduce((a, i) => a + i.qty, 0);

/* ── Cálculo de precios (arriendo + garantía) ── */
function rentalSubtotal(): number {
  return state.cart.reduce((a, i) => {
    const it = byId(i.id);
    return a + (it && isProduct(it) ? it.price * i.qty : 0);
  }, 0);
}
function rentalTotal(): number {
  return rentalSubtotal();
}
function guaranteeTotal(): number {
  return state.cart.reduce((a, i) => {
    const it = byId(i.id);
    return a + (it && isProduct(it) ? it.gar * i.qty : 0);
  }, 0);
}

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
/* refresca la fila de fechas legibles ("lunes 19 de octubre") */
function refreshDateRow() {
  const row = $('.daterow');
  if (row) row.innerHTML = `<span>📦 Retiro: <b>${fmtDate(state.req.retiro)}</b></span><span>↩️ Entrega: <b>${fmtDate(state.req.entrega)}</b></span>`;
  const entTxt = $('#rqEntTxt');
  if (entTxt) entTxt.textContent = fmtDate(state.req.entrega);
  const ent = $<HTMLInputElement>('#rqEnt');
  if (ent) ent.value = state.req.entrega;
}

/* ── bloque de totales (arriendo + garantía), compartido ── */
function totalsHTML(conPagoDia = true): string {
  const sub = rentalSubtotal();
  const tot = rentalTotal();
  const gar = guaranteeTotal();
  const pagoDia = tot + gar;
  return `<div class="det mt-3 rounded-2xl border-2 border-line bg-[#f9f6ff] p-3 text-[.85rem]">
    <div class="flex items-baseline justify-between gap-2">
      <span class="font-ft text-[.95rem] font-bold text-m600">Total a pagar por el arriendo</span>
      <b class="font-ft text-[1.3rem] leading-none text-m600">Desde $15.000</b>
    </div>
    <p class="mt-1 text-[.75rem] text-ink2">Arriendo por 3 días (retiro, uso y entrega)</p>
  </div>
  <span class="gchip">🛡️ Garantía de $15.000 o $20.000 reintegrable</span>
  ${
    conPagoDia
      ? `<div class="paynote">
    <span class="pn-label">El día del retiro pagarás</span>
    <b class="pn-total">Desde $30.000</b>
    <small>Arriendo desde $15.000 + garantía de $15.000 o $20.000. La garantía se te devuelve completa al entregar el disfraz en las mismas condiciones.</small>
  </div>`
      : ''
  }`;
}
const thumb = (it: Item) =>
  `<span class="me">${'img' in it && it.img ? `<img src="${it.img}" alt="">` : it.e}</span>`;

function addItem(id: string | number, tipo: 'd' | 'a' = 'd', talla?: string, qty = 1, srcEl?: Element | null) {
  const item = byId(id);
  if (!item) return;
  talla = talla || (isProduct(item) ? item.tl[0] : 'único');
  const f = state.cart.find((i) => i.id === String(id) && i.talla === talla && i.tipo === tipo);
  if (f) f.qty += qty;
  else state.cart.push({ id: String(id), tipo, talla, qty });
  state.lastAdd = { id: String(id), tipo, talla };
  afterCart(srcEl, true);
  toast(`${item.e} <b>${esc(item.n)}</b> agregado a tu arriendo (talla ${talla})`);
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
  if (srcEl && !reduced()) {
    fly(srcEl);
    Confetti.at(srcEl); // estallido visible al agregar
    srcEl.classList.remove('clicked');
    void (srcEl as HTMLElement).offsetWidth;
    srcEl.classList.add('clicked');
  }
  renderMini();
  renderSticky();
  if ($('#reqModal')?.classList.contains('open')) renderReq();
  // El panel lateral se abre siempre al agregar un disfraz (salvo detrás del
  // modal de solicitud, que ya ocupa toda la pantalla).
  if (abrir && !$('#reqModal')?.classList.contains('open')) openMini();
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
  const head = `<div class="cart-head"><b class="font-ft text-[1.05rem] text-ink">🛒 Tu arriendo</b><span class="cart-n">${cartQty()} prenda(s)</span><button class="cart-close" data-act="close" aria-label="Cerrar panel">✕</button></div>`;
  if (!state.cart.length) {
    mc.innerHTML = head + `<div class="cart-body"><div class="py-8 text-center text-ink2"><span class="mb-2 block text-[2.8rem]">🎭✨</span><b class="font-ft">Tu arriendo está esperando magia</b><p class="mt-1.5 text-[.85rem]">Agrega disfraces de adultos y te vamos apuntando todo aquí.</p></div></div><div class="cart-foot"><button class="btn btn-ghost w-full" data-act="gocat">← Seguir viendo disfraces</button></div>`;
    return;
  }
  mc.innerHTML =
    head +
    `<div class="cart-body">` +
    state.cart
      .map((i) => {
        const it = byId(i.id)!;
        const nuevo = state.lastAdd && state.lastAdd.id === i.id && state.lastAdd.talla === i.talla && state.lastAdd.tipo === i.tipo;
        return `<div class="mc-item${nuevo ? ' justadded' : ''}">${thumb(it)}<span class="mn">${esc(it.n)}${nuevo ? ' <b class="justbadge">✨ ¡Agregado!</b>' : ''}<br><small>Talla ${i.talla}</small></span><span class="qty inline-flex items-center gap-2"><button data-mc="-" data-id="${i.id}" data-t="${esc(i.talla)}" aria-label="Menos">−</button>${i.qty}<button data-mc="+" data-id="${i.id}" data-t="${esc(i.talla)}" aria-label="Más">+</button></span></div>`;
      })
      .join('') +
    `</div>` +
    `<div class="cart-foot">
      ${totalsHTML(false)}
      <button class="btn btn-wsp w-full" data-act="req">Continuar con mi cotización 💬</button>
      <button class="btn btn-ghost w-full" data-act="gocat">← Seguir comprando</button>
      <p class="payline text-center">Pagos por depósito o transferencia: ver <button data-opencond>Condiciones de arriendo</button>.</p>
    </div>`;
}

$('#miniCart')?.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-opencond]')) {
    openModal('condModal');
    return;
  }
  const act = t.closest('[data-act]') as HTMLElement | null;
  if (act) {
    if (act.dataset.act === 'close') closeMini();
    else if (act.dataset.act === 'gocat') {
      closeMini();
      scrollToCat();
    } else if (act.dataset.act === 'req') {
      closeMini();
      openReq();
    } else if (act.dataset.act === 'wa') sendWA();
    return;
  }
  const b = t.closest('[data-mc]') as HTMLButtonElement | null;
  if (!b) return;
  const it = state.cart.find((i) => i.id === b.dataset.id && i.talla === b.dataset.t);
  if (!it) return;
  if (b.dataset.mc === '+') it.qty++;
  else {
    it.qty--;
    if (it.qty < 1) state.cart = state.cart.filter((x) => x !== it);
  }
  afterCart();
});

function openMini() {
  const mc = $('#miniCart');
  mc?.classList.add('open');
  mc?.removeAttribute('inert');
  $('#cartBackdrop')?.classList.add('open');
  document.body.classList.add('drawer-lock');
  ($('#cartBtn') as HTMLButtonElement | null)?.focus();
}
function closeMini() {
  const mc = $('#miniCart');
  mc?.classList.remove('open');
  mc?.setAttribute('inert', '');
  $('#cartBackdrop')?.classList.remove('open');
  document.body.classList.remove('drawer-lock');
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
  if (cartQty() && isMobile()) {
    sb.classList.add('show');
    const st = $('#stickyTxt');
    if (st) st.textContent = `Tu arriendo (${cartQty()})`;
  } else sb.classList.remove('show');
}
$('#stickySend')?.addEventListener('click', () => openReq());

/* Mensaje de WhatsApp: se arma solo, con lo que el cliente elige en la solicitud.
   Va sin emojis a propósito: los caracteres de 4 bytes UTF-8 (los emojis) se
   dañan al viajar dentro del enlace y llegan como "?" a WhatsApp Web/escritorio. */
function waDraft(): string {
  const r = state.req;
  const pedido = state.cart
    .map((i) => {
      const it = byId(i.id);
      if (!it || !isProduct(it)) return it ? `${i.qty}× ${it.n} (talla ${i.talla})` : '';
      const slug = `${it.id}-${it.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
      const link = `https://magicatienda.cl/disfraz/${slug}/`;
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
  if (!r.nombre.trim()) errs.push(['#rqNom', 'Falta tu nombre (ej: Camila)']);
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

/* ═══ FICHA RÁPIDA ═══ */
/* resalta la sección de talla + tooltip, si aún no se elige */
function nudgeSize() {
  const wrap = $('#qmSizeWrap');
  if (wrap) {
    wrap.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    wrap.classList.remove('nudge');
    void wrap.offsetWidth;
    wrap.classList.add('nudge');
  }
  const tip = $('#qmTtip');
  if (tip) {
    tip.classList.add('show');
    setTimeout(() => tip.classList.remove('show'), 2600);
  }
}

function openQuick(id: number) {
  const c = PRODUCTS.find((p) => p.id === id);
  if (!c) return;
  const T = catById(c.t);
  const multi = c.tl.length > 1;
  let talla = multi ? '' : c.tl[0]; // en multi-talla hay que elegir explícitamente
  const body = $('#qmBody');
  if (!body) return;
  const slug = `${c.id}-${c.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
  body.innerHTML = `<div class="qimg group relative h-[420px] cursor-zoom-in overflow-hidden rounded-2xl" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})">
    <img src="${c.img}" alt="${esc(c.n)} para arriendo en Punta Arenas" class="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[2]">
  </div>
  <span class="mt-3 block text-[.8rem] font-extrabold text-m500">${T.i} ${T.n} · solo adultos · ${pubLabel(c.pub)}</span>
  <h3 class="my-1 text-[1.45rem]">${esc(c.n)}</h3>
  <p class="text-ink2">${esc(c.d)}</p>
  <div class="mt-3 flex flex-wrap items-center gap-2.5 rounded-2xl border-2 border-line bg-[#f9f6ff] p-3">
    <span class="font-ft text-[1.5rem] font-bold leading-none text-m600">Desde $15.000</span>
    <button type="button" class="info-dot tip cursor-help" data-tip="Valor según el disfraz. Cotiza por WhatsApp para conocer el precio exacto." aria-label="Sobre los precios">?</button>
    <span class="text-[.78rem] font-bold text-ink2">arriendo 3 días (retiro, uso y entrega)</span>
  </div>
  <div id="qmSizeWrap" class="relative rounded-2xl">
    <b class="my-3 block">📏 Elige tu talla:</b>
    <div class="tsel" id="qmTallas">${c.tl.map((t) => `<button class="tip ${!multi && t === talla ? 'on' : ''}" data-t="${esc(t)}" data-tip="${esc(TALLA_GUIA[t] ? 'Estatura recomendada: ' + TALLA_GUIA[t] : 'Sin referencia de estatura')}">${esc(t)}</button>`).join('')}</div>
    <span id="qmTtip" class="sizetip" role="status">👆 Selecciona una talla para continuar</span>
  </div>
  <span class="gchip">🛡️ Garantía de $15.000 o $20.000 reintegrable</span>
  <div class="mt-5 flex flex-col gap-2.5">
    <button class="btn btn-mora w-full" id="qmAdd">🛒 Agregar a mi cotización →</button>
    <a class="btn btn-blanco w-full" id="qmWa" target="_blank" rel="noopener" href="${waLink(`¡Hola! Quiero cotizar el arriendo del disfraz ${c.n} para adultos. ¿Está disponible?`)}">💬 Cotizar solo este disfraz por WhatsApp</a>
    <a class="btn btn-ghost w-full" href="/disfraz/${slug}/">📄 Ver ficha completa</a>
    <p class="text-center text-[.76rem] leading-[1.4] text-ink2">
      <b>Agregar</b> lo suma a tu lista para cotizar varios · <b>Cotizar directo</b> es solo por <b>este</b> disfraz, al tiro.
    </p>
  </div>
  <p class="payline mt-3">Al agregarlo queda en tu lista de cotización; lo envías por WhatsApp con tus datos. Pagos: ver <button data-opencond>Condiciones de arriendo</button></p>`;

  $('#qmTallas')?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('[data-t]') as HTMLButtonElement | null;
    if (!b) return;
    talla = b.dataset.t!;
    $$('#qmTallas button').forEach((x) => x.classList.toggle('on', x === b));
    $('#qmTtip')?.classList.remove('show');
    $('#qmSizeWrap')?.classList.remove('nudge');
  });
  $('#qmAdd')?.addEventListener('click', (e) => {
    if (!talla) {
      nudgeSize();
      return;
    }
    addItem(id, 'd', talla, 1, e.target as Element);
    closeModal('quickModal');
  });
  // Si no se eligió talla, no abre WhatsApp: resalta y avisa
  $('#qmWa')?.addEventListener('click', (ev) => {
    if (!talla) {
      ev.preventDefault();
      nudgeSize();
    }
  });
  // Zoom que sigue el cursor: subes el mouse y ves la cabeza/cara; bajas y ves los pies
  encuadrarFotos();
  const qimg = body.querySelector('.qimg') as HTMLElement | null;
  const qimEl = body.querySelector('.qimg img') as HTMLElement | null;
  if (qimg && qimEl) {
    qimg.addEventListener('mousemove', (ev: MouseEvent) => {
      const r = qimg.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
      const y = Math.max(0, Math.min(100, ((ev.clientY - r.top) / r.height) * 100));
      qimEl.style.transformOrigin = `${x}% ${y}%`;
    });
    qimg.addEventListener('mouseleave', () => {
      qimEl.style.transformOrigin = 'center';
    });
  }
  openModal('quickModal');
}

/* clics en la grilla */
$('#grid')?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  // Vista rápida: abre el popup
  const quickBtn = target.closest('[data-quick]') as HTMLElement | null;
  if (quickBtn) {
    e.preventDefault();
    e.stopPropagation();
    openQuick(Number(quickBtn.dataset.quick));
    return;
  }
  // Si se hizo clic en un enlace, dejar que navegue normalmente
  if (target.closest('a')) return;
  const card = target.closest('.pcard') as HTMLElement | null;
  if (!card) return;
  const id = Number(card.dataset.id);
  const act = target.closest('[data-act]') as HTMLElement | null;
  if (act?.dataset.act === 'add') {
    const p = PRODUCTS.find((x) => x.id === id);
    // Si hay más de una talla, abrir la ficha y llevar/resaltar la sección de talla
    if (p && p.tl.length > 1) {
      openQuick(id);
      nudgeSize(); // el modal ya quedó abierto; resalta la talla al instante
      return;
    }
    addItem(id, 'd', p?.tl[0], 1, act);
    return;
  }
  // Clic en la tarjeta (fuera de enlace) → ir a la página individual
  const link = card.querySelector('a') as HTMLAnchorElement | null;
  if (link) window.location.href = link.href;
});
$('#grid')?.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (e.key === 'Enter' && t.classList.contains('pcard')) openQuick(Number(t.dataset.id));
});

/* ═══ SOLICITUD DE ARRIENDO ═══ */
/* Mientras esté en true, la sección de fechas se resalta como "el paso que sigue";
   se apaga apenas el usuario elige el día de retiro. */
let pedirFecha = false;
function openReq() {
  pedirFecha = true;
  renderReq();
  openModal('reqModal');
}
function renderReq() {
  const rb = $('#reqBody');
  if (!rb) return;
  const tot = rentalTotal();
  const gar = guaranteeTotal();
  rb.innerHTML = `<div class="mb-2 flex flex-wrap items-center gap-2"><h3 class="m-0 text-[1.5rem]">🛒 Tu solicitud de arriendo</h3><span class="req-pill green">💬 Se envía por WhatsApp</span></div>
  ${
    state.cart.length
      ? state.cart
          .map((i, k) => {
            const it = byId(i.id)!;
            const tls = isProduct(it) ? it.tl : ['único'];
            const line = isProduct(it) ? 'Desde $15.000' : '';
            const pricePill = isProduct(it)
              ? `<span class="price-pill">Desde $15.000</span> <button type="button" class="info-dot tip" data-tip="Valor según el disfraz. Cotiza por WhatsApp para conocer el precio exacto." aria-label="Sobre los precios">?</button>`
              : '';
            return `<div class="req-card"><span class="re">${'img' in it && it.img ? `<img src="${it.img}" alt="">` : it.e}</span><span class="rn">${esc(it.n)}<br>${pricePill}<br><small class="font-normal text-ink2">${isProduct(it) ? `Talla ${i.talla}` : 'Arriendo por 3 días'}</small></span>
  <select data-rt="${k}" aria-label="Talla de ${esc(it.n)}">${tls.map((x) => `<option ${x === i.talla ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
  <span class="qty inline-flex items-center gap-2"><button data-rq="-" data-k="${k}" aria-label="Quitar una unidad de ${esc(it.n)}">−</button>${i.qty}<button data-rq="+" data-k="${k}" aria-label="Agregar una unidad de ${esc(it.n)}">+</button></span>
  <span class="ml-1 min-w-[70px] text-right font-ft text-[.9rem] font-bold text-m600">${line}</span>
  <button data-rm="${k}" class="border-0 bg-transparent text-[1.1rem] text-[#c33]" aria-label="Eliminar ${esc(it.n)}">🗑</button></div>`;
          })
          .join('')
      : `<div class="py-6 text-center text-ink2"><div class="text-[3rem]">🎭</div>Tu arriendo está esperando magia…</div>`
  }
  <div class="req-sec"><span>📅 Selecciona tus fechas de uso</span><span class="req-pill">Período 3 días</span></div>
  <div class="datebox${pedirFecha ? ' destacar' : ''}">
    <label class="dcell">Retiro en tienda<input type="date" id="rqRet" value="${state.req.retiro}" min="${firstRetiroISO()}" max="${maxISO(60)}" aria-label="Día de retiro en tienda"></label>
    <span class="darrow" aria-hidden="true">→</span>
    <div class="dcell">Devolución (auto)<b id="rqEntTxt">${fmtDate(state.req.entrega)}</b></div>
  </div>
  <input type="date" id="rqEnt" value="${state.req.entrega}" readonly hidden>
  <p class="entnota">↩️ Eliges el retiro y la devolución queda 2 días después. Domingos cerrado: si eliges domingo, pasa al lunes.</p>
  <div class="req-sec"><span>👤 Tus datos</span><span class="req-pill">Para reservar tu disfraz</span></div>
  <input id="rqNom" placeholder="Nombre y apellido *" autocomplete="name" required aria-required="true" aria-label="Nombre y apellido (obligatorio)" value="${esc(state.req.nombre)}" class="mt-1.5 w-full rounded-[10px] border-2 border-line p-2.5">
  <p class="mt-1 text-[.75rem] font-bold text-ink2">* Obligatorio: con tu nombre te confirmamos la reserva por WhatsApp.</p>
  <div class="totbox">
    <div class="trow total"><span>Valor de arriendo por 3 días:</span><b>Desde ${clp(15000 * (state.cart.reduce((a, i) => a + i.qty, 0) || 1))}</b></div>
    <div class="trow"><span class="text-[.75rem] text-ink2">Garantía reembolsable <button type="button" class="info-dot tip" data-tip="${esc(GAR)}" aria-label="Sobre la garantía">i</button>:</span><b class="text-[.75rem] text-ink2">$15.000 o $20.000 por disfraz</b></div>
    <div class="trow total mt-1.5 border-t border-line pt-1.5"><span>Total estimado en sucursal:</span><b class="text-[#0c7a56]">Desde ${clp(30000 * (state.cart.reduce((a, i) => a + i.qty, 0) || 1))}</b></div>
    <p class="mt-1 text-[.7rem] text-ink2">Incluye garantía reembolsable (se devuelve al entregar el disfraz en las mismas condiciones).</p>
  </div>
  <p class="totnote">Es solo una cotización: el valor del arriendo y la garantía se revisan y confirman en la tienda al reservar.</p>
  <button class="btn btn-wsp btn-lg mt-2.5 w-full" id="rqSend">💬 Enviar solicitud por WhatsApp</button>
  <p class="mt-2.5 text-center text-[.8rem] font-bold text-ink2">✓ Garantía 100% reembolsable <span class="mx-1 opacity-40">·</span> 🕐 Lun a Sáb</p>
  <p class="payline text-center">Pagos por depósito o transferencia: ver datos en <button data-opencond>Condiciones de arriendo</button>. Sin pagos en línea en esta demo.</p>`;

  rb.querySelectorAll<HTMLButtonElement>('[data-rq]').forEach((b) =>
    b.addEventListener('click', () => {
      const it = state.cart[Number(b.dataset.k)];
      if (!it) return;
      if (b.dataset.rq === '+') it.qty++;
      else {
        it.qty--;
        if (it.qty < 1) state.cart.splice(Number(b.dataset.k), 1);
      }
      afterCart();
    }),
  );
  rb.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach((b) =>
    b.addEventListener('click', () => {
      state.cart.splice(Number(b.dataset.rm), 1);
      afterCart();
    }),
  );
  rb.querySelectorAll<HTMLSelectElement>('[data-rt]').forEach((s) =>
    s.addEventListener('change', () => {
      const it = state.cart[Number(s.dataset.rt)];
      if (it) it.talla = s.value;
      afterCart();
    }),
  );

  // El mensaje de WhatsApp se arma al enviarlo (waDraft), ya con el nombre y las fechas
  const map: Record<string, string> = { rqRet: 'retiro', rqNom: 'nombre' };
  Object.keys(map).forEach((id) => {
    const el = $<HTMLInputElement>('#' + id);
    el?.addEventListener('input', () => {
      (state.req as Record<string, string>)[map[id]] = el.value;
      if (id === 'rqRet') {
        setRetiro(el.value);
        el.value = state.req.retiro; // refleja la corrección si era domingo
        refreshDateRow(); // actualiza la fecha de devolución
        // Ya eligió el día: el recordatorio verde del bloque de fechas se apaga
        pedirFecha = false;
        $('.datebox.destacar')?.classList.remove('destacar');
      } else if (el.value.trim()) {
        quitarFalta(el); // el nombre ya está: se va el aviso de campo obligatorio
      }
    });
  });
  $('#rqSend')?.addEventListener('click', sendWA);
  // Al tocar cualquier parte del campo (día, mes o año) se abre el calendario
  const ret = $<HTMLInputElement>('#rqRet');
  ret?.addEventListener('click', () => {
    const pick = ret as HTMLInputElement & { showPicker?: () => void };
    try {
      pick.showPicker?.();
    } catch {
      /* si el navegador no lo permite, queda el icono del calendario */
    }
  });
}

/* ═══ MODALES ═══ */
function openModal(id: string) {
  $('#' + id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id: string) {
  $('#' + id)?.classList.remove('open');
  document.body.style.overflow = '';
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
  if (e.key === 'Escape') {
    ['quickModal', 'reqModal', 'condModal'].forEach(closeModal);
  }
});

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

/* huevasco del logo (solo en la portada: en el catálogo el logo es un enlace) */
let logoC = 0;
let logoT: ReturnType<typeof setTimeout>;
$('#logoBtn')?.addEventListener('click', () => {
  if (enCatalogo) return;
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

/* ═══ ZOMBIS DEL PIE: al tocarlos se caen y se desangran ═══
   A los 11 s se vuelven a levantar solos, así se puede repetir. */
$$('[data-zombi]').forEach((z) => {
  let revive: ReturnType<typeof setTimeout>;
  const nombre = z.getAttribute('aria-label') ?? 'Zombi';
  z.addEventListener('click', () => {
    if (z.classList.contains('muerto')) return;
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

/* ── Catálogo completo ──
   Al llegar al final de la lista se carga la tanda siguiente sola, para no
   tener que apretar nada en el teléfono. El botón queda como respaldo (y para
   quien navega con teclado o lector de pantalla). */
if (enCatalogo) {
  const wrap = $('#loadWrap');
  if (wrap) {
    new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) cargarMas();
      },
      { rootMargin: '0px 0px 420px 0px' },
    ).observe(wrap);
  }
}

/* Exponer funciones para paginas individuales */
(window as any).addItemToCart = (id, talla) => addItem(id, 'd', talla, 1);
(window as any).openCartModal = () => openReq();
(window as any).openMiniCart = () => openMini();
