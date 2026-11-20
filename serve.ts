// Leonida Trophy Atlas — local preview server.
// Serves the guide's app/ files and its screenshots/ over plain HTTP so the
// guide can be opened in a desktop browser. No build step, no network calls:
// every file comes from the folders beside this file.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8080);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function lookup(requestPath: string): string | null {
  const clean = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const rel = clean === "/" || clean === "" ? "index.html" : clean.replace(/^\//, "");
  const roots = [join(here, "app"), join(here, "screenshots")];
  for (const root of roots) {
    const candidate = join(root, rel);
    if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()) {
      return candidate;
    }
  }
  // The screenshots folder is served at the same root, so a bare filename
  // also resolves there (e.g. /1-checklist.jpg).
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const file = lookup(url.pathname);
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("not found\n");
    return;
  }
  const body = readFileSync(file);
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(body);
});

server.listen(port, () => {
  console.log(`Leonida Trophy Atlas at http://localhost:${port}/`);
});
