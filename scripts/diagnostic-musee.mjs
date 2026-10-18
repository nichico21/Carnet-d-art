#!/usr/bin/env node
/**
 * Diagnostic : pour chaque URL de page "Expositions" d'un musée, indique si
 * elle peut être suivie automatiquement (réponse du serveur, robots.txt,
 * données structurées d'événements, contenu présent sans JavaScript).
 *
 * Usage :
 *   node scripts/diagnostic-musee.mjs "https://musee-a.fr/expositions" "https://musee-b.fr/agenda"
 */

import { fileURLToPath } from 'node:url';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Extrait les objets JSON-LD (données structurées) d'une page, @graph déplié. */
export function extraireJsonLd(html) {
  const blocs = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  const objets = [];
  for (const [, contenu] of blocs) {
    try {
      const donnees = JSON.parse(contenu.trim());
      const liste = Array.isArray(donnees) ? donnees : [donnees];
      for (const o of liste) {
        if (o && Array.isArray(o['@graph'])) objets.push(...o['@graph']);
        else objets.push(o);
      }
    } catch {
      /* bloc illisible : ignoré */
    }
  }
  return objets;
}

/** Nombre d'objets de type Event / ExhibitionEvent parmi les données structurées. */
export function contientEvenement(objets) {
  return objets.filter((o) => {
    const type = o && o['@type'];
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => typeof t === 'string' && /Event|Exhibition/i.test(t));
  }).length;
}

/** Texte réellement visible d'une page (sans scripts, styles ni balises). */
export function texteVisible(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nombre de liens dont l'adresse contient "expo". */
export function compterLiensExpo(html) {
  return [...html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)].filter(([, href]) =>
    /expo/i.test(href),
  ).length;
}

function motifVersRegex(motif) {
  const echappe = motif.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + echappe);
}

/**
 * Lecture simplifiée de robots.txt pour "User-agent: *" : la règle la plus
 * spécifique (motif le plus long) l'emporte, et Allow gagne à égalité.
 */
export function robotsAutorise(robotsTxt, chemin) {
  const lignes = robotsTxt
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);

  let dansGroupeEtoile = false;
  let precedentEtaitAgent = false;
  const regles = [];

  for (const ligne of lignes) {
    const [cleBrute, ...reste] = ligne.split(':');
    const cle = cleBrute.trim().toLowerCase();
    const valeur = reste.join(':').trim();
    if (cle === 'user-agent') {
      if (!precedentEtaitAgent) dansGroupeEtoile = false;
      if (valeur === '*') dansGroupeEtoile = true;
      precedentEtaitAgent = true;
    } else {
      precedentEtaitAgent = false;
      if (dansGroupeEtoile && (cle === 'disallow' || cle === 'allow')) {
        regles.push({ type: cle, motif: valeur });
      }
    }
  }

  let meilleure = null;
  for (const r of regles) {
    if (r.motif === '') continue;
    if (motifVersRegex(r.motif).test(chemin)) {
      const plusSpecifique = !meilleure || r.motif.length > meilleure.motif.length;
      const egaliteAllow =
        meilleure && r.motif.length === meilleure.motif.length && r.type === 'allow';
      if (plusSpecifique || egaliteAllow) meilleure = r;
    }
  }
  return !meilleure || meilleure.type === 'allow';
}

export function verdict({ statut, nbEvenements, longueurTexte, nbLiensExpo }) {
  if (statut === null) return 'Injoignable (erreur réseau).';
  if (statut === 401 || statut === 403 || statut === 429) {
    return `Bloqué (réponse ${statut}) : protection anti-robot probable.`;
  }
  if (statut >= 400) return `Page non disponible (réponse ${statut}).`;
  if (nbEvenements > 0) {
    return "Très bien : données structurées d'événements trouvées (extraction fiable, sans IA).";
  }
  if (longueurTexte < 1500) {
    return 'Page quasi vide côté serveur : contenu chargé par JavaScript (navigateur automatisé nécessaire).';
  }
  if (nbLiensExpo > 0) {
    return "Exploitable avec une extraction par IA : du texte et des liens d'expositions sont présents.";
  }
  return "Texte présent mais aucun lien d'exposition repéré : à examiner à la main.";
}

async function diagnostiquer(url) {
  console.log(`\n=== ${url}`);
  let u;
  try {
    u = new URL(url);
  } catch {
    console.log('URL invalide.');
    return;
  }

  try {
    const r = await fetch(`${u.origin}/robots.txt`, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      const autorise = robotsAutorise(await r.text(), u.pathname);
      console.log(
        `robots.txt : ${autorise ? "cette page n'est pas interdite aux robots" : 'cette page est INTERDITE aux robots (Disallow)'}`,
      );
    } else {
      console.log(`robots.txt : introuvable (réponse ${r.status})`);
    }
  } catch {
    console.log('robots.txt : illisible');
  }

  let statut = null;
  let html = '';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
      redirect: 'follow',
    });
    statut = res.status;
    html = await res.text();
    if (res.url !== url) console.log(`redirigée vers ${res.url}`);
  } catch (e) {
    console.log(`Erreur : ${e.message}`);
  }

  const nbEvenements = contientEvenement(extraireJsonLd(html));
  const longueurTexte = texteVisible(html).length;
  const nbLiensExpo = compterLiensExpo(html);
  const aImage = /<meta[^>]+property=["']og:image["']/i.test(html);

  console.log(`réponse du serveur : ${statut ?? 'aucune'}`);
  console.log(`taille de la page : ${Math.round(html.length / 1024)} Ko`);
  console.log(`texte visible : ${longueurTexte} caractères`);
  console.log(`événements en données structurées : ${nbEvenements}`);
  console.log(`liens contenant "expo" : ${nbLiensExpo}`);
  console.log(`image de partage (og:image) : ${aImage ? 'oui' : 'non'}`);
  console.log(`>>> ${verdict({ statut, nbEvenements, longueurTexte, nbLiensExpo })}`);
}

async function main() {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('Usage : node scripts/diagnostic-musee.mjs "https://page-expositions-1" "https://page-expositions-2"');
    process.exit(1);
  }
  for (const url of urls) {
    await diagnostiquer(url);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}