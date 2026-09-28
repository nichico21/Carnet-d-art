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
    ...(fiche.dimensions ? { dimensions: fiche.dimensions } : {}),
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

    const facettes = construireFacettes(artworks);

  const contenu = `// Fichier généré automatiquement par scripts/build-app-data.mjs
// Ne pas éditer à la main — relancer le script après toute mise à jour du catalogue.

import { Artwork } from '../types/artwork';

export const ARTWORKS: Artwork[] = ${JSON.stringify(artworks, null, 2)};

export interface FacetteValeur {
  valeur: string;
  nombre: number;
}

export const FACETTES = ${JSON.stringify(facettes, null, 2)} as {
  artistes: FacetteValeur[];
  musees: FacetteValeur[];
  mouvements: FacetteValeur[];
  genres: FacetteValeur[];
  epoques: FacetteValeur[];
};

`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenu, 'utf-8');
  console.log(`${artworks.length} œuvre(s) écrite(s) dans src/data/artworks.generated.ts`);
}

main();

function construireFacettes(artworks) {
  const compter = (valeurs) => {
    const compte = new Map();
    for (const v of valeurs) {
      if (!v) continue;
      compte.set(v, (compte.get(v) ?? 0) + 1);
    }
    return Array.from(compte.entries())
      .map(([valeur, nombre]) => ({ valeur, nombre }))
      .sort((a, b) => b.nombre - a.nombre);
  };

  const epoqueDe = (annee) => {
    const n = parseInt(annee, 10);
    if (!n || isNaN(n)) return null;
    const siecle = Math.ceil(n / 100);
    const chiffresRomains = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
    return `${chiffresRomains[siecle] ?? siecle}e siècle`;
  };

  return {
    artistes: compter(artworks.map((a) => a.artiste)),
    musees: compter(artworks.map((a) => a.lieuConservation)),
    mouvements: compter(artworks.map((a) => a.mouvement)),
    genres: compter(artworks.flatMap((a) => a.themes ?? [])),
    epoques: compter(artworks.map((a) => epoqueDe(a.annee)).filter(Boolean)),
  };
}