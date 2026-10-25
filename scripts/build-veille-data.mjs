#!/usr/bin/env node
/**
 * Lit toutes les fiches de scripts/catalog/veille/ et génère
 * src/data/veille.generated.ts — le fichier que l'app importe réellement.
 * Calcule aussi DERNIERS_AJOUTS (tri par dateAjout) et PLUS_CONSULTES
 * (tri par compteurConsultations), pour éviter que chaque écran refasse
 * ce tri lui-même.
 *
 * Liens (artistes, mouvements, époques, disciplines, museesIds, acces, oeuvresLiees) :
 * ils sont contrôlés avant publication. Une référence qui ne mène nulle part (musée sans
 * fiche, œuvre absente du catalogue, valeur hors vocabulaire) n'est pas publiée et la
 * commande l'indique. Les artistes sont publiés avec l'orthographe exacte du catalogue.
 * Un champ n'est publié que si le type de l'app (src/types/veille.ts) le connaît : sinon
 * le fichier généré ne passerait pas la vérification de types.
 *
 * Usage : node scripts/build-veille-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerContexte, normaliser } from './verifier-liens-veille.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VEILLE_DIR = path.join(__dirname, 'catalog', 'veille');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'veille.generated.ts');
const TYPE_FILE = path.join(__dirname, '..', 'src', 'types', 'veille.ts');
const CHAMPS_LIENS = ['artistes', 'mouvements', 'epoques', 'disciplines', 'museesIds', 'acces'];
const MAX_AVERTISSEMENTS_AFFICHES = 15;

const liste = (v) => (Array.isArray(v) ? v : []);

/** Les champs de liens que le type de l'app déclare (« nom: » ou « nom?: »), commentaires exclus. */
export function champsDuType(texte) {
  const code = (texte ?? '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return new Set(CHAMPS_LIENS.filter((nom) => new RegExp(`\\b${nom}\\s*\\??\\s*:`).test(code)));
}

function filtrerVocabulaire(valeurs, nomVocabulaire, ctx, avertir) {
  const vocabulaire = ctx.vocabulaires.get(nomVocabulaire);
  if (!vocabulaire) return valeurs;
  return valeurs.filter((v) => {
    if (vocabulaire.has(v)) return true;
    avertir(`${nomVocabulaire} : « ${v} » absent du vocabulaire, non publié`);
    return false;
  });
}

/** Les liens d'une fiche, contrôlés et nettoyés ; seuls les champs non vides sont retournés. */
export function liensControles(fiche, ctx, avertir = () => {}) {
  const liens = {};
  const artistes = [...new Set(liste(fiche.artistes).map((n) => ctx.artistes.get(normaliser(n)) ?? n))];
  if (artistes.length > 0) liens.artistes = artistes;
  for (const champ of ['mouvements', 'epoques', 'disciplines']) {
    const valeurs = [...new Set(filtrerVocabulaire(liste(fiche[champ]), champ, ctx, avertir))];
    if (valeurs.length > 0) liens[champ] = valeurs;
  }
  const musees = liste(fiche.museesIds).filter((id) => {
    if (ctx.museesIds.has(id)) return true;
    avertir(ctx.museesBrouillons.has(id)
      ? `museesIds : « ${id} » est encore un brouillon, non publié`
      : `museesIds : « ${id} » ne correspond à aucune fiche musée, non publié`);
    return false;
  });
  if (musees.length > 0) liens.museesIds = [...new Set(musees)];
  if (fiche.acces) {
    const [acces] = filtrerVocabulaire([fiche.acces], 'acces', ctx, avertir);
    if (acces) liens.acces = acces;
  }
  return liens;
}

export function versContenuVeille(fiche, ctx, publies = new Set(), avertir = () => {}) {
  const liens = liensControles(fiche, ctx, avertir);
  const oeuvres = [...new Set(liste(fiche.oeuvresLiees).filter((id) => {
    if (ctx.oeuvresIds.has(id)) return true;
    avertir(`oeuvresLiees : « ${id} » n'est pas une œuvre du catalogue, non publiée`);
    return false;
  }))];
  const nonPublies = Object.keys(liens).filter((nom) => !publies.has(nom));
  nonPublies.forEach((nom) => avertir(`@type:${nom}`));
  const publiables = Object.fromEntries(Object.entries(liens).filter(([nom]) => publies.has(nom)));
  return {
    id: fiche.id,
    titre: fiche.titre,
    type: fiche.type,
    source: fiche.source,
    url: fiche.url,
    ...(fiche.imageUrl ? { imageUrl: fiche.imageUrl } : {}),
    ...(fiche.duree ? { duree: fiche.duree } : {}),
    ...(fiche.datePublication ? { datePublication: fiche.datePublication } : {}),
    ...(fiche.description ? { description: fiche.description } : {}),
    ...(fiche.motsCles && fiche.motsCles.length > 0 ? { motsCles: fiche.motsCles } : {}),
    ...(oeuvres.length > 0 ? { oeuvresLiees: oeuvres } : {}),
    dateAjout: fiche.dateAjout,
    compteurConsultations: fiche.compteurConsultations ?? 0,
    ...(fiche.themesLies && fiche.themesLies.length > 0 ? { themesLies: fiche.themesLies } : {}),
    ...publiables,
    statut: fiche.statut,
  };
}

function lireFiches() {
  const fiches = [];
  for (const nom of fs.readdirSync(VEILLE_DIR).filter((f) => f.endsWith('.json')).sort()) {
    try {
      fiches.push(JSON.parse(fs.readFileSync(path.join(VEILLE_DIR, nom), 'utf-8')));
    } catch (e) {
      console.error(`Fiche illisible : scripts/catalog/veille/${nom} (${e.message})`);
      console.error('Corrige son JSON puis relance : aucune donnée n\'a été écrite.');
      process.exit(1);
    }
  }
  return fiches;
}

function main() {
  if (!fs.existsSync(VEILLE_DIR)) {
    console.error(`Dossier introuvable : ${VEILLE_DIR}`);
    process.exit(1);
  }
  const fiches = lireFiches();
  const ctx = chargerContexte();
  const typeApp = fs.existsSync(TYPE_FILE) ? fs.readFileSync(TYPE_FILE, 'utf-8') : '';
  const publies = champsDuType(typeApp);

  const avertissements = [];
  const champsNonPublies = new Set();
  let artistesInconnus = 0;
  const contenus = fiches.map((fiche) => {
    for (const nom of liste(fiche.artistes)) if (!ctx.artistes.has(normaliser(nom))) artistesInconnus += 1;
    return versContenuVeille(fiche, ctx, publies, (message) => {
      if (message.startsWith('@type:')) champsNonPublies.add(message.slice(6));
      else avertissements.push(`${fiche.id} : ${message}`);
    });
  });

  for (const cle of ['id', 'url']) {
    const vus = new Map();
    for (const c of contenus) {
      if (vus.has(c[cle])) {
        avertissements.push(`${c.id} : ${cle} déjà utilisé par « ${vus.get(c[cle])} »`);
      }
      else vus.set(c[cle], c.id);
    }
  }

  const parDate = (a, b) => (b.dateAjout ?? '').localeCompare(a.dateAjout ?? '');
  const derniersAjouts = [...contenus].sort(parDate);
  const plusConsultes = [...contenus].sort((a, b) => b.compteurConsultations - a.compteurConsultations);

  const contenuFichier = `// Fichier généré automatiquement par scripts/build-veille-data.mjs
// Ne pas éditer à la main — relancer le script après toute mise à jour du catalogue veille.

import { ContenuVeille } from '../types/veille';

export const CONTENUS_VEILLE: ContenuVeille[] = ${JSON.stringify(contenus, null, 2)};

export const DERNIERS_AJOUTS: ContenuVeille[] = ${JSON.stringify(derniersAjouts, null, 2)};

export const PLUS_CONSULTES: ContenuVeille[] = ${JSON.stringify(plusConsultes, null, 2)};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, contenuFichier, 'utf-8');
  console.log(`${contenus.length} contenu(s) écrit(s) dans src/data/veille.generated.ts`);

  if (avertissements.length > 0) {
    console.log(`\n⚠ ${avertissements.length} référence(s) non publiée(s) ou à vérifier :`);
    avertissements.slice(0, MAX_AVERTISSEMENTS_AFFICHES).forEach((a) => console.log(`  - ${a}`));
    if (avertissements.length > MAX_AVERTISSEMENTS_AFFICHES) {
      console.log(`  … et ${avertissements.length - MAX_AVERTISSEMENTS_AFFICHES} autre(s)`);
    }
    console.log('  Détail et suggestions : node scripts/verifier-liens-veille.mjs');
  }
  if (artistesInconnus > 0) {
    console.log(
      `\nℹ ${artistesInconnus} mention(s) d'artiste absente(s) du catalogue d'œuvres ` +
        '(publiées telles quelles).',
    );
  }
  if (champsNonPublies.size > 0) {
    const noms = [...champsNonPublies].sort((a, b) => CHAMPS_LIENS.indexOf(a) - CHAMPS_LIENS.indexOf(b));
    console.log(
      '\n⚠ Champs renseignés mais NON publiés, car absents de src/types/veille.ts : ' +
        noms.join(', '),
    );
    console.log('  Ajoute-les à l\'interface ContenuVeille (champs facultatifs) puis relance.');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
