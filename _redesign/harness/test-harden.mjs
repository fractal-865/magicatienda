// Test harden: inert de superficies ocultas + domingo en retiro.
import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://localhost:4321/magicatienda/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1200));

// inert inicial
const inertInit = await p.evaluate(() => ({
  drawer: document.querySelector('#drawer')?.hasAttribute('inert'),
  mini: document.querySelector('#miniCart')?.hasAttribute('inert'),
}));
console.log('inert inicial (esperado true/true):', JSON.stringify(inertInit));

// abrir carrito -> miniCart sin inert; cerrar -> vuelve
await p.click('#cartBtn');
await new Promise((r) => setTimeout(r, 400));
const open = await p.evaluate(() => document.querySelector('#miniCart')?.hasAttribute('inert'));
await p.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));
const closed = await p.evaluate(() => document.querySelector('#miniCart')?.hasAttribute('inert'));
console.log('miniCart inert abierto (esperado false):', open, '| tras Escape (esperado true):', closed);

// domingo: si hoy es domingo, firstRetiroISO debe ser lunes; si no, hoy
const dom = await p.evaluate(() => {
  const d = new Date();
  const t = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const inp = document.querySelector('#grid') ? null : null;
  return { hoy: t, dia: d.getDay() };
});
console.log('hoy:', dom.hoy, 'día(semana):', dom.dia, '(0=domingo)');

// domingo directo en setRetiro (vía cambio en el input del minicart)
await p.click('#grid .pcard');
await new Promise((r) => setTimeout(r, 600));
await p.click('#qmTallas button');
await p.click('#qmAdd');
await new Promise((r) => setTimeout(r, 800));
// buscar próximo domingo
const nextSun = await p.evaluate(() => {
  const d = new Date();
  do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
});
const after = await p.evaluate((sun) => {
  const el = document.querySelector('#mcRet');
  el.value = sun;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return new Promise((res) => setTimeout(() => res(document.querySelector('#mcRet').value), 300));
}, nextSun);
const afterDay = new Date(after + 'T12:00:00').getDay();
console.log('domingo pedido:', nextSun, '→ retiro resultante:', after, '(día', afterDay, 'esperado 1=lunes)');

await b.close();
console.log('OK');
