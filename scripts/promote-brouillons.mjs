#!/usr/bin/env node
/**
 * Bascule TOUTES les fiches de 0_workspace/ vers scripts/catalog/artworks/,
 * SANS passer par validate.mjs — donc sans vérifier ni les champs obligatoires
 * ni le vocabulaire contrôlé.
 *
 * Le statut de chaque fiche reste "brouillon" (on ne le force pas à "valide" :
 * ce serait mentir sur l'état réel de la fiche). Objectif : voir les œuvres
 * dans l'appli tout de suite, avec la curation éditoriale (mouvement,
 * description...) à compléter plus tard, sans bloquer l'affichage.
 *
 * Usage : node scripts/promote-brouillons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace');
const ARTWORKS_DIR = path.join(__dirname, 'catalog', 'artworks');

function main() {
  fs.mkdirSync(ARTWORKS_DIR, { recursive: true });

  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('0_workspace/ est vide ou absent — rien à basculer.');
    return;
  }

  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json'));
  let deplacees = 0;

  for (const fichier of fichiers) {
    const cheminWorkspace = path.join(WORKSPACE_DIR, fichier);
    const cheminCatalog = path.join(ARTWORKS_DIR, fichier);
    fs.renameSync(cheminWorkspace, cheminCatalog);
    deplacees += 1;
  }

  console.log(`${deplacees} fiche(s) déplacée(s) vers scripts/catalog/artworks/, statut inchangé ("brouillon").`);
  console.log('Rappel : ces fiches n\'ont pas été vérifiées (champs obligatoires, vocabulaire contrôlé).');
}

main();