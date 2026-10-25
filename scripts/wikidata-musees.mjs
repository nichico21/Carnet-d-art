/**
 * Lecture d'un musée sur Wikidata (données libres, licence CC0) : site officiel,
 * coordonnées, année de création, surface, nombre d'objets, image libre de droits
 * (Wikimedia Commons), adresse, ville et pays.
 *
 * Les fonctions prennent un "fetchJson" (adresse -> objet JSON) pour pouvoir être
 * testées sans réseau.
 */

const UA_BASE = 'CarnetDArt/1.0 (usage personnel; scripts de catalogue';
const API = 'https://www.wikidata.org/w/api.php';
const ENTITE = 'https://www.wikidata.org/wiki/Special:EntityData/';
const FACTEURS_SURFACE = { Q25343: 1, Q712226: 1e6, Q35852: 1e4 }; // m², km², hectare
const SOUS_DIVISIONS = /arrondissement|quartier|district|borough|canton|secteur/i;
const MOTS_MUSEE = /mus[eé]e|museum|gallery|galerie|fondation|foundation|institut|collection/i;
const MAX_REBONDS_VILLE = 3;

function normaliser(texte) {
  return String(texte)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Identifie l'agent ; WIKIMEDIA_CONTACT (une adresse e-mail) est recommandé par Wikimedia. */
function agentUtilisateur() {
  const contact = process.env.WIKIMEDIA_CONTACT;
  return contact ? `${UA_BASE}; ${contact})` : `${UA_BASE})`;
}

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let dernierAppel = 0;

/** Laisse un court intervalle entre deux requêtes (250 ms par défaut, MUSEES_INTERVALLE_MS). */
async function respecterIntervalle(pause) {
  const intervalle = Number(process.env.MUSEES_INTERVALLE_MS ?? 250);
  const reste = dernierAppel + intervalle - Date.now();
  if (reste > 0) await pause(reste);
  dernierAppel = Date.now();
}

/**
 * Lit une adresse et retourne du JSON. Wikimedia limite le rythme des requêtes (réponse 429,
 * ou 503) : on attend (le délai demandé par le serveur, sinon 2, 6 puis 14 secondes) et on
 * réessaie trois fois au plus. Un délai dépassé ou une coupure réseau sont réessayés de la même
 * façon. Délai par requête : 60 secondes (WIKIMEDIA_TIMEOUT_MS), car certaines réponses (les
 * fiches complètes d'artistes célèbres) sont volumineuses.
 */
export async function fetchJsonWikimedia(url, { fetchFn = fetch, pause = attendre } = {}) {
  const base = Number(process.env.MUSEES_ATTENTE_MS ?? 2000);
  const delai = Number(process.env.WIKIMEDIA_TIMEOUT_MS ?? 60000);
  const attentes = [base, base * 3, base * 7];
  for (let essai = 0; ; essai++) {
    await respecterIntervalle(pause);
    let res;
    let corps;
    try {
      res = await fetchFn(url, {
        headers: { 'User-Agent': agentUtilisateur(), Accept: 'application/json' },
        signal: AbortSignal.timeout(delai),
      });
      if (res.ok) corps = await res.json();
    } catch (e) {
      if (essai < attentes.length) {
        await pause(attentes[essai]);
        continue;
      }
      const depasse = e?.name === 'TimeoutError' || e?.name === 'AbortError' || /timeout|aborted/i.test(e?.message ?? '');
      throw new Error(depasse ? `délai dépassé (${Math.round(delai / 1000)} s)` : `réseau : ${e?.message ?? e}`);
    }
    if (res.ok) return corps;
    if ((res.status === 429 || res.status === 503) && essai < attentes.length) {
      const demande = Number(res.headers?.get?.('retry-after'));
      const valide = Number.isFinite(demande) && demande > 0;
      const secondes = valide ? Math.min(demande, 30) : null;
      await pause(secondes !== null ? secondes * 1000 : attentes[essai]);
      continue;
    }
    throw new Error(`réponse ${res.status}`);
  }
}

/**
 * Reconnaît ce que l'utilisateur donne : un identifiant (Q23402), une page Wikidata,
 * une page Wikipédia (toutes langues), ou l'adresse du site d'un musée.
 */
export function extraireCible(cible) {
  const brut = String(cible ?? '').trim();
  if (/^Q[1-9]\d*$/i.test(brut)) return { type: 'qid', qid: brut.toUpperCase() };
  let u;
  try {
    u = new URL(brut);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const hote = u.hostname.toLowerCase();
  if (/(^|\.)wikidata\.org$/.test(hote)) {
    const m = u.pathname.match(/\/(?:wiki|entity)\/(Q[1-9]\d*)/i);
    return m ? { type: 'wikidata', qid: m[1].toUpperCase() } : null;
  }
  const w = hote.match(/^([a-z-]+)\.(?:m\.)?wikipedia\.org$/);
  if (w) {
    const m = u.pathname.match(/^\/wiki\/(.+)$/);
    if (!m) return null;
    try {
      return { type: 'wikipedia', langue: w[1], titre: decodeURIComponent(m[1]).replace(/_/g, ' ') };
    } catch {
      return null;
    }
  }
  return { type: 'site', url: brut };
}

/** Identifiant Wikidata d'une cible (une page Wikipédia est convertie par l'API de Wikipédia). */
export async function resoudreQid(cible, { fetchJson = fetchJsonWikimedia } = {}) {
  if (cible.qid) return cible.qid;
  if (cible.type === 'wikipedia') {
    const params = new URLSearchParams({
      action: 'query', prop: 'pageprops', ppprop: 'wikibase_item',
      titles: cible.titre, redirects: '1', format: 'json',
    });
    const data = await fetchJson(`https://${cible.langue}.wikipedia.org/w/api.php?${params}`);
    const pages = Object.values(data.query?.pages ?? {});
    const qid = pages.map((p) => p.pageprops?.wikibase_item).find(Boolean);
    if (!qid) {
      throw new Error(`la page Wikipédia « ${cible.titre} » n'a pas d'élément Wikidata`);
    }
    return qid;
  }
  throw new Error("cette adresse ne contient pas d'identifiant Wikidata");
}

// ---------------------------------------------------------------- lecture des énoncés

/** Énoncés valides d'une propriété : sans les énoncés rejetés ; les "préférés" l'emportent. */
export function enonces(entite, propriete) {
  const valides = (entite.claims?.[propriete] ?? []).filter(
    (e) => e.rank !== 'deprecated' && e.mainsnak?.snaktype === 'value' && e.mainsnak.datavalue,
  );
  const preferes = valides.filter((e) => e.rank === 'preferred');
  return preferes.length > 0 ? preferes : valides;
}

const valeurDe = (enonce) => enonce.mainsnak.datavalue.value;

export function etiquette(entite) {
  const labels = entite?.labels ?? {};
  return labels.fr?.value ?? labels.en?.value ?? Object.values(labels)[0]?.value ?? null;
}

function idsDe(entite, propriete) {
  return enonces(entite, propriete)
    .map((e) => valeurDe(e)?.id)
    .filter(Boolean);
}

/** Année d'une date Wikidata ("+1792-00-00T00:00:00Z"), si la précision va jusqu'à l'année. */
export function anneeDe(valeurTemps) {
  if (!valeurTemps || typeof valeurTemps.time !== 'string' || valeurTemps.precision < 9) return null;
  const m = valeurTemps.time.match(/^([+-])(\d+)-/);
  return m ? (m[1] === '-' ? -1 : 1) * parseInt(m[2], 10) : null;
}

function anneeDuQualificatif(enonce, propriete) {
  const v = enonce.qualifiers?.[propriete]?.[0]?.datavalue?.value;
  return v ? anneeDe(v) : null;
}

/**
 * Parmi plusieurs valeurs chiffrées (surface, nombre d'objets), préfère celle qui
 * porte sur le musée entier (sans "partie : exposition"), puis la plus récente.
 */
export function choisirQuantite(liste) {
  const candidats = liste.filter((e) => valeurDe(e)?.amount !== undefined);
  const partie = (e) => (e.qualifiers?.P518?.length ?? 0) > 0;
  candidats.sort((a, b) => {
    if (partie(a) !== partie(b)) return partie(a) ? 1 : -1;
    return (anneeDuQualificatif(b, 'P585') ?? -Infinity) - (anneeDuQualificatif(a, 'P585') ?? -Infinity);
  });
  return candidats[0] ? { enonce: candidats[0], partie: partie(candidats[0]), nombre: candidats.length } : null;
}

async function chargerEntites(ids, fetchJson) {
  const uniques = [...new Set(ids)].slice(0, 50);
  if (uniques.length === 0) return {};
  const params = new URLSearchParams({
    action: 'wbgetentities', ids: uniques.join('|'), props: 'labels|claims',
    languages: 'fr|en', format: 'json',
  });
  const data = await fetchJson(`${API}?${params}`);
  return data.entities ?? {};
}

// ---------------------------------------------------------------- un musée

/**
 * Lit l'élément Wikidata d'un musée et retourne les champs de la fiche (ceux que
 * Wikidata ne donne pas sont absents) et les avertissements.
 */
export async function lireMuseeWikidata(qid, { fetchJson = fetchJsonWikimedia } = {}) {
  const donnees = await fetchJson(`${ENTITE}${qid}.json`);
  const entite = donnees.entities?.[qid] ?? Object.values(donnees.entities ?? {})[0];
  if (!entite) throw new Error(`élément ${qid} introuvable sur Wikidata`);
  const avertissements = [];
  const lecture = { qid: entite.id ?? qid, avertissements };

  lecture.nom = etiquette(entite);
  lecture.descriptionWikidata =
    entite.descriptions?.fr?.value ?? entite.descriptions?.en?.value ?? null;

  // Liés : types, pays, premier niveau de localisation.
  const idsTypes = idsDe(entite, 'P31');
  const idsPays = idsDe(entite, 'P17');
  const idsLieu = idsDe(entite, 'P131');
  const liees = await chargerEntites([...idsTypes, ...idsPays.slice(0, 1), ...idsLieu.slice(0, 1)], fetchJson);
  lecture.types = idsTypes.map((id) => etiquette(liees[id])).filter(Boolean);
  lecture.pays = idsPays[0] ? etiquette(liees[idsPays[0]]) : null;

  // Ville : on remonte les arrondissements et quartiers jusqu'à la commune.
  let ville = null;
  let courant = idsLieu[0];
  for (let rebond = 0; courant && rebond <= MAX_REBONDS_VILLE; rebond++) {
    const info = liees[courant] ?? (await chargerEntites([courant], fetchJson))[courant];
    const nom = etiquette(info);
    if (!nom) break;
    if (!SOUS_DIVISIONS.test(nom)) {
      ville = nom;
      break;
    }
    courant = info ? idsDe(info, 'P131')[0] : undefined;
    if (courant && !liees[courant]) Object.assign(liees, await chargerEntites([courant], fetchJson));
  }
  lecture.ville = ville;

  // Site officiel (https), réduit à sa page d'accueil.
  const sites = enonces(entite, 'P856').map(valeurDe);
  if (sites.length > 0) {
    try {
      const u = new URL(sites[0]);
      if (u.protocol === 'http:') {
        u.protocol = 'https:';
        avertissements.push('site officiel en http converti en https : à vérifier');
      }
      lecture.siteUrl = u.origin;
    } catch {
      avertissements.push(`site officiel illisible ignoré : ${sites[0]}`);
    }
  }

  // Coordonnées.
  const coord = enonces(entite, 'P625').map(valeurDe)[0];
  if (coord && Number.isFinite(coord.latitude) && Number.isFinite(coord.longitude)) {
    lecture.latitude = Math.round(coord.latitude * 1e5) / 1e5;
    lecture.longitude = Math.round(coord.longitude * 1e5) / 1e5;
  }

  // Année de création (P571), à défaut d'ouverture officielle (P1619).
  const annees = [...enonces(entite, 'P571'), ...enonces(entite, 'P1619')]
    .map((e) => anneeDe(valeurDe(e)))
    .filter((a) => a !== null);
  if (annees.length > 0) {
    lecture.anneeCreation = annees[0];
    const autres = [...new Set(annees)].filter((a) => a !== annees[0]);
    if (autres.length > 0) {
      const toutes = [annees[0], ...autres].join(', ');
      avertissements.push(
        `plusieurs années de création sur Wikidata (${toutes}) : ${annees[0]} retenue`,
      );
    }
  }

  // Surface (P2046) : converties en m².
  const surface = choisirQuantite(enonces(entite, 'P2046'));
  if (surface) {
    const v = valeurDe(surface.enonce);
    const facteur = FACTEURS_SURFACE[String(v.unit ?? '').split('/').pop()];
    const m2 = facteur ? Math.round(parseFloat(v.amount) * facteur) : NaN;
    if (Number.isFinite(m2) && m2 > 0) {
      lecture.surfaceM2 = m2;
      if (surface.partie) {
        avertissements.push(
          'surface : valeur de la partie exposée (Wikidata), pas du bâtiment entier',
        );
      }
    } else {
      avertissements.push('surface ignorée (unité inconnue ou valeur nulle)');
    }
  }

  // Nombre d'objets (P1436).
  const objets = choisirQuantite(enonces(entite, 'P1436'));
  if (objets) {
    const n = Math.round(parseFloat(valeurDe(objets.enonce).amount));
    if (Number.isFinite(n) && n > 0) {
      lecture.nombreObjets = n;
      if (objets.partie) {
        avertissements.push("nombre d'objets : valeur de la partie exposée (Wikidata)");
      }
    }
  }

  // Image libre de droits (Wikimedia Commons).
  const image = enonces(entite, 'P18').map(valeurDe)[0];
  if (typeof image === 'string' && image.trim() !== '') {
    const fichier = encodeURIComponent(image);
    lecture.imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${fichier}?width=1200`;
  }

  // Adresse postale (P6375), avec le code postal (P281) s'il manque.
  // Elle sert aussi à corriger la ville.
  const adresses = enonces(entite, 'P6375').map(valeurDe).filter((v) => v?.text);
  const adresse = adresses.find((v) => v.language === 'fr') ?? adresses[0];
  if (adresse) {
    let texte = adresse.text.trim();
    lecture.ville = villeDeLaFiche(lecture.ville, texte);
    const cp = enonces(entite, 'P281').map(valeurDe).find((v) => typeof v === 'string');
    if (cp && !texte.includes(cp)) texte += `, ${cp}${lecture.ville ? ` ${lecture.ville}` : ''}`;
    lecture.adresse = texte;
  } else {
    lecture.ville = villeDeLaFiche(lecture.ville, null);
  }

  // Page Wikipédia (française de préférence).
  const lien = entite.sitelinks?.frwiki ?? entite.sitelinks?.enwiki;
  if (lien?.title) {
    const langue = entite.sitelinks.frwiki ? 'fr' : 'en';
    const titre = encodeURIComponent(lien.title.replace(/ /g, '_'));
    lecture.wikipediaUrl = `https://${langue}.wikipedia.org/wiki/${titre}`;
  }
  return lecture;
}

// Secteurs administratifs qui ne sont pas des villes
// (Paris Centre regroupe les 1er à 4e arrondissements).
const SECTEURS_FUSIONNES = { 'paris centre': 'Paris' };

/**
 * Ville de la fiche : la commune, et non son secteur ou son arrondissement. Pour une adresse
 * française ("75001 Paris"), la ville de l'adresse est préférée quand celle de Wikidata
 * en est un prolongement ("Paris Centre").
 */
export function villeDeLaFiche(villeWikidata, adresse) {
  const deAdresse = adresse?.match(/\b\d{5}\s+([^,]+)$/)?.[1]?.trim().replace(/\s+cedex.*$/i, '');
  if (!villeWikidata) return deAdresse || null;
  if (deAdresse && normaliser(villeWikidata).startsWith(`${normaliser(deAdresse)} `)) return deAdresse;
  return SECTEURS_FUSIONNES[normaliser(villeWikidata)] ?? villeWikidata;
}

/** Vrai si l'un des types de l'élément ressemble à un musée, une galerie ou une fondation. */
export function ressembleAUnMusee(lecture) {
  return lecture.types.some((t) => MOTS_MUSEE.test(t));
}

/** Formulations essayées dans l'ordre : le nom, puis des variantes (trait d'union, début). */
export function variantesDeRecherche(nom) {
  const mots = String(nom).trim().split(/\s+/);
  const variantes = [mots.join(' ')];
  if (mots.length >= 3) {
    variantes.push([...mots.slice(0, -2), mots.slice(-2).join('-')].join(' '));
    variantes.push(mots.slice(0, 2).join(' '));
  }
  return [...new Set(variantes)];
}

/**
 * Cherche un élément par son nom : retourne { qid } s'il y a exactement une
 * correspondance de nom exacte, { ambigus } s'il y en a plusieurs, ou null.
 * Wikidata cherche par début de libellé et tient mal compte des traits d'union :
 * on essaie donc quelques variantes, mais on n'accepte qu'un libellé identique au nom.
 */
export async function chercherQid(nom, { fetchJson = fetchJsonWikimedia } = {}) {
  for (const recherche of variantesDeRecherche(nom)) {
    const params = new URLSearchParams({
      action: 'wbsearchentities', search: recherche, language: 'fr', uselang: 'fr',
      type: 'item', limit: '10', format: 'json',
    });
    const data = await fetchJson(`${API}?${params}`);
    const exacts = (data.search ?? []).filter((r) => normaliser(r.label ?? '') === normaliser(nom));
    if (exacts.length === 1) return { qid: exacts[0].id };
    if (exacts.length > 1) {
      return { ambigus: exacts.map((r) => `${r.id} (${r.description ?? 'sans description'})`) };
    }
  }
  return null;
}
