// Captura del modal de solicitud estilo WhatsApp (desktop + móvil).
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dir, '..', 'shots');
const URL = 'http://localhost:4321/magicatienda/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

async function capturaModal(page, shopPath) {
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.click('#grid .pcard');
  await new Promise((r) => setTimeout(r, 600));
  await page.evaluate(() => document.querySelector('#qmTallas button').click());
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelector('#qmAdd').click());
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => document.querySelector('#miniCart [data-act="req"]')?.click());
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => {
    const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    set('#rqNom', 'Camila Rojas');
    set('#rqRut', '12.345.678-5');
    set('#rqCor', 'camila@correo.cl');
    set('#rqTel', '+56 9 1234 5678');
  });
  await new Promise((r) => setTimeout(r, 400));
  const panel = await page.$('#reqModal .mpanel');
  if (panel) {
    await panel.screenshot({ path: shopPath });
    // segunda captura con el scroll abajo (totales + CTA)
    await page.evaluate(() => {
      const el = document.querySelector('#reqModal .mpanel');
      if (el) el.scrollTo({ top: el.scrollHeight });
    });
    await new Promise((r) => setTimeout(r, 400));
    await panel.screenshot({ path: shopPath.replace(/\.png$/, '-abajo.png') });
  } else await page.screenshot({ path: shopPath, fullPage: true });
}

const d = await b.newPage();
await d.setViewport({ width: 1440, height: 900 });
d.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
await capturaModal(d, path.join(SHOTS, 'review-modal-whatsapp.png'));

const m = await b.newPage();
await m.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await capturaModal(m, path.join(SHOTS, 'review-modal-whatsapp-movil.png'));

await b.close();
console.log('capturas listas: review-modal-whatsapp.png, review-modal-whatsapp-movil.png');
