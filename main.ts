// Leonida Trophy Atlas — entrypoint (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository to the output directory and
// writes /output/dossier.json with buildDossier from vendor/makefun-frontend.ts.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts  (or it writes to /output).
// Paths resolve from this file itself, so it runs the same from any working directory.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

function copyTree(src, dest) {
  if (!existsSync(src)) throw new Error('missing input directory: ' + src);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const dest = join(outDir, name);
  rmSync(dest, { recursive: true, force: true });
  copyTree(join(repoRoot, name), dest);
}

const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log('wrote ' + join(outDir, 'dossier.json') + ' (' + dossier.length + ' bytes)');
