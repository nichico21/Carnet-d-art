#!/usr/bin/env node
/**
 * Lit toutes les fiches de scripts/catalog/artworks/ (validées ou brouillon)
 * et génère src/data/artworks.generated.ts — le fichier que l'app importe
 * réellement. Ce fichier est TOUJOURS généré, jamais édité à la main :
 * relance ce script après chaque nouvelle fiche ajoutée/validée.
 *
 * Usage : node scripts/build-app-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTWORKS_DIR = path.join(__dirname, 'catalog', 'artworks');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'artworks.generated.ts');

function versArtwork(fiche) {
  return {
    id: fiche.id,
    titre: fiche.titre,
    artiste: fiche.artiste,
    ...(fiche.annee ? { annee: fiche.annee } : {}),
    ...(fiche.image ? { imageUrl: fiche.image } : {}),
    ...(fiche.technique ? { technique: fiche.technique } : {}),
    lieuConservation: fiche.lieuConservation,
    ville: fiche.ville,
    pays: fiche.pays,
    mouvement: fiche.mouvement ?? 'Non déterminé',
    themes: fiche.themes ?? [],
    ...(fiche.description_formelle ? { description: fiche.description_formelle } : {}),
    ...(fiche.contexte_creation ? { contexteCreation: fiche.contexte_creation } : {}),
    ...(fiche.anecdote ? { anecdote: fiche.anecdote } : {}),
    ...(fiche.pourquoi_ca_compte ? { pourquoiCaCompte: fiche.pourquoi_ca_compte } : {}),
    ...(fiche.contenuSensible ? { contenuSensible: true } : {}),
    statut: fiche.statut,
  };
}

function main() {
  if (!fs.existsSync(ARTWORKS_DIR)) {
    console.error(`Dossier introuvable : ${ARTWORKS_DIR}`);
    process.exit(1);
  }

  const fichiers = fs.readdirSync(ARTWORKS_DIR).filter((f) => f.endsWith('.json'));
  const artworks = fichiers
    .map((f) => JSON.parse(fs.readFileSync(path.join(ARTWORKS_DIR, f), 'utf-8')))
    .map(versArtwork);

  const contenu = `// Fichier généré automatiquement par scripts/build-app-data.mjs
// Ne pas éditer à la main — relancer le script après toute mise à jour du catalogue.

import { Artwork } from '../types/artwork';

export const ARTWORKS: Artwork[] = ${JSON.stringify(artworks, null, 2)};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenu, 'utf-8');
  console.log(`${artworks.length} œuvre(s) écrite(s) dans src/data/artworks.generated.ts`);
}

main();