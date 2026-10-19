/* ═══════════════════════════════════════════════════════════════
   Genera las miniaturas para compartir (og:image) de cada disfraz.

   WhatsApp y las demás redes no muestran bien el AVIF, así que se crea
   un JPG 1200×630 por disfraz: la foto nítida al centro sobre un fondo
   suave hecho con la misma foto (desenfocada y aclarada). Se guardan en
   public/img/og/<numero>.jpg y la ficha apunta ahí.

   Uso:  node scripts/generar-og.mjs        (todos)
         node scripts/generar-og.mjs 13     (solo el número 13)
   ═══════════════════════════════════════════════════════════════ */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'disfraces.json'), 'utf8'));
const outDir = path.join(root, 'public', 'img', 'og');
fs.mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 630;
const PAD = 16;

const solo = process.argv[2];
let hechos = 0;

for (const r of raw) {
  if (solo && String(r.numero) !== solo) continue;
  const src = path.join(root, 'public', 'img', r.archivo);
  if (!fs.existsSync(src)) {
    console.warn('Falta la foto:', r.archivo);
    continue;
  }

  // 1) Fondo: la misma foto cubriendo todo, desenfocada y aclarada.
  const desenfoque = await sharp(src)
    .resize(W, H, { fit: 'cover' })
    .blur(46)
    .modulate({ brightness: 1.18, saturation: 1.05 })
    .toBuffer();
  const velo = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
       <rect width="${W}" height="${H}" fill="#f7f2ff" fill-opacity="0.66"/>
     </svg>`
  );
  const fondo = await sharp(desenfoque).composite([{ input: velo, left: 0, top: 0 }]).toBuffer();

  // 2) Foto nítida, contenida en el alto.
  const foto = await sharp(src).resize({ height: H - PAD * 2, fit: 'inside' }).toBuffer();
  const m = await sharp(foto).metadata();
  const left = Math.round((W - m.width) / 2);
  const top = Math.round((H - m.height) / 2);

  // 3) Tarjeta blanca con sombra detrás de la foto.
  const tarjeta = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
           <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#4a1b96" flood-opacity="0.30"/>
         </filter>
       </defs>
       <rect x="${left - 14}" y="${top - 14}" width="${m.width + 28}" height="${m.height + 28}"
             rx="24" fill="#ffffff" filter="url(#s)"/>
     </svg>`
  );

  await sharp(fondo)
    .composite([
      { input: tarjeta, left: 0, top: 0 },
      { input: foto, left, top },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(outDir, `${r.numero}.jpg`));
  hechos++;
}

console.log(`Miniaturas generadas: ${hechos} en public/img/og/`);
