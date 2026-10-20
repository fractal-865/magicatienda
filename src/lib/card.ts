/* HTML de una tarjeta de disfraz.
   Es una función pura a propósito: la usan el build (para que el catálogo salga
   en el HTML) y el navegador (para filtrar y paginar). Una sola plantilla =
   una sola tarjeta que mantener. */
import { TALLA_GUIA, catById, clp, disfrazSlug, thumbSrcset, type Product } from '../data/products';
import { PRECIO_DESDE } from '../data/site';
import { esc, hl } from './text';

/* Si una miniatura faltara (por ejemplo, una foto nueva sin regenerar) o la
   red cortara la descarga, se reintenta una vez con la URL limpia y recién
   después se cae a la imagen original, en vez de dejar el hueco roto. */
export const ONERROR_MINI =
  "this.removeAttribute('srcset');if(!this.dataset.r){this.dataset.r='1';this.src=this.dataset.full+'?r=1'}else{this.onerror=null;this.src=this.dataset.full}";

export function cardHTML(c: Product, k: number, q = '') {
  const T = catById(c.t);
  const guia = (t: string) => (TALLA_GUIA[t] ? TALLA_GUIA[t] : 'Sin referencia de estatura');
  const disfrazUrl = `/disfraz/${disfrazSlug(c)}/`;
  return `<article class="pcard relative flex cursor-pointer flex-col rounded-[20px] border-[1.5px] border-line bg-white shadow-[0_8px_20px_rgba(90,42,156,.08)] transition duration-300 hover:-translate-y-[5px] hover:shadow-sh2" data-id="${c.id}" style="--d:${Math.min(k * 0.05, 0.4)}s" tabindex="0" aria-label="${esc(c.n)}, disfraz para adultos en arriendo">
  <div class="pimg relative aspect-[2/3] shrink-0 overflow-hidden" style="background:linear-gradient(135deg,${T.g[0]},${T.g[1]})">
    <a href="${disfrazUrl}" class="absolute inset-0 z-[1]" aria-label="Ver ${esc(c.n)}">
      <img src="${c.img}" srcset="${thumbSrcset(c.img)}" sizes="(max-width: 600px) calc(50vw - 22px), 300px" data-full="${c.img}" onerror="${ONERROR_MINI}" alt="${esc(c.n)} para arriendo en Punta Arenas" loading="lazy" decoding="async" width="400" height="600" class="absolute inset-0 h-full w-full object-contain object-center transition duration-500">
    </a>
    <span class="absolute left-2 top-2 z-[2] rounded-full bg-m600/90 px-2 py-0.5 text-[.75rem] font-extrabold text-white shadow-sh"> #${String(c.id).padStart(3, '0')}</span>
  </div>
  <div class="flex flex-1 flex-col p-3.5 pb-4">
    <span class="block text-[.75rem] font-extrabold uppercase tracking-[.05em] text-m500">${T.i} ${T.n}</span>
    <a href="${disfrazUrl}" class="mb-1 min-h-[2.55rem] text-[1.0625rem] font-semibold leading-[1.25] text-ink hover:text-m600">${hl(c.n, q)}</a>
    <div class="mb-2.5 flex min-h-[1.6rem] flex-wrap gap-1">${c.tl.map((t) => `<span class="tip cursor-help rounded-[7px] bg-[#f0eaff] px-[7px] py-[3px] text-[.75rem] font-extrabold text-m600" data-tip="${esc(guia(t))}" tabindex="0">${esc(t)}</span>`).join('')}</div>
    <div class="mt-auto">
      <div class="pcard-price mb-2.5 flex items-baseline gap-2">
        <span class="pcard-price-line flex items-baseline gap-1.5">
          <small class="text-[.75rem] font-bold uppercase tracking-[.02em] text-ink2">Desde</small>
          <b class="font-ft text-[1.375rem] font-bold leading-none text-m600 tabular-nums">${clp(PRECIO_DESDE)}</b>
          <button type="button" class="info-dot tip cursor-help" data-tip="Valor según el disfraz. Cotiza por WhatsApp para conocer el precio exacto." aria-label="Sobre los precios">?</button>
        </span>
      </div>
      <button class="addbtn inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 bg-[linear-gradient(135deg,var(--color-m600),var(--color-m500))] px-2 py-2.5 font-ft text-[.875rem] font-semibold text-white shadow-[0_4px_12px_rgba(90,42,156,.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(90,42,156,.45)] active:scale-[.9]" data-act="add"><svg class="h-[1.05rem] w-[1.05rem] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path d="M8 13.2h2.2M13.8 13.2H16M8 17.2h2.2M13.8 17.2H16"/></svg>Agendar arriendo</button>
    </div>
  </div>
</article>`;
}
