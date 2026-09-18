#!/usr/bin/env node
/**
 * Récupère depuis Wikidata une sélection de peintures du Louvre et du
 * Musée d'Orsay (domaine public, avec image), triées par notoriété
 * (nombre d'articles Wikipédia liés), et écrit un fichier brut dans
 * scripts/output/wikidata-artworks.json.
 *
 * Ce script ne fait QUE la collecte : le mapping vers la nomenclature
 * de l'app (thème, couleurs dominantes, tonalité émotionnelle) se fait
 * ensuite à la main, œuvre par œuvre, car Wikidata ne peut pas nous
 * donner ça automatiquement.
 *
 * Usage : node scripts/fetch-artworks.mjs
 * (nécessite Node 18+, aucune dépendance à installer)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Si un musée renvoie 0 résultat, son identifiant Wikidata (Qxxxxx) est
// probablement faux : cherche le musée sur wikidata.org et corrige ici.
const MUSEUMS = [
  { qid: 'Q19675', nom: 'Musée du Louvre', ville: 'Paris', pays: 'France' },
  { qid: 'Q23402', nom: "Musée d'Orsay", ville: 'Paris', pays: 'France' },
];

// Nombre brut de lignes demandées à Wikidata (avant déduplication ;
// avec les OPTIONAL sur matériau/genre, une même œuvre peut apparaître
// plusieurs fois, donc on vise large).
const LIGNES_BRUTES_PAR_MUSEE = 400;

// Nombre d'œuvres uniques conservées par musée après tri par notoriété.
const OEUVRES_RETENUES_PAR_MUSEE = 40;

function buildQuery(collectionQid) {
  return `
    SELECT ?item ?itemLabel ?creatorLabel ?image ?inception ?height ?width ?materialLabel ?genreLabel ?sitelinks WHERE {
      ?item wdt:P195 wd:${collectionQid}.
      ?item wdt:P31 wd:Q3305213.
      ?item wdt:P18 ?image.
      ?item wdt:P170 ?creator.
      ?item wikibase:sitelinks ?sitelinks.
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P2049 ?width. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL { ?item wdt:P136 ?genre. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
    ORDER BY DESC(?sitelinks)
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

  if (!res.ok) {
    throw new Error(`Wikidata a répondu ${res.status} pour ${museum.nom}`);
  }

  const data = await res.json();
  return data.results.bindings.map((b) => toRawArtwork(b, museum));
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
  const artiste = artisteBrut && /^Q\d+$/.test(artisteBrut) ? `${artisteBrut} (à corriger)` : artisteBrut;

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
  const toutes = [];

  for (const museum of MUSEUMS) {
    console.log(`Interrogation de Wikidata pour ${museum.nom}...`);
    try {
      const brutes = await fetchMuseum(museum);
      const uniques = dedupliquer(brutes)
        .filter((o) => o.titre && o.image)
        .sort((a, b) => b.notoriete - a.notoriete)
        .slice(0, OEUVRES_RETENUES_PAR_MUSEE);
      console.log(`  -> ${brutes.length} lignes brutes, ${uniques.length} œuvres uniques retenues`);
      toutes.push(...uniques);
    } catch (err) {
      console.error(`  Erreur pour ${museum.nom} :`, err.message);
    }
  }

  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'wikidata-artworks.json');
  fs.writeFileSync(outFile, JSON.stringify(toutes, null, 2), 'utf-8');

  console.log(`\n${toutes.length} œuvres écrites dans ${path.relative(process.cwd(), outFile)}`);
  console.log('Prochaine étape : commit + push de ce fichier, puis on curate ensemble.');
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
