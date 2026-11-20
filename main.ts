// Leonida Trophy Atlas — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository to the output directory
// and writes output/dossier.json with buildDossier from the kit's library.
// Run it as: MAKEFUN_OUTPUT_DIR=out node main.ts
// (In the grader, /output is the writable directory and MAKEFUN_OUTPUT_DIR
// is unset, so /output is used.) Paths resolve from this file, never from
// the working directory, so two runs from different directories agree.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
    app_path_max_bytes: 1000,
  }),
);

console.log('wrote ' + join(outDir, 'dossier.json'));
