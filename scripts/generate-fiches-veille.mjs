#!/usr/bin/env node
/**
 * Prend les contenus bruts collectés (scripts/output/veille-brutes.json)
 * et génère une fiche individuelle par contenu dans 0_workspace_veille/,
 * au format défini par scripts/catalog/fields/veille.fields.json.
 *
 * Les champs sont lus dans ce fichier : ajouter un champ ne demande plus de
 * modifier ce script. Règles :
 *   - champs "systeme" : valeur calculée (date du jour, compteur à 0, statut brouillon) ;
 *   - champs "curation" : toujours vides à la création (jamais repris de la collecte) ;
 *   - champs "collecte" : repris du contenu brut, vides s'il n'y figurent pas.
 *
 * Usage :
 *   node scripts/generate-fiches-veille.mjs
 *       crée les fiches manquantes. Une fiche déjà présente (brouillon OU catalogue) n'est
 *       jamais modifiée ni recréée ; si l'identifiant est pris par une AUTRE ressource
 *       (adresse différente), la fiche est créée sous « identifiant-xxxxxx ».
 *   node scripts/generate-fiches-veille.mjs --migrer [dossier…]
 *       ajoute aux fiches existantes les champs qui leur manquent (valeurs vides),
 *       sans toucher au reste ; par défaut 0_workspace_veille/ et catalog/veille/
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'veille-brutes.json');
const FIELDS_FILE = path.join(__dirname, 'catalog', 'fields', 'veille.fields.json');
const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_veille');
const CATALOG_VEILLE_DIR = path.join(__dirname, 'catalog', 'veille');
const CHAMPS_REQUIS_BRUTS = ['id', 'titre', 'type', 'source', 'url'];

export function chargerChamps(chemin = FIELDS_FILE) {
  return JSON.parse(fs.readFileSync(chemin, 'utf-8')).champs;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

function valeurVide(champ) {
  return champ.type === 'vocabulaire_liste' || champ.type === 'liste_libre' ? [] : null;
}

function valeurSysteme(champ, jour) {
  const calculees = { dateAjout: jour, compteurConsultations: 0, statut: 'brouillon' };
  return champ.nom in calculees ? calculees[champ.nom] : valeurVide(champ);
}

/** Une fiche neuve, avec tous les champs du fichier de champs, dans son ordre. */
export function creerFiche(brut, champs, jour = aujourdhui()) {
  const fiche = {};
  for (const champ of champs) {
    if (champ.source === 'systeme') fiche[champ.nom] = valeurSysteme(champ, jour);
    else if (champ.source === 'curation') fiche[champ.nom] = valeurVide(champ);
    else fiche[champ.nom] = brut[champ.nom] ?? valeurVide(champ);
  }
  return fiche;
}

/**
 * Ajoute à une fiche existante les champs qui lui manquent. Les valeurs existantes et les
 * clés inconnues sont conservées telles quelles. Retourne { fiche, ajoutes }.
 */
export function completerFiche(fiche, champs, jour = aujourdhui()) {
  const resultat = {};
  const ajoutes = [];
  for (const champ of champs) {
    if (champ.nom in fiche) {
      resultat[champ.nom] = fiche[champ.nom];
    } else {
      resultat[champ.nom] =
        champ.source === 'systeme' ? valeurSysteme(champ, jour) : valeurVide(champ);
      ajoutes.push(champ.nom);
    }
  }
  for (const [cle, valeur] of Object.entries(fiche)) {
    if (!(cle in resultat)) resultat[cle] = valeur;
  }
  return { fiche: resultat, ajoutes };
}

/** Six caractères tirés de l'adresse : de quoi départager deux ressources au même identifiant. */
export function suffixeUrl(url) {
  return crypto.createHash('sha1').update(String(url)).digest('hex').slice(0, 6);
}

function urlDeFiche(chemin) {
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf-8')).url ?? null;
  } catch {
    return null;
  }
}

/**
 * Où écrire la fiche d'un contenu brut ?
 *   { etat: 'libre', id }                    : l'identifiant est disponible ;
 *   { etat: 'existe', id, dossier }          : la ressource a déjà sa fiche (brouillon ou catalogue) ;
 *   { etat: 'suffixe', id }                  : l'identifiant est pris par une autre ressource.
 * Une fiche existante illisible ou sans adresse est considérée comme la même ressource :
 * dans le doute, on ne crée rien.
 */
export function emplacement(brut, dossiers = [WORKSPACE_DIR, CATALOG_VEILLE_DIR]) {
  const candidats = [brut.id, `${brut.id}-${suffixeUrl(brut.url)}`];
  for (const [rang, id] of candidats.entries()) {
    let pris = false;
    for (const dossier of dossiers) {
      const chemin = path.join(dossier, `${id}.json`);
      if (!fs.existsSync(chemin)) continue;
      const url = urlDeFiche(chemin);
      if (url === null || url === brut.url) return { etat: 'existe', id, dossier };
      pris = true;
    }
    if (!pris) return { etat: rang === 0 ? 'libre' : 'suffixe', id };
  }
  return { etat: 'existe', id: candidats[1], dossier: dossiers[0] };
}

const ecrire = (chemin, fiche) =>
  fs.writeFileSync(chemin, JSON.stringify(fiche, null, 2) + '\n', 'utf-8');

function creer() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error(`Fichier introuvable : ${OUTPUT_FILE}. Lance d'abord fetch-veille-by-url.mjs.`);
    process.exit(1);
  }
  const champs = chargerChamps();
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });

  const brutes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  let creees = 0;
  let dejaExistantes = 0;
  let dejaAuCatalogue = 0;
  let suffixees = 0;
  let ignorees = 0;

  for (const brut of brutes) {
    const manquants = CHAMPS_REQUIS_BRUTS.filter((c) => !brut[c]);
    if (manquants.length > 0 || !/^[a-z0-9][a-z0-9-]*$/.test(brut.id)) {
      ignorees += 1;
      const raison = manquants.length > 0
        ? `champ(s) manquant(s) : ${manquants.join(', ')}`
        : `identifiant invalide : ${brut.id}`;
      console.warn(`  ⚠ Contenu ignoré (${raison}) : ${brut.titre ?? brut.url ?? '?'}`);
      continue;
    }
    const place = emplacement(brut);
    if (place.etat === 'existe') {
      if (place.dossier === CATALOG_VEILLE_DIR) dejaAuCatalogue += 1;
      else dejaExistantes += 1;
      continue;
    }
    if (place.etat === 'suffixe') {
      suffixees += 1;
      console.warn(
        `  ⚠ Identifiant déjà pris par une autre ressource : fiche créée sous ${place.id}`,
      );
    }
    const fiche = creerFiche({ ...brut, id: place.id }, champs);
    ecrire(path.join(WORKSPACE_DIR, `${place.id}.json`), fiche);
    creees += 1;
  }

  console.log(`${creees} nouvelle(s) fiche(s) créée(s) dans 0_workspace_veille/`);
  console.log(`${dejaExistantes} déjà existante(s), non modifiée(s)`);
  if (dejaAuCatalogue > 0) {
    console.log(`${dejaAuCatalogue} déjà au catalogue (scripts/catalog/veille/), non recréée(s)`);
  }
  if (suffixees > 0) {
    console.log(`${suffixees} fiche(s) créée(s) sous un identifiant suffixé (titre déjà pris)`);
  }
  if (ignorees > 0) {
    console.log(`${ignorees} contenu(s) ignoré(s) (voir les avertissements ci-dessus)`);
  }
}

function migrer(dossiersDemandes) {
  const champs = chargerChamps();
  const dossiers = dossiersDemandes.length > 0
    ? dossiersDemandes.map((d) => path.resolve(d))
    : [WORKSPACE_DIR, CATALOG_VEILLE_DIR].filter((d) => fs.existsSync(d));
  let completees = 0;
  let ajour = 0;
  let illisibles = 0;
  for (const dossier of dossiers) {
    if (!fs.existsSync(dossier)) {
      console.error(`Dossier introuvable : ${dossier}`);
      process.exitCode = 1;
      continue;
    }
    for (const nom of fs.readdirSync(dossier).filter((f) => f.endsWith('.json')).sort()) {
      const chemin = path.join(dossier, nom);
      let fiche;
      try {
        fiche = JSON.parse(fs.readFileSync(chemin, 'utf-8'));
      } catch {
        illisibles += 1;
        console.error(`  ✕ ${nom} : fichier illisible, ignoré`);
        continue;
      }
      const { fiche: complete, ajoutes } = completerFiche(fiche, champs);
      if (ajoutes.length === 0) {
        ajour += 1;
        continue;
      }
      ecrire(chemin, complete);
      completees += 1;
    }
  }
  console.log(
    `${completees} fiche(s) complétée(s), ${ajour} déjà à jour ` +
      `(${dossiers.length} dossier(s)).`,
  );
  if (illisibles > 0) {
    console.log(`${illisibles} fichier(s) illisible(s) : corrige leur JSON puis relance.`);
    process.exitCode = 1;
  }
}

function main() {
  const [option, ...reste] = process.argv.slice(2);
  if (option === '--migrer') migrer(reste);
  else creer();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
