#!/usr/bin/env node
/**
 * Vérifie les brouillons de 0_workspace_expositions/ et déplace dans
 * scripts/catalog/expositions/ ceux qui sont complets et valides. Les autres
 * restent en place, avec la liste de ce qui leur manque.
 *
 * Usage : node scripts/promote-expositions-brouillons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FICHES_DIR, WORKSPACE_DIR, chargerContexte, estVide, validerFiche } from './lib-expositions.mjs';

/** Retire l'aide (clés commençant par "_") et les champs vides. */
export function nettoyerBrouillon(fiche) {
  const propre = {};
  for (const [cle, valeur] of Object.entries(fiche)) {
    if (cle.startsWith('_') || estVide(valeur)) continue;
    propre[cle] = typeof valeur === 'string' ? valeur.trim() : valeur;
  }
  return propre;
}

function main() {
  let champs, ctx;
  try {
    ({ champs, ctx } = chargerContexte());
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('0_workspace_expositions/ est absent ou vide : rien à promouvoir.');
    return;
  }
  fs.mkdirSync(FICHES_DIR, { recursive: true });

  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json'));
  let promus = 0;
  let restants = 0;

  for (const fichier of fichiers) {
    let brouillon;
    try {
      brouillon = JSON.parse(fs.readFileSync(path.join(WORKSPACE_DIR, fichier), 'utf-8'));
    } catch (e) {
      console.error(`✕ ${fichier} : JSON illisible (${e.message})`);
      restants += 1;
      continue;
    }
    const fiche = nettoyerBrouillon(brouillon);
    const erreurs = validerFiche(fiche, champs, ctx);
    const destination = path.join(FICHES_DIR, `${fiche.id}.json`);
    if (typeof fiche.id === 'string' && fs.existsSync(destination)) {
      erreurs.push(`une fiche "${fiche.id}.json" existe déjà dans le catalogue`);
    }

    if (erreurs.length > 0) {
      console.error(`✕ ${fichier} : pas encore prête`);
      erreurs.forEach((e) => console.error(`    - ${e}`));
      restants += 1;
      continue;
    }
    fs.writeFileSync(destination, JSON.stringify(fiche, null, 2) + '\n', 'utf-8');
    fs.unlinkSync(path.join(WORKSPACE_DIR, fichier));
    console.log(`✓ ${fichier} promue dans scripts/catalog/expositions/`);
    promus += 1;
  }

  console.log(`\n${promus} fiche(s) promue(s), ${restants} restée(s) en brouillon.`);
  if (promus > 0) console.log('Étape suivante : node scripts/build-expositions-data.mjs');
  if (restants > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}