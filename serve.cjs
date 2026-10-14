/* Servidor estático mínimo (solo para ver local / panel de revisión) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  // El sitio se construye con base '/magicatienda' (GitHub Pages); quitar ese prefijo
  // para poder previsualizar dist/ también en la raíz.
  const BASE = '/magicatienda';
  if (p === BASE) p = '/';
  else if (p.startsWith(BASE + '/')) p = p.slice(BASE.length);
  if (p.endsWith('/')) p += 'index.html';
  let f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  fs.stat(f, (err, st) => {
    if (err || st.isDirectory()) { f = path.join(ROOT, 'index.html'); }
    fs.readFile(f, (e2, data) => {
      if (e2) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(data);
    });
  });
}).listen(PORT, '0.0.0.0', () => console.log('Estático en http://localhost:' + PORT + '/ sirviendo ' + ROOT));
