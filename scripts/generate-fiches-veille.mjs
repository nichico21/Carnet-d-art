#!/usr/bin/env node
/**
 * Prend les contenus bruts collectés (scripts/output/veille-brutes.json)
 * et génère une fiche individuelle par contenu dans 0_workspace_veille/,
 * au format défini par scripts/catalog/fields/veille.fields.json.
 *
 * Usage : node scripts/generate-fiches-veille.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'veille-brutes.json');
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_veille');

function creerFiche(brut) {
  return {
    id: brut.id,
    titre: brut.titre,
    type: brut.type,
    source: brut.source,
    url: brut.url,
    imageUrl: brut.imageUrl ?? null,
    duree: brut.duree ?? null,
    datePublication: brut.datePublication ?? null,
    dateAjout: new Date().toISOString().slice(0, 10),
    compteurConsultations: 0,
    themesLies: [],
    statut: 'brouillon',
    description: null,
motsCles: [],
oeuvresLiees: [],
  };
}

function main() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`Fichier introuvable : ${OUTPUT_FILE}. Lance d'abord fetch-veille.mjs.`);
    process.exit(1);
  }
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

  const brutes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  let creees = 0;
  let dejaExistantes = 0;

  for (const brut of brutes) {
    const cheminFiche = path.join(WORKSPACE_DIR, `${brut.id}.json`);
    if (fs.existsSync(cheminFiche)) {
      dejaExistantes += 1;
      continue;
    }
    fs.writeFileSync(cheminFiche, JSON.stringify(creerFiche(brut), null, 2), 'utf-8');
    creees += 1;
  }

  console.log(`${creees} nouvelle(s) fiche(s) créée(s) dans 0_workspace_veille/`);
  console.log(`${dejaExistantes} déjà existante(s), non modifiée(s)`);
}

main();