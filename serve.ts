// serve.ts — a tiny local preview server for the Leonida Trophy Atlas.
// It serves only the files under app/ that sit beside this file, over plain
// HTTP on a local port, so the guide can be opened in a desktop browser and
// screenshotted. Standard library only; it makes no network calls itself.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, resolve, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = resolve(fileURLToPath(new URL(".", import.meta.url)));
const appRoot = join(here, "app");
const port = Number(process.env.PORT || 8080);

const mimeByExtension: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(response: ServerResponse, status: number, body: string | Buffer, type: string): void {
  response.writeHead(status, { "content-type": type, "content-length": Buffer.byteLength(body) });
  response.end(body);
}

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  try {
    const rawPath = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    const cleaned = normalize(rawPath === "/" ? "/index.html" : rawPath).replace(/^(\.\.[/\\])+/, "");
    const target = join(appRoot, cleaned);
    if (!target.startsWith(appRoot)) {
      send(response, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }
    const info = await stat(target);
    if (!info.isFile()) {
      send(response, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }
    const body = await readFile(target);
    send(response, 200, body, mimeByExtension[extname(target).toLowerCase()] || "application/octet-stream");
  } catch (error) {
    const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
    send(response, missing ? 404 : 500, missing ? "Not found" : "Server error", "text/plain; charset=utf-8");
  }
});

server.listen(port, () => {
  console.log(`Leonida Trophy Atlas preview at http://localhost:${port}/`);
});
