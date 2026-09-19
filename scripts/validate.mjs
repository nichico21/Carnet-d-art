#!/usr/bin/env node
/**
 * Valide chaque fiche de 0_workspace/ contre scripts/catalog/fields/artwork.fields.json
 * et les vocabulaires contrôlés (scripts/catalog/vocabularies/*.json).
 *
 * - Structure  : tous les champs obligatoires sont présents et non vides.
 * - Vocabulaire: "mouvement" et "themes" utilisent des termes de la liste contrôlée
 *                (jamais un terme inventé par erreur de frappe ou de curation).
 * - Cohérence  : une fiche marquée contenuSensible=true doit avoir été relue
 *                explicitement (on exige un champ "pourquoi_ca_compte" rempli,
 *                signe qu'un humain a bien regardé la fiche avant validation).
 *
 * Une fiche qui passe tous les contrôles est copiée dans scripts/catalog/artworks/
 * (source de vérité utilisée par l'appli) avec statut "valide", puis supprimée
 * de 0_workspace/. Une fiche qui échoue reste dans 0_workspace/ avec la liste
 * de ses erreurs affichée dans le terminal — jamais promue automatiquement.
 *
 * Usage : node scripts/validate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace');
const VALIDATED_DIR = path.join(__dirname, 'catalog', 'artworks');
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

  // --- Structure : champs obligatoires ---
  for (const champ of champs) {
    if (!champ.obligatoire) continue;
    const valeur = fiche[champ.nom];
    const vide = valeur === null || valeur === undefined || valeur === '' ||
      (Array.isArray(valeur) && valeur.length === 0);
    if (vide) erreurs.push(`Champ obligatoire manquant ou vide : "${champ.nom}"`);
  }

  // --- Vocabulaire contrôlé ---
  for (const champ of champs) {
    if (champ.type === 'vocabulaire' && fiche[champ.nom]) {
      const liste = vocabulaires[champ.vocabulaire] ?? [];
      if (!liste.includes(fiche[champ.nom])) {
        erreurs.push(`"${champ.nom}" = "${fiche[champ.nom]}" n'est pas dans le vocabulaire contrôlé (${champ.vocabulaire})`);
      }
    }
    if (champ.type === 'vocabulaire_liste' && Array.isArray(fiche[champ.nom])) {
      const liste = vocabulaires[champ.vocabulaire] ?? [];
      for (const valeur of fiche[champ.nom]) {
        if (!liste.includes(valeur)) {
          erreurs.push(`"${champ.nom}" contient "${valeur}", absent du vocabulaire contrôlé (${champ.vocabulaire})`);
        }
      }
    }
  }

  // --- Cohérence métier : contenu sensible => relecture attestée ---
  if (fiche.contenuSensible === true && !fiche.pourquoi_ca_compte) {
    erreurs.push('Œuvre marquée contenuSensible=true mais "pourquoi_ca_compte" non rempli : la fiche doit être relue explicitement avant validation.');
  }

  return erreurs;
}

function main() {
  const champs = chargerJSON(path.join('catalog', 'fields', 'artwork.fields.json')).champs;
  const vocabulaires = chargerVocabulaires();

  fs.mkdirSync(VALIDATED_DIR, { recursive: true });

  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('Aucune fiche en attente (0_workspace/ est vide ou absent).');
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

  console.log(`\n${validees} fiche(s) validée(s) et déplacée(s) vers scripts/catalog/artworks/`);
  console.log(`${rejetees} fiche(s) encore en attente dans 0_workspace/ (à compléter)`);
}

main();