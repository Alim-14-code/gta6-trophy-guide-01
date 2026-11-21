// Leonida Trophy Ledger — hand-in program.
//
// Takes the guide in this repository (app/ plus screenshots/) and hands it
// in: the two folders are copied into the output directory, and a dossier
// file is written there describing the entry, built with the kit's dossier
// library from vendor/makefun-frontend.ts. The output directory comes from
// MAKEFUN_OUTPUT_DIR, or /output when that is not set.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || "/output";

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

cpSync(join(root, "app"), join(out, "app"), { recursive: true });
const shots = join(root, "screenshots");
if (existsSync(shots)) cpSync(shots, join(out, "screenshots"), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, "dossier.json"), dossier);
console.log("Leonida Trophy Ledger: dossier written to " + out + "/dossier.json (" + dossier.length + " bytes)");
