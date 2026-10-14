/* ═══════════════════════════════════════════════════════════════
   La Mágica Tienda — interactividad del sitio
   Filtros + buscador + "Tu arriendo" (cotización) + modales
   ═══════════════════════════════════════════════════════════════ */
import { PRODUCTS, CATS, PUBLICOS, OCASIONES, TALLAS, catById, clp, type Product } from '../data/products';
import { CONFIG, GAR_SHORT, waLink, ACC, TOPMSGS, SEARCH_PH } from '../data/site';

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
const byId = (id: string | number): Item | undefined =>
  PRODUCTS.find((p) => p.id === Number(id)) ?? ACC.find((a) => a.id === String(id));
const pubLabel = (id: string) => PUBLICOS.find((p) => p.id === id)?.n ?? id;
const hay = (c: Product) =>
  norm(
    [c.n, c.cats.map((x) => catById(x).n).join(' '), c.pub, c.tl.join(' '), c.oc.join(' ')].join(' '),
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

/* ── estado ── */
const state = {
  q: '',
  tem: new Set<string>(),
  oca: new Set<string>(),
  pub: new Set<string>(),
  tal: new Set<string>(),
  exFecha: '',
  sort: 'pop',
  cart: [] as CartItem[],
  coupon: null as null | { code: string; pct: number; label: string },
  coupons: { MAGIA15: { pct: 15, label: 'Cupón MAGIA15' } },
  req: { nombre: '', rut: '', correo: '', tel: '', dir: '', retiro: '', uso: '', entrega: '', com: '' },
  groupCelebrated: false,
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

/* ═══ TOPBAR / HEADER ═══ */
let tmi = 0;
setInterval(() => {
  const el = $('#topbarMsg');
  if (!el) return;
  el.classList.add('opacity-0', '-translate-y-2');
  setTimeout(() => {
    tmi = (tmi + 1) % TOPMSGS.length;
    el.textContent = TOPMSGS[tmi];
    el.classList.remove('opacity-0', '-translate-y-2');
  }, 400);
}, 4200);

addEventListener(
  'scroll',
  () => $('#header')?.classList.toggle('scrolled', scrollY > 40),
  { passive: true },
);

let phi = 0;
setInterval(() => {
  const i = $<HTMLInputElement>('#hdrSearch');
  if (i && document.activeElement !== i) {
    phi = (phi + 1) % SEARCH_PH.length;
    i.placeholder = SEARCH_PH[phi];
  }
}, 2800);

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

/* confeti del banner cumpleaños */
(() => {
  const c = $('#cbConf');
  if (!c) return;
  const cols = ['#FFD23F', '#fff', '#2EE6D6', '#ffe3f1'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('i');
    s.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 4]};--t:${4 + Math.random() * 4}s;--dl:${Math.random() * 5}s`;
    c.append(s);
  }
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

/* ═══ PICKER ALEATORIO "SORPRÉNDEME" ═══ */
(() => {
  const btn = $('#pickBtn');
  if (!btn) return;
  const card = $('#pickCard');
  const img = $<HTMLImageElement>('#pickImg');
  const name = $('#pickName');
  const meta = $('#pickMeta');
  const price = $('#pickPrice');
  const go = $('#pickGo');
  let cur = 0;
  btn.addEventListener('click', () => {
    let p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    if (PRODUCTS.length > 1 && p.id === cur) p = PRODUCTS[(PRODUCTS.indexOf(p) + 1) % PRODUCTS.length];
    cur = p.id;
    if (img) {
      img.src = p.img;
      img.alt = p.n;
    }
    if (name) name.textContent = p.n;
    if (meta) meta.textContent = `${catById(p.t).n} · Tallas ${p.tl.join(' · ')} · ${pubLabel(p.pub)}`;
    if (price) price.textContent = `${clp(p.price)} arriendo 3 días`;
    if (card) card.hidden = false;
    go?.classList.remove('clicked');
    void go?.offsetWidth;
    go?.classList.add('clicked');
  });
  go?.addEventListener('click', () => cur && openQuick(cur));
})();

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
  return `<div class="my-2.5 flex items-start gap-2 rounded-[14px] border-[1.5px] border-ama bg-[#fdf6d9] p-2.5 text-[.82rem] text-[#6b5200]">🛡️ <span><b>Garantía de $13.000 a $20.000 según el disfraz.</b> Se paga el día del retiro, en efectivo o transferencia, y se devuelve al entregar el disfraz en las mismas condiciones. <button class="glink cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 text-[.82rem] font-extrabold text-m600 underline" data-opencond>Ver condiciones de garantía</button></span></div>`;
}

function cardHTML(c: Product, k: number) {
  const T = catById(c.t);
  const multiSize = c.tl.length > 1;
  return `<article class="pcard relative cursor-pointer rounded-[20px] border-[1.5px] border-line bg-white shadow-[0_8px_20px_rgba(90,42,156,.08)] transition duration-300 hover:-translate-y-[5px] hover:shadow-sh2" data-id="${c.id}" style="--d:${Math.min(k * 0.05, 0.4)}s" tabindex="0" aria-label="${esc(c.n)}, disfraz para adultos en arriendo">
  <div class="relative h-[300px] overflow-hidden" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})">
    <img src="${c.img}" alt="Disfraz ${esc(c.n)}" loading="lazy" class="absolute inset-0 h-full w-full object-cover object-top transition duration-500">
  </div>
  <div class="p-3.5 pb-4">
    <span class="block text-[.72rem] font-extrabold uppercase tracking-[.05em] text-m500">${T.i} ${T.n} · adultos</span>
    <h3 class="mb-0.5 text-[1.02rem] font-semibold text-ink">${hl(c.n, state.q)}</h3>
    <div class="my-2 flex flex-wrap gap-1">${c.tl.map((t) => `<span class="rounded-[7px] bg-[#f0eaff] px-[7px] py-[3px] text-[.64rem] font-extrabold text-m600">${esc(t)}</span>`).join('')}</div>
    <div class="mb-2.5 flex items-baseline justify-between gap-2">
      <span class="font-ft text-[1.3rem] font-bold leading-none text-m600">${clp(c.price)}</span>
      <span class="text-[.68rem] font-bold text-ink2">arriendo 3 días</span>
    </div>
    <button class="addbtn w-full cursor-pointer rounded-xl border-0 bg-[linear-gradient(135deg,var(--color-m600),var(--color-m500))] px-2 py-2.5 font-ft text-[.84rem] font-bold text-white shadow-[0_4px_12px_rgba(90,42,156,.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(90,42,156,.45)] active:scale-[.9]" data-act="add">${multiSize ? '📏 Elegir talla y arrendar' : '🎭 Arrendar disfraz'}</button>
  </div>
</article>`;
}

function renderGrid() {
  const g = $('#grid');
  if (!g) return;
  const L = filtered();
  g.innerHTML = L.length
    ? L.map(cardHTML).join('')
    : `<div class="col-span-full rounded-[20px] border-[1.5px] border-line bg-white p-10 text-center"><div class="text-[3rem]">🔮</div><b class="font-ft">Mmm… no encontramos eso</b><p class="mt-1.5 text-ink2">Prueba con <b>payaso</b>, <b>terror</b> o <b>Halloween</b> ✨</p></div>`;
  const cl = $('#countLabel');
  if (cl) cl.textContent = `Mostrando ${L.length} de ${PRODUCTS.length} disfraces`;
  const rb = $('#resultsBtn');
  if (rb) rb.textContent = `Ver ${L.length} resultados ✨`;
  renderChips();
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
  else if (k === 'exFecha') {
    state.exFecha = '';
    const f = $<HTMLInputElement>('#fxFecha');
    if (f) f.value = '';
  } else if (k && v && ['tem', 'oca', 'pub', 'tal'].includes(k)) state[k as 'tem'].delete(v);
  syncFilterUI();
  renderGrid();
});

/* grupos de filtros (marcado estático) */
$<HTMLElement>('#filterGroups')?.addEventListener('change', (e) => {
  const el = e.target as HTMLInputElement;
  if (el.id === 'fxFecha') state.exFecha = el.value;
  else if (el.dataset.g) {
    const s = state[el.dataset.g as 'tem'];
    el.checked ? s.add(el.value) : s.delete(el.value);
  }
  renderGrid();
});
$<HTMLElement>('#filterGroups')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('.fchip') as HTMLButtonElement | null;
  if (!b) return;
  const s = state[b.dataset.g as 'pub'];
  s.has(b.dataset.v!) ? s.delete(b.dataset.v!) : s.add(b.dataset.v!);
  b.classList.toggle('on');
  renderGrid();
});

function syncFilterUI() {
  $$('#filterGroups [data-g]').forEach((el) => {
    const inp = el as HTMLInputElement;
    if (el.tagName === 'INPUT') inp.checked = state[inp.dataset.g as 'tem'].has(inp.value);
    else el.classList.toggle('on', state[(el as HTMLButtonElement).dataset.g as 'pub'].has((el as HTMLButtonElement).dataset.v!));
  });
  const ff = $<HTMLInputElement>('#fxFecha');
  if (ff) ff.value = state.exFecha;
  ['hdrSearch', 'catSearch', 'mobSearch'].forEach((id) => {
    const i = $<HTMLInputElement>('#' + id);
    if (i && document.activeElement !== i) i.value = state.q;
  });
}

$('#clearFilters')?.addEventListener('click', () => {
  ['tem', 'oca', 'pub', 'tal'].forEach((k) => state[k as 'tem'].clear());
  state.exFecha = '';
  state.q = '';
  syncFilterUI();
  renderGrid();
});

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
    ['hdrSearch', 'catSearch', 'mobSearch'].forEach((o) => {
      const el = $<HTMLInputElement>('#' + o);
      if (el && el !== inp) el.value = state.q;
    });
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
bindSearch('hdrSearch', 'sugHdr');
bindSearch('catSearch', 'sugCat');
bindSearch('mobSearch');

$<HTMLElement>('#chipsPop')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-q]') as HTMLElement | null;
  if (!b) return;
  state.q = b.dataset.q || '';
  syncFilterUI();
  renderGrid();
  scrollToCat();
});

function scrollToCat() {
  $('#catalogo')?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
}
function closeAll() {
  $('#megaMenu')?.classList.remove('open');
  $('#drawer')?.classList.remove('open');
  $('#burger')?.classList.remove('x');
  document.body.style.overflow = '';
}
function applyFilter(o: { q?: string; tem?: string; pub?: string; oca?: string }) {
  (['tem', 'oca', 'pub', 'tal'] as const).forEach((k) => state[k].clear());
  state.exFecha = '';
  state.q = o.q || '';
  if (o.tem) state.tem.add(o.tem);
  if (o.oca) state.oca.add(o.oca);
  if (o.pub) state.pub.add(o.pub);
  syncFilterUI();
  renderGrid();
  scrollToCat();
  closeAll();
}

/* ═══ MEGA MENÚ ═══ */
(() => {
  const btn = $<HTMLButtonElement>('#megaBtn');
  const menu = $('#megaMenu');
  if (!btn || !menu) return;
  let mt: ReturnType<typeof setTimeout>;
  const open = (v: boolean) => {
    menu.classList.toggle('open', v);
    btn.setAttribute('aria-expanded', String(v));
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
  btn.addEventListener('click', () => open(!menu.classList.contains('open')));
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
      $('#promos')?.scrollIntoView({ behavior: 'smooth' });
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
    $('#burger')?.classList.toggle('x', v);
    $('#burger')?.setAttribute('aria-expanded', String(v));
    document.body.style.overflow = v ? 'hidden' : '';
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

/* navegación inferior móvil */
$('#bottomNav')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-nav]') as HTMLElement | null;
  if (!b) return;
  const n = b.dataset.nav;
  if (n === 'top') scrollTo({ top: 0, behavior: 'smooth' });
  else if (n === 'cat') scrollToCat();
  else if (n === 'fecha') $('#fechas')?.scrollIntoView({ behavior: 'smooth' });
  else if (n === 'req') openReq();
  else ($('#burger') as HTMLButtonElement | null)?.click();
});

/* ═══ TU ARRIENDO (CARRITO) ═══ */
const cartQty = () => state.cart.reduce((a, i) => a + i.qty, 0);
const disfQty = () => state.cart.filter((i) => i.tipo === 'd').reduce((a, i) => a + i.qty, 0);

function discountLabels(): string[] {
  const L: string[] = [];
  const dq = disfQty();
  if (dq >= 7) L.push('👥 25% grupal (7+ disfraces)');
  if (state.coupon) L.push(`🎟️ ${state.coupon.code} (${state.coupon.pct}% dto.)`);
  return L;
}
function bestDiscount(): string | null {
  const dq = disfQty();
  if (state.coupon && dq >= 7) return state.coupon.pct >= 25 ? '25% grupal' : `${state.coupon.pct}% ${state.coupon.code}`;
  if (dq >= 7) return '25% grupal';
  if (state.coupon) return `${state.coupon.pct}% ${state.coupon.code}`;
  return null;
}

/* ── Cálculo de precios (arriendo + garantía) ── */
function discountPct(): number {
  const dq = disfQty();
  let pct = 0;
  if (dq >= 7) pct = 25;
  if (state.coupon && state.coupon.pct > pct) pct = state.coupon.pct;
  return pct;
}
function rentalSubtotal(): number {
  return state.cart.reduce((a, i) => {
    const it = byId(i.id);
    return a + (it && isProduct(it) ? it.price * i.qty : 0);
  }, 0);
}
function rentalTotal(): number {
  return Math.round(rentalSubtotal() * (1 - discountPct() / 100));
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
  state.req.retiro = v;
  state.req.uso = addDays(v, 1);
  state.req.entrega = addDays(v, 2);
}
/* refresca la fila de fechas legibles ("lunes 19 de octubre") */
function refreshDateRow() {
  const row = $('.daterow');
  if (!row) return;
  row.innerHTML = `<span>📦 Retiro: <b>${fmtDate(state.req.retiro)}</b></span><span>↩️ Entrega: <b>${fmtDate(state.req.entrega)}</b></span>`;
}

/* ── bloque de totales (arriendo + garantía), compartido ── */
function totalsHTML(): string {
  const sub = rentalSubtotal();
  const pct = discountPct();
  const tot = rentalTotal();
  const gar = guaranteeTotal();
  const dto = sub - tot;
  const pagoDia = tot + gar;
  return `<div class="mt-3 rounded-2xl border-2 border-line bg-[#f9f6ff] p-3 text-[.85rem]">
    <div class="flex justify-between"><span>Arriendo 3 días</span><b>${clp(sub)}</b></div>
    ${pct ? `<div class="flex justify-between text-[#0c7a56]"><span>✨ Descuento ${pct}%</span><b>−${clp(dto)}</b></div>` : ''}
    <div class="mt-1 flex justify-between border-t border-line pt-1 font-ft text-[1rem] text-m600"><span>Total arriendo</span><b>${clp(tot)}</b></div>
    <div class="mt-1.5 flex justify-between border-t border-dashed border-line pt-1.5 text-[.8rem] text-ink2"><span>🛡️ Garantía (se devuelve)</span><b>${clp(gar)}</b></div>
    <div class="mt-2 rounded-xl border-[1.5px] border-ama bg-[#fdf6d9] p-2.5 text-[.82rem] text-[#6b5200]">
      💳 <b>El día del retiro pagarás ≈ ${clp(pagoDia)}</b><br>
      <span class="opacity-90">Arriendo ${clp(tot)} + garantía aprox. ${clp(gar)} (la garantía se te devuelve al entregar el disfraz en las mismas condiciones).</span>
    </div>
  </div>`;
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
  afterCart(srcEl);
  toast(`${item.e} <b>${esc(item.n)}</b> agregado a tu arriendo (talla ${talla})`);
}

function afterCart(srcEl?: Element | null) {
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
  if (disfQty() >= 7 && !state.groupCelebrated) {
    state.groupCelebrated = true;
    Confetti.rain(140);
    toast('🎉 ¡Descuento grupal 25% desbloqueado en tu cotización!');
  }
  if (disfQty() < 7) state.groupCelebrated = false;
  renderMini();
  renderSticky();
  if ($('#reqModal')?.classList.contains('open')) renderReq();
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
  const dl = discountLabels();
  mc.innerHTML =
    head +
    `<div class="cart-body">` +
    state.cart
      .map((i) => {
        const it = byId(i.id)!;
        return `<div class="mc-item">${thumb(it)}<span class="mn">${esc(it.n)}<br><small>Talla ${i.talla}</small></span><span class="qty inline-flex items-center gap-2"><button data-mc="-" data-id="${i.id}" data-t="${esc(i.talla)}" aria-label="Menos">−</button>${i.qty}<button data-mc="+" data-id="${i.id}" data-t="${esc(i.talla)}" aria-label="Más">+</button></span></div>`;
      })
      .join('') +
    totalsHTML() +
    `<div class="mdates"><label>Día de retiro<input type="date" id="mcRet" value="${state.req.retiro}"></label><label>Día de entrega (auto)<input type="date" id="mcEnt" value="${state.req.entrega}" readonly class="bg-[#f4f1fb] text-ink2"></label></div>
    <div class="daterow"><span>📦 Retiro: <b>${fmtDate(state.req.retiro)}</b></span><span>↩️ Entrega: <b>${fmtDate(state.req.entrega)}</b></span></div>` +
    (dl.length ? `<div class="infoline">✨ Descuentos aplicables: ${dl.join(' · ')}. Se aplica el mayor.</div>` : '') +
    (disfQty() < 7 && disfQty() > 0 ? `<div class="infoline">🎈 Agrega ${7 - disfQty()} disfraces más y desbloquea 25% grupal.</div>` : '') +
    `</div>` +
    `<div class="cart-foot">
      <button class="btn btn-wsp w-full" data-act="req">Continuar con mi cotización 💬</button>
      <button class="btn btn-ghost w-full" data-act="gocat">← Seguir comprando</button>
      <p class="payline text-center">Pagos por depósito o transferencia: ver <button data-opencond>Condiciones de arriendo</button>.</p>
    </div>`;

  const mret = $<HTMLInputElement>('#mcRet');
  mret?.addEventListener('change', (e) => {
    setRetiro((e.target as HTMLInputElement).value);
    const ent = $<HTMLInputElement>('#mcEnt');
    if (ent) ent.value = state.req.entrega;
    refreshDateRow();
  });
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
  $('#miniCart')?.classList.add('open');
  $('#cartBackdrop')?.classList.add('open');
  document.body.classList.add('drawer-lock');
}
function closeMini() {
  $('#miniCart')?.classList.remove('open');
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

function applyCoupon(code?: string, inp?: HTMLInputElement | null) {
  const c = (code || '').trim().toUpperCase();
  const found = state.coupons[c as 'MAGIA15'];
  if (found) {
    state.coupon = { code: c, ...found };
    if (inp) {
      inp.classList.add('okk');
      inp.classList.remove('shake');
    }
    toast(`🎟️ Cupón ${code} aplicado a tu cotización.`);
    afterCart();
  } else {
    inp?.classList.add('shake');
    setTimeout(() => inp?.classList.remove('shake'), 450);
    toast('😅 Ese código no es válido. Prueba con MAGIA15 🎟️');
  }
}

function waMsg() {
  const L = ['¡Hola! 🎭 Quiero cotizar el arriendo de disfraces en La Mágica Tienda ✨'];
  const r = state.req;
  if (r.nombre) L.push(`👤 Nombre: ${r.nombre}`);
  if (r.rut) L.push(`🪪 RUT: ${r.rut}`);
  if (r.correo) L.push(`✉️ Correo: ${r.correo}`);
  if (r.tel) L.push(`📱 Teléfono: ${r.tel}`);
  if (r.dir) L.push(`🏠 Dirección: ${r.dir}`);
  if (r.retiro || r.uso || r.entrega)
    L.push(`📅 Fechas: retiro ${r.retiro || '—'} · uso ${r.uso || '—'} · entrega ${r.entrega || '—'}`);
  L.push('🧾 Disfraces que quiero arrendar:');
  state.cart.forEach((i) => {
    const it = byId(i.id);
    if (it) L.push(`• ${i.qty}× ${it.n} (talla ${i.talla})`);
  });
  const bd = bestDiscount();
  if (bd) L.push(`✨ Descuento aplicable: ${bd} sobre el valor de arriendo`);
  L.push(`💰 Arriendo 3 días: ${clp(rentalSubtotal())}${bd ? ` → total ${clp(rentalTotal())} (${bd})` : ''}`);
  L.push(`🛡️ Garantía total: ${clp(guaranteeTotal())} (${GAR_SHORT} por disfraz), se paga el día del retiro y se devuelve al entregar.`);
  L.push('💳 Reserva: valor de arriendo de cada disfraz (se confirma en la cotización).');
  if (r.com) L.push('💬 ' + r.com);
  return L.join('\n');
}
function sendWA() {
  if (!state.cart.length) {
    toast('🛒 Tu arriendo está vacío. ¡Agrega un disfraz primero!');
    return;
  }
  window.open(waLink(waMsg()), '_blank');
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
  body.innerHTML = `<div class="qimg group relative h-[340px] cursor-zoom-in overflow-hidden rounded-2xl" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})">
    <img src="${c.img}" alt="Disfraz ${esc(c.n)}" class="absolute inset-0 h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.7]">
  </div>
  <span class="mt-3 block text-[.8rem] font-extrabold text-m500">${T.i} ${T.n} · solo adultos · ${pubLabel(c.pub)}</span>
  <h3 class="my-1 text-[1.45rem]">${esc(c.n)}</h3>
  <p class="text-[#555]">${esc(c.d)}</p>
  <div class="mt-3 flex flex-wrap items-center gap-2.5 rounded-2xl border-2 border-line bg-[#f9f6ff] p-3">
    <span class="font-ft text-[1.5rem] font-bold leading-none text-m600">${clp(c.price)}</span>
    <span class="text-[.78rem] font-bold text-ink2">arriendo 3 días (retiro, uso y entrega)</span>
  </div>
  <div id="qmSizeWrap" class="relative rounded-2xl">
    <b class="my-3 block">📏 Elige tu talla:</b>
    <div class="tsel" id="qmTallas">${c.tl.map((t) => `<button class="${!multi && t === talla ? 'on' : ''}" data-t="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <span id="qmTtip" class="sizetip" role="status">👆 Selecciona una talla para continuar</span>
  </div>
  <div class="mt-4 flex items-start gap-2 rounded-2xl border-[1.5px] border-ama bg-[#fdf6d9] p-3 text-[.82rem] text-[#6b5200]">🛡️ <span>Garantía de <b>${clp(c.gar)}</b>, se paga el día del retiro y <b>se te devuelve</b> al entregar el disfraz en las mismas condiciones.</span></div>
  <div class="mt-5 flex flex-col gap-2.5">
    <button class="btn btn-mora w-full" id="qmAdd">🛒 Agregar a mi cotización →</button>
    <a class="btn btn-wsp w-full" id="qmWa" target="_blank" rel="noopener" href="${waLink(`¡Hola! Quiero cotizar el arriendo del disfraz ${c.n} para adultos 🎭 ¿Está disponible?`)}">💬 Cotizar directo por WhatsApp</a>
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
  openModal('quickModal');
}

/* clics en la grilla */
$('#grid')?.addEventListener('click', (e) => {
  const card = (e.target as HTMLElement).closest('.pcard') as HTMLElement | null;
  if (!card) return;
  const id = Number(card.dataset.id);
  const act = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
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
  openQuick(id);
});
$('#grid')?.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement;
  if (e.key === 'Enter' && t.classList.contains('pcard')) openQuick(Number(t.dataset.id));
});

/* ═══ SOLICITUD DE ARRIENDO ═══ */
function openReq() {
  renderReq();
  openModal('reqModal');
}
function renderReq() {
  const rb = $('#reqBody');
  if (!rb) return;
  const dl = discountLabels();
  rb.innerHTML = `<h3 class="mb-1 text-[1.5rem]">🛒 Tu solicitud de arriendo</h3>
  <p class="text-[.9rem] text-[#666]">Completa tus datos, elige las fechas y envíala por WhatsApp. Te respondemos con la cotización (valor de arriendo y garantía de cada disfraz). 💜</p>
  ${
    state.cart.length
      ? state.cart
          .map((i, k) => {
            const it = byId(i.id)!;
            const tls = isProduct(it) ? it.tl : ['único'];
            const line = isProduct(it) ? clp(it.price * i.qty) : '';
            return `<div class="req-row"><span class="re">${'img' in it && it.img ? `<img src="${it.img}" alt="">` : it.e}</span><span class="rn">${esc(it.n)}<br><small class="font-normal text-[#888]">${isProduct(it) ? `Talla ${i.talla} · ${clp(it.price)}` : 'Arriendo por 3 días'}</small></span>
  <select data-rt="${k}" aria-label="Talla">${tls.map((x) => `<option ${x === i.talla ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
  <span class="qty inline-flex items-center gap-2"><button data-rq="-" data-k="${k}">−</button>${i.qty}<button data-rq="+" data-k="${k}">+</button></span>
  <span class="ml-1 min-w-[70px] text-right font-ft text-[.9rem] font-bold text-m600">${line}</span>
  <button data-rm="${k}" class="border-0 bg-transparent text-[1.1rem] text-[#c33]" aria-label="Eliminar">🗑</button></div>`;
          })
          .join('')
      : `<div class="py-6 text-center text-[#777]"><div class="text-[3rem]">🎭</div>Tu arriendo está esperando magia…</div>`
  }
  <div class="mdates">
    <label>Día de retiro<input type="date" id="rqRet" value="${state.req.retiro}"></label>
    <label>Día de entrega (auto)<input type="date" id="rqEnt" value="${state.req.entrega}" readonly class="bg-[#f4f1fb] text-ink2"></label>
  </div>
  <div class="daterow">
    <span>📦 Retiro: <b>${fmtDate(state.req.retiro)}</b></span>
    <span>↩️ Entrega: <b>${fmtDate(state.req.entrega)}</b></span>
  </div>
  <div class="mt-1.5 grid gap-2.5 min-[600px]:grid-cols-2">
    <input id="rqNom" placeholder="Nombre" value="${esc(state.req.nombre)}" class="rounded-[10px] border-2 border-line p-2.5">
    <input id="rqRut" placeholder="RUT" value="${esc(state.req.rut)}" class="rounded-[10px] border-2 border-line p-2.5">
    <input id="rqCor" placeholder="Correo" value="${esc(state.req.correo)}" class="rounded-[10px] border-2 border-line p-2.5">
    <input id="rqTel" placeholder="Teléfono" value="${esc(state.req.tel)}" class="rounded-[10px] border-2 border-line p-2.5">
  </div>
  <input id="rqDir" placeholder="Dirección" value="${esc(state.req.dir)}" class="mt-2.5 w-full rounded-[10px] border-2 border-line p-2.5">
  <textarea id="rqCom" rows="2" placeholder="Comentarios (evento, dudas de talla, etc.)" class="mt-2.5 w-full rounded-[10px] border-2 border-line p-2.5">${esc(state.req.com)}</textarea>
  <div class="cpnbox"><input id="cpnIn" placeholder="¿Tienes un cupón? (ej: MAGIA15)" value="${state.coupon?.code || ''}" aria-label="Código de cupón"><button class="btn btn-mora btn-sm" id="cpnApply">Aplicar</button></div>
  ${totalsHTML()}
  <div class="infoline">🧾 <b>Resumen:</b> ${cartQty()} prenda(s). La reserva corresponde al valor de arriendo; la garantía (${GAR_SHORT} por disfraz) se paga el día del retiro y se devuelve al entregar.</div>
  <button class="btn btn-wsp btn-lg mt-3 w-full" id="rqSend">Enviar solicitud de arriendo 💬</button>
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

  const map: Record<string, string> = {
    rqRet: 'retiro', rqNom: 'nombre', rqRut: 'rut',
    rqCor: 'correo', rqTel: 'tel', rqDir: 'dir', rqCom: 'com',
  };
  Object.keys(map).forEach((id) => {
    const el = $<HTMLInputElement>('#' + id);
    el?.addEventListener('input', () => {
      (state.req as Record<string, string>)[map[id]] = el.value;
      if (id === 'rqRet') {
        setRetiro(el.value);
        const ent = $<HTMLInputElement>('#rqEnt');
        if (ent) ent.value = state.req.entrega;
        refreshDateRow();
      }
    });
  });
  $('#cpnApply')?.addEventListener('click', () => applyCoupon($<HTMLInputElement>('#cpnIn')?.value, $<HTMLInputElement>('#cpnIn')));
  $('#rqSend')?.addEventListener('click', sendWA);
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
    $('#filterPanel')?.classList.remove('open');
    $('#fback')?.classList.remove('on');
  }
});

/* panel de filtros (móvil) */
$('#filterOpen')?.addEventListener('click', () => {
  $('#filterPanel')?.classList.add('open');
  $('#fback')?.classList.add('on');
});
$('#fback')?.addEventListener('click', () => {
  $('#filterPanel')?.classList.remove('open');
  $('#fback')?.classList.remove('on');
});
$('#resultsBtn')?.addEventListener('click', () => {
  $('#filterPanel')?.classList.remove('open');
  $('#fback')?.classList.remove('on');
});

/* ═══ CUPÓN ═══ */
$('#couponBtn')?.addEventListener('click', (e) => {
  const btn = e.currentTarget as HTMLElement;
  const code = 'MAGIA15';
  const done = () => {
    const t = $('#cpnTxt');
    if (t)
      t.innerHTML =
        '¡Copiado! <b>MAGIA15</b> <svg class="ck" viewBox="0 0 20 20"><path d="M4 10l4 4 8-9"/></svg>';
    btn.classList.add('ok', 'bounce');
    state.coupon = { code, pct: 15, label: 'Cupón MAGIA15' };
    renderMini();
    renderSticky();
    if ($('#reqModal')?.classList.contains('open')) renderReq();
    if (!reduced()) Confetti.at(btn);
    toast('🎟️ Cupón MAGIA15 copiado y aplicado a tu cotización 🎉');
    if (navigator.vibrate && !reduced()) try { navigator.vibrate(40); } catch { /* noop */ }
    setTimeout(() => {
      const t2 = $('#cpnTxt');
      if (t2) t2.textContent = 'Cupón 15% dto.';
      $('#cpnIco')?.replaceChildren(document.createTextNode('🎟️'));
      btn.classList.remove('ok', 'bounce');
    }, 3000);
  };
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* noop */
    }
    ta.remove();
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(code).then(done).catch(() => { fallback(); done(); });
  else {
    fallback();
    done();
  }
});

/* ═══ FECHAS ═══ */
$('#fechasRow')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('[data-tem]') as HTMLElement | null;
  if (b) applyFilter({ tem: b.dataset.tem });
});

/* huevasco del logo */
let logoC = 0;
let logoT: ReturnType<typeof setTimeout>;
$('#logoBtn')?.addEventListener('click', () => {
  logoC++;
  clearTimeout(logoT);
  logoT = setTimeout(() => (logoC = 0), 1500);
  if (logoC >= 5) {
    logoC = 0;
    Confetti.rain(160);
    toast('🔮 ¡Encontraste la magia secreta! #lamagicatienda 💜');
  }
});

/* ═══ TESTIMONIOS ═══ */
(() => {
  const track = $('#testiTrack');
  const dots = $('#testiDots');
  if (!track || !dots) return;
  const n = track.children.length;
  let i = 0;
  const go = (k: number) => {
    i = (k + n) % n;
    track.style.transform = `translateX(-${i * 100}%)`;
    [...dots.children].forEach((d, x) => ((d as HTMLElement).style.background = x === i ? '#FF5FA2' : '#d9c9f7'));
  };
  for (let k = 0; k < n; k++) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Testimonio ' + (k + 1));
    b.style.cssText = 'width:10px;height:10px;border-radius:50%;border:0;background:#d9c9f7;cursor:pointer';
    b.onclick = () => go(k);
    dots.append(b);
  }
  $('#testiPrev')?.addEventListener('click', () => go(i - 1));
  $('#testiNext')?.addEventListener('click', () => go(i + 1));
  go(0);
  if (!reduced()) setInterval(() => go(i + 1), 6500);
})();

/* ═══ GALERÍA ═══ */
$('#instaGrid')?.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest('.hbtn') as HTMLButtonElement | null;
  if (!b) return;
  e.stopPropagation();
  const liked = b.classList.toggle('liked');
  const s = b.querySelector('span');
  if (s) s.textContent = String(Number(s.textContent) + (liked ? 1 : -1));
  if (liked) Confetti.at(b);
});

/* ═══ MAPA · HORARIO ═══ */
(() => {
  const badge = $('#openBadge');
  if (!badge) return;
  const st = () => {
    const n = new Date();
    const d = n.getDay();
    const h = CONFIG.horario[d];
    const mins = n.getHours() * 60 + n.getMinutes();
    const to = (t: string) => {
      const [a, b] = t.split(':');
      return Number(a) * 60 + Number(b);
    };
    const open = (extra: string) => {
      badge.classList.add('open');
      badge.classList.remove('closed');
      badge.innerHTML = `<span class="dot"></span> ${extra}`;
    };
    const closed = (extra: string) => {
      badge.classList.add('closed');
      badge.classList.remove('open');
      badge.innerHTML = `<span class="dot"></span> ${extra}`;
    };
    if (!h) return closed('Cerrado · abre el lunes 10:00');
    const [o, c] = [to(h[0]), to(h[1])];
    if (mins >= o && mins < c) open('Abierto ahora · hasta ' + h[1]);
    else if (mins < o) open('Abre hoy a las ' + h[0]);
    else closed('Cerrado · vuelve mañana');
  }
  st();
  setInterval(st, 60000);
})();

/* ═══ CONTACTO / FAQ / NEWSLETTER ═══ */
$('#cForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = (id: string) => ($<HTMLInputElement>('#' + id)?.value ?? '');
  const m = `¡Hola! Soy ${v('cfNombre')} 🙋\n📱 ${v('cfCel')}\n📅 Evento: ${v('cfFecha') || 'por definir'}\n💬 ${v('cfMsg')}`;
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

$('#nlForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  Confetti.rain(120);
  const ok = $('#nlOk');
  if (ok) ok.classList.remove('hidden');
  const f = $('#nlForm');
  if (f) f.style.display = 'none';
});

/* ═══ FLOTANTES DE CONTACTO ═══ */
(() => {
  const dial = $('#speedDial');
  const tg = $<HTMLButtonElement>('#speedToggle');
  const setDial = (v: boolean) => {
    dial?.classList.toggle('open', v);
    tg?.setAttribute('aria-expanded', String(v));
    if (tg) tg.textContent = v ? '✕' : '＋';
  };
  tg?.addEventListener('click', () => setDial(!dial?.classList.contains('open')));

  const chat = $('#wspChat');
  $('#wspFloat')?.addEventListener('click', () => chat?.classList.toggle('open'));
  $('#waChatClose')?.addEventListener('click', () => chat?.classList.remove('open'));
  $('#bubbleX')?.addEventListener('click', () => $('#wspBubble')?.classList.remove('show'));
})();

$('#halloCTA')?.addEventListener('click', () => applyFilter({ tem: 'halloween' }));

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

/* ═══ ARRANQUE ═══ */
renderGrid();
renderMini();
renderSticky();
