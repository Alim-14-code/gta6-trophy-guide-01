// main.ts — hand in the Leonida Trophy Atlas.
// It gathers the finished guide folder (app/) and the screenshots folder
// (screenshots/) into the output directory the grader provides — or the
// environment's output directory when run locally — and writes the
// submission dossier there with the dossier-writing function from the
// kit's vendor library. Every path is worked out from this file's own
// location, never from the directory the process was started in, so the
// result is byte-identical no matter where it is run from.
// Standard library only, apart from the vendor library it calls.
import { copyFile, mkdir, readdir, writeFile, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const here = resolve(dirname(fileURLToPath(import.meta.url)));
const guideFolder = join(here, "app");
const shotsFolder = join(here, "screenshots");

function outputDirectory(): string {
  const fromEnvironment = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnvironment && fromEnvironment.trim() !== "") return resolve(fromEnvironment);
  return "/output";
}

async function copyTree(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  const entries = await readdir(source, { withFileTypes: true });
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to);
    } else if (entry.isFile()) {
      await copyFile(from, to);
    }
  }
}

async function run(): Promise<void> {
  const out = outputDirectory();
  await mkdir(out, { recursive: true });
  await copyTree(guideFolder, join(out, "app"));
  const shots = await stat(shotsFolder).catch(() => null);
  if (shots && shots.isDirectory()) {
    await copyTree(shotsFolder, join(out, "screenshots"));
  } else {
    await mkdir(join(out, "screenshots"), { recursive: true });
  }
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
    app_path_max_bytes: 1000,
  });
  await writeFile(join(out, "dossier.json"), dossier);
  console.log(`Leonida Trophy Atlas handed in to ${out}`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
