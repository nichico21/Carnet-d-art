#!/usr/bin/env node
/**
 * Lit toutes les fiches de scripts/catalog/veille/ et génère
 * src/data/veille.generated.ts — le fichier que l'app importe réellement.
 * Calcule aussi DERNIERS_AJOUTS (tri par dateAjout) et PLUS_CONSULTES
 * (tri par compteurConsultations), pour éviter que chaque écran refasse
 * ce tri lui-même.
 *
 * Usage : node scripts/build-veille-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VEILLE_DIR = path.join(__dirname, 'catalog', 'veille');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'veille.generated.ts');

function versContenuVeille(fiche) {
  return {
    id: fiche.id,
    titre: fiche.titre,
    type: fiche.type,
    source: fiche.source,
    url: fiche.url,
    ...(fiche.imageUrl ? { imageUrl: fiche.imageUrl } : {}),
    ...(fiche.duree ? { duree: fiche.duree } : {}),
    ...(fiche.datePublication ? { datePublication: fiche.datePublication } : {}),
    ...(fiche.description ? { description: fiche.description } : {}),
...(fiche.motsCles && fiche.motsCles.length > 0 ? { motsCles: fiche.motsCles } : {}),
...(fiche.oeuvresLiees && fiche.oeuvresLiees.length > 0 ? { oeuvresLiees: fiche.oeuvresLiees } : {}),
    dateAjout: fiche.dateAjout,
    compteurConsultations: fiche.compteurConsultations ?? 0,
    ...(fiche.themesLies && fiche.themesLies.length > 0 ? { themesLies: fiche.themesLies } : {}),
    statut: fiche.statut,
  };
}

function main() {
  if (!fs.existsSync(VEILLE_DIR)) {
    console.error(`Dossier introuvable : ${VEILLE_DIR}`);
    process.exit(1);
  }

  const fichiers = fs.readdirSync(VEILLE_DIR).filter((f) => f.endsWith('.json'));
  const contenus = fichiers
    .map((f) => JSON.parse(fs.readFileSync(path.join(VEILLE_DIR, f), 'utf-8')))
    .map(versContenuVeille);

  const derniersAjouts = [...contenus].sort((a, b) => b.dateAjout.localeCompare(a.dateAjout));
  const plusConsultes = [...contenus].sort((a, b) => b.compteurConsultations - a.compteurConsultations);

  const contenuFichier = `// Fichier généré automatiquement par scripts/build-veille-data.mjs
// Ne pas éditer à la main — relancer le script après toute mise à jour du catalogue veille.

import { ContenuVeille } from '../types/veille';

export const CONTENUS_VEILLE: ContenuVeille[] = ${JSON.stringify(contenus, null, 2)};

export const DERNIERS_AJOUTS: ContenuVeille[] = ${JSON.stringify(derniersAjouts, null, 2)};

export const PLUS_CONSULTES: ContenuVeille[] = ${JSON.stringify(plusConsultes, null, 2)};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenuFichier, 'utf-8');
  console.log(`${contenus.length} contenu(s) écrit(s) dans src/data/veille.generated.ts`);
}

main();