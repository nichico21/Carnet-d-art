#!/usr/bin/env node
/**
 * Lit les fiches de scripts/catalog/expositions/, les vérifie, puis génère
 * src/data/expositions.generated.ts. Une fiche invalide est signalée et
 * écartée (les autres sont écrites).
 *
 * Usage : node scripts/build-expositions-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FICHES_DIR, OUT_FILE, chargerContexte, validerFiche, versExposition } from './lib-expositions.mjs';

function main() {
  let champs, ctx;
  try {
    ({ champs, ctx } = chargerContexte());
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (!fs.existsSync(FICHES_DIR)) {
    console.error(`Dossier introuvable : ${FICHES_DIR}`);
    process.exit(1);
  }

  const fichiers = fs.readdirSync(FICHES_DIR).filter((f) => f.endsWith('.json'));
  const valides = [];
  const idsVus = new Set();
  let nbErreurs = 0;

  for (const fichier of fichiers) {
    let fiche;
    try {
      fiche = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, fichier), 'utf-8'));
    } catch (e) {
      console.error(`✕ ${fichier} : JSON illisible (${e.message})`);
      nbErreurs += 1;
      continue;
    }
    const erreurs = validerFiche(fiche, champs, ctx);
    if (typeof fiche.id === 'string' && idsVus.has(fiche.id)) erreurs.push(`"id" en double : ${fiche.id}`);
    if (erreurs.length > 0) {
      console.error(`✕ ${fichier} écartée :`);
      erreurs.forEach((e) => console.error(`    - ${e}`));
      nbErreurs += 1;
      continue;
    }
    idsVus.add(fiche.id);
    valides.push(versExposition(fiche, champs, ctx));
  }

  const contenu = `// Fichier généré automatiquement par scripts/build-expositions-data.mjs
// Ne pas éditer à la main — relancer le script après toute mise à jour des fiches.

import { Exposition } from '../types/exposition';

export const EXPOSITIONS: Exposition[] = ${JSON.stringify(valides, null, 2)};
`;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenu, 'utf-8');

  console.log(`${valides.length} exposition(s) écrite(s) dans src/data/expositions.generated.ts`);
  if (nbErreurs > 0) {
    console.error(`${nbErreurs} fiche(s) écartée(s) : voir ci-dessus.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}