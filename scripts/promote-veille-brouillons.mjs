#!/usr/bin/env node
/**
 * Bascule TOUTES les fiches de 0_workspace_veille/ vers scripts/catalog/veille/,
 * SANS validation — statut laissé à "brouillon". Utile pour voir les
 * contenus dans l'app tout de suite, sans attendre la curation complète.
 *
 * Usage : node scripts/promote-veille-brouillons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_veille');
const VEILLE_DIR = path.join(__dirname, 'catalog', 'veille');

function main() {
  fs.mkdirSync(VEILLE_DIR, { recursive: true });
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('0_workspace_veille/ est vide ou absent — rien à basculer.');
    return;
  }
  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json'));
  for (const fichier of fichiers) {
    fs.renameSync(path.join(WORKSPACE_DIR, fichier), path.join(VEILLE_DIR, fichier));
  }
  console.log(`${fichiers.length} fiche(s) déplacée(s) vers scripts/catalog/veille/, statut inchangé.`);
}

main();