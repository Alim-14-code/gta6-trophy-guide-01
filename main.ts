// Leonida Trophy Ledger — entrypoint.
// Hands the guide in: copies app/ and screenshots/ from this repository into
// the output directory and writes output/dossier.json with the kit's dossier
// library. The output directory is MAKEFUN_OUTPUT_DIR, or /output when unset.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
cpSync(appDir, join(outputDir, "app"), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, "screenshots"), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log("Leonida Trophy Ledger: wrote " + outputDir + "/dossier.json (" + dossier.length + " bytes)");
