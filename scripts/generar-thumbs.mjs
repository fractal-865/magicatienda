/* ─────────────────────────────────────────────────────────────────────────
   Miniaturas responsivas del catálogo (Etapa 1)

   Genera, para cada foto original de public/img/*.avif, dos versiones más
   livianas en public/img/thumbs/<nombre>-<ancho>.avif:

     · 400 px de ancho → tarjeta en celular (≈173 px) y en escritorio 1x
     · 560 px de ancho → tarjeta en pantallas retina (≈450 px)

   Los anchos se eligieron sobre el diseño real de las tarjetas y porque
   ninguna foto original baja de 575 px de ancho: así NINGUNA miniatura se
   amplía (no se inventa calidad que no existe).

   Reglas:
     · No toca, mueve ni renombra los originales: solo los lee.
     · Es idempotente: si la miniatura ya existe, la salta (usar --force
       para regenerar todo desde cero).
     · El alto se calcula solo (se mantienen las proporciones originales).

   Uso:
     npm run thumbs            → genera lo que falte
     npm run thumbs -- --force → regenera todas
   ───────────────────────────────────────────────────────────────────────── */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ANCHOS = [400, 560];
const CALIDAD = 55; // AVIF: diferencia imperceptible al ojo, peso bajo
const ESFUERZO = 4; // 0–9: más alto = más compresión y más lento
const SRC = 'public/img';
const OUT = path.join(SRC, 'thumbs');
const FORCE = process.argv.includes('--force');

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const fotos = fs
  .readdirSync(SRC)
  .filter((f) => f.toLowerCase().endsWith('.avif'))
  .sort((a, b) => a.localeCompare(b, 'es'));

if (!fotos.length) {
  console.error(`No se encontraron AVIF en ${SRC}/`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

let hechas = 0;
let saltadas = 0;
let fallos = 0;
let bytesEntrada = 0;
let bytesSalida = 0;
const porAncho = {};
for (const w of ANCHOS) porAncho[w] = { n: 0, bytes: 0 };

for (const foto of fotos) {
  const base = foto.replace(/\.avif$/i, '');
  const entrada = path.join(SRC, foto);
  const pesoEntrada = fs.statSync(entrada).size;

  for (const ancho of ANCHOS) {
    const salida = path.join(OUT, `${base}-${ancho}.avif`);
    if (!FORCE && fs.existsSync(salida)) {
      saltadas++;
      porAncho[ancho].n++;
      porAncho[ancho].bytes += fs.statSync(salida).size;
      continue;
    }
    try {
      /* withoutEnlargement: si algún día llega una foto más chica que el
         ancho pedido, se genera igual a su tamaño real, sin ampliar. */
      await sharp(entrada)
        .resize({ width: ancho, withoutEnlargement: true })
        .avif({ quality: CALIDAD, effort: ESFUERZO })
        .toFile(salida);
      hechas++;
      const peso = fs.statSync(salida).size;
      bytesSalida += peso;
      bytesEntrada += pesoEntrada;
      porAncho[ancho].n++;
      porAncho[ancho].bytes += peso;
    } catch (err) {
      fallos++;
      console.error(`✗ ${base}-${ancho}.avif:`, err.message);
    }
  }
}

console.log(`Fotos originales: ${fotos.length}`);
console.log(`Miniaturas generadas: ${hechas} · ya existían: ${saltadas} · errores: ${fallos}`);
for (const w of ANCHOS) {
  const d = porAncho[w];
  const prom = d.n ? d.bytes / d.n : 0;
  console.log(`  · ${w} px → ${d.n} archivos · ${(d.bytes / 1048576).toFixed(2)} MB · promedio ${kb(prom)}`);
}
if (hechas) {
  const ahorro = bytesEntrada ? (1 - bytesSalida / bytesEntrada) * 100 : 0;
  console.log(
    `Peso comparado con servir la original: ${(bytesEntrada / 1048576).toFixed(2)} MB → ${(bytesSalida / 1048576).toFixed(2)} MB (−${ahorro.toFixed(0)}%)`,
  );
}
console.log(`Salida: ${OUT.replace(/\\/g, '/')}`);
