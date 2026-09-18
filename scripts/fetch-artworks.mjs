#!/usr/bin/env node
/**
 * Récupère depuis Wikidata une sélection de peintures du Louvre et du
 * Musée d'Orsay (domaine public, avec image) et écrit un fichier brut
 * dans scripts/output/wikidata-artworks.json.
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

const LIMIT_PAR_MUSEE = 60;

function buildQuery(collectionQid) {
  return `
    SELECT ?item ?itemLabel ?creatorLabel ?image ?inception ?height ?width ?materialLabel ?genreLabel WHERE {
      ?item wdt:P195 wd:${collectionQid}.
      ?item wdt:P31 wd:Q3305213.
      ?item wdt:P18 ?image.
      ?item wdt:P170 ?creator.
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P2049 ?width. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL { ?item wdt:P136 ?genre. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
    LIMIT ${LIMIT_PAR_MUSEE}
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

function toRawArtwork(b, museum) {
  const wikidataId = b.item.value.split('/').pop();
  const image = b.image?.value ? b.image.value.replace(/^http:\/\//, 'https://') : null;

  return {
    wikidataId,
    titre: b.itemLabel?.value ?? null,
    artiste: b.creatorLabel?.value ?? null,
    annee: b.inception?.value ? b.inception.value.slice(0, 4) : null,
    image,
    technique: b.materialLabel?.value ?? null,
    hauteurCm: b.height?.value ? Number(b.height.value) : null,
    largeurCm: b.width?.value ? Number(b.width.value) : null,
    genreWikidata: b.genreLabel?.value ?? null,
    lieuConservation: museum.nom,
    ville: museum.ville,
    pays: museum.pays,
  };
}

async function main() {
  const toutes = [];

  for (const museum of MUSEUMS) {
    console.log(`Interrogation de Wikidata pour ${museum.nom}...`);
    try {
      const oeuvres = await fetchMuseum(museum);
      console.log(`  -> ${oeuvres.length} œuvres récupérées`);
      toutes.push(...oeuvres);
    } catch (err) {
      console.error(`  Erreur pour ${museum.nom} :`, err.message);
    }
  }

  // On écarte les entrées sans titre ou sans image exploitable.
  const valides = toutes.filter((o) => o.titre && o.image);

  const outDir = path.join(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'wikidata-artworks.json');
  fs.writeFileSync(outFile, JSON.stringify(valides, null, 2), 'utf-8');

  console.log(`\n${valides.length} œuvres écrites dans ${path.relative(process.cwd(), outFile)}`);
  console.log('Prochaine étape : commit + push de ce fichier, puis on curate ensemble.');
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
