// Test del flujo de solicitud: validación y modal.
import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://localhost:4321/magicatienda/', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 1500));

// abrir ficha rápida del primer producto
await p.click('#grid .pcard');
await new Promise((r) => setTimeout(r, 700));
// elegir talla y agregar
await p.click('#qmTallas button');
await p.click('#qmAdd');
await new Promise((r) => setTimeout(r, 900));
const drawerOpen1 = await p.evaluate(() => document.querySelector('#miniCart')?.classList.contains('open'));
console.log('drawer auto-open 1er agregado:', drawerOpen1);

// agregar un segundo producto (NO debe auto-abrir el drawer)
await p.evaluate(() => { document.querySelector('#miniCart .cart-close')?.click(); });
await new Promise((r) => setTimeout(r, 500));
await p.evaluate(() => document.querySelectorAll('#grid .pcard')[1].click());
await new Promise((r) => setTimeout(r, 700));
await p.click('#qmTallas button');
await p.click('#qmAdd');
await new Promise((r) => setTimeout(r, 900));
const drawerOpen2 = await p.evaluate(() => document.querySelector('#miniCart')?.classList.contains('open'));
console.log('drawer auto-open 2o agregado (esperado false):', drawerOpen2);

// abrir modal de solicitud
await p.evaluate(() => document.querySelector('#cartBtn').click());
await new Promise((r) => setTimeout(r, 500));
await p.evaluate(() => document.querySelector('#miniCart [data-act="req"]')?.click());
await new Promise((r) => setTimeout(r, 700));
const reqOpen = await p.evaluate(() => document.querySelector('#reqModal')?.classList.contains('open'));
console.log('reqModal abierto:', reqOpen);
const trust = await p.evaluate(() => document.querySelector('#reqBody')?.textContent.includes('no se paga nada en línea'));
const noRefund = await p.evaluate(() => document.querySelector('#reqBody')?.textContent.includes('no es reembolsable'));
console.log('encabezado confianza:', trust, '| reserva visible:', noRefund);

// enviar con datos vacíos -> errores
await p.click('#rqSend');
await new Promise((r) => setTimeout(r, 500));
const errCount = await p.evaluate(() => document.querySelectorAll('.req-err').length);
console.log('errores mostrados (esperado 4):', errCount);

// datos válidos -> sin errores
await p.evaluate(() => {
  const set = (id, v) => { const el = document.querySelector(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
  set('#rqNom', 'Camila Rojas');
  set('#rqRut', '12.345.678-5');
  set('#rqCor', 'camila@correo.cl');
  set('#rqTel', '+56 9 1234 5678');
});
await p.click('#rqSend');
await new Promise((r) => setTimeout(r, 500));
const errCount2 = await p.evaluate(() => document.querySelectorAll('.req-err').length);
console.log('errores tras datos válidos (esperado 0):', errCount2);

await b.close();
console.log('OK');
