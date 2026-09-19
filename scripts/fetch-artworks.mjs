#!/usr/bin/env node
/**
* Résout un argument en ligne de commande (nom de musée en texte libre, ou
 * identifiant Wikidata "Qxxxxx" déjà connu) vers { qid, nom, ville, pays }.
 * En texte libre, interroge l'API de recherche Wikidata et prend le premier
 * résultat — toujours vérifier que le nom affiché correspond bien au musée
 * attendu avant de lancer une grosse collecte.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerRegistre, enregistrer } from './registry.mjs';

async function resoudreMusee(saisie) {
  if (/^Q\d+$/i.test(saisie)) {
    // Identifiant déjà fourni : on va juste chercher son libellé pour l'affichage
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${saisie}&props=labels&languages=fr&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'CarnetDArtApp/0.1' } });
    const data = await res.json();
    const label = data.entities?.[saisie]?.labels?.fr?.value ?? saisie;
    return { qid: saisie.toUpperCase(), nom: label, ville: '?', pays: '?' };
  }

  const url =
    'https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json' +
    `&search=${encodeURIComponent(saisie)}&language=fr&type=item&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CarnetDArtApp/0.1' } });
  const data = await res.json();

  if (!data.search || data.search.length === 0) {
    throw new Error(`Aucun résultat Wikidata pour "${saisie}". Essaie avec l'identifiant Qxxxxx directement.`);
  }

  const trouve = data.search[0];
  console.log(`  → Musée résolu : "${trouve.label}" (${trouve.id}) — ${trouve.description ?? 'pas de description'}`);
  return { qid: trouve.id, nom: trouve.label, ville: '?', pays: '?' };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Par défaut (aucun argument) : Louvre + Orsay, comme avant.
const MUSEUMS_PAR_DEFAUT = [
  { qid: 'Q19675', nom: 'Musée du Louvre', ville: 'Paris', pays: 'France' },
  { qid: 'Q23402', nom: "Musée d'Orsay", ville: 'Paris', pays: 'France' },
];

async function resoudreListeMusees() {
  const args = process.argv.slice(2); // tout ce qui suit "node scripts/fetch-artworks.mjs"
  if (args.length === 0) return MUSEUMS_PAR_DEFAUT;

  console.log(`Résolution du/des musée(s) demandé(s) : ${args.join(', ')}`);
  const musees = [];
  for (const arg of args) {
    musees.push(await resoudreMusee(arg));
  }
  return musees;
}

// Nombre brut de lignes demandées à Wikidata (avant déduplication ;
// avec les OPTIONAL sur matériau/genre, une même œuvre peut apparaître
// plusieurs fois, donc on vise large).
const LIGNES_BRUTES_PAR_MUSEE = 800;

// Nombre d'œuvres uniques conservées par musée après tri par notoriété.
const OEUVRES_RETENUES_PAR_MUSEE = 250;

function buildQuery(collectionQid) {
  return `
    SELECT ?item ?itemLabel ?creatorLabel ?image ?inception ?height ?width ?materialLabel ?genreLabel ?sitelinks ?locationLabel WHERE {
      VALUES ?type { wd:Q3305213 wd:Q860861 wd:Q93184 wd:Q11060274 wd:Q1400264 wd:Q220659 }
      ?item wdt:P195 wd:${collectionQid}.
      ?item wdt:P31 ?type.
      ?item wdt:P18 ?image.
      ?item wikibase:sitelinks ?sitelinks.
      OPTIONAL { ?item wdt:P170 ?creator. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P2049 ?width. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL { ?item wdt:P136 ?genre. }
      OPTIONAL { ?item wdt:P276 ?location. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
    LIMIT ${LIGNES_BRUTES_PAR_MUSEE}
  `;
}

async function fetchMuseum(museum) {
  const url =
    'https://query.wikidata.org/sparql?format=json&query=' +
    encodeURIComponent(buildQuery(museum.qid));

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CarnetDArtApp/0.1 (prototype personnel de catalogue artistique)',
      Accept: 'application/sparql-results+json',
    },
  });

   const erreurTransitoire = [429, 502, 503, 504].includes(res.status);
  if (erreurTransitoire && tentative < 4) {
    const attente = tentative * 15000; // 15s, 30s, 45s
    console.log(`  Erreur ${res.status}, nouvel essai dans ${attente / 1000}s (tentative ${tentative + 1}/4)...`);
    await new Promise((r) => setTimeout(r, attente));
    return fetchMuseum(museum, tentative + 1);
  }

  if (!res.ok) {
  const detail = await res.text();
  throw new Error(`Wikidata a répondu ${res.status} pour ${museum.nom} :\n${detail}`);
}

  const data = await res.json();
  return data.results.bindings.map((b) => toRawArtwork(b, museum));
}

const MOTS_CLES_SENSIBLES = ['nu', 'nudité', 'nu féminin', 'nu masculin', 'érotique', 'scène de nu'];

function estContenuSensible(genreLabel) {
  if (!genreLabel) return false;
  const genre = genreLabel.toLowerCase();
  return MOTS_CLES_SENSIBLES.some(motCle => genre.includes(motCle));
}

function anneeValide(inceptionBinding) {
  if (!inceptionBinding || inceptionBinding.type !== 'literal') return null;
  const match = /^(\d{4})/.exec(inceptionBinding.value);
  return match ? match[1] : null;
}

function toRawArtwork(b, museum) {
  const wikidataId = b.item.value.split('/').pop();
  const image = b.image?.value ? b.image.value.replace(/^http:\/\//, 'https://') : null;
  // Un artiste dont le label n'a pas pu être résolu apparaît comme "Q12345" :
  // on le signale explicitement pour correction manuelle plutôt que de
  // masquer le problème.
  const artisteBrut = b.creatorLabel?.value ?? null;
const artiste = artisteBrut
  ? (/^Q\d+$/.test(artisteBrut) ? `${artisteBrut} (à corriger)` : artisteBrut)
  : 'Artiste inconnu';

  const locationLabel = b.locationLabel?.value ?? null;
  // Si Wikidata connaît une localisation actuelle ET qu'elle ne mentionne pas
  // le nom du musée attendu, c'est suspect (dépôt ailleurs, ou erreur de tag).
  const localisationSuspecte = Boolean(
    locationLabel && !locationLabel.toLowerCase().includes(museum.nom.toLowerCase().replace("musée d'", '').replace('musée du ', ''))
  );


  return {
    wikidataId,
    titre: b.itemLabel?.value ?? null,
    artiste,
    annee: anneeValide(b.inception),
    image,
    technique: b.materialLabel?.value ?? null,
    hauteurCm: b.height?.value ? Number(b.height.value) : null,
    largeurCm: b.width?.value ? Number(b.width.value) : null,
    genreWikidata: b.genreLabel?.value ?? null,
    notoriete: b.sitelinks?.value ? Number(b.sitelinks.value) : 0,
    lieuConservation: museum.nom,
    ville: museum.ville,
    pays: museum.pays,
    localisationActuelle: locationLabel,
    localisationSuspecte,
    contenuSensible: estContenuSensible(b.genreLabel?.value),
  };
}

function dedupliquer(oeuvres) {
  const parId = new Map();
  for (const o of oeuvres) {
    const existante = parId.get(o.wikidataId);
    if (!existante) {
      parId.set(o.wikidataId, o);
      continue;
    }
    // On complète les champs manquants avec les autres lignes du même id
    // (ex : technique "toile" plus utile que "peinture à l'huile" seul).
    if (!existante.annee && o.annee) existante.annee = o.annee;
    if (!existante.hauteurCm && o.hauteurCm) existante.hauteurCm = o.hauteurCm;
    if (!existante.largeurCm && o.largeurCm) existante.largeurCm = o.largeurCm;
    if (!existante.genreWikidata && o.genreWikidata) existante.genreWikidata = o.genreWikidata;
  }
  return Array.from(parId.values());
}

async function main() {
  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const registre = chargerRegistre();
  const toutes = [];

const musees = await resoudreListeMusees();

  for (const museum of musees) {
    const fichierMusee = path.join(outDir, `wikidata-${museum.qid}.json`);
    console.log(`Interrogation de Wikidata pour ${museum.nom}...`);

    try {
  const brutes = await fetchMuseum(museum);
  const dejaConnus = new Set(registre[museum.qid] ?? []);
  const uniques = dedupliquer(brutes)
    .filter((o) => o.titre && o.image)
    .filter((o) => !dejaConnus.has(o.wikidataId))   // ← exclut ce qui a déjà été collecté
    .sort((a, b) => b.notoriete - a.notoriete)
    .slice(0, OEUVRES_RETENUES_PAR_MUSEE);

  console.log(`  -> ${brutes.length} lignes brutes, ${uniques.length} nouvelles œuvres retenues (${dejaConnus.size} déjà en registre, ignorées)`);
  fs.writeFileSync(fichierMusee, JSON.stringify(uniques, null, 2), 'utf-8');
  enregistrer(registre, museum.qid, uniques.map((o) => o.wikidataId));
  toutes.push(...uniques);
} catch (err) {
      console.error(`  Erreur pour ${museum.nom} :`, err.message);
      // On retombe sur la dernière collecte réussie pour ce musée, plutôt que de la perdre
      if (fs.existsSync(fichierMusee)) {
        const secours = JSON.parse(fs.readFileSync(fichierMusee, 'utf-8'));
        console.log(`  -> Reprise de la précédente collecte réussie : ${secours.length} œuvres`);
        toutes.push(...secours);
      }
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  const outFile = path.join(outDir, 'wikidata-artworks.json');
  fs.writeFileSync(outFile, JSON.stringify(toutes, null, 2), 'utf-8');
  console.log(`\n${toutes.length} œuvres écrites dans ${path.relative(process.cwd(), outFile)}`);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
