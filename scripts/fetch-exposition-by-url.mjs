#!/usr/bin/env node
/**
 * Crée un BROUILLON de fiche exposition à partir de l'adresse de sa page sur
 * le site d'un musée. Récupère ce qui se lit de façon fiable (titre, image,
 * dates) et laisse le reste à compléter. Si la page est inaccessible
 * (ex. protection anti-robot), un brouillon presque vide est créé.
 *
 * Usage :
 *   node scripts/fetch-exposition-by-url.mjs "https://site-du-musee/page-exposition" ["https://..."]
 *   node scripts/fetch-exposition-by-url.mjs --musee louvre "https://..."   (force le musée)
 *
 * Étape suivante : compléter 0_workspace_expositions/<id>.json, puis
 *   node scripts/promote-expositions-brouillons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FICHES_DIR, WORKSPACE_DIR, chargerContexte, estDateISO, estVide } from './lib-expositions.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PARAMS_DE_SUIVI = new Set([
  'srsltid', 'gclid', 'gclsrc', 'fbclid', 'msclkid', 'cookie_consent',
  'mc_cid', 'mc_eid', '_ga', 'igshid',
]);

/** Retire les paramètres de suivi publicitaire et le fragment, garde le reste. */
export function nettoyerUrl(url) {
  const u = new URL(url);
  for (const cle of [...u.searchParams.keys()]) {
    if (cle.startsWith('utm_') || PARAMS_DE_SUIVI.has(cle)) u.searchParams.delete(cle);
  }
  u.hash = '';
  return u.toString();
}

const ENTITES = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ',
  aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', atilde: 'ã', aring: 'å',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü',
  ccedil: 'ç', ntilde: 'ñ', szlig: 'ß', oelig: 'œ',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê',
  Icirc: 'Î', Ocirc: 'Ô', Ucirc: 'Û', Ccedil: 'Ç', OElig: 'Œ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', laquo: '«', raquo: '»',
  hellip: '…', ndash: '–', mdash: '—',
};

/** Décode les entités HTML en un seul passage ("&amp;amp;" donne "&amp;"). */
export function decoderEntites(texte) {
  return texte.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(n) ? tout : String.fromCodePoint(n);
    }
    return ENTITES[code] ?? tout;
  });
}

export function extraireMeta(html, propriete) {
  // La valeur se termine au guillemet du même type que celui d'ouverture
  // (une apostrophe dans un titre entre guillemets doubles ne la coupe pas)
  // et ne peut jamais déborder sur une autre balise.
  const regexes = [
    {
      re: new RegExp(`<meta[^>]+(?:property|name)=(["'])${propriete}\\1[^>]+content=(["'])((?:(?!\\2)[^>])*)\\2`, 'i'),
      groupe: 3,
    },
    {
      re: new RegExp(`<meta[^>]+content=(["'])((?:(?!\\1)[^>])*)\\1[^>]+(?:property|name)=(["'])${propriete}\\3`, 'i'),
      groupe: 2,
    },
  ];
  for (const { re, groupe } of regexes) {
    const m = html.match(re);
    if (m && m[groupe].trim() !== '') return decoderEntites(m[groupe].trim());
  }
  return null;
}

export function texteVisible(html) {
  return decoderEntites(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Premier événement (Event / ExhibitionEvent) trouvé dans les données structurées. */
export function extraireEvenementJsonLd(html) {
  const blocs = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];
  for (const [, contenu] of blocs) {
    let donnees;
    try {
      donnees = JSON.parse(contenu.trim());
    } catch {
      continue;
    }
    const liste = (Array.isArray(donnees) ? donnees : [donnees]).flatMap((o) =>
      o && Array.isArray(o['@graph']) ? o['@graph'] : [o],
    );
    for (const o of liste) {
      const type = o && o['@type'];
      const types = Array.isArray(type) ? type : [type];
      if (types.some((t) => typeof t === 'string' && /Event|Exhibition/i.test(t))) return o;
    }
  }
  return null;
}

const MOIS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};
const J = '(?<!\\d)(1er|\\d{1,2})';
const M = '(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)';
const SEP = '\\s*(?:au|-)\\s*';

function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\u2012-\u2015\u2212]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ');
}

const jourNum = (j) => (j === '1er' ? 1 : Number(j));
const iso = (a, m, j) => `${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;

/**
 * Cherche une période en français dans un texte : "du 11 septembre 2026 au
 * 24 janvier 2027", "7 octobre 2026 – 25 janvier 2027", "du 09.10.2026 au
 * 08.03.2027", "du 3 août au 31 décembre 2026", "du 3 au 15 mars 2027",
 * "jusqu'au 25 janvier 2027". Retourne la première période valide du texte.
 */
export function extraireDatesFrancais(texte) {
  const t = normaliser(texte);
  const candidats = [];

  const motifs = [
    {
      re: new RegExp(`${J}\\s+${M}\\s+(\\d{4})${SEP}${J}\\s+${M}\\s+(\\d{4})`, 'g'),
      lire: (m) => ({ d: [m[3], MOIS[m[2]], jourNum(m[1])], f: [m[6], MOIS[m[5]], jourNum(m[4])] }),
    },
    {
      re: new RegExp(`(?<!\\d)(\\d{2})[./](\\d{2})[./](\\d{4})${SEP}(\\d{2})[./](\\d{2})[./](\\d{4})`, 'g'),
      lire: (m) => ({ d: [m[3], Number(m[2]), Number(m[1])], f: [m[6], Number(m[5]), Number(m[4])] }),
    },
    {
      re: new RegExp(`${J}\\s+${M}${SEP}${J}\\s+${M}\\s+(\\d{4})`, 'g'),
      lire: (m) => {
        const anneeFin = Number(m[5]);
        const moisDebut = MOIS[m[2]];
        const moisFin = MOIS[m[4]];
        return {
          d: [moisDebut > moisFin ? anneeFin - 1 : anneeFin, moisDebut, jourNum(m[1])],
          f: [anneeFin, moisFin, jourNum(m[3])],
        };
      },
    },
    {
      re: new RegExp(`${J}${SEP}${J}\\s+${M}\\s+(\\d{4})`, 'g'),
      lire: (m) => ({
        d: [m[4], MOIS[m[3]], jourNum(m[1])],
        f: [m[4], MOIS[m[3]], jourNum(m[2])],
      }),
    },
  ];

  for (const { re, lire } of motifs) {
    for (const m of t.matchAll(re)) {
      const { d, f } = lire(m);
      const dateDebut = iso(Number(d[0]), d[1], d[2]);
      const dateFin = iso(Number(f[0]), f[1], f[2]);
      if (estDateISO(dateDebut) && estDateISO(dateFin) && dateFin >= dateDebut) {
        candidats.push({ index: m.index, dateDebut, dateFin });
      }
    }
  }
  if (candidats.length > 0) {
    candidats.sort((a, b) => a.index - b.index);
    const { dateDebut, dateFin } = candidats[0];
    return { dateDebut, dateFin };
  }

  const fin = new RegExp(`jusqu.?au\\s+${J}\\s+${M}\\s+(\\d{4})`).exec(t);
  if (fin) {
    const dateFin = iso(Number(fin[3]), MOIS[fin[2]], jourNum(fin[1]));
    if (estDateISO(dateFin)) return { dateDebut: null, dateFin };
  }
  return null;
}

export function slugifier(texte) {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/** Musée du registre dont le site correspond à l'adresse (sous-domaines acceptés). */
export function trouverMusee(hote, musees) {
  return musees.find((m) => hote === m.domaine || hote.endsWith('.' + m.domaine)) ?? null;
}

function titreNettoye(titre, musee) {
  if (!titre) return null;
  let t = titre.split(' | ')[0].trim();
  const suffixe = new RegExp(`\\s*[-–—]\\s*${musee.nom.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
  t = t.replace(suffixe, '').trim();
  return t || null;
}

/**
 * Construit le brouillon d'une fiche à partir de la page (html vide si la page
 * n'a pas pu être lue). Fonction pure : aucun accès au réseau ni aux fichiers.
 */
export function construireBrouillon({ url, html, statut, musee, champs, vocabulaires, aujourdhui }) {
  const avertissements = [];
  if (statut !== 200 || !html) {
    avertissements.push(
      statut === null || statut === undefined
        ? 'page injoignable : brouillon presque vide'
        : `page illisible (réponse ${statut}) : brouillon presque vide, à compléter à la main`,
    );
  }

  const evenement = html ? extraireEvenementJsonLd(html) : null;
  const titreBrut = (html && extraireMeta(html, 'og:title')) || (evenement && evenement.name) || null;
  const titre = titreNettoye(titreBrut, musee);
  const imageBrute = html ? extraireMeta(html, 'og:image') : null;
  const imageUrl = imageBrute && /^https:\/\/\S+$/.test(imageBrute) ? imageBrute : null;
  if (imageBrute && !imageUrl) avertissements.push(`image ignorée (adresse non https) : ${imageBrute}`);

  let dates = null;
  let sourceDates = null;
  if (evenement && typeof evenement.startDate === 'string' && typeof evenement.endDate === 'string') {
    const d = evenement.startDate.slice(0, 10);
    const f = evenement.endDate.slice(0, 10);
    if (estDateISO(d) && estDateISO(f) && f >= d) {
      dates = { dateDebut: d, dateFin: f };
      sourceDates = 'données structurées de la page';
    }
  }
  if (!dates && html) {
    const trouve = extraireDatesFrancais(texteVisible(html));
    if (trouve) {
      dates = trouve;
      sourceDates = 'texte de la page';
    }
  }

  const segment = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
  const base = slugifier(segment) || slugifier(titre ?? '') || 'nouvelle-exposition';
  const id = `${base}-${musee.id}`;

  const descriptionSite = html ? extraireMeta(html, 'og:description') || extraireMeta(html, 'description') : null;

  const brouillon = {};
  for (const champ of champs) {
    brouillon[champ.nom] = champ.type === 'liste_texte' || champ.type === 'vocabulaire_liste' ? [] : null;
  }
  brouillon.id = id;
  brouillon.titre = titre;
  brouillon.museeId = musee.id;
  brouillon.dateDebut = dates ? dates.dateDebut : null;
  brouillon.dateFin = dates ? dates.dateFin : null;
  brouillon.url = url;
  brouillon.imageUrl = imageUrl;
  brouillon.dateReleve = aujourdhui;

  const aCompleter = champs
    .filter((c) => c.obligatoire && estVide(brouillon[c.nom]))
    .map((c) => c.nom);

  const aide = {
    a_completer: aCompleter,
    dates_detectees: dates
      ? `${dates.dateDebut ?? '?'} → ${dates.dateFin} (source : ${sourceDates} — à vérifier)`
      : null,
    description_du_site: descriptionSite,
    note_description: "Écris la description en tes propres mots (le texte du site est protégé).",
    types_autorises: vocabulaires.types_exposition ?? [],
    epoques_autorisees: vocabulaires.epoques ?? [],
    mouvements_autorises: 'voir scripts/catalog/vocabularies/mouvements.json',
    avertissements,
  };
  return { brouillon: { _aide: aide, ...brouillon }, avertissements, id };
}

function urlsDejaConnues() {
  const urls = new Set();
  for (const dossier of [FICHES_DIR, WORKSPACE_DIR]) {
    if (!fs.existsSync(dossier)) continue;
    for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.json'))) {
      try {
        const fiche = JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf-8'));
        if (typeof fiche.url === 'string') urls.add(nettoyerUrl(fiche.url));
      } catch {
        /* fiche illisible : ignorée ici, le script de génération la signalera */
      }
    }
  }
  return urls;
}

async function recupererPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'fr-FR,fr;q=0.9' },
      redirect: 'follow',
    });
    return { statut: res.status, html: res.status === 200 ? await res.text() : '' };
  } catch {
    return { statut: null, html: '' };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let museeForce = null;
  const urls = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--musee') museeForce = args[++i];
    else urls.push(args[i]);
  }
  if (urls.length === 0) {
    console.error('Usage : node scripts/fetch-exposition-by-url.mjs "https://page-exposition" ["https://..."]');
    process.exit(1);
  }

  let champs, ctx;
  try {
    ({ champs, ctx } = chargerContexte());
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  const connues = urlsDejaConnues();
  const aujourdhui = new Date().toISOString().slice(0, 10);

  for (const urlBrute of urls) {
    let url;
    try {
      url = nettoyerUrl(urlBrute);
    } catch {
      console.error(`✕ Adresse invalide : ${urlBrute}`);
      continue;
    }
    console.log(`\n${url}`);
    if (connues.has(url)) {
      console.log('  ↷ déjà présente (catalogue ou brouillons), ignorée');
      continue;
    }

    const musee = museeForce
      ? ctx.musees.find((m) => m.id === museeForce)
      : trouverMusee(new URL(url).hostname, ctx.musees);
    if (!musee) {
      console.error(
        museeForce
          ? `  ✕ Musée inconnu : "${museeForce}".`
          : `  ✕ Aucune fiche musée pour ce site (${new URL(url).hostname}).`,
      );
      console.error('    Crée d\'abord sa fiche, puis relance :');
      console.error('      node scripts/musees.mjs creer "adresse-du-site" --ville "..."');
      console.error('      node scripts/musees.mjs promouvoir');
      continue;
    }

    const { statut, html } = await recupererPage(url);
    const { brouillon, avertissements, id } = construireBrouillon({
      url, html, statut, musee, champs, vocabulaires: ctx.vocabulaires, aujourdhui,
    });

    const chemin = path.join(WORKSPACE_DIR, `${id}.json`);
    if (fs.existsSync(chemin)) {
      console.log(`  ↷ un brouillon "${id}.json" existe déjà, non modifié`);
      continue;
    }
    fs.writeFileSync(chemin, JSON.stringify(brouillon, null, 2) + '\n', 'utf-8');

    console.log(`  ✓ brouillon créé : 0_workspace_expositions/${id}.json`);
    if (brouillon._aide.dates_detectees) console.log(`    dates : ${brouillon._aide.dates_detectees}`);
    avertissements.forEach((a) => console.log(`    ⚠ ${a}`));
    console.log(`    à compléter : ${brouillon._aide.a_completer.join(', ') || 'rien (vérifie quand même)'}`);

    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('\nÉtape suivante : compléter les brouillons, puis node scripts/promote-expositions-brouillons.mjs');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
