/* Leonida Trophy Atlas — static file server for local use.
   Serves app/ (resolved from this file's own location) over HTTP.
   Default port 8080; override with PORT or a command-line argument. */
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "app");
const port = Number(process.argv[2] || process.env.PORT || 8080);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const rawPath = decodeURIComponent((req.url || "/").split("?")[0].split("#")[0]);
  const rel = normalize(rawPath === "/" ? "index.html" : rawPath.replace(/^\//, ""));
  const file = join(appDir, rel);
  if (!file.startsWith(appDir) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found\n");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

server.listen(port, () => {
  console.log(`Leonida Trophy Atlas at http://localhost:${port}/`);
});
