/* Utilidades de texto que usan tanto el HTML generado en el build como el que
   arma el navegador. Viven aquí para que ambos produzcan lo mismo. */

export const norm = (s: string) =>
  String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* Resalta lo buscado dentro de un nombre, sin romper etiquetas ni acentos. */
export function hl(name: string, q: string) {
  if (!q) return esc(name);
  const i = norm(name).indexOf(norm(q));
  if (i < 0) return esc(name);
  return (
    esc(name.slice(0, i)) +
    '<mark>' +
    esc(name.slice(i, i + q.length)) +
    '</mark>' +
    esc(name.slice(i + q.length))
  );
}
