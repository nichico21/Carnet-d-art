#!/usr/bin/env node
/**
 * Collecte des contenus de veille à partir d'URLs précises (pas un flux RSS)
 * — utile pour des séries déjà terminées, dont on veut ajouter les épisodes
 * existants une fois, sans mettre en place de veille continue.
 *
 * Récupère le titre (balise og:title, ou <title>) et l'image (og:image) de
 * chaque page. Fusionne dans scripts/output/veille-brutes.json comme
 * fetch-veille.mjs.
 *
 * Usage :
 *   node scripts/fetch-veille-by-url.mjs --type podcast --source "France Culture — Les Chemins de la philosophie" "https://url1" "https://url2"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'veille-brutes.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = { urls: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--type') { params.type = args[++i]; }
    else if (args[i] === '--source') { params.source = args[++i]; }
    else { params.urls.push(args[i]); }
  }
  return params;
}

function decoderEntitesHTML(texte) {
  if (!texte) return texte;
  return texte
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extraireMeta(html, propriete) {
  const regexes = [
    new RegExp(`<meta[^>]+property=["']${propriete}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${propriete}["']`, 'i'),
  ];
  for (const r of regexes) {
    const m = html.match(r);
    if (m) return m[1];
  }
  return null;
}

function extraireTitreBalise(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

async function recupererPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`réponse ${res.status}`);
  const html = await res.text();
  return {
    titre: decoderEntitesHTML(extraireMeta(html, 'og:title') || extraireTitreBalise(html)),
    imageUrl: decoderEntitesHTML(extraireMeta(html, 'og:image')),
  };
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
  const { urls, type, source } = parseArgs();

  if (urls.length === 0) {
    console.error('Usage : node scripts/fetch-veille-by-url.mjs --type podcast --source "..." "https://url1" "https://url2"');
    process.exit(1);
  }
  if (!type || !source) {
    console.error('Les options --type et --source sont obligatoires (impossible de les deviner de façon fiable pour une URL isolée).');
    process.exit(1);
  }

  const existants = chargerExistants();
  const urlsExistantes = new Set(existants.map((c) => c.url));
  const nouveaux = [];

  for (const url of urls) {
    if (urlsExistantes.has(url)) {
      console.log(`  Ignoré (déjà présent) : ${url}`);
      continue;
    }
    console.log(`Récupération de ${url}...`);
    try {
      const { titre, imageUrl } = await recupererPage(url);
      if (!titre) {
        console.warn(`  ⚠ Titre introuvable, ignoré — ajoute-le manuellement si besoin : ${url}`);
        continue;
      }
      nouveaux.push({
        id: slugifier(titre),
        titre,
        type,
        source,
        url,
        imageUrl,
        duree: null,
        datePublication: null,
      });
      console.log(`  ✓ ${titre}${imageUrl ? '' : ' — pas d\'image trouvée, à compléter'}`);
    } catch (err) {
      console.error(`  ✕ Échec : ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const fusion = [...existants, ...nouveaux];
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fusion, null, 2), 'utf-8');
  console.log(`\n${nouveaux.length} contenu(s) ajouté(s) à scripts/output/veille-brutes.json`);
  console.log('Prochaine étape : node scripts/generate-fiches-veille.mjs');
}

main().catch((err) => {
  console.error('Erreur fatale :', err.message);
  process.exit(1);
});