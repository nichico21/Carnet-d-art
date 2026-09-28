#!/usr/bin/env node
/**
 * Valide chaque fiche de 0_workspace_veille/ contre
 * scripts/catalog/fields/veille.fields.json et les vocabulaires contrôlés.
 * Une fiche conforme est déplacée vers scripts/catalog/veille/ avec
 * statut "valide" ; une fiche non conforme reste en attente, avec le
 * détail de ses erreurs.
 *
 * Usage : node scripts/validate-veille.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_veille');
const VALIDATED_DIR = path.join(__dirname, 'catalog', 'veille');
const CATALOG_DIR = path.join(__dirname, 'catalog');

function chargerJSON(cheminRelatif) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, cheminRelatif), 'utf-8'));
}

function chargerVocabulaires() {
  const dir = path.join(CATALOG_DIR, 'vocabularies');
  const vocabulaires = {};
  for (const fichier of fs.readdirSync(dir)) {
    const nom = path.basename(fichier, '.json');
    vocabulaires[nom] = chargerJSON(path.join('catalog', 'vocabularies', fichier));
  }
  return vocabulaires;
}

function validerFiche(fiche, champs, vocabulaires) {
  const erreurs = [];

  for (const champ of champs) {
    if (!champ.obligatoire) continue;
    const valeur = fiche[champ.nom];
    const vide = valeur === null || valeur === undefined || valeur === '' ||
      (Array.isArray(valeur) && valeur.length === 0);
    if (vide) erreurs.push(`Champ obligatoire manquant ou vide : "${champ.nom}"`);
  }

  for (const champ of champs) {
    if (champ.type === 'vocabulaire' && fiche[champ.nom]) {
      const liste = vocabulaires[champ.vocabulaire] ?? [];
      if (!liste.includes(fiche[champ.nom])) {
        erreurs.push(`"${champ.nom}" = "${fiche[champ.nom]}" absent du vocabulaire contrôlé (${champ.vocabulaire})`);
      }
    }
    if (champ.type === 'vocabulaire_liste' && Array.isArray(fiche[champ.nom])) {
      const liste = vocabulaires[champ.vocabulaire] ?? [];
      for (const valeur of fiche[champ.nom]) {
        if (!liste.includes(valeur)) {
          erreurs.push(`"${champ.nom}" contient "${valeur}", absent du vocabulaire (${champ.vocabulaire})`);
        }
      }
    }
  }

  return erreurs;
}

function main() {
  const champs = chargerJSON(path.join('catalog', 'fields', 'veille.fields.json')).champs;
  const vocabulaires = chargerVocabulaires();

  fs.mkdirSync(VALIDATED_DIR, { recursive: true });

  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('Aucune fiche en attente (0_workspace_veille/ est vide ou absent).');
    return;
  }

  const fichiers = fs.readdirSync(WORKSPACE_DIR).filter((f) => f.endsWith('.json'));
  let validees = 0;
  let rejetees = 0;

  for (const fichier of fichiers) {
    const cheminWorkspace = path.join(WORKSPACE_DIR, fichier);
    const fiche = JSON.parse(fs.readFileSync(cheminWorkspace, 'utf-8'));
    const erreurs = validerFiche(fiche, champs, vocabulaires);

    if (erreurs.length === 0) {
      fiche.statut = 'valide';
      fs.writeFileSync(path.join(VALIDATED_DIR, fichier), JSON.stringify(fiche, null, 2), 'utf-8');
      fs.unlinkSync(cheminWorkspace);
      validees += 1;
      console.log(`✓ ${fiche.titre} — validée`);
    } else {
      rejetees += 1;
      console.log(`✕ ${fiche.titre || fichier} — ${erreurs.length} erreur(s) :`);
      erreurs.forEach((e) => console.log(`    - ${e}`));
    }
  }

  console.log(`\n${validees} fiche(s) validée(s) vers scripts/catalog/veille/`);
  console.log(`${rejetees} fiche(s) encore en attente dans 0_workspace_veille/`);
}

main();