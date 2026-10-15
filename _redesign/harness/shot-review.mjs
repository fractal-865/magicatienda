// Captura de revisión del dueño: mini-carrito sin fechas/nota de pago + modal sin campo de entrega.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dir, '..', 'shots');
const URL = 'http://localhost:4321/magicatienda/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
await p.setViewport({ width: 1440, height: 900 });
await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

// agregar dos productos (abre el mini-carrito en el primero)
await p.click('#grid .pcard');
await new Promise((r) => setTimeout(r, 600));
await p.click('#qmTallas button');
await p.click('#qmAdd');
await new Promise((r) => setTimeout(r, 900));
await p.evaluate(() => { document.querySelectorAll('#grid .pcard')[1].click(); });
await new Promise((r) => setTimeout(r, 600));
await p.click('#qmTallas button');
await p.click('#qmAdd');
await new Promise((r) => setTimeout(r, 700));
// el panel se auto-abre con el 1er agregado: solo alternar si sigue cerrado
await p.evaluate(() => {
  const mc = document.querySelector('#miniCart');
  if (!mc?.classList.contains('open')) document.querySelector('#cartBtn').click();
});
await new Promise((r) => setTimeout(r, 600));
const abierto = await p.evaluate(() => document.querySelector('#miniCart')?.classList.contains('open'));
console.log('miniCart abierto para captura:', abierto);

const mini = await p.evaluate(() => ({
  mdates: document.querySelectorAll('#miniCart .mdates-md').length,
  paynote: document.querySelectorAll('#miniCart .paynote').length,
}));
await p.screenshot({ path: path.join(SHOTS, 'review-minicart-sin-fechas.png') });

// modal de solicitud: campo de entrega oculto
await p.evaluate(() => document.querySelector('#miniCart [data-act="req"]')?.click());
await new Promise((r) => setTimeout(r, 800));
const modal = await p.evaluate(() => {
  const ent = document.querySelector('#rqEnt');
  return {
    rqEntDisplay: ent ? getComputedStyle(ent.closest('label')).display : 'no-existe',
    rqRetVisible: document.querySelector('#rqRet')?.getBoundingClientRect().height > 0,
  };
});
await p.screenshot({ path: path.join(SHOTS, 'review-modal-sin-entrega.png') });

await b.close();
console.log('mini:', JSON.stringify(mini), '| modal:', JSON.stringify(modal));
console.log('capturas listas: review-minicart-sin-fechas.png, review-modal-sin-entrega.png');
