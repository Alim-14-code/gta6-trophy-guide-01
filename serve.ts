// A tiny static server for app/ (Node 22, standard library only), so the guide can be run locally without a
// build step: `node serve.ts` serves app/ on http://localhost:8080 (`--port <n>` for another port). It sends the MIME
// types a browser needs, refuses any path outside app/, and otherwise does nothing clever: this is a development
// server for trying the guide in a browser, not a production server.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), 'app');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

let port = 8080;
const portFlag = process.argv.indexOf('--port');
if (portFlag !== -1 && process.argv[portFlag + 1]) {
  const n = Number(process.argv[portFlag + 1]);
  if (Number.isInteger(n) && n > 0 && n < 65536) port = n;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = resolve(appDir, '.' + normalize(rel));
  if (!file.startsWith(appDir + '/') && file !== appDir) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, () => {
  console.log('serving app/ at http://localhost:' + port);
});
