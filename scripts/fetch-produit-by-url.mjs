#!/usr/bin/env node
/**
 * Collecte un ou plusieurs produits à partir d'URLs précises. Récupère le
 * titre (og:title) et l'image (og:image) de chaque page, et tente
 * d'extraire un prix (balise product:price:amount si présente, sinon une
 * recherche de motif "XX,XX €" dans la page — imparfait, à vérifier).
 *
 * Usage :
 *   node scripts/fetch-produit-by-url.mjs --source "Tokyo Design Studio" --categorie deco --sous-categorie "Objets décoratifs" "https://url1" "https://url2"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'produits-bruts.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const params = { urls: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') params.source = args[++i];
    else if (args[i] === '--categorie') params.categorie = args[++i];
    else if (args[i] === '--sous-categorie') params.sousCategorie = args[++i];
    else params.urls.push(args[i]);
  }
  return params;
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

/** Prix : d'abord la balise Open Graph produit, sinon un motif "XX,XX €" ou "XX.XX EUR" dans la page. */
function extrairePrix(html) {
  const meta = extraireMeta(html, 'product:price:amount');
  if (meta) return parseFloat(meta.replace(',', '.'));

  const motif = html.match(/(\d{1,4}[,.]\d{2})\s*(€|EUR)/);
  return motif ? parseFloat(motif[1].replace(',', '.')) : null;
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
    titre: extraireMeta(html, 'og:title') || extraireTitreBalise(html),
    imageUrl: extraireMeta(html, 'og:image'),
    prix: extrairePrix(html),
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
  const { urls, source, categorie, sousCategorie } = parseArgs();

  if (urls.length === 0 || !source || !categorie || !sousCategorie) {
    console.error('Usage : node scripts/fetch-produit-by-url.mjs --source "..." --categorie ... --sous-categorie "..." "https://url1" "https://url2"');
    process.exit(1);
  }

  const existants = chargerExistants();
  const urlsExistantes = new Set(existants.map((p) => p.url));
  const nouveaux = [];

  for (const url of urls) {
    if (urlsExistantes.has(url)) {
      console.log(`  Ignoré (déjà présent) : ${url}`);
      continue;
    }
    console.log(`Récupération de ${url}...`);
    try {
      const { titre, imageUrl, prix } = await recupererPage(url);
      if (!titre) {
        console.warn(`  ⚠ Titre introuvable, ignoré : ${url}`);
        continue;
      }
      nouveaux.push({
        id: slugifier(titre),
        titre,
        categorie,
        sousCategorie,
        prix,
        imageUrl,
        url,
        source,
        dateReleve: new Date().toISOString().slice(0, 10),
      });
      const avertissements = [];
      if (!imageUrl) avertissements.push('pas d\'image trouvée');
      if (prix === null) avertissements.push('prix non détecté, à compléter à la main');
      console.log(`  ✓ ${titre}${avertissements.length ? ' — ' + avertissements.join(', ') : ''}`);
    } catch (err) {
      console.error(`  ✕ Échec : ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const fusion = [...existants, ...nouveaux];
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fusion, null, 2), 'utf-8');
  console.log(`\n${nouveaux.length} produit(s) ajouté(s) à scripts/output/produits-bruts.json`);
  console.log('Prochaine étape : node scripts/generate-fiches-produits.mjs');
}

main().catch((err) => {
  console.error('Erreur fatale :', err.message);
  process.exit(1);
});