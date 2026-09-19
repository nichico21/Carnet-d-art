#!/usr/bin/env node
/**
 * Migration ponctuelle, à lancer UNE FOIS après la mise à jour du schéma :
 * - renomme le champ "wikidataId" en "id" sur les fiches déjà présentes
 *   dans 0_workspace/ et scripts/catalog/artworks/
 * - complète "ville"/"pays" quand ils manquent, via une table de
 *   correspondance par lieuConservation (les fiches générées avant cette
 *   mise à jour ne les avaient pas)
 *
 * Usage : node scripts/migrate-id-field.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VILLE_PAYS_PAR_LIEU = {
  'Musée du Louvre': { ville: 'Paris', pays: 'France' },
  "Musée d'Orsay": { ville: 'Paris', pays: 'France' },
  'musée Jacquemart-André': { ville: 'Paris', pays: 'France' },
  'National Gallery': { ville: 'Londres', pays: 'Royaume-Uni' },
};

const DOSSIERS = [
  path.join(__dirname, '..', '0_workspace'),
  path.join(__dirname, 'catalog', 'artworks'),
];

function migrerFichier(chemin) {
  const fiche = JSON.parse(fs.readFileSync(chemin, 'utf-8'));
  let modifie = false;

  if ('wikidataId' in fiche && !('id' in fiche)) {
    fiche.id = fiche.wikidataId;
    delete fiche.wikidataId;
    modifie = true;
  }

  if (!fiche.ville || !fiche.pays) {
    const correspondance = VILLE_PAYS_PAR_LIEU[fiche.lieuConservation];
    if (correspondance) {
      fiche.ville = fiche.ville || correspondance.ville;
      fiche.pays = fiche.pays || correspondance.pays;
      modifie = true;
    } else {
      console.warn(`  ⚠ Pas de ville/pays connus pour "${fiche.lieuConservation}" (${fiche.titre}) — à compléter à la main.`);
    }
  }

  if (modifie) {
    fs.writeFileSync(chemin, JSON.stringify(fiche, null, 2), 'utf-8');
    return true;
  }
  return false;
}

function main() {
  let total = 0;
  let migrees = 0;

  for (const dossier of DOSSIERS) {
    if (!fs.existsSync(dossier)) continue;
    for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith('.json'))) {
      total += 1;
      if (migrerFichier(path.join(dossier, fichier))) migrees += 1;
    }
  }

  console.log(`${migrees}/${total} fiche(s) migrée(s).`);
}

main();