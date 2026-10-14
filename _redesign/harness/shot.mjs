// Capturas de verificación: node shot.mjs <sufijo> [full]
// Produce shots/fase-<sufijo>-desktop.png y -movil.png
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dir, '..', 'shots');
const URL = 'http://localhost:4321/magicatienda/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const suffix = process.argv[2] ?? 'test';
const full = process.argv.includes('full');

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

const d = await b.newPage();
await d.setViewport({ width: 1440, height: 900 });
await d.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2200));
await d.screenshot({ path: path.join(SHOTS, `fase-${suffix}-desktop.png`), fullPage: full });

const m = await b.newPage();
await m.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await m.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2200));
await m.screenshot({ path: path.join(SHOTS, `fase-${suffix}-movil.png`), fullPage: full });

await b.close();
console.log('capturas listas:', `fase-${suffix}-desktop.png`, `fase-${suffix}-movil.png`);
