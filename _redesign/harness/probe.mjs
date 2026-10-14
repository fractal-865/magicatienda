// Sonda de diagnóstico + capturas con puppeteer-core (no forma parte del sitio).
// Uso: node probe.mjs [acciones] — toma capturas y mide overflow en móvil/escritorio.
import puppeteer from 'puppeteer-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.join(__dir, '..', 'shots');
const URL = 'http://localhost:4321/magicatienda/';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });

async function overflowReport(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') return;
        bad.push({
          sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : ''),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    });
    return { vw, scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, bad: bad.slice(0, 25) };
  });
}

// --- Móvil 375x812 ---
const m = await browser.newPage();
await m.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await m.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
console.log('MOVIL 375:', JSON.stringify(await overflowReport(m), null, 1));
await m.screenshot({ path: path.join(SHOTS, 'probe-movil-top.png') });
await m.screenshot({ path: path.join(SHOTS, 'probe-movil-full.png'), fullPage: true });

// --- Móvil 320 ---
await m.setViewport({ width: 320, height: 700, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await new Promise((r) => setTimeout(r, 800));
console.log('MOVIL 320:', JSON.stringify(await overflowReport(m), null, 1));

// --- Escritorio 1440 ---
const d = await browser.newPage();
await d.setViewport({ width: 1440, height: 900 });
await d.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
console.log('DESKTOP 1440:', JSON.stringify(await overflowReport(d), null, 1));
await d.screenshot({ path: path.join(SHOTS, 'probe-desktop-top.png') });
await d.screenshot({ path: path.join(SHOTS, 'probe-desktop-full.png'), fullPage: true });

await browser.close();
console.log('OK');
