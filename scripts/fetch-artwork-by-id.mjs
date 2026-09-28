#!/usr/bin/env node
/**
 * Collecte une ou plusieurs œuvres précises, identifiées par leur QID Wikidata
 * (pas un musée entier). Fusionne le résultat dans scripts/output/wikidata-artworks.json,
 * en évitant les doublons — puis node scripts/generate-fiches.mjs prend le relais
 * comme d'habitude pour créer les fiches brouillon.
 *
 * Usage : node scripts/fetch-artwork-by-id.mjs Q1234567 Q7654321
 * (trouve le QID sur wikidata.org : cherche l'œuvre, l'identifiant est dans l'URL)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'wikidata-artworks.json');

const VILLE_PAYS_PAR_LIEU = {
  'musée du louvre': { ville: 'Paris', pays: 'France' },
  "musée d'orsay": { ville: 'Paris', pays: 'France' },
  'musée jacquemart-andré': { ville: 'Paris', pays: 'France' },
  'national gallery': { ville: 'Londres', pays: 'Royaume-Uni' },
};

const MOTS_CLES_SENSIBLES = ['nu', 'nudité', 'nu féminin', 'nu masculin', 'érotique', 'scène de nu'];
function estContenuSensible(genreLabel) {
  if (!genreLabel) return false;
  const genre = genreLabel.toLowerCase();
  return MOTS_CLES_SENSIBLES.some((motCle) => genre.includes(motCle));
}

function buildQuery(qids) {
  const values = qids.map((q) => `wd:${q}`).join(' ');
  return `
    SELECT ?item ?itemLabel ?creatorLabel ?image ?inception ?height ?width ?materialLabel ?genreLabel ?collectionLabel ?locationLabel ?sitelinks WHERE {
      VALUES ?item { ${values} }
      OPTIONAL { ?item wdt:P18 ?image. }
      OPTIONAL { ?item wdt:P170 ?creator. }
      OPTIONAL { ?item wdt:P571 ?inception. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P2049 ?width. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL { ?item wdt:P136 ?genre. }
      OPTIONAL { ?item wdt:P195 ?collection. }
      OPTIONAL { ?item wdt:P276 ?location. }
      OPTIONAL { ?item wikibase:sitelinks ?sitelinks. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
    }
  `;
}

async function interroger(qids) {
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(buildQuery(qids));
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CarnetDArtApp/0.1 (prototype personnel de catalogue artistique)',
      Accept: 'application/sparql-results+json',
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Wikidata a répondu ${res.status} :\n${detail}`);
  }
  const data = await res.json();
  return data.results.bindings;
}

function anneeValide(inceptionBinding) {
  if (!inceptionBinding || inceptionBinding.type !== 'literal') return null;
  const match = /^(\d{4})/.exec(inceptionBinding.value);
  return match ? match[1] : null;
}

function trouverVillePays(lieuConservation) {
  if (!lieuConservation) return { ville: null, pays: null };
  const cle = Object.keys(VILLE_PAYS_PAR_LIEU).find((k) => k === lieuConservation.toLowerCase());
  return cle ? VILLE_PAYS_PAR_LIEU[cle] : { ville: null, pays: null };
}

function versOeuvreBrute(b) {
  const wikidataId = b.item.value.split('/').pop();
  const image = b.image?.value ? b.image.value.replace(/^http:\/\//, 'https://') : null;
  const artisteBrut = b.creatorLabel?.value ?? null;
  const artiste = artisteBrut
    ? (/^Q\d+$/.test(artisteBrut) ? `${artisteBrut} (à corriger)` : artisteBrut)
    : 'Artiste inconnu';
  const lieuConservation = b.collectionLabel?.value ?? b.locationLabel?.value ?? null;
  const { ville, pays } = trouverVillePays(lieuConservation);

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
    lieuConservation: lieuConservation ?? 'À compléter',
    ville: ville ?? 'À compléter',
    pays: pays ?? 'À compléter',
    localisationSuspecte: false,
    contenuSensible: estContenuSensible(b.genreLabel?.value),
  };
}

function main() {
  const qids = process.argv.slice(2);

  if (qids.length === 0) {
    console.error('Usage : node scripts/fetch-artwork-by-id.mjs Q1234567 [Q7654321 ...]');
    process.exit(1);
  }
  const invalides = qids.filter((q) => !/^Q\d+$/i.test(q));
  if (invalides.length > 0) {
    console.error(`Identifiant(s) invalide(s) (format attendu Qxxxxx) : ${invalides.join(', ')}`);
    process.exit(1);
  }

  interroger(qids)
    .then((bindings) => {
      if (bindings.length === 0) {
        console.log('Aucun résultat — vérifie les identifiants sur wikidata.org.');
        return;
      }

      const brutes = bindings.map(versOeuvreBrute).filter((o) => o.titre && o.image);
const vues = new Set();
const nouvelles = brutes.filter((o) => {
  if (vues.has(o.wikidataId)) return false;
  vues.add(o.wikidataId);
  return true;
});
      const manquantes = qids.filter((q) => !nouvelles.some((o) => o.wikidataId === q));
      if (manquantes.length > 0) {
        console.warn(`⚠ Ignoré (pas de titre ou pas d'image sur Wikidata) : ${manquantes.join(', ')}`);
      }

      let existantes = [];
      if (fs.existsSync(OUTPUT_FILE)) {
        existantes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      }
      const idsExistants = new Set(existantes.map((o) => o.wikidataId));
      const aAjouter = nouvelles.filter((o) => !idsExistants.has(o.wikidataId));
      const dejaPresentes = nouvelles.length - aAjouter.length;

      const fusion = [...existantes, ...aAjouter];
      fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fusion, null, 2), 'utf-8');

      console.log(`${aAjouter.length} œuvre(s) ajoutée(s) à scripts/output/wikidata-artworks.json`);
      if (dejaPresentes > 0) console.log(`${dejaPresentes} déjà présente(s), ignorée(s).`);
      aAjouter.forEach((o) => {
        const alerte = o.ville === 'À compléter' ? '  ⚠ ville/pays/lieu à compléter manuellement' : '';
        console.log(`  - ${o.titre} (${o.artiste})${alerte}`);
      });
      console.log('\nProchaine étape : node scripts/generate-fiches.mjs');
    })
    .catch((err) => {
      console.error('Erreur :', err.message);
      process.exit(1);
    });
}

main();