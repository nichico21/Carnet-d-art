#!/usr/bin/env node
/**
 * Orchestrateur : enchaîne la collecte Wikidata puis la génération des fiches.
 * Les arguments passés à collect.mjs (nom(s) de musée ou identifiant(s) Qxxxxx)
 * sont transmis tels quels à fetch-artworks.mjs.
 *
 * Usage :
 *   node scripts/collect.mjs                              → Louvre + Orsay (défaut)
 *   node scripts/collect.mjs "Musée Jacquemart-André"      → un seul musée
 *   node scripts/collect.mjs "Tate Britain" "Rijksmuseum"  → plusieurs musées
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argsMusees = process.argv.slice(2); // tout ce qui suit "node scripts/collect.mjs"

function lancer(script, args = []) {
  console.log(`\n=== ${script}${args.length ? ' ' + args.join(' ') : ''} ===\n`);
  execFileSync('node', [path.join(__dirname, script), ...args], { stdio: 'inherit' });
}

lancer('fetch-artworks.mjs', argsMusees);
lancer('generate-fiches.mjs'); // pas besoin d'arguments : lit simplement le fichier produit juste avant

console.log('\nTerminé. Les fiches sont prêtes dans 0_workspace/ pour curation.');