#!/usr/bin/env node
/**
 * Prend les œuvres brutes fraîchement collectées (scripts/output/wikidata-artworks.json)
 * et génère une fiche individuelle par œuvre dans 0_workspace/ (à la racine), au format
 * défini par scripts/catalog/fields/artwork.fields.json.
 *
 * Les champs "collecte" sont déjà remplis (viennent de Wikidata).
 * Les champs "curation" sont laissés à null : c'est le travail éditorial (toi,
 * ou un contributeur) qui les complète ensuite, à la main, dans le fichier lui-même.
 * Le champ "statut" démarre à "brouillon".
 *
 * Usage : node scripts/generate-fiches.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace');

function creerFiche(oeuvreBrute) {
  return {
    id: oeuvreBrute.wikidataId,
    titre: oeuvreBrute.titre,
    artiste: oeuvreBrute.artiste,
    annee: oeuvreBrute.annee,
    image: oeuvreBrute.image,
    technique: oeuvreBrute.technique,
    lieuConservation: oeuvreBrute.lieuConservation,
    ville: oeuvreBrute.ville,
    pays: oeuvreBrute.pays,
    localisationSuspecte: oeuvreBrute.localisationSuspecte ?? false,
    contenuSensible: oeuvreBrute.contenuSensible ?? false,

    mouvement: null,
    themes: [],
    description_formelle: null,
    contexte_creation: null,
    anecdote: null,
    pourquoi_ca_compte: null,

    statut: 'brouillon',
  };
}

function main() {
  const fichierSource = path.join(OUTPUT_DIR, 'wikidata-artworks.json');
  if (!fs.existsSync(fichierSource)) {
    console.error(`Fichier introuvable : ${fichierSource}. Lance d'abord fetch-artworks.mjs.`);
    process.exit(1);
  }

  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

  const oeuvres = JSON.parse(fs.readFileSync(fichierSource, 'utf-8'));
  let creees = 0;
  let dejaExistantes = 0;

  for (const oeuvre of oeuvres) {
    const cheminFiche = path.join(WORKSPACE_DIR, `${oeuvre.wikidataId}.json`);
    if (fs.existsSync(cheminFiche)) {
      dejaExistantes += 1;
      continue; // ne jamais écraser une fiche déjà en cours de curation
    }
    fs.writeFileSync(cheminFiche, JSON.stringify(creerFiche(oeuvre), null, 2), 'utf-8');
    creees += 1;
  }

  console.log(`${creees} nouvelles fiches créées dans 0_workspace/`);
  console.log(`${dejaExistantes} fiches déjà existantes, non modifiées`);
}

main();