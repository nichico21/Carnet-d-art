#!/usr/bin/env node
/**
 * Collecte de contenus de veille culturelle depuis un flux RSS. Par défaut,
 * interroge le flux configuré ci-dessous ; si des arguments sont fournis
 * en ligne de commande, ils remplacent ce flux par défaut.
 *
 * Usage :
 *   node scripts/fetch-veille.mjs                                    → flux par défaut
 *   node scripts/fetch-veille.mjs --url "https://..." --source "France Culture — X" --type podcast
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'veille-brutes.json');

const FLUX_PAR_DEFAUT = [
  {
    source: "France Culture — Le Cours de l'histoire",
    url: 'https://radiofrance-podcast.net/podcast09/rss_10076.xml',
    type: 'podcast',
  },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      params[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return params;
}

function resoudreFlux() {
  const { url, source, type } = parseArgs();
  if (!url) return FLUX_PAR_DEFAUT;

  return [
    {
      url,
      source: source || new URL(url).hostname,
      type: type || 'article',
    },
  ];
}

const MOTS_CLES_PERTINENTS = [
  'peinture', 'peintre', 'musée', 'tableau', 'exposition', 'sculpture',
  'sculpteur', 'art ', 'artiste', 'galerie', 'joconde', 'louvre',
  'patrimoine', 'photographie', 'architecte', 'architecture',
];

function estPertinent(item) {
  const texte = `${item.titre} ${item.description}`.toLowerCase();
  return MOTS_CLES_PERTINENTS.some((mot) => texte.includes(mot));
}

function extraireBalise(bloc, balise) {
  const regex = new RegExp(`<${balise}>([\\s\\S]*?)<\\/${balise}>`, 'i');
  const m = bloc.match(regex);
  if (!m) return null;
  return m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
}

function extraireImage(bloc) {
  const m = bloc.match(/<itunes:image[^>]+href=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

function extraireDuree(bloc) {
  const m = bloc.match(/<itunes:duration>([^<]+)<\/itunes:duration>/i);
  if (!m) return null;
  const parts = m[1].split(':').map(Number);
  if (parts.length === 3) {
    const [h, mn] = parts;
    return h > 0 ? `${h}h${String(mn).padStart(2, '0')}` : `${mn} min`;
  }
  return m[1];
}

function parserFluxRSS(xml) {
  const items = [];
  const blocs = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
  for (const bloc of blocs) {
    items.push({
      titre: extraireBalise(bloc, 'title'),
      lien: extraireBalise(bloc, 'link'),
      date: extraireBalise(bloc, 'pubDate'),
      description: extraireBalise(bloc, 'description'),
      imageUrl: extraireImage(bloc),
      duree: extraireDuree(bloc),
    });
  }
  return items;
}

async function recupererFlux(flux) {
  const res = await fetch(flux.url, {
    headers: { 'User-Agent': 'CarnetDArtApp/0.1 (veille culturelle, usage personnel)' },
  });
  if (!res.ok) throw new Error(`${flux.source} : réponse ${res.status}`);
  const xml = await res.text();
  return parserFluxRSS(xml).map((item) => ({ ...item, source: flux.source, type: flux.type }));
}

function slugifier(titre) {
  return titre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function chargerExistants() {
  if (!fs.existsSync(OUTPUT_FILE)) return [];
  return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
}

async function main() {
  const fluxAInterroger = resoudreFlux();
  const tousLesItems = [];

  for (const flux of fluxAInterroger) {
    console.log(`Interrogation de ${flux.source}...`);
    try {
      const items = await recupererFlux(flux);
      console.log(`  -> ${items.length} item(s) trouvé(s) dans le flux`);
      tousLesItems.push(...items);
    } catch (err) {
      console.error(`  Erreur : ${err.message}`);
    }
  }

  const utiles = tousLesItems.filter((item) => item.titre && item.lien && !item.lien.match(/^https?:\/\/[^/]+\/?$/));
  console.log(`${utiles.length} item(s) avec un lien réel (teasers sans page propre écartés)`);

  const pertinents = utiles.filter(estPertinent);
  console.log(`${pertinents.length} item(s) jugé(s) pertinents (mots-clés art/patrimoine)`);

  const nouveaux = pertinents.map((item) => ({
    id: slugifier(item.titre),
    titre: item.titre,
    type: item.type,
    source: item.source,
    url: item.lien,
    imageUrl: item.imageUrl,
    duree: item.duree,
    datePublication: item.date,
  }));

  const existants = chargerExistants();
  const idsExistants = new Set(existants.map((c) => c.id));
  const aAjouter = nouveaux.filter((c) => !idsExistants.has(c.id));
  const fusion = [...existants, ...aAjouter];

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fusion, null, 2), 'utf-8');
  console.log(`\n${aAjouter.length} nouveau(x) contenu(s) ajouté(s) (${nouveaux.length - aAjouter.length} déjà présents, ignorés).`);
}

main().catch((err) => {
  console.error('Erreur fatale :', err.message);
  process.exit(1);
});