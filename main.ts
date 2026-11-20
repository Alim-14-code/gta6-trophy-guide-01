// Leonida Trophy Atlas — entrypoint.
// Copies the guide (app/) and its screenshots (screenshots/) into the output
// directory, then asks the vendored dossier builder to write dossier.json there.
// Paths are worked out from this file's own location, never from the working
// directory, so the build is the same no matter where it is run from.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

function mirrorFolder(source: string, target: string): void {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function main(): void {
  const appSource = join(here, "app");
  const shotsSource = join(here, "screenshots");
  if (!existsSync(appSource)) throw new Error("app/ is missing next to main.ts");
  if (!existsSync(shotsSource)) throw new Error("screenshots/ is missing next to main.ts");
  mkdirSync(outDir, { recursive: true });
  mirrorFolder(appSource, join(outDir, "app"));
  mirrorFolder(shotsSource, join(outDir, "screenshots"));
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  });
}

main();
