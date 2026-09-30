#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_produits');
const PRODUITS_DIR = path.join(__dirname, 'catalog', 'produits');

function main() {
  fs.mkdirSync(PRODUITS_DIR, { recursive: true });
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('0_workspace_produits/ est vide ou absent — rien à basculer.');
    return;
  }
  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json'));
  for (const fichier of fichiers) {
    fs.renameSync(path.join(WORKSPACE_DIR, fichier), path.join(PRODUITS_DIR, fichier));
  }
  console.log(`${fichiers.length} fiche(s) déplacée(s) vers scripts/catalog/produits/, statut inchangé.`);
}

main();