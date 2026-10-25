#!/usr/bin/env node
/**
 * Contrôle les liens des fiches de veille avec le reste du catalogue :
 *   - artistes     : noms comme dans le catalogue d'œuvres (avertissement sinon, avec suggestions) ;
 *   - museesIds    : identifiants de fiches musées (erreur si inconnu, avertissement si brouillon) ;
 *   - oeuvresLiees : identifiants Wikidata (Q…) d'œuvres du catalogue (erreur sinon) ;
 *   - champs à vocabulaire (thèmes, mouvements, époques, disciplines, type, statut, accès…) ;
 *   - champs obligatoires vides, clés inconnues, champs manquants.
 *
 * Usage :
 *   node scripts/verifier-liens-veille.mjs [dossier…] [--corriger] [--vocab dossier]
 *
 * Sans dossier : 0_workspace_veille/ et scripts/catalog/veille/ (s'il existe).
 * --corriger écrit dans les fiches l'orthographe exacte du catalogue pour les artistes dont le
 * nom ne diffère que par les accents, la casse ou la ponctuation (jamais pour une simple
 * ressemblance). Code de sortie 1 s'il y a des erreurs (✕), 0 sinon.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(__dirname, '..');
const FIELDS_FILE = path.join(__dirname, 'catalog', 'fields', 'veille.fields.json');
const VOCAB_DIR = path.join(__dirname, 'catalog', 'vocabularies');
const ARTWORKS_DIR = path.join(__dirname, 'catalog', 'artworks');
const MUSEES_DIR = path.join(__dirname, 'catalog', 'musees');
const MUSEES_BROUILLONS_DIR = path.join(RACINE, '0_workspace_musees');
const DOSSIERS_VEILLE = [
  path.join(RACINE, '0_workspace_veille'),
  path.join(__dirname, 'catalog', 'veille'),
];

/** Minuscules, sans accents ni ponctuation ; les lettres spéciales (œ, æ, ø, ß…) sont développées. */
export function normaliser(texte) {
  return String(texte)
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/ß/g, 'ss')
    .replace(/đ/g, 'd')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function distance(a, b) {
  const m = a.length;
  const n = b.length;
  let precedente = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const courante = [i];
    for (let j = 1; j <= n; j++) {
      courante[j] = Math.min(
        precedente[j] + 1,
        courante[j - 1] + 1,
        precedente[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    precedente = courante;
  }
  return precedente[n];
}

const estVide = (v) => v === null || v === undefined || v === '';

function lireJsonDossier(dossier) {
  if (!fs.existsSync(dossier)) return [];
  const fiches = [];
  for (const nom of fs.readdirSync(dossier).filter((f) => f.endsWith('.json')).sort()) {
    try {
      fiches.push({ nom, fiche: JSON.parse(fs.readFileSync(path.join(dossier, nom), 'utf-8')) });
    } catch {
      fiches.push({ nom, fiche: null });
    }
  }
  return fiches;
}

/** Ce que le catalogue sait : artistes (nom normalisé -> nom exact), œuvres, musées, vocabulaires. */
export function chargerContexte({ vocabDir = VOCAB_DIR } = {}) {
  const champs = JSON.parse(fs.readFileSync(FIELDS_FILE, 'utf-8')).champs;
  const artistes = new Map();
  const oeuvresIds = new Set();
  for (const { fiche } of lireJsonDossier(ARTWORKS_DIR)) {
    if (!fiche) continue;
    if (typeof fiche.id === 'string') oeuvresIds.add(fiche.id);
    if (typeof fiche.artiste === 'string' && fiche.artiste.trim() !== '') {
      artistes.set(normaliser(fiche.artiste), fiche.artiste.trim());
    }
  }
  const ids = (dossier) => new Set(lireJsonDossier(dossier).filter((x) => x.fiche?.id).map((x) => x.fiche.id));
  const vocabulaires = new Map();
  const manquants = new Set();
  for (const nom of new Set(champs.map((c) => c.vocabulaire).filter(Boolean))) {
    const chemin = path.join(vocabDir, `${nom}.json`);
    if (fs.existsSync(chemin)) {
      vocabulaires.set(nom, new Set(JSON.parse(fs.readFileSync(chemin, 'utf-8'))));
    }
    else manquants.add(nom);
  }
  return {
    champs, artistes, oeuvresIds, vocabulaires, vocabulairesManquants: manquants,
    museesIds: ids(MUSEES_DIR), museesBrouillons: ids(MUSEES_BROUILLONS_DIR),
  };
}

/** Noms du catalogue proches d'un nom inconnu : nom complet contenant le mot, ou orthographe voisine. */
export function suggererArtistes(nom, artistes) {
  const voulu = normaliser(nom);
  if (voulu === '') return [];
  const mots = voulu.split(' ');
  const trouves = [];
  for (const [norme, exact] of artistes) {
    if (norme === voulu) continue;
    const motsCatalogue = norme.split(' ');
    if (mots.length < motsCatalogue.length && mots.every((m) => motsCatalogue.includes(m))) {
      trouves.push({ exact, rang: 0, d: 0 });
    } else if (voulu.length >= 5 && distance(voulu, norme) <= 2) {
      trouves.push({ exact, rang: 1, d: distance(voulu, norme) });
    }
  }
  return trouves.sort((a, b) => a.rang - b.rang || a.d - b.d || a.exact.localeCompare(b.exact)).slice(0, 3).map((t) => t.exact);
}

const enListe = (v) => (Array.isArray(v) ? v : estVide(v) ? [] : [v]);

/** Contrôle une fiche : { erreurs, avertissements, corrections, manquants } (tableaux de textes). */
export function verifierFiche(fiche, ctx) {
  const erreurs = [];
  const avertissements = [];
  const corrections = {};
  const nomsChamps = new Set(ctx.champs.map((c) => c.nom));
  const manquants = ctx.champs.filter((c) => !(c.nom in fiche)).map((c) => c.nom);

  for (const champ of ctx.champs) {
    if (champ.nom in fiche && champ.obligatoire && estVide(fiche[champ.nom])) {
      erreurs.push(`${champ.nom} : champ obligatoire vide`);
    }
  }
  for (const cle of Object.keys(fiche)) {
    if (!nomsChamps.has(cle)) avertissements.push(`champ inconnu : ${cle}`);
  }

  // Champs à vocabulaire.
  for (const champ of ctx.champs.filter((c) => c.vocabulaire && c.nom in fiche)) {
    const liste = ctx.vocabulaires.get(champ.vocabulaire);
    if (!liste) continue;
    const estListe = Array.isArray(fiche[champ.nom]);
    if (champ.type === 'vocabulaire_liste' && !estListe && !estVide(fiche[champ.nom])) {
      erreurs.push(`${champ.nom} : une liste est attendue`);
      continue;
    }
    const valeurs = enListe(fiche[champ.nom]);
    for (const v of valeurs) {
      if (!liste.has(v)) {
        const proche = [...liste].find((x) => distance(normaliser(x), normaliser(String(v))) <= 2);
        const piste = proche ? ` (peut-être « ${proche} » ?)` : '';
        erreurs.push(
          `${champ.nom} : « ${v} » n'est pas dans le vocabulaire « ${champ.vocabulaire} »${piste}`,
        );
      }
    }
    if (champ.type === 'vocabulaire_liste' && new Set(valeurs).size !== valeurs.length) {
      avertissements.push(`${champ.nom} : valeur répétée`);
    }
  }

  // Artistes : le nom exact du catalogue.
  if ('artistes' in fiche) {
    const corriges = [];
    for (const nom of enListe(fiche.artistes)) {
      const exact = ctx.artistes.get(normaliser(nom));
      if (exact) {
        if (exact !== nom) {
          avertissements.push(`artistes : « ${nom} » s'écrit « ${exact} » dans le catalogue`);
        }
        corriges.push(exact);
      } else {
        const propositions = suggererArtistes(nom, ctx.artistes);
        const noms = propositions.map((p) => `« ${p} »`).join(' ou ');
        const piste = propositions.length > 0 ? ` — peut-être ${noms} ?` : '';
        avertissements.push(`artistes : « ${nom} » absent du catalogue${piste}`);
        corriges.push(nom);
      }
    }
    const sansDoublon = [...new Set(corriges)];
    if (sansDoublon.length !== corriges.length) avertissements.push('artistes : nom répété');
    if (JSON.stringify(sansDoublon) !== JSON.stringify(enListe(fiche.artistes))) corrections.artistes = sansDoublon;
  }

  // Musées.
  for (const id of enListe(fiche.museesIds)) {
    if (ctx.museesIds.has(id)) continue;
    if (ctx.museesBrouillons.has(id)) {
      avertissements.push(`museesIds : « ${id} » est encore un brouillon (pas promu)`);
    }
    else erreurs.push(`museesIds : « ${id} » ne correspond à aucune fiche musée`);
  }

  // Œuvres.
  for (const id of enListe(fiche.oeuvresLiees)) {
    if (typeof id !== 'string' || !/^Q[1-9]\d*$/.test(id)) {
      erreurs.push(
        `oeuvresLiees : « ${id} » n'est pas un identifiant Wikidata (Q suivi de chiffres)`,
      );
    } else if (!ctx.oeuvresIds.has(id)) {
      erreurs.push(`oeuvresLiees : ${id} n'est pas une œuvre du catalogue`);
    }
  }
  return { erreurs, avertissements, corrections, manquants };
}

function lireArguments(args) {
  const dossiers = [];
  const options = { corriger: false, vocab: VOCAB_DIR };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--corriger') options.corriger = true;
    else if (args[i] === '--vocab') options.vocab = path.resolve(args[++i] ?? '');
    else dossiers.push(path.resolve(args[i]));
  }
  return { dossiers, options };
}

function main() {
  const { dossiers: demandes, options } = lireArguments(process.argv.slice(2));
  const dossiers = demandes.length > 0 ? demandes : DOSSIERS_VEILLE.filter((d) => fs.existsSync(d));
  const ctx = chargerContexte({ vocabDir: options.vocab });
  let controlees = 0;
  let nbErreurs = 0;
  let nbAvertissements = 0;
  let sansNouveauxChamps = 0;
  let corrigees = 0;

  if (ctx.vocabulairesManquants.size > 0) {
    const fichiers = [...ctx.vocabulairesManquants].map((v) => `${v}.json`).join(', ');
    console.log(`⚠ Vocabulaire(s) introuvable(s) dans ${options.vocab} : ${fichiers}`);
    console.log(
      '  (les champs concernés ne sont pas contrôlés ; ' +
        '--vocab <dossier> pour indiquer le bon dossier)\n',
    );
  }
  for (const dossier of dossiers) {
    if (!fs.existsSync(dossier)) {
      console.error(`Dossier introuvable : ${dossier}`);
      process.exitCode = 1;
      continue;
    }
    for (const { nom, fiche } of lireJsonDossier(dossier)) {
      controlees += 1;
      const libelle = `${nom.replace(/\.json$/, '')} (${path.basename(dossier)})`;
      if (!fiche) {
        nbErreurs += 1;
        console.log(`\n${libelle}\n  ✕ fichier illisible (JSON invalide)`);
        continue;
      }
      const r = verifierFiche(fiche, ctx);
      nbErreurs += r.erreurs.length;
      nbAvertissements += r.avertissements.length;
      if (r.manquants.length > 0) sansNouveauxChamps += 1;
      if (r.erreurs.length + r.avertissements.length > 0) {
        console.log(`\n${libelle}`);
        r.erreurs.forEach((e) => console.log(`  ✕ ${e}`));
        r.avertissements.forEach((a) => console.log(`  ⚠ ${a}`));
      }
      if (options.corriger && Object.keys(r.corrections).length > 0) {
        const complete = { ...fiche, ...r.corrections };
        const chemin = path.join(dossier, nom);
        fs.writeFileSync(chemin, JSON.stringify(complete, null, 2) + '\n', 'utf-8');
        corrigees += 1;
        console.log('  → orthographe du catalogue appliquée');
      }
    }
  }
  console.log(
    `\n${controlees} fiche(s) contrôlée(s) · ${nbErreurs} erreur(s) · ` +
      `${nbAvertissements} avertissement(s)`,
  );
  if (sansNouveauxChamps > 0) {
    console.log(
      `${sansNouveauxChamps} fiche(s) n'ont pas tous les champs : ` +
        'node scripts/generate-fiches-veille.mjs --migrer',
    );
  }
  if (corrigees > 0) console.log(`${corrigees} fiche(s) corrigée(s)`);
  if (nbErreurs > 0) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
