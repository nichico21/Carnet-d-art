#!/usr/bin/env node
/**
 * Fiches artistes : inventaire, création depuis le catalogue d'œuvres, complément par Wikidata,
 * promotion, génération des données de l'application.
 *
 *   node scripts/artistes.mjs inventaire
 *       combien d'artistes distincts dans le catalogue d'œuvres, et quels noms demandent un
 *       examen. Ne touche à aucune fiche.
 *   node scripts/artistes.mjs nettoyer-noms [--ecrire]
 *       remplace par « Artiste inconnu » les adresses techniques de créateurs inconnus
 *       (…/.well-known/genid/…). Sans --ecrire : simulation.
 *   node scripts/artistes.mjs depuis-catalogue [--min N] [--limite N] [--reessayer]
 *       brouillons (0_workspace_artistes/) pour les artistes du catalogue qui n'ont pas de fiche :
 *       le créateur de chaque œuvre est lu sur Wikidata. --limite N pour un essai sur N artistes.
 *       Les noms sans créateur ou dont le créateur n'est pas une personne sont mémorisés
 *       (registres/artistes_ignores.json) pour ne pas être réexaminés ; --reessayer les revoit.
 *   node scripts/artistes.mjs creer "<Q… | page Wikipédia ou Wikidata>" [--nom-catalogue "Nom"]
 *       brouillon pour un artiste choisi, même sans œuvre au catalogue ; --nom-catalogue (répétable)
 *       indique sous quel nom ses œuvres figurent dans le catalogue (utile pour trancher un nom ambigu)
 *   node scripts/artistes.mjs corriger-noms [--ecrire] [--variantes]
 *       remplace dans les fiches d'œuvres les noms codés (« Q155626 (à corriger) ») par le nom de la
 *       fiche artiste promue ; --variantes ramène aussi les autres graphies au nom de la fiche
 *   node scripts/artistes.mjs inconnus
 *       liste les œuvres à créateur inconnu, avec un lien Wikidata pour vérifier ou attribuer
 *   node scripts/artistes.mjs completer <id> ["Q… ou page"] | --tous  [--force]
 *       remplit les champs vides d'une fiche (--force : met à jour dates et lieu de naissance)
 *   node scripts/artistes.mjs promouvoir [id…] [--min-oeuvres N] [--simuler]
 *       sans argument : tous les brouillons valides ; avec des identifiants (claude-monet) et/ou
 *       --min-oeuvres N : seulement ceux-là ; --simuler montre ce qui serait promu sans rien déplacer
 *       vérifie les brouillons et déplace les valides dans scripts/catalog/artistes/
 *   node scripts/artistes.mjs generer
 *       écrit src/data/artistes.generated.ts et affiche le bilan
 *   node scripts/artistes.mjs inspecter [id ou nom]
 *       ce qu'il reste à renseigner, fiche par fiche
 *   node scripts/artistes.mjs synchroniser
 *       après l'ajout d'œuvres : brouillons pour les nouveaux artistes + génération
 *
 * Hors ligne : --sans-wikidata, ou la variable ARTISTES_SANS_RESEAU=1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG, estVide, lireJson, validerFiche } from './lib-expositions.mjs';
import { slugifier } from './fetch-exposition-by-url.mjs';
import { extraireCible, resoudreQid } from './wikidata-musees.mjs';
import { createursDesOeuvres, lireArtistes, normaliser } from './wikidata-artistes.mjs';
import { inspecterFiche, lireDossier, nettoyerBrouillon, regionDe, verifierEnsemble } from './musees.mjs';

export { normaliser };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTWORKS_DIR = path.join(__dirname, 'catalog', 'artworks');
const OUTPUT_FILE = path.join(__dirname, 'output', 'artistes-inventaire.json');
const ARTISTES_DIR = path.join(CATALOG, 'artistes');
const BROUILLONS_DIR = path.join(__dirname, '..', '0_workspace_artistes');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'artistes.generated.ts');
const CHAMPS_FILE = path.join(CATALOG, 'fields', 'artiste.fields.json');
const VOCAB_DIR = path.join(CATALOG, 'vocabularies');
const REGISTRES_DIR = path.join(CATALOG, 'registres');
const MUSEES_DIR = path.join(CATALOG, 'musees');
const IGNORES_FILE = path.join(CATALOG, 'registres', 'artistes_ignores.json');
export const TAILLE_GROUPE = 20; // artistes lus puis enregistrés ensemble
const NOM_INCONNU = 'Artiste inconnu';
const TOP = 15;
const MAX_ALERTES_AFFICHEES = 40;

// Les limites de mot de JavaScript (\\b) ignorent les lettres accentuées (« École ») : on les
// remplace par des tests sur les lettres Unicode.
const ANONYME = /(?<!\p{L})(?:anonym|unknown|inconnu|non identifi)/iu;
const ATELIER = new RegExp(
  '(?<!\\p{L})(?:(?:atelier|workshop|studio|ecole|école|school|entourage|suiveur|follower|' +
    'cercle|circle|copie|copy|imitateur|assistants?|after)(?!\\p{L})|' +
    "d['’]apr[eè]s|attribu|manner of|style of)",
  'iu',
);

const MOTIFS = [
  [ANONYME, 'anonyme ou inconnu'],
  [ATELIER, 'atelier, école, copie ou attribution'],
  [/\s+et\s+|\s+and\s+|\s*&\s*|\s*;\s*|\s+\/\s+/i, 'plusieurs artistes ?'],
  [/^[^,]+,[^,]+$/, 'format « Nom, Prénom » ?'],
  [/[()]/, 'précision entre parenthèses'],
  [/\d/, 'chiffre dans le nom'],
];

const GENID = /^https?:\/\/www\.wikidata\.org\/\.well-known\/genid\/[0-9a-f]+$/i;
const QID_NON_RESOLU = /^Q[1-9]\d*(?:\s*\(à corriger\))?$/;

/** 'genid' (créateur inconnu codé en adresse), 'qid' (identifiant sans nom) ou null. */
export function typeDeNomTechnique(nom) {
  if (GENID.test(nom)) return 'genid';
  if (QID_NON_RESOLU.test(nom)) return 'qid';
  return null;
}

/** Raisons pour lesquelles un nom n'est sans doute pas celui d'un artiste unique. */
export function alertesDeNom(nom) {
  const technique = typeDeNomTechnique(nom);
  if (technique === 'genid') return ['créateur inconnu (adresse technique Wikidata)'];
  if (technique === 'qid') return ['identifiant Wikidata à la place du nom'];
  const alertes = MOTIFS.filter(([motif]) => motif.test(nom)).map(([, raison]) => raison);
  if (nom.length > 60) alertes.push('nom très long');
  return alertes;
}

/** Résumé des artistes d'une liste d'œuvres (champ "artiste"). */
export function inventorier(oeuvres) {
  const parNom = new Map();
  let sansArtiste = 0;
  for (const oeuvre of oeuvres) {
    const nom = typeof oeuvre.artiste === 'string' ? oeuvre.artiste.trim() : '';
    if (nom === '') {
      sansArtiste += 1;
      continue;
    }
    if (!parNom.has(nom)) parNom.set(nom, { nom, oeuvres: 0, ids: [] });
    const entree = parNom.get(nom);
    entree.oeuvres += 1;
    if (oeuvre.id) entree.ids.push(oeuvre.id);
  }
  const artistes = [...parNom.values()]
    .map((a) => ({ ...a, alertes: alertesDeNom(a.nom) }))
    .sort((a, b) => b.oeuvres - a.oeuvres || a.nom.localeCompare(b.nom, 'fr'));

  const groupes = new Map();
  for (const a of artistes) {
    const cle = normaliser(a.nom);
    groupes.set(cle, [...(groupes.get(cle) ?? []), a.nom]);
  }
  const variantes = [...groupes.values()].filter((noms) => noms.length > 1);
  const compte = (min, max) => artistes.filter((a) => a.oeuvres >= min && a.oeuvres <= max).length;
  return {
    oeuvres: oeuvres.length,
    sansArtiste,
    artistes,
    variantes,
    repartition: {
      une: compte(1, 1),
      deuxACinq: compte(2, 5),
      sixADix: compte(6, 10),
      plusDeDix: compte(11, Infinity),
    },
  };
}

function lireOeuvres() {
  const oeuvres = [];
  let illisibles = 0;
  for (const nom of fs.readdirSync(ARTWORKS_DIR).filter((f) => f.endsWith('.json')).sort()) {
    try {
      oeuvres.push(JSON.parse(fs.readFileSync(path.join(ARTWORKS_DIR, nom), 'utf-8')));
    } catch {
      illisibles += 1;
    }
  }
  return { oeuvres, illisibles };
}

function commandeInventaire() {
  if (!fs.existsSync(ARTWORKS_DIR)) {
    console.error(`Dossier introuvable : ${ARTWORKS_DIR}`);
    process.exit(1);
  }
  const { oeuvres, illisibles } = lireOeuvres();
  const r = inventorier(oeuvres);
  if (r.oeuvres === 0) {
    console.log("Aucune œuvre dans le catalogue : rien à inventorier.");
    return;
  }
  const genid = r.artistes.filter((a) => typeDeNomTechnique(a.nom) === 'genid');
  const nonResolus = r.artistes.filter((a) => typeDeNomTechnique(a.nom) === 'qid');
  const techniques = new Set([...genid, ...nonResolus]);
  const total = (liste) => liste.reduce((somme, a) => somme + a.oeuvres, 0);

  const attribuees = r.oeuvres - r.sansArtiste;
  const moyenne = r.artistes.length > 0
    ? (attribuees / r.artistes.length).toFixed(1).replace('.', ',')
    : '0';
  console.log(
    `${r.artistes.length} artiste(s) distinct(s) pour ${r.oeuvres} œuvre(s) ` +
      `(en moyenne ${moyenne} œuvre(s) par artiste).`,
  );
  if (techniques.size > 0) {
    console.log(
      `  dont ${techniques.size} nom(s) technique(s), ` +
        'qui ne sont pas des artistes (voir plus bas)',
    );
  }
  console.log(
    `  1 œuvre : ${r.repartition.une} · 2 à 5 : ${r.repartition.deuxACinq} · ` +
      `6 à 10 : ${r.repartition.sixADix} · plus de 10 : ${r.repartition.plusDeDix}`,
  );
  if (r.sansArtiste > 0) console.log(`  ⚠ ${r.sansArtiste} œuvre(s) sans nom d'artiste`);
  if (illisibles > 0) console.log(`  ⚠ ${illisibles} fichier(s) d'œuvre illisible(s), ignoré(s)`);

  const classement = r.artistes.filter((a) => !techniques.has(a));
  console.log(`\nLes ${Math.min(TOP, classement.length)} artistes les plus présents :`);
  for (const a of classement.slice(0, TOP)) {
    console.log(`  ${String(a.oeuvres).padStart(3)}  ${a.nom}`);
  }

  if (genid.length > 0) {
    console.log(
      `\n⚠ ${total(genid)} œuvre(s) dont le créateur est inconnu ` +
        'sont notées avec une adresse technique Wikidata.',
    );
    console.log(
      '  Pour les remplacer par « Artiste inconnu » : ' +
        'node scripts/artistes.mjs nettoyer-noms',
    );
  }
  if (nonResolus.length > 0) {
    const sansMarque = (nom) => nom.replace(/\s*\(à corriger\)/, '');
    const liste = nonResolus.map((a) => `${sansMarque(a.nom)} (${a.oeuvres})`).join(', ');
    console.log(
      `\n⚠ ${nonResolus.length} artiste(s) (${total(nonResolus)} œuvre(s)) ` +
        `notés par un identifiant Wikidata, sans nom : ${liste}`,
    );
    console.log('  Leur nom sera retrouvé automatiquement à la création des fiches artistes.');
  }
  const aExaminer = r.artistes.filter((a) => a.alertes.length > 0 && !techniques.has(a));
  if (aExaminer.length > 0) {
    console.log(
      `\nÀ examiner (${aExaminer.length}) : ` +
        'ces noms ne désignent sans doute pas un artiste unique :',
    );
    for (const a of aExaminer.slice(0, MAX_ALERTES_AFFICHEES)) {
      console.log(`  « ${a.nom} » (${a.oeuvres}) — ${a.alertes.join(', ')}`);
    }
    if (aExaminer.length > MAX_ALERTES_AFFICHEES) {
      const reste = aExaminer.length - MAX_ALERTES_AFFICHEES;
      console.log(`  … et ${reste} autre(s) (voir le fichier de détail)`);
    }
  }
  if (r.variantes.length > 0) {
    console.log(`\nVariantes d'orthographe à rapprocher (${r.variantes.length}) :`);
    for (const noms of r.variantes) console.log(`  ${noms.map((n) => `« ${n} »`).join('  /  ')}`);
  }
  if (aExaminer.length === 0 && r.variantes.length === 0 && techniques.size === 0) {
    console.log(`\nAucun nom à examiner.`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  const detail = { date: new Date().toISOString().slice(0, 10), ...r };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(detail, null, 2) + '\n', 'utf-8');
  console.log(`\nDétail complet : scripts/output/artistes-inventaire.json`);
}

/** Remplace dans le texte d'un fichier le nom technique par « Artiste inconnu ». */
export function remplacerNom(texte, ancien, nouveau = NOM_INCONNU) {
  const motif = JSON.stringify(ancien);
  if (texte.split(motif).length === 2) return texte.replace(motif, JSON.stringify(nouveau));
  const fiche = JSON.parse(texte);
  return JSON.stringify({ ...fiche, artiste: nouveau }, null, 2) + '\n';
}

function commandeNettoyerNoms(args) {
  const ecrire = args.includes('--ecrire');
  if (!fs.existsSync(ARTWORKS_DIR)) {
    console.error(`Dossier introuvable : ${ARTWORKS_DIR}`);
    process.exit(1);
  }
  const aCorriger = [];
  let nonResolus = 0;
  for (const nom of fs.readdirSync(ARTWORKS_DIR).filter((f) => f.endsWith('.json')).sort()) {
    const chemin = path.join(ARTWORKS_DIR, nom);
    let fiche;
    try {
      fiche = JSON.parse(fs.readFileSync(chemin, 'utf-8'));
    } catch {
      continue;
    }
    const type = typeof fiche.artiste === 'string' ? typeDeNomTechnique(fiche.artiste) : null;
    if (type === 'genid') aCorriger.push({ chemin, nom: fiche.artiste, id: fiche.id ?? nom });
    if (type === 'qid') nonResolus += 1;
  }
  if (aCorriger.length === 0) {
    console.log('Aucun nom technique à corriger.');
  } else {
    console.log(`${aCorriger.length} œuvre(s) à corriger : adresse technique → « ${NOM_INCONNU} »`);
    const ids = aCorriger.slice(0, 10).map((a) => a.id).join(', ');
    console.log(`  ${ids}${aCorriger.length > 10 ? ', …' : ''}`);
    if (ecrire) {
      for (const a of aCorriger) {
        const texte = fs.readFileSync(a.chemin, 'utf-8');
        fs.writeFileSync(a.chemin, remplacerNom(texte, a.nom), 'utf-8');
      }
      console.log(`${aCorriger.length} fiche(s) modifiée(s).`);
      console.log(
        'Relance ensuite : node scripts/build-app-data.mjs ' +
          "(pour mettre à jour l'application).",
      );
    } else {
      console.log('(simulation : aucun fichier modifié — ajoute --ecrire pour appliquer)');
    }
  }
  if (nonResolus > 0) {
    console.log(
      `${nonResolus} œuvre(s) ont un identifiant Wikidata à la place du nom : ` +
        'non touchées (à résoudre via les fiches artistes).',
    );
  }
}

// ================================================================ fiches artistes

const estListe = (champ) => champ.type === 'liste_texte' || champ.type === 'vocabulaire_liste';
const FAITS_REFAITS = ['naissance', 'deces', 'datesApproximatives', 'villeNaissance', 'paysNaissance'];
const FORMAT_DATE = /^-?\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/;
const OPTIONS_SANS_VALEUR = new Set(['force', 'tous', 'sans-wikidata', 'ecrire', 'reessayer', 'variantes', 'simuler']);
const OPTIONS_REPETABLES = new Set(['nom-catalogue']);
const DECOUPAGE_EPOQUES = [
  ['Antiquité', -Infinity, 475], ['Moyen Âge', 476, 1400], ['XVe siècle', 1401, 1500],
  ['XVIe siècle', 1501, 1600], ['XVIIe siècle', 1601, 1700], ['XVIIIe siècle', 1701, 1800],
  ['XIXe siècle', 1801, 1900], ['XXe siècle', 1901, 2000], ['XXIe siècle', 2001, Infinity],
];

function jourLocalISO() {
  const d = new Date();
  const deux = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

/**
 * Noms d'artiste déjà examinés sans résultat (aucun créateur sur Wikidata, créateur qui n'est pas
 * une personne) : on ne les réinterroge pas à chaque synchronisation. Fichier modifiable à la main
 * (retire une ligne pour réessayer ; --reessayer ignore la liste le temps d'une commande).
 */
export function chargerIgnores() {
  if (!fs.existsSync(IGNORES_FILE)) return new Map();
  const brut = lireJson(IGNORES_FILE, 'Liste des noms d\'artiste ignorés');
  return new Map(Object.entries(brut).map(([nom, raison]) => [normaliser(nom), { nom, raison }]));
}

/** Noms mis de côté parce que leurs œuvres se partagent entre plusieurs créateurs, et pas encore tranchés. */
export function nomsATrancher(ignores, fiches) {
  const index = indexDesNoms(fiches);
  return [...ignores.values()].filter((x) => x.raison.startsWith('ambigu') && !index.has(normaliser(x.nom)));
}

function afficherATrancher(noms) {
  if (noms.length === 0) return;
  const liste = noms.slice(0, 5).map((x) => `« ${x.nom} »`).join(', ');
  console.log(`\n⚠ ${noms.length} nom(s) d'artiste à trancher (plusieurs créateurs sur Wikidata) : ${liste}${noms.length > 5 ? '…' : ''}`);
  console.log('  Détails et commandes : node scripts/artistes.mjs depuis-catalogue --reessayer');
}

function memoriserIgnores(aIgnorer) {
  if (aIgnorer.length === 0) return;
  const actuel = fs.existsSync(IGNORES_FILE) ? lireJson(IGNORES_FILE, 'Liste des noms d\'artiste ignorés') : {};
  for (const { nom, raison } of aIgnorer) actuel[nom] = raison;
  fs.mkdirSync(path.dirname(IGNORES_FILE), { recursive: true });
  fs.writeFileSync(IGNORES_FILE, JSON.stringify(actuel, null, 2) + '\n', 'utf-8');
}

function reseauActif(options) {
  return !options['sans-wikidata'] && process.env.ARTISTES_SANS_RESEAU !== '1';
}

function lireOptions(args) {
  const options = {};
  const positionnels = [];
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) positionnels.push(args[i]);
    else if (OPTIONS_SANS_VALEUR.has(args[i].slice(2))) options[args[i].slice(2)] = true;
    else if (OPTIONS_REPETABLES.has(args[i].slice(2))) (options[args[i].slice(2)] ??= []).push(args[++i]);
    else options[args[i].slice(2)] = args[++i];
  }
  return { options, positionnels };
}

function messageWikidata(e) {
  if (/réponse (429|503)/.test(e.message)) {
    return `${e.message} : Wikidata limite le rythme des requêtes. Attends une minute et relance la même commande.`;
  }
  if (/délai dépassé|réseau :/.test(e.message)) {
    return `${e.message}. Relance la même commande : ce qui a déjà été enregistré est conservé.`;
  }
  return e.message;
}

export function chargerModele() {
  const champs = lireJson(CHAMPS_FILE, 'Fichier de champs des artistes').champs;
  const vocabulaires = {};
  for (const champ of champs) {
    if (champ.vocabulaire && !vocabulaires[champ.vocabulaire]) {
      vocabulaires[champ.vocabulaire] = lireJson(
        path.join(VOCAB_DIR, `${champ.vocabulaire}.json`),
        `Vocabulaire "${champ.vocabulaire}"`,
      );
    }
  }
  return { champs, ctx: { musees: [], vocabulaires } };
}

/** Tables de correspondance (modifiables dans scripts/catalog/registres/). */
export function chargerTables(vocabulaires) {
  const lire = (nom, description) => lireJson(path.join(REGISTRES_DIR, nom), description);
  const regions = lire('pays_regions.json', 'Table pays/régions');
  const mouvements = new Map(
    Object.entries(lire('mouvements_wikidata.json', 'Table des mouvements Wikidata')).map(([l, v]) => [normaliser(l), v]),
  );
  for (const v of vocabulaires.mouvements ?? []) {
    if (!mouvements.has(normaliser(v))) mouvements.set(normaliser(v), v);
  }
  return {
    regions,
    mouvements,
    nationalites: new Map(Object.entries(lire('nationalites.json', 'Table des nationalités')).map(([l, v]) => [normaliser(l), v])),
    pays: new Map(Object.keys(regions).map((p) => [normaliser(p), p])),
    disciplines: lire('disciplines_wikidata.json', 'Table des disciplines Wikidata'),
  };
}

// ---------------------------------------------------------------- dates, âge, époques

/** Année d'une date partielle ("1832-01-23", "1832", "-0450"), ou null. */
export function anneeDeDate(date) {
  const m = String(date ?? '').match(/^(-?)(\d{4})/);
  return m ? (m[1] ? -1 : 1) * parseInt(m[2], 10) : null;
}

/** Âge en années (au décès, ou aujourd'hui), ou null si impossible ou douteux. */
export function ageDe(naissance, deces, aujourdhui = new Date()) {
  const n = anneeDeDate(naissance);
  if (n === null) return null;
  const complete = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d ?? ''));
  let fin;
  let finComplete = null;
  if (deces) {
    fin = anneeDeDate(deces);
    if (complete(deces)) finComplete = deces;
  } else {
    fin = aujourdhui.getFullYear();
    if (fin - n > 110) return null;
    finComplete = aujourdhui.toISOString().slice(0, 10);
  }
  if (fin === null) return null;
  if (complete(naissance) && finComplete) {
    const anniversairePasse = finComplete.slice(5) >= naissance.slice(5);
    return fin - n - (anniversairePasse ? 0 : 1);
  }
  return fin - n;
}

/**
 * Époques d'un artiste, déduites de ses dates : on prend sa période d'activité (de 20 ans après
 * la naissance jusqu'au décès, ou jusqu'à 70 ans s'il est vivant) et on retient chaque époque qui
 * en couvre au moins 30 %. Avec "vocabulaire", seuls les noms de la liste sont retournés.
 */
export function epoquesDepuis(naissance, deces, { annee = new Date().getFullYear(), vocabulaire = null, seuil = 0.3 } = {}) {
  const n = anneeDeDate(naissance);
  const d = anneeDeDate(deces);
  const ne = n ?? (d !== null ? d - 60 : null);
  if (ne === null) return [];
  const fin = d ?? Math.min(annee, ne + 70);
  const debut = Math.min(ne + 20, fin);
  const total = fin - debut + 1;
  const parts = DECOUPAGE_EPOQUES.map(([nom, a, b]) => [nom, Math.max(0, Math.min(fin, b) - Math.max(debut, a) + 1) / total]);
  const retenues = parts.filter(([, p]) => p >= seuil);
  const noms = (retenues.length > 0 ? retenues : [[...parts].sort((x, y) => y[1] - x[1])[0]]).map(([nom]) => nom);
  return vocabulaire ? noms.filter((nom) => vocabulaire.includes(nom)) : noms;
}

// ---------------------------------------------------------------- fiches : lecture, contrôle, ensemble

function toutesLesFiches() {
  const entrees = [];
  for (const dossier of [ARTISTES_DIR, BROUILLONS_DIR]) {
    for (const x of lireDossier(dossier)) {
      if (x.fiche) {
        entrees.push({ source: `${path.basename(dossier)}/${x.fichier}`, fiche: x.fiche, dossier, fichier: x.fichier });
      }
    }
  }
  return entrees;
}

/** Contrôle d'une fiche : le contrôle commun des fiches, plus les dates partielles. */
export function validerArtiste(fiche, champs, ctx) {
  const erreurs = validerFiche(fiche, champs, ctx);
  for (const champ of ['naissance', 'deces']) {
    const v = fiche[champ];
    if (estVide(v)) continue;
    const valide = typeof v === 'string' && FORMAT_DATE.test(v) && (v.length < 10 || estJourReel(v));
    if (!valide) erreurs.push(`"${champ}" : AAAA, AAAA-MM ou AAAA-MM-JJ valide attendu (reçu : ${JSON.stringify(v)})`);
  }
  const n = anneeDeDate(fiche.naissance);
  const d = anneeDeDate(fiche.deces);
  if (n !== null && d !== null && FORMAT_DATE.test(fiche.naissance) && FORMAT_DATE.test(fiche.deces)) {
    if (d < n || (d === n && fiche.deces.slice(0, 10) < fiche.naissance.slice(0, 10))) {
      erreurs.push('"deces" est antérieur à "naissance"');
    }
  }
  return erreurs;
}

function estJourReel(date) {
  const [a, m, j] = date.replace(/^-/, '').split('-').map(Number);
  const d = new Date(Date.UTC(2000, m - 1, j));
  d.setUTCFullYear(a);
  return d.getUTCMonth() === m - 1 && d.getUTCDate() === j;
}

/** Noms (normalisés) connus par un ensemble de fiches : nom d'usage et noms du catalogue. */
export function indexDesNoms(fiches) {
  const index = new Map();
  for (const f of fiches) {
    for (const n of [f.nom, ...(Array.isArray(f.nomsCatalogue) ? f.nomsCatalogue : [])]) {
      if (typeof n === 'string' && normaliser(n) !== '') index.set(normaliser(n), f.id);
    }
  }
  return index;
}

/** Fiche -> objet Artiste de l'app (champs vides omis, listes toujours présentes). */
export function versArtiste(fiche, champs, regions = {}) {
  const resultat = {};
  for (const champ of champs) {
    const valeur = fiche[champ.nom];
    if (estListe(champ)) resultat[champ.nom] = estVide(valeur) ? [] : valeur;
    else if (!estVide(valeur)) resultat[champ.nom] = valeur;
  }
  const pays = (fiche.nationalites ?? []).find((p) => regionDe(p, regions)) ?? fiche.paysNaissance;
  const region = regionDe(pays, regions);
  if (region) resultat.region = region;
  const an = anneeDeDate(fiche.naissance);
  if (an !== null) resultat.anneeNaissance = an;
  const ad = anneeDeDate(fiche.deces);
  if (ad !== null) resultat.anneeDeces = ad;
  return resultat;
}

/** Œuvres (et musées) de chaque artiste, d'après les noms de l'artiste et du musée. */
export function rattacherOeuvres(fiches, oeuvres, musees) {
  const parNom = indexDesNoms(fiches);
  const museeParNom = indexDesNoms(musees);
  const resultat = new Map(fiches.map((f) => [f.id, { oeuvresIds: [], musees: new Map() }]));
  const sansFiche = new Map();
  for (const o of oeuvres) {
    const nom = typeof o.artiste === 'string' ? o.artiste.trim() : '';
    if (nom === '') continue;
    const id = parNom.get(normaliser(nom));
    if (!id) {
      sansFiche.set(nom, (sansFiche.get(nom) ?? 0) + 1);
      continue;
    }
    const r = resultat.get(id);
    r.oeuvresIds.push(o.id);
    const musee = typeof o.lieuConservation === 'string' ? museeParNom.get(normaliser(o.lieuConservation)) : null;
    if (musee) r.musees.set(musee, (r.musees.get(musee) ?? 0) + 1);
  }
  return { resultat, sansFiche };
}

// ---------------------------------------------------------------- fusion Wikidata -> fiche

/**
 * Écrit dans la fiche ce que Wikidata sait de l'artiste : seuls les champs vides sont remplis ;
 * avec force, les faits (dates, lieu de naissance) sont mis à jour. L'époque est déduite des
 * dates. Pour un brouillon, le bloc "_aide" est complété.
 */
export function fusionnerArtiste(fiche, lecture, champs, { force = false, avecAide = true, date, vocabulaires = {} } = {}) {
  const valeurs = {
    nom: lecture.nom, alias: lecture.alias, nomNaissance: lecture.nomNaissance, wikidataId: lecture.qid,
    wikipediaUrl: lecture.wikipediaUrl, ulanId: lecture.ulanId, imageUrl: lecture.imageUrl,
    naissance: lecture.naissance, deces: lecture.deces,
    datesApproximatives: lecture.datesApproximatives ? true : undefined,
    villeNaissance: lecture.villeNaissance, paysNaissance: lecture.paysNaissance,
    nationalites: lecture.nationalites, disciplines: lecture.disciplines, mouvements: lecture.mouvements,
  };
  const resultat = { ...fiche };
  const remplis = [];
  const appliquer = (champ, valeur) => {
    if (estVide(valeur)) return;
    const libre = estVide(resultat[champ]) || (force && FAITS_REFAITS.includes(champ));
    if (libre && JSON.stringify(resultat[champ]) !== JSON.stringify(valeur)) {
      resultat[champ] = valeur;
      remplis.push(champ);
    }
  };
  for (const [champ, valeur] of Object.entries(valeurs)) appliquer(champ, valeur);
  appliquer('epoques', epoquesDepuis(resultat.naissance, resultat.deces, { vocabulaire: vocabulaires.epoques ?? null }));
  if (!avecAide || !fiche._aide) return { fiche: resultat, remplis };

  const { _aide: ancienne, ...reste } = resultat;
  const aide = {
    ...ancienne,
    a_completer: champs.filter((c) => c.obligatoire && estVide(reste[c.nom])).map((c) => c.nom),
    a_verifier: [...new Set([...(ancienne.a_verifier ?? []), ...remplis])],
    wikidata: {
      id: lecture.qid, description: lecture.descriptionWikidata ?? null, champs_remplis: remplis,
      avertissements: lecture.avertissements ?? [], date,
    },
    non_reconnus: lecture.nonReconnus ?? { professions: [], mouvements: [], nationalites: [] },
  };
  return { fiche: { _aide: aide, ...reste }, remplis };
}

/** Brouillon construit à partir d'une lecture Wikidata. Retourne { brouillon, id }. */
export function construireBrouillonArtiste({ lecture, nomsCatalogue = [], nbOeuvres = 0, champs, vocabulaires, existants = [], date }) {
  const base = {};
  for (const champ of champs) base[champ.nom] = estListe(champ) ? [] : null;
  const nom = lecture.nom ?? nomsCatalogue[0] ?? lecture.qid;
  let id = slugifier(nom) || lecture.qid.toLowerCase();
  const pris = (candidat) => existants.some((f) => f.id === candidat && f.wikidataId !== lecture.qid);
  if (pris(id)) id = `${id}-${lecture.qid.toLowerCase()}`;
  const aide = {
    a_completer: [],
    oeuvres_au_catalogue: nbOeuvres,
    note_description: 'Écris la description en tes propres mots (2 à 3 phrases).',
  };
  const depart = { _aide: aide, ...base, id, nom };
  const { fiche } = fusionnerArtiste(depart, lecture, champs, { date, vocabulaires });
  fiche.nomsCatalogue = [...new Set(nomsCatalogue)];
  return { brouillon: fiche, id };
}

// ---------------------------------------------------------------- noms du catalogue -> artistes à créer

function lireOeuvresCompletes() {
  return lireDossier(ARTWORKS_DIR)
    .filter((x) => x.fiche)
    .map((x) => ({
      id: x.fiche.id ?? x.fichier.replace(/\.json$/, ''),
      artiste: x.fiche.artiste,
      lieuConservation: x.fiche.lieuConservation,
    }));
}

/**
 * Regroupe les œuvres par nom d'artiste. Ne sont pas traités : les créateurs inconnus (« Artiste
 * inconnu », adresses techniques) et les noms qui ne désignent pas un artiste unique (atelier,
 * école, plusieurs artistes…) ; les uns et les autres sont comptés. Un identifiant Wikidata
 * (« Q123 (à corriger) ») est en revanche traité : il sera résolu par Wikidata.
 */
export function classerNomsDOeuvres(oeuvres) {
  const groupes = new Map();
  const aExaminer = new Map();
  let inconnus = 0;
  for (const o of oeuvres) {
    const nom = typeof o.artiste === 'string' ? o.artiste.trim() : '';
    if (nom === '') continue;
    const type = typeDeNomTechnique(nom);
    if (type === 'genid' || ['artiste inconnu', 'anonyme', 'unknown artist'].includes(normaliser(nom))) {
      inconnus += 1;
      continue;
    }
    if (type !== 'qid' && alertesDeNom(nom).length > 0) {
      aExaminer.set(nom, (aExaminer.get(nom) ?? 0) + 1);
      continue;
    }
    if (!groupes.has(nom)) groupes.set(nom, []);
    groupes.get(nom).push(o.id);
  }
  return { groupes, inconnus, aExaminer: [...aExaminer].map(([nom, n]) => ({ nom, n })) };
}

/** Artistes du catalogue qui n'ont pas encore de fiche (détection hors ligne, par le nom). */
export function artistesSansFiche(oeuvres, fiches, ignores = new Map()) {
  const index = indexDesNoms(fiches);
  const { groupes } = classerNomsDOeuvres(oeuvres);
  return [...groupes]
    .filter(([nom]) => !index.has(normaliser(nom)) && !ignores.has(normaliser(nom)))
    .map(([nom, ids]) => ({ nom, ids }));
}

const ecrireJsonFiche = (chemin, fiche) => fs.writeFileSync(chemin, JSON.stringify(fiche, null, 2) + '\n', 'utf-8');

function compter(liste) {
  const total = new Map();
  for (const x of liste) total.set(x, (total.get(x) ?? 0) + 1);
  return [...total].map(([libelle, nombre]) => ({ libelle, nombre })).sort((a, b) => b.nombre - a.nombre || a.libelle.localeCompare(b.libelle, 'fr'));
}

/**
 * Crée un brouillon pour chaque artiste du catalogue qui n'a pas de fiche. Le créateur de chaque
 * œuvre est lu sur Wikidata (l'identifiant de l'œuvre est son identifiant Q) ; plusieurs noms qui
 * désignent le même créateur donnent une seule fiche. Une fiche qui existe déjà pour ce créateur
 * reçoit simplement le nom manquant dans "nomsCatalogue".
 */
export async function creerBrouillonsDepuisCatalogue({
  oeuvres, existantes, champs, vocabulaires, tables, fetchJson, min = 1, limite = Infinity,
  ignores = new Map(), date = jourLocalISO(), log = () => {},
}) {
  const rapport = {
    crees: [], rattaches: [], dejaCouverts: 0, inconnus: 0, aExaminer: [], sansCreateur: [], ignores: 0, aIgnorer: [],
    homonymes: [], nonHumains: [], nonReconnus: { professions: [], mouvements: [], nationalites: [] },
  };
  const { groupes, inconnus, aExaminer } = classerNomsDOeuvres(oeuvres);
  rapport.inconnus = inconnus;
  rapport.aExaminer = aExaminer;
  const index = indexDesNoms(existantes.map((e) => e.fiche));
  const sansFicheTous = [...groupes].filter(([nom]) => !index.has(normaliser(nom)));
  rapport.dejaCouverts = groupes.size - sansFicheTous.length;
  const sansFiche = sansFicheTous.filter(([nom]) => !ignores.has(normaliser(nom)));
  rapport.ignores = sansFicheTous.length - sansFiche.length;
  const aTraiter = sansFiche.filter(([, ids]) => ids.length >= min);
  const ids = aTraiter.flatMap(([, i]) => i);
  if (ids.length === 0) return rapport;

  log(`${aTraiter.length} nom(s) d'artiste sans fiche : lecture du créateur de ${ids.length} œuvre(s) sur Wikidata…`);
  const createurs = await createursDesOeuvres(ids, { fetchJson });
  const parQid = new Map();
  const ambigus = [];
  for (const [nom, idsOeuvres] of aTraiter) {
    const decompte = new Map();
    let avecCreateur = 0;
    for (const id of idsOeuvres) {
      const liste = createurs.get(id)?.createurs ?? [];
      if (liste.length > 0) avecCreateur += 1;
      for (const q of liste) decompte.set(q, (decompte.get(q) ?? 0) + 1);
    }
    if (decompte.size === 0) {
      rapport.sansCreateur.push({ nom, oeuvres: idsOeuvres.length });
      rapport.aIgnorer.push({ nom, raison: 'aucun créateur sur Wikidata' });
      continue;
    }
    const classes = [...decompte].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    // Un créateur présent sur toutes les œuvres du nom l'emporte (les autres sont des co-auteurs) ;
    // sinon les œuvres se partagent entre plusieurs créateurs : on ne devine pas.
    if (classes.length > 1 && classes[0][1] < avecCreateur) {
      ambigus.push({ nom, total: idsOeuvres.length, createurs: classes.map(([qid, oeuvres]) => ({ qid, oeuvres })) });
      continue;
    }
    const qid = classes[0][0];
    if (!parQid.has(qid)) parQid.set(qid, { noms: new Set(), oeuvres: 0 });
    parQid.get(qid).noms.add(nom);
    parQid.get(qid).oeuvres += idsOeuvres.length;
  }
  if (ambigus.length > 0) {
    log(`${ambigus.length} nom(s) partagé(s) entre plusieurs créateurs : lecture de leurs fiches Wikidata…`);
    let infos = new Map();
    try {
      infos = await lireArtistes([...new Set(ambigus.flatMap((a) => a.createurs.map((c) => c.qid)))], { fetchJson, tables });
    } catch (e) {
      log(`⚠ Détails des noms ambigus indisponibles (${e.message}) : seuls les identifiants seront affichés.`);
    }
    for (const a of ambigus) {
      for (const c of a.createurs) {
        const l = infos.get(c.qid);
        Object.assign(c, { nom: l?.nom ?? null, naissance: l?.naissance ?? null, deces: l?.deces ?? null, estHumain: l?.estHumain ?? false });
      }
      rapport.aIgnorer.push({ nom: a.nom, raison: `ambigu : plusieurs créateurs Wikidata (${a.createurs.map((c) => c.qid).join(', ')})` });
    }
    rapport.homonymes = ambigus;
  }

  // Une fiche existe déjà pour ce créateur : on lui ajoute le nom du catalogue.
  const nouveaux = [];
  for (const [qid, { noms }] of parQid) {
    const existante = existantes.find((e) => e.fiche.wikidataId === qid);
    if (!existante) {
      nouveaux.push(qid);
      continue;
    }
    const connus = new Set([existante.fiche.nom, ...(existante.fiche.nomsCatalogue ?? [])].map(normaliser));
    const ajouts = [...noms].filter((n) => !connus.has(normaliser(n)));
    if (ajouts.length > 0) {
      existante.fiche.nomsCatalogue = [...(existante.fiche.nomsCatalogue ?? []), ...ajouts];
      ecrireJsonFiche(path.join(existante.dossier, existante.fichier), existante.fiche);
      rapport.rattaches.push({ id: existante.fiche.id, noms: ajouts });
    }
  }
  nouveaux.sort((a, b) => parQid.get(b).oeuvres - parQid.get(a).oeuvres || a.localeCompare(b));
  const retenus = nouveaux.slice(0, limite);
  if (retenus.length === 0) return rapport;

  fs.mkdirSync(BROUILLONS_DIR, { recursive: true });
  const dejaPris = existantes.map((e) => e.fiche);
  const nonReconnus = { professions: [], mouvements: [], nationalites: [] };
  for (let i = 0; i < retenus.length; i += TAILLE_GROUPE) {
    const groupe = retenus.slice(i, i + TAILLE_GROUPE);
    log(`Lecture des artistes ${i + 1} à ${i + groupe.length} sur ${retenus.length}…`);
    let lectures;
    try {
      lectures = await lireArtistes(groupe, { fetchJson, tables });
    } catch (e) {
      rapport.interrompu = e.message;
      break;
    }
    for (const qid of groupe) {
      const lecture = lectures.get(qid);
      const { noms, oeuvres: nb } = parQid.get(qid);
      if (!lecture.estHumain) {
        rapport.nonHumains.push({ qid, nom: lecture.nom, noms: [...noms] });
        for (const n of noms) rapport.aIgnorer.push({ nom: n, raison: `créateur ${qid} : pas une personne` });
        continue;
      }
      // Si l'artiste a déjà une fiche (existante ou créée dans cette passe, par exemple sous l'ancien
      // identifiant d'un élément fusionné), on lui ajoute simplement les noms du catalogue.
      const memeArtiste = existantes.find((e) => e.fiche.wikidataId === lecture.qid);
      const dejaCree = rapport.crees.find((c) => c.qid === lecture.qid);
      if (memeArtiste || dejaCree) {
        const chemin = memeArtiste ? path.join(memeArtiste.dossier, memeArtiste.fichier) : path.join(BROUILLONS_DIR, `${dejaCree.id}.json`);
        const fiche = memeArtiste ? memeArtiste.fiche : JSON.parse(fs.readFileSync(chemin, 'utf-8'));
        fiche.nomsCatalogue = [...new Set([...(fiche.nomsCatalogue ?? []), ...noms])];
        ecrireJsonFiche(chemin, fiche);
        rapport.rattaches.push({ id: fiche.id, noms: [...noms] });
        continue;
      }
      const { brouillon, id } = construireBrouillonArtiste({
        lecture, nomsCatalogue: [...noms], nbOeuvres: nb, champs, vocabulaires, existants: dejaPris, date,
      });
      ecrireJsonFiche(path.join(BROUILLONS_DIR, `${id}.json`), brouillon);
      dejaPris.push(brouillon);
      rapport.crees.push({ id, nom: brouillon.nom, oeuvres: nb, qid: lecture.qid });
      for (const cle of Object.keys(nonReconnus)) nonReconnus[cle].push(...(lecture.nonReconnus?.[cle] ?? []));
    }
  }
  for (const cle of Object.keys(nonReconnus)) rapport.nonReconnus[cle] = compter(nonReconnus[cle]);
  return rapport;
}

function afficherRapport(r) {
  if (r.interrompu) {
    console.log(`\n⚠ Lecture interrompue : ${messageWikidata({ message: r.interrompu })}`);
  }
  console.log(`\n${r.crees.length} brouillon(s) créé(s) dans 0_workspace_artistes/`);
  for (const c of r.crees.slice(0, 15)) console.log(`  - ${c.nom} (${c.oeuvres} œuvre(s))`);
  if (r.crees.length > 15) console.log(`  … et ${r.crees.length - 15} autre(s)`);
  if (r.rattaches.length > 0) {
    console.log(`\n${r.rattaches.length} fiche(s) existante(s) complétée(s) avec un nom du catalogue :`);
    for (const x of r.rattaches) console.log(`  - ${x.id} : ${x.noms.map((n) => `« ${n} »`).join(', ')}`);
  }
  if (r.dejaCouverts > 0) console.log(`\n${r.dejaCouverts} nom(s) d'artiste ont déjà une fiche.`);
  if (r.ignores > 0) {
    console.log(`${r.ignores} nom(s) ignoré(s), déjà examinés sans résultat (registres/artistes_ignores.json ; --reessayer pour les revoir).`);
  }
  if (r.inconnus > 0) console.log(`${r.inconnus} œuvre(s) à créateur inconnu : pas de fiche (normal).`);
  if (r.aExaminer.length > 0) {
    console.log(`\nÀ examiner à la main (${r.aExaminer.length}) : ces noms ne désignent sans doute pas un artiste unique :`);
    for (const a of r.aExaminer.slice(0, 10)) console.log(`  « ${a.nom} » (${a.n})`);
  }
  if (r.sansCreateur.length > 0) {
    console.log(`\n⚠ ${r.sansCreateur.length} nom(s) sans créateur sur Wikidata (aucune fiche créée) :`);
    for (const x of r.sansCreateur.slice(0, 10)) console.log(`  « ${x.nom} » (${x.oeuvres} œuvre(s))`);
  }
  if (r.nonHumains.length > 0) {
    console.log(`\n⚠ ${r.nonHumains.length} créateur(s) qui ne sont pas des personnes (atelier, groupe) : aucune fiche créée :`);
    for (const x of r.nonHumains.slice(0, 10)) console.log(`  ${x.qid} (${x.nom ?? 'sans nom'}) : ${x.noms.map((n) => `« ${n} »`).join(', ')}`);
  }
  if (r.homonymes.length > 0) {
    console.log(`\n⚠ ${r.homonymes.length} nom(s) dont les œuvres se partagent entre plusieurs créateurs Wikidata : aucune fiche créée, à trancher :`);
    for (const h of r.homonymes) {
      console.log(`  « ${h.nom} » (${h.total} œuvre(s))`);
      for (const c of h.createurs) {
        const dates = c.naissance || c.deces ? ` (${c.naissance ? anneeDeDate(c.naissance) : '?'}–${c.deces ? anneeDeDate(c.deces) : '?'})` : '';
        const humain = c.estHumain ? '' : ' [pas une personne]';
        console.log(`      ${c.qid} ${c.nom ?? 'sans nom'}${dates}${humain} : ${c.oeuvres} œuvre(s)`);
      }
      console.log(`      → node scripts/artistes.mjs creer ${h.createurs[0].qid} --nom-catalogue "${h.nom}"`);
    }
    console.log('  Choisis le bon créateur (souvent le premier : le plus fréquent), puis lance la commande indiquée.');
  }
  const tableau = [
    ['mouvements', 'Mouvements Wikidata sans équivalent dans ta liste', 'registres/mouvements_wikidata.json'],
    ['nationalites', 'Nationalités Wikidata non reconnues', 'registres/nationalites.json'],
  ];
  for (const [cle, titre, fichier] of tableau) {
    const liste = r.nonReconnus[cle];
    if (liste.length === 0) continue;
    console.log(`\n${titre} (à ajouter dans ${fichier} si besoin) :`);
    for (const x of liste.slice(0, 15)) console.log(`  ${x.libelle} (${x.nombre})`);
  }
  if (r.aIgnorer.length > 0) {
    console.log(
      `\n${r.aIgnorer.length} nom(s) mémorisé(s) comme sans fiche possible : ` +
        'ils ne seront plus réexaminés (registres/artistes_ignores.json).',
    );
  }
  if (r.crees.length > 0) console.log('\nÉtape suivante : relire les brouillons, puis node scripts/artistes.mjs promouvoir');
}

async function commandeDepuisCatalogue(args) {
  const { options } = lireOptions(args);
  if (!reseauActif(options)) {
    console.error('Cette commande lit Wikidata : elle ne peut pas fonctionner hors ligne.');
    process.exit(1);
  }
  const { champs, ctx } = chargerModele();
  const tables = chargerTables(ctx.vocabulaires);
  const oeuvres = lireOeuvresCompletes();
  try {
    const rapport = await creerBrouillonsDepuisCatalogue({
      oeuvres, existantes: toutesLesFiches(), champs, vocabulaires: ctx.vocabulaires, tables,
      min: options.min ? parseInt(options.min, 10) : 1,
      limite: options.limite ? parseInt(options.limite, 10) : Infinity,
      ignores: options.reessayer ? new Map() : chargerIgnores(),
      log: (m) => console.log(m),
    });
    memoriserIgnores(rapport.aIgnorer);
    afficherRapport(rapport);
    if (rapport.interrompu) process.exitCode = 1;
  } catch (e) {
    console.error(`✕ Wikidata : ${messageWikidata(e)}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- créer, compléter

function trouverFiche(id) {
  for (const [dossier, brouillon] of [[BROUILLONS_DIR, true], [ARTISTES_DIR, false]]) {
    const chemin = path.join(dossier, `${id}.json`);
    if (fs.existsSync(chemin)) return { id, chemin, brouillon, fiche: JSON.parse(fs.readFileSync(chemin, 'utf-8')) };
  }
  return null;
}

async function commandeCreer(args) {
  const { options, positionnels } = lireOptions(args);
  if (positionnels.length === 0) {
    console.error('Usage : node scripts/artistes.mjs creer "<Q… | page Wikipédia ou Wikidata>" [--nom-catalogue "Nom"]');
    process.exit(1);
  }
  if (!reseauActif(options)) {
    console.error('Cette commande lit Wikidata : elle ne peut pas fonctionner hors ligne.');
    process.exit(1);
  }
  const noms = options['nom-catalogue'] ?? [];
  if (noms.length > 0 && positionnels.length > 1) {
    console.error('--nom-catalogue ne peut servir que pour un seul artiste à la fois.');
    process.exit(1);
  }
  const { champs, ctx } = chargerModele();
  const tables = chargerTables(ctx.vocabulaires);
  const existantes = toutesLesFiches();
  const index = indexDesNoms(existantes.map((e) => e.fiche));
  const voulus = new Set(noms.map(normaliser));
  const nbOeuvres = noms.length > 0
    ? lireOeuvresCompletes().filter((o) => typeof o.artiste === 'string' && voulus.has(normaliser(o.artiste))).length
    : 0;
  fs.mkdirSync(BROUILLONS_DIR, { recursive: true });
  for (const brut of positionnels) {
    console.log(`\n${brut}`);
    const cible = extraireCible(brut);
    if (!cible || cible.type === 'site') {
      console.error('  ✕ Ni identifiant Wikidata (Q…), ni page Wikipédia ou Wikidata : ignoré');
      continue;
    }
    try {
      const qid = await resoudreQid(cible);
      const pris = noms.find((n) => index.has(normaliser(n)));
      if (pris) {
        console.error(`  ✕ le nom « ${pris} » est déjà utilisé par la fiche ${index.get(normaliser(pris))}`);
        continue;
      }
      const doublon = existantes.find((e) => e.fiche.wikidataId === qid);
      if (doublon && noms.length > 0) {
        doublon.fiche.nomsCatalogue = [...(doublon.fiche.nomsCatalogue ?? []), ...noms];
        ecrireJsonFiche(path.join(doublon.dossier, doublon.fichier), doublon.fiche);
        for (const n of noms) index.set(normaliser(n), doublon.fiche.id);
        if (nbOeuvres === 0) console.log('  ⚠ aucune œuvre du catalogue ne porte ce nom : vérifie l\'orthographe');
        console.log(`  ✓ ${qid} avait déjà une fiche (${doublon.source}) : nom(s) du catalogue ajouté(s) : ${noms.map((n) => `« ${n} »`).join(', ')}`);
        continue;
      }
      if (doublon) {
        console.log(`  ↷ ${qid} a déjà une fiche (${doublon.source}) : completer ${doublon.fiche.id}`);
        continue;
      }
      const lecture = (await lireArtistes([qid], { tables })).get(qid);
      if (!lecture.estHumain) {
        console.error(`  ✕ ${qid} (${lecture.nom ?? 'sans nom'}) n'est pas une personne`);
        continue;
      }
      if (noms.length > 0 && nbOeuvres === 0) console.log('  ⚠ aucune œuvre du catalogue ne porte ce nom : vérifie l\'orthographe');
      const { brouillon, id } = construireBrouillonArtiste({
        lecture, nomsCatalogue: noms, nbOeuvres, champs, vocabulaires: ctx.vocabulaires, existants: existantes.map((e) => e.fiche), date: jourLocalISO(),
      });
      ecrireJsonFiche(path.join(BROUILLONS_DIR, `${id}.json`), brouillon);
      existantes.push({ source: `0_workspace_artistes/${id}.json`, fiche: brouillon });
      console.log(`  ✓ brouillon créé : 0_workspace_artistes/${id}.json (${brouillon.nom})`);
      lecture.avertissements.forEach((w) => console.log(`    ⚠ ${w}`));
    } catch (e) {
      console.error(`  ✕ ${messageWikidata(e)}`);
      process.exitCode = 1;
    }
  }
}

const CHAMPS_A_REMPLIR = [
  'imageUrl', 'naissance', 'villeNaissance', 'paysNaissance', 'nationalites',
  'disciplines', 'mouvements', 'epoques', 'alias', 'wikipediaUrl',
];

async function commandeCompleter(args) {
  const { options, positionnels } = lireOptions(args);
  if (!reseauActif(options)) {
    console.error('Cette commande lit Wikidata : elle ne peut pas fonctionner hors ligne.');
    process.exit(1);
  }
  const { champs, ctx } = chargerModele();
  const tables = chargerTables(ctx.vocabulaires);
  const cibleQid = positionnels.map(extraireCible).find((c) => c && c.type !== 'site');
  const ids = positionnels.filter((p) => extraireCible(p) === null);
  let fiches;
  if (options.tous) {
    fiches = toutesLesFiches()
      .filter((e) => e.fiche.wikidataId && (options.force || CHAMPS_A_REMPLIR.some((c) => estVide(e.fiche[c]))))
      .map((e) => ({ id: e.fiche.id, chemin: path.join(e.dossier, e.fichier), brouillon: e.dossier === BROUILLONS_DIR, fiche: e.fiche }));
  } else if (ids.length === 1) {
    const c = trouverFiche(ids[0]);
    if (!c) {
      console.error(`Aucune fiche (ni brouillon) pour "${ids[0]}".`);
      process.exit(1);
    }
    fiches = [c];
  } else {
    console.error('Usage : node scripts/artistes.mjs completer <id> ["Q… ou page"] [--force]');
    console.error('        node scripts/artistes.mjs completer --tous [--force]');
    process.exit(1);
  }
  if (fiches.length === 0) {
    console.log('Rien à compléter.');
    return;
  }
  const qidDe = (c) => (cibleQid && fiches.length === 1 ? null : c.fiche.wikidataId);
  let explicite = null;
  try {
    if (cibleQid && fiches.length === 1) explicite = await resoudreQid(cibleQid);
    const qids = [...new Set(fiches.map((c) => explicite ?? qidDe(c)).filter(Boolean))];
    const lectures = qids.length > 0 ? await lireArtistes(qids, { tables }) : new Map();
    const catalogue = lireDossier(ARTISTES_DIR).filter((x) => x.fiche).map((x) => ({ source: x.fichier, fiche: x.fiche }));
    let echecs = 0;
    for (const c of fiches) {
      const qid = explicite ?? qidDe(c);
      console.log(`\n${c.fiche.nom ?? c.id} (${c.id})${c.brouillon ? ' · brouillon' : ''}`);
      if (!qid) {
        console.log(`    pas d'identifiant Wikidata : completer ${c.id} <Q… ou page Wikipédia>`);
        continue;
      }
      const lecture = lectures.get(qid);
      if (!lecture?.estHumain) {
        console.error(`    ✕ ${qid} n'est pas une personne ou est introuvable`);
        echecs += 1;
        continue;
      }
      const { fiche, remplis } = fusionnerArtiste(c.fiche, lecture, champs, {
        force: Boolean(options.force), avecAide: c.brouillon, date: jourLocalISO(), vocabulaires: ctx.vocabulaires,
      });
      lecture.avertissements.forEach((w) => console.log(`    ⚠ ${w}`));
      if (remplis.length === 0) {
        console.log('    rien de nouveau');
        continue;
      }
      if (!c.brouillon) {
        const entrees = catalogue.map((e) => (e.fiche.id === fiche.id ? { source: e.source, fiche } : e));
        const source = catalogue.find((e) => e.fiche.id === fiche.id)?.source;
        const erreurs = [...validerArtiste(fiche, champs, ctx), ...((source && verifierEnsemble(entrees)[source]) || [])];
        if (erreurs.length > 0) {
          console.error('    ✕ Résultat refusé, fiche non modifiée :');
          erreurs.forEach((e) => console.error(`      - ${e}`));
          echecs += 1;
          continue;
        }
      }
      ecrireJsonFiche(c.chemin, fiche);
      console.log(`    ✓ rempli : ${remplis.join(', ')}`);
    }
    if (echecs > 0) process.exitCode = 1;
  } catch (e) {
    console.error(`✕ Wikidata : ${messageWikidata(e)}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- promouvoir, générer, inspecter, synchroniser

/**
 * Promeut des brouillons dans le catalogue. Sans sélection : tous les brouillons valides.
 * Avec des identifiants (claude-monet) et/ou --min-oeuvres N : seulement ceux-là.
 * --simuler : montre ce qui serait promu, sans rien déplacer.
 */
function commandePromouvoir(args = []) {
  const { options, positionnels } = lireOptions(args);
  const min = options['min-oeuvres'] === undefined ? null : Number(options['min-oeuvres']);
  if (min !== null && (!Number.isInteger(min) || min < 0)) {
    console.error('--min-oeuvres attend un nombre entier (par exemple --min-oeuvres 12).');
    process.exitCode = 1;
    return;
  }
  const ids = positionnels.map((x) => x.replace(/\.json$/, ''));
  const avecSelection = ids.length > 0 || min !== null;
  const simuler = options.simuler === true;
  const { champs, ctx } = chargerModele();
  if (!fs.existsSync(BROUILLONS_DIR)) {
    console.log('0_workspace_artistes/ est absent ou vide : rien à promouvoir.');
    return;
  }
  if (!simuler) fs.mkdirSync(ARTISTES_DIR, { recursive: true });
  const existantes = lireDossier(ARTISTES_DIR).filter((x) => x.fiche).map((x) => ({ source: `catalogue/${x.fichier}`, fiche: x.fiche }));
  const brouillons = lireDossier(BROUILLONS_DIR);
  const souche = (b) => b.fichier.replace(/\.json$/, '');
  const nbOeuvres = (b) => b.fiche?._aide?.oeuvres_au_catalogue ?? 0;
  const choisi = (b) => !avecSelection || ids.includes(souche(b)) || (b.fiche && ids.includes(b.fiche.id)) || (min !== null && b.fiche && nbOeuvres(b) >= min);

  let promus = 0;
  let restants = 0;
  for (const id of ids) {
    if (!brouillons.some((b) => souche(b) === id || b.fiche?.id === id)) {
      console.error(`✕ ${id} : aucun brouillon de ce nom dans 0_workspace_artistes/`);
      restants += 1;
    }
  }
  const lisibles = brouillons
    .filter((b) => b.fiche && choisi(b))
    .map((b) => ({ b, entree: { source: `brouillon/${b.fichier}`, fiche: nettoyerBrouillon(b.fiche) } }));
  // les conflits (doublons d'identifiant ou de nom) se cherchent contre tous les brouillons lisibles
  const tousLisibles = brouillons.filter((b) => b.fiche).map((b) => ({ source: `brouillon/${b.fichier}`, fiche: nettoyerBrouillon(b.fiche) }));
  const conflits = verifierEnsemble([...existantes, ...tousLisibles]);
  for (const b of brouillons.filter((x) => x.erreur && (!avecSelection || ids.includes(souche(x))))) {
    console.error(`✕ ${b.fichier} : JSON illisible (${b.erreur})`);
    restants += 1;
  }
  if (avecSelection && lisibles.length === 0 && restants === 0) {
    console.log(min !== null ? `Aucun brouillon n'a au moins ${min} œuvre(s) au catalogue.` : 'Aucun brouillon ne correspond.');
    return;
  }
  for (const { b, entree } of lisibles) {
    const erreurs = [...validerArtiste(entree.fiche, champs, ctx), ...(conflits[entree.source] ?? [])];
    if (erreurs.length > 0) {
      console.error(`✕ ${b.fichier} : pas encore prête`);
      erreurs.forEach((e) => console.error(`    - ${e}`));
      restants += 1;
      continue;
    }
    if (simuler) {
      console.log(`  ${entree.fiche.nom} (${souche(b)}) : ${nbOeuvres(b)} œuvre(s)`);
    } else {
      ecrireJsonFiche(path.join(ARTISTES_DIR, `${entree.fiche.id}.json`), entree.fiche);
      fs.unlinkSync(path.join(BROUILLONS_DIR, b.fichier));
      console.log(`✓ ${b.fichier} promue dans scripts/catalog/artistes/`);
    }
    promus += 1;
  }
  const autres = brouillons.filter((b) => !choisi(b)).length;
  if (simuler) {
    console.log(`\nSimulation : ${promus} fiche(s) seraient promue(s), ${restants} pas prête(s). Rien n'a été déplacé.`);
  } else {
    console.log(`\n${promus} fiche(s) promue(s), ${restants} restée(s) en brouillon.${autres > 0 ? ` ${autres} autre(s) brouillon(s) non concerné(s).` : ''}`);
    if (promus > 0) console.log('Étape suivante : node scripts/artistes.mjs generer');
  }
  if (!avecSelection && brouillons.length > 20 && !simuler && promus > 20) {
    console.log("Astuce : pour n'en promouvoir que certains, utilise des identifiants (claude-monet) ou --min-oeuvres N, avec --simuler pour voir avant.");
  }
  if (restants > 0) process.exitCode = 1;
}

function construireDonnees(champs, ctx, regions) {
  const lus = lireDossier(ARTISTES_DIR);
  const entrees = lus.filter((x) => x.fiche).map((x) => ({ source: x.fichier, fiche: x.fiche }));
  const conflits = verifierEnsemble(entrees);
  const valides = [];
  const messages = [];
  for (const x of lus) {
    if (x.erreur) {
      messages.push(`✕ ${x.fichier} : JSON illisible (${x.erreur})`);
      continue;
    }
    const erreurs = [...validerArtiste(x.fiche, champs, ctx), ...(conflits[x.fichier] ?? [])];
    if (erreurs.length > 0) {
      messages.push(`✕ ${x.fichier} écartée :`, ...erreurs.map((e) => `    - ${e}`));
      continue;
    }
    valides.push({ fiche: x.fiche, artiste: versArtiste(x.fiche, champs, regions) });
  }
  const musees = lireDossier(MUSEES_DIR).filter((x) => x.fiche).map((x) => x.fiche);
  const { resultat, sansFiche } = rattacherOeuvres(valides.map((v) => v.fiche), lireOeuvresCompletes(), musees);
  for (const v of valides) {
    const r = resultat.get(v.fiche.id);
    v.artiste.oeuvresIds = [...r.oeuvresIds].sort();
    v.artiste.nombreOeuvres = r.oeuvresIds.length;
    v.artiste.musees = [...r.musees].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => b.nombre - a.nombre || a.id.localeCompare(b.id));
  }
  valides.sort((a, b) => a.artiste.nom.localeCompare(b.artiste.nom, 'fr'));
  return { valides, messages, nbEcartees: lus.length - valides.length, sansFiche };
}

function ecrireDonnees(valides) {
  const contenu = `// Fichier généré automatiquement par scripts/artistes.mjs generer
// Ne pas éditer à la main — relancer la commande après toute mise à jour des fiches.

import { Artiste } from '../types/artiste';

export const ARTISTES: Artiste[] = ${JSON.stringify(valides.map((v) => v.artiste), null, 2)};
`;
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenu, 'utf-8');
}

function commandeGenerer() {
  const { champs, ctx } = chargerModele();
  const regions = lireJson(path.join(REGISTRES_DIR, 'pays_regions.json'), 'Table pays/régions');
  const { valides, messages, nbEcartees } = construireDonnees(champs, ctx, regions);
  messages.forEach((m) => console.error(m));
  ecrireDonnees(valides);
  console.log(`${valides.length} artiste(s) écrit(s) dans src/data/artistes.generated.ts`);
  const horsTable = [...new Set(valides.flatMap((v) => [...v.fiche.nationalites ?? [], v.fiche.paysNaissance]).filter((p) => p && !regions[p]))];
  if (horsTable.length > 0) {
    console.log(`\n⚠ Pays absents de registres/pays_regions.json (pas de région pour le filtre) : ${horsTable.join(', ')}`);
  }
  const manquants = artistesSansFiche(lireOeuvresCompletes(), toutesLesFiches().map((e) => e.fiche), chargerIgnores());
  if (manquants.length > 0) {
    const nb = manquants.reduce((n, m) => n + m.ids.length, 0);
    console.log(`\n${manquants.length} artiste(s) du catalogue (${nb} œuvre(s)) n'ont pas encore de fiche : node scripts/artistes.mjs synchroniser`);
  }
  afficherATrancher(nomsATrancher(chargerIgnores(), toutesLesFiches().map((e) => e.fiche)));
  const enAttente = lireDossier(BROUILLONS_DIR).filter((x) => x.fiche).length;
  if (enAttente > 0) console.log(`\n${enAttente} brouillon(s) en attente de promotion : node scripts/artistes.mjs promouvoir`);
  if (nbEcartees > 0) {
    console.error(`${nbEcartees} fiche(s) écartée(s) : voir ci-dessus.`);
    process.exitCode = 1;
  }
}

function resumeUneFiche(fiche, champs, ctx, rattachement) {
  const bilan = inspecterFiche(fiche, champs, ctx);
  const r = rattachement.get(fiche.id) ?? { oeuvresIds: [], musees: new Map() };
  return { fiche, bilan, oeuvres: r.oeuvresIds.length, musees: [...r.musees].map(([id, n]) => `${id} (${n})`) };
}

function commandeInspecter(args) {
  const { champs, ctx } = chargerModele();
  const regions = lireJson(path.join(REGISTRES_DIR, 'pays_regions.json'), 'Table pays/régions');
  const fiches = lireDossier(ARTISTES_DIR).filter((x) => x.fiche).map((x) => x.fiche);
  if (fiches.length === 0) {
    console.log('Aucune fiche artiste dans scripts/catalog/artistes/ : lance "depuis-catalogue" puis "promouvoir".');
    return;
  }
  const musees = lireDossier(MUSEES_DIR).filter((x) => x.fiche).map((x) => x.fiche);
  const { resultat } = rattacherOeuvres(fiches, lireOeuvresCompletes(), musees);
  const cible = args.find((a) => !a.startsWith('--'));
  if (cible) {
    const voulu = normaliser(cible);
    const trouve = fiches.find((f) => f.id === cible) ?? fiches.find((f) => normaliser(f.nom).includes(voulu));
    if (!trouve) {
      console.error(`Aucune fiche pour "${cible}". Exemple d'identifiant : ${fiches[0].id}`);
      process.exitCode = 1;
      return;
    }
    afficherDetail(resumeUneFiche(trouve, champs, ctx, resultat), champs, regions);
    return;
  }
  const resumes = fiches
    .map((f) => resumeUneFiche(f, champs, ctx, resultat))
    .sort(
      (a, b) =>
        a.bilan.pourcentage - b.bilan.pourcentage || a.fiche.nom.localeCompare(b.fiche.nom, 'fr'),
    );
  const completes = resumes.filter((r) => r.bilan.manquants.length === 0).length;
  console.log(`Fiches artistes : ${resumes.length} · complètes : ${completes} · à compléter : ${resumes.length - completes}\n`);
  const manquesFrequents = compter(resumes.flatMap((r) => r.bilan.manquants.map((m) => m.nom)));
  console.log('Champs les plus souvent manquants :');
  for (const m of manquesFrequents.slice(0, 10)) console.log(`  ${String(m.nombre).padStart(4)}  ${m.libelle}`);
  console.log('\nLes 15 fiches les moins complètes :');
  for (const r of resumes.slice(0, 15)) {
    const manque = r.bilan.manquants.map((x) => x.nom).join(', ');
    console.log(
      `${String(r.bilan.pourcentage).padStart(3)} %  ${r.fiche.nom} (${r.oeuvres} œuvre(s)) — manque : ${manque}`,
    );
  }
  console.log("\nDétail d'une fiche : node scripts/artistes.mjs inspecter <id ou nom>");
}

function afficherDetail(r, champs, regions) {
  const { fiche: f, bilan } = r;
  console.log(`${f.nom} (${f.id}) · ${bilan.renseignes}/${bilan.total} champs recommandés · ${bilan.pourcentage} %\n`);
  for (const champ of champs.filter((c) => c.recommande)) {
    const manquant = bilan.manquants.find((x) => x.nom === champ.nom);
    if (!manquant) {
      const v = f[champ.nom];
      const texte = Array.isArray(v) ? v.join(', ') : String(v);
      console.log(`  ✓ ${champ.nom} : ${texte.length > 70 ? `${texte.slice(0, 67)}...` : texte}`);
    } else {
      console.log(`  ✗ ${champ.nom} — ${manquant.aide}`);
      if (manquant.valeurs) console.log(`      valeurs : ${manquant.valeurs.join(' · ')}`);
    }
  }
  const age = ageDe(f.naissance, f.deces);
  if (age !== null) console.log(`\nÂge : ${age} an(s) ${f.deces ? 'au décès' : '(vivant)'}${f.datesApproximatives ? ' · dates approximatives' : ''}`);
  console.log(r.oeuvres > 0 ? `Œuvres du catalogue : ${r.oeuvres}` : 'Œuvres du catalogue : aucune. Vérifie nomsCatalogue.');
  if (r.musees.length > 0) console.log(`À voir dans : ${r.musees.join(', ')}`);
  const horsTable = [...(f.nationalites ?? []), f.paysNaissance].filter((p) => p && !regions[p]);
  if (horsTable.length > 0) console.log(`\n⚠ Pays absents de registres/pays_regions.json : ${[...new Set(horsTable)].join(', ')}`);
  if (bilan.facultatifsVides.length > 0) console.log(`\nFacultatif, non renseigné : ${bilan.facultatifsVides.join(', ')}`);
  console.log(`\nÀ éditer : scripts/catalog/artistes/${f.id}.json`);
}

async function commandeSynchroniser(args = []) {
  const { options } = lireOptions(args);
  const { champs, ctx } = chargerModele();
  const regions = lireJson(path.join(REGISTRES_DIR, 'pays_regions.json'), 'Table pays/régions');
  const oeuvres = lireOeuvresCompletes();
  const ignores = options.reessayer ? new Map() : chargerIgnores();
  const manquants = artistesSansFiche(oeuvres, toutesLesFiches().map((e) => e.fiche), ignores);
  if (manquants.length === 0) {
    console.log('Aucun nouvel artiste dans le catalogue.');
  } else if (!reseauActif(options)) {
    console.log(`${manquants.length} artiste(s) du catalogue sans fiche (réseau désactivé) : ${manquants.slice(0, 5).map((m) => m.nom).join(', ')}…`);
  } else {
    console.log(`Nouveaux artistes détectés dans le catalogue : ${manquants.length}`);
    try {
      const rapport = await creerBrouillonsDepuisCatalogue({
        oeuvres, existantes: toutesLesFiches(), champs, vocabulaires: ctx.vocabulaires, tables: chargerTables(ctx.vocabulaires), ignores,
      });
      memoriserIgnores(rapport.aIgnorer);
      afficherRapport(rapport);
    } catch (e) {
      console.log(`⚠ Wikidata inaccessible (${messageWikidata(e)}) : les brouillons seront créés à la prochaine synchronisation.`);
    }
  }
  const { valides, messages, nbEcartees } = construireDonnees(champs, ctx, regions);
  messages.forEach((m) => console.error(m));
  ecrireDonnees(valides);
  const incompletes = valides.filter((v) => inspecterFiche(v.fiche, champs, ctx).manquants.length > 0).length;
  console.log(`Fiches artistes : ${valides.length} générées · ${incompletes} à compléter (inspecter)`);
  afficherATrancher(nomsATrancher(chargerIgnores(), toutesLesFiches().map((e) => e.fiche)));
  const enAttente = lireDossier(BROUILLONS_DIR).filter((x) => x.fiche).length;
  if (enAttente > 0) console.log(`Brouillons en attente de promotion : ${enAttente} (promouvoir)`);
  if (nbEcartees > 0) process.exitCode = 1;
}

// ---------------------------------------------------------------- corriger les noms dans les fiches d'œuvres

/**
 * Remplace, dans les fiches d'œuvres, un nom d'artiste codé (« Q155626 (à corriger) ») par le nom de
 * la fiche artiste qui le porte. Seules les fiches artistes PROMUES servent : un brouillon peut encore
 * changer de nom. Avec --variantes, les autres graphies (« Monet ») sont aussi ramenées au nom de la
 * fiche (« Claude Monet »).
 */
function commandeCorrigerNoms(args) {
  const { options } = lireOptions(args);
  const index = new Map();
  for (const e of toutesLesFiches()) {
    const promue = e.dossier === ARTISTES_DIR;
    for (const n of [e.fiche.nom, ...(Array.isArray(e.fiche.nomsCatalogue) ? e.fiche.nomsCatalogue : [])]) {
      if (typeof n === 'string' && normaliser(n) !== '') index.set(normaliser(n), { fiche: e.fiche, promue });
    }
  }
  const aCorriger = [];
  const enAttente = new Map();
  const sansFiche = new Map();
  for (const x of lireDossier(ARTWORKS_DIR)) {
    const nom = x.fiche?.artiste;
    if (typeof nom !== 'string') continue;
    const code = typeDeNomTechnique(nom) === 'qid';
    const trouve = index.get(normaliser(nom));
    if (!code && !(options.variantes && trouve && trouve.fiche.nom !== nom)) continue;
    if (!trouve) {
      sansFiche.set(nom, (sansFiche.get(nom) ?? 0) + 1);
      continue;
    }
    if (trouve.fiche.nom === nom) continue;
    if (!trouve.promue) {
      enAttente.set(nom, { nouveau: trouve.fiche.nom, n: (enAttente.get(nom)?.n ?? 0) + 1 });
      continue;
    }
    aCorriger.push({ chemin: path.join(ARTWORKS_DIR, x.fichier), ancien: nom, nouveau: trouve.fiche.nom });
  }

  const groupes = new Map();
  for (const a of aCorriger) {
    const cle = `${a.ancien}\u0000${a.nouveau}`;
    groupes.set(cle, { ...a, n: (groupes.get(cle)?.n ?? 0) + 1 });
  }
  if (groupes.size === 0 && enAttente.size === 0 && sansFiche.size === 0) {
    console.log('Aucun nom à corriger.');
    return;
  }
  if (groupes.size > 0) {
    console.log(`${options.ecrire ? 'CORRIGÉ' : 'À CORRIGER'} :`);
    for (const g of groupes.values()) console.log(`  ${g.ancien} → ${g.nouveau} : ${g.n} œuvre(s)`);
  }
  for (const [nom, { nouveau, n }] of enAttente) {
    console.log(`\nEN ATTENTE : ${nom} → ${nouveau} (${n} œuvre(s)) : la fiche artiste est encore un brouillon.`);
    console.log('  Promeus-la (node scripts/artistes.mjs promouvoir), puis relance cette commande.');
  }
  for (const [nom, n] of sansFiche) {
    console.log(`\nSANS FICHE ARTISTE : ${nom} (${n} œuvre(s)).`);
    console.log('  Lance node scripts/artistes.mjs depuis-catalogue (ou creer Q… --nom-catalogue "…").');
  }
  if (options.ecrire) {
    for (const a of aCorriger) fs.writeFileSync(a.chemin, remplacerNom(fs.readFileSync(a.chemin, 'utf-8'), a.ancien, a.nouveau), 'utf-8');
    if (aCorriger.length > 0) {
      console.log(`\n${aCorriger.length} fiche(s) d'œuvre modifiée(s).`);
      console.log('Relance ensuite : node scripts/artistes.mjs generer puis node scripts/build-app-data.mjs');
    }
  } else if (aCorriger.length > 0) {
    console.log(`\n${aCorriger.length} fiche(s) d'œuvre seraient modifiée(s) (simulation) : ajoute --ecrire pour appliquer.`);
  }
  if (enAttente.size > 0 || sansFiche.size > 0) process.exitCode = 1;
}

/** Les œuvres dont le créateur est inconnu sur Wikidata, avec un lien pour vérifier ou attribuer. */
function commandeInconnus() {
  const inconnus = ['artiste inconnu', 'anonyme', 'unknown artist'];
  const lignes = lireDossier(ARTWORKS_DIR)
    .filter((x) => x.fiche && typeof x.fiche.artiste === 'string' && inconnus.includes(normaliser(x.fiche.artiste)))
    .map((x) => ({ id: x.fiche.id ?? x.fichier.replace(/\.json$/, ''), titre: x.fiche.titre ?? '(sans titre)', lieu: x.fiche.lieuConservation ?? '' }));
  if (lignes.length === 0) {
    console.log('Aucune œuvre à créateur inconnu.');
    return;
  }
  console.log(`${lignes.length} œuvre(s) à créateur inconnu :\n`);
  for (const l of lignes) console.log(`  ${l.id}  ${l.titre}${l.lieu ? ` — ${l.lieu}` : ''}\n      https://www.wikidata.org/wiki/${l.id}`);
  console.log("\nPour attribuer une œuvre, modifie le champ \"artiste\" de sa fiche dans scripts/catalog/artworks/ (par exemple « Atelier de Rembrandt »).");
}

const AIDE = `Commandes :
  inventaire                              les artistes du catalogue d'œuvres, et les noms à examiner
  nettoyer-noms [--ecrire]                remplace les adresses techniques par « Artiste inconnu »
  depuis-catalogue [--min N] [--limite N] brouillons pour les artistes du catalogue sans fiche
  creer "<Q… | page Wikipédia>"           brouillon pour un artiste choisi
  corriger-noms [--ecrire] [--variantes]  remplace les noms codés (Q…) dans les fiches d'œuvres
  inconnus                                les œuvres à créateur inconnu, avec un lien Wikidata
  completer <id> | --tous [--force]       remplit les champs vides par Wikidata
  promouvoir [id…] [--min-oeuvres N] [--simuler]
                                          valide les brouillons (tous, ou seulement ceux choisis)
  generer                                 écrit les données de l'application
  inspecter [id ou nom]                   ce qu'il reste à renseigner
  synchroniser                            nouveaux artistes du catalogue + génération`;

async function main() {
  const [commande, ...reste] = process.argv.slice(2);
  try {
    if (commande === 'inventaire') commandeInventaire();
    else if (commande === 'nettoyer-noms') commandeNettoyerNoms(reste);
    else if (commande === 'depuis-catalogue') await commandeDepuisCatalogue(reste);
    else if (commande === 'creer') await commandeCreer(reste);
    else if (commande === 'corriger-noms') commandeCorrigerNoms(reste);
    else if (commande === 'inconnus') commandeInconnus();
    else if (commande === 'completer') await commandeCompleter(reste);
    else if (commande === 'promouvoir') commandePromouvoir(reste);
    else if (commande === 'generer') commandeGenerer();
    else if (commande === 'inspecter') commandeInspecter(reste);
    else if (commande === 'synchroniser') await commandeSynchroniser(reste);
    else {
      console.log(AIDE);
      if (commande) process.exitCode = 1;
    }
  } catch (e) {
    console.error(`✕ ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
