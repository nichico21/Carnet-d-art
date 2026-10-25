#!/usr/bin/env node
/**
 * Bascule les fiches de 0_workspace_veille/ vers scripts/catalog/veille/,
 * SANS validation — statut laissé à "brouillon". Utile pour voir les
 * contenus dans l'app tout de suite, sans attendre la curation complète.
 *
 * Une fiche déjà présente au catalogue n'est JAMAIS écrasée (elle porte peut-être
 * une description, des thèmes ou des corrections) : elle reste dans 0_workspace_veille/
 * et la commande te le signale. --ecraser pour la remplacer volontairement.
 *
 * Usage : node scripts/promote-veille-brouillons.mjs [--ecraser]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_veille');
const VEILLE_DIR = path.join(__dirname, 'catalog', 'veille');
const MAX_CONFLITS_AFFICHES = 10;

function main() {
  const ecraser = process.argv.includes('--ecraser');
  fs.mkdirSync(VEILLE_DIR, { recursive: true });
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('0_workspace_veille/ est vide ou absent — rien à basculer.');
    return;
  }
  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json')).sort();
  let deplacees = 0;
  const conflits = [];
  for (const fichier of fichiers) {
    const destination = path.join(VEILLE_DIR, fichier);
    if (fs.existsSync(destination) && !ecraser) {
      conflits.push(fichier);
      continue;
    }
    fs.renameSync(path.join(WORKSPACE_DIR, fichier), destination);
    deplacees += 1;
  }
  console.log(`${deplacees} fiche(s) déplacée(s) vers scripts/catalog/veille/, statut inchangé.`);
  if (conflits.length > 0) {
    console.log(
      `\n${conflits.length} fiche(s) NON déplacée(s) : ` +
        'elles existent déjà au catalogue (non écrasées) :',
    );
    for (const f of conflits.slice(0, MAX_CONFLITS_AFFICHES)) console.log(`  - ${f}`);
    if (conflits.length > MAX_CONFLITS_AFFICHES) {
      console.log(`  … et ${conflits.length - MAX_CONFLITS_AFFICHES} autre(s)`);
    }
    console.log('Elles restent dans 0_workspace_veille/ : supprime-les si ce sont des doublons,');
    console.log('ou relance avec --ecraser pour remplacer volontairement celles du catalogue.');
  }
}

main();
