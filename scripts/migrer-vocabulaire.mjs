#!/usr/bin/env node
/**
 * Met les fiches existantes en conformité avec une nouvelle version d'un vocabulaire.
 *
 *   node scripts/migrer-vocabulaire.mjs <vocabulaire> [--ecrire]
 *
 * Vocabulaires pris en charge : mouvements, themes.
 *
 * Pour chaque valeur d'une fiche qui n'est plus dans scripts/catalog/vocabularies/<nom>.json :
 *   - la table scripts/catalog/registres/migration_<nom>.json donne la correspondance :
 *       { "ancienne valeur": "nouvelle valeur" }   remplacement
 *       { "ancienne valeur": null }                suppression de la valeur
 *   - sans entrée dans la table, la valeur est signalée et laissée en place (à traiter).
 *
 * Sans --ecrire, simulation : rien n'est modifié. Code de sortie 1 s'il reste des valeurs sans
 * correspondance (ou des fichiers illisibles), 0 sinon.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(__dirname, '..');
const CATALOG = path.join(__dirname, 'catalog');
const VOCAB_DIR = path.join(CATALOG, 'vocabularies');
const REGISTRES_DIR = path.join(CATALOG, 'registres');

const rel = (...morceaux) => path.join(RACINE, ...morceaux);
export const CIBLES = {
  mouvements: [
    { type: 'expositions', dossiers: [rel('scripts', 'catalog', 'expositions'), rel('0_workspace_expositions')], champ: 'mouvements', liste: true },
    { type: 'artistes', dossiers: [rel('scripts', 'catalog', 'artistes'), rel('0_workspace_artistes')], champ: 'mouvements', liste: true },
    { type: 'veille', dossiers: [rel('scripts', 'catalog', 'veille'), rel('0_workspace_veille')], champ: 'mouvements', liste: true },
    { type: 'œuvres', dossiers: [rel('scripts', 'catalog', 'artworks')], champ: 'mouvement', liste: false },
  ],
  themes: [
    { type: 'œuvres', dossiers: [rel('scripts', 'catalog', 'artworks')], champ: 'themes', liste: true },
    { type: 'veille', dossiers: [rel('scripts', 'catalog', 'veille'), rel('0_workspace_veille')], champ: 'themesLies', liste: true },
  ],
};

/**
 * Corrige le champ d'une fiche. Retourne { fiche, changements: [{ de, vers }], sansCorrespondance: [valeur] }.
 * vocabulaire : Set des valeurs actuelles ; table : { ancienne: nouvelle | null }.
 */
export function migrerFiche(fiche, cible, vocabulaire, table) {
  const valeur = fiche[cible.champ];
  const changements = [];
  const sansCorrespondance = [];
  const traiter = (v) => {
    if (typeof v !== 'string' || vocabulaire.has(v)) return [v];
    if (Object.hasOwn(table, v)) {
      changements.push({ de: v, vers: table[v] });
      return table[v] === null ? [] : [table[v]];
    }
    sansCorrespondance.push(v);
    return [v];
  };
  let resultat = valeur;
  if (cible.liste && Array.isArray(valeur)) {
    resultat = [...new Set(valeur.flatMap(traiter))];
  } else if (!cible.liste && typeof valeur === 'string' && valeur !== '') {
    const [nouveau] = traiter(valeur);
    resultat = nouveau ?? null;
  }
  return { fiche: changements.length > 0 ? { ...fiche, [cible.champ]: resultat } : fiche, changements, sansCorrespondance };
}

function lireJson(chemin, description) {
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf-8'));
  } catch (e) {
    console.error(`${description} introuvable ou illisible : ${chemin} (${e.message})`);
    process.exit(1);
  }
}

function compterPar(liste, cle) {
  const total = new Map();
  for (const x of liste) total.set(x[cle], (total.get(x[cle]) ?? 0) + 1);
  return [...total].map(([k, n]) => `${k} : ${n}`).join(', ');
}

function main() {
  const [nom, ...options] = process.argv.slice(2);
  const ecrire = options.includes('--ecrire');
  if (!nom || !CIBLES[nom]) {
    console.log(`Usage : node scripts/migrer-vocabulaire.mjs <${Object.keys(CIBLES).join(' | ')}> [--ecrire]`);
    process.exit(nom ? 1 : 0);
  }
  const vocabulaire = new Set(lireJson(path.join(VOCAB_DIR, `${nom}.json`), `Vocabulaire "${nom}"`));
  const fichierTable = path.join(REGISTRES_DIR, `migration_${nom}.json`);
  const table = fs.existsSync(fichierTable) ? lireJson(fichierTable, 'Table de migration') : {};
  const incoherentes = Object.entries(table).filter(([, vers]) => vers !== null && !vocabulaire.has(vers));
  if (incoherentes.length > 0) {
    console.error(`La table de migration vise des valeurs absentes du vocabulaire « ${nom} » :`);
    incoherentes.forEach(([de, vers]) => console.error(`  « ${de} » → « ${vers} »`));
    process.exit(1);
  }
  console.log(`Vocabulaire « ${nom} » : ${vocabulaire.size} valeurs. Table de migration : ${Object.keys(table).length} correspondance(s).${ecrire ? '' : '  (simulation)'}\n`);

  const modifications = [];
  const orphelines = [];
  let illisibles = 0;
  let controlees = 0;
  const aEcrire = [];
  for (const cible of CIBLES[nom]) {
    for (const dossier of cible.dossiers) {
      if (!fs.existsSync(dossier)) continue;
      for (const fichier of fs.readdirSync(dossier).filter((f) => f.endsWith('.json')).sort()) {
        const chemin = path.join(dossier, fichier);
        let fiche;
        try {
          fiche = JSON.parse(fs.readFileSync(chemin, 'utf-8'));
        } catch {
          illisibles += 1;
          console.error(`  ✕ ${path.relative(RACINE, chemin)} : JSON illisible, ignoré`);
          continue;
        }
        controlees += 1;
        const r = migrerFiche(fiche, cible, vocabulaire, table);
        for (const c of r.changements) modifications.push({ ...c, type: cible.type });
        for (const v of r.sansCorrespondance) orphelines.push({ valeur: v, type: cible.type });
        if (r.changements.length > 0) aEcrire.push({ chemin, fiche: r.fiche });
      }
    }
  }
  console.log(`${controlees} fiche(s) contrôlée(s).`);

  if (modifications.length > 0) {
    console.log(`\n${ecrire ? 'MODIFIÉ' : 'À MODIFIER'} :`);
    const groupes = new Map();
    for (const m of modifications) {
      const cle = `${m.de}\u0000${m.vers}`;
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(m);
    }
    for (const liste of groupes.values()) {
      console.log(`  ${liste[0].de} → ${liste[0].vers === null ? '(supprimé)' : liste[0].vers} : ${liste.length} fiche(s) (${compterPar(liste, 'type')})`);
    }
  }
  if (orphelines.length > 0) {
    console.log('\nSANS CORRESPONDANCE (valeurs laissées en place, à traiter) :');
    const parValeur = new Map();
    for (const o of orphelines) parValeur.set(o.valeur, [...(parValeur.get(o.valeur) ?? []), o]);
    for (const [valeur, liste] of parValeur) {
      console.log(`  ${valeur} : ${liste.length} fiche(s) (${compterPar(liste, 'type')})`);
    }
    console.log(`  → ajoute-les dans scripts/catalog/registres/migration_${nom}.json : "valeur": "nouvelle valeur"  (ou null pour la supprimer)`);
  }
  if (modifications.length === 0 && orphelines.length === 0) console.log('\nToutes les fiches sont conformes au vocabulaire.');

  if (ecrire) {
    for (const { chemin, fiche } of aEcrire) fs.writeFileSync(chemin, JSON.stringify(fiche, null, 2) + '\n', 'utf-8');
    console.log(`\n${aEcrire.length} fiche(s) modifiée(s).`);
  } else if (aEcrire.length > 0) {
    console.log(`\n${aEcrire.length} fiche(s) seraient modifiée(s) : ajoute --ecrire pour appliquer.`);
  }
  if (orphelines.length > 0 || illisibles > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
