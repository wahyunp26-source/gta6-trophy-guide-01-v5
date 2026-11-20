// Leonida 100% — the gta6-trophy-guide-01 entry (Node 22, standard library only).
//
// What this entry is: a static single-page guide in app/ (index.html, style.css,
// app.js and the data files under app/data/). A browser opens app/index.html; the
// page fetches the trophy data at runtime and renders the tracker, the roadmap,
// the missables table and the sources tab. Nothing is loaded over the network.
//
// What this file does: it hands the entry in. It copies app/ and screenshots/
// from beside this file into the output directory and writes dossier.json there,
// the summary the judge reads — the screenshots, the first-load files and their
// bytes, and the source tree — using the vendored make.fun library. Leave
// vendor/makefun-frontend.ts untouched: the scorer requires dossier.json to be
// byte for byte what its own copy of that library writes.
//
// How to run it locally:
//   node serve.ts            — serves app/ on http://localhost:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   — builds the dossier outside the grader

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The directory this file lives in, and where the entry goes.
const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree if it exists, creating the destination first.
function copyTree(name) {
  const from = join(root, name);
  const to = join(outDir, name);
  if (!existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function main() {
  mkdirSync(outDir, { recursive: true });
  copyTree('app');
  copyTree('screenshots');

  // The scorer's own caps (reference/gate.json). Only text_max_bytes shapes the
  // bytes; the rest refuse an entry the scorer would refuse: more than 4
  // screenshots or one over 256 KiB; more than 993 files and directories in
  // app/, or more than 48 MiB of app files (app/ counts beside /output's own
  // 1000-entry cap, its screenshots/ and dossier.json).
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
