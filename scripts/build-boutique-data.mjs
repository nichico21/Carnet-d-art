#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUITS_DIR = path.join(__dirname, 'catalog', 'produits');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'boutique.generated.ts');

function versProduit(fiche) {
  return {
    id: fiche.id,
    titre: fiche.titre,
    categorie: fiche.categorie,
    sousCategorie: fiche.sousCategorie,
    prix: fiche.prix ?? 0,
    ...(fiche.imageUrl ? { imageUrl: fiche.imageUrl } : {}),
    url: fiche.url,
    ...(fiche.oeuvreLieeId ? { oeuvreLieeId: fiche.oeuvreLieeId } : {}),
    offres: [{ source: fiche.source, url: fiche.url, prix: fiche.prix ?? 0, dateReleve: fiche.dateReleve }],
  };
}

function main() {
  if (!fs.existsSync(PRODUITS_DIR)) {
    console.error(`Dossier introuvable : ${PRODUITS_DIR}`);
    process.exit(1);
  }
  const fichiers = fs.readdirSync(PRODUITS_DIR).filter((f) => f.endsWith('.json'));
  const produits = fichiers
    .map((f) => JSON.parse(fs.readFileSync(path.join(PRODUITS_DIR, f), 'utf-8')))
    .map(versProduit);

  const contenu = `// Fichier généré automatiquement par scripts/build-boutique-data.mjs
// Ne pas éditer à la main.

import { Produit } from '../types/boutique';

export const PRODUITS_REELS: Produit[] = ${JSON.stringify(produits, null, 2)};
`;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenu, 'utf-8');
  console.log(`${produits.length} produit(s) écrit(s) dans src/data/boutique.generated.ts`);
}

main();