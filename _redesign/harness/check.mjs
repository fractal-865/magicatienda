// Captura de verificación puntual: node check.mjs
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dir, '..', 'shots');
const URL = 'http://localhost:4321/magicatienda/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));
const t = await p.$('#testimonios');
await t.evaluate((el) => el.scrollIntoView());
await new Promise((r) => setTimeout(r, 1200));
await t.screenshot({ path: path.join(SHOTS, 'check-testimonios.png') });
const h1 = await p.evaluate(() => {
  const el = document.querySelector('h1');
  return el ? el.textContent.trim() : null;
});
console.log('H1:', h1);
await b.close();
