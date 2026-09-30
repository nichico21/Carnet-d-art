#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'produits-bruts.json');
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_produits');

function creerFiche(brut) {
  return {
    id: brut.id,
    titre: brut.titre,
    categorie: brut.categorie,
    sousCategorie: brut.sousCategorie,
    prix: brut.prix,
    imageUrl: brut.imageUrl,
    url: brut.url,
    source: brut.source,
    dateReleve: brut.dateReleve,
    oeuvreLieeId: null,
    statut: 'brouillon',
  };
}

function main() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`Fichier introuvable : ${OUTPUT_FILE}. Lance d'abord fetch-produit-by-url.mjs.`);
    process.exit(1);
  }
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

  const brutes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  let creees = 0, dejaExistantes = 0;

  for (const brut of brutes) {
    const cheminFiche = path.join(WORKSPACE_DIR, `${brut.id}.json`);
    if (fs.existsSync(cheminFiche)) { dejaExistantes += 1; continue; }
    fs.writeFileSync(cheminFiche, JSON.stringify(creerFiche(brut), null, 2), 'utf-8');
    creees += 1;
  }

  console.log(`${creees} nouvelle(s) fiche(s) créée(s) dans 0_workspace_produits/`);
  console.log(`${dejaExistantes} déjà existante(s), non modifiée(s)`);
}

main();