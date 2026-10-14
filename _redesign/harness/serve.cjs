// Sirve el harness de capturas móviles en el puerto 8099. No forma parte del sitio.
const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  const file = path.join(__dirname, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(500); res.end('error'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
}).listen(8099, () => console.log('harness listo en http://localhost:8099/'));
