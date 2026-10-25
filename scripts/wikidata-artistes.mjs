/**
 * Lecture des artistes sur Wikidata (données libres, licence CC0) :
 *   - retrouver le créateur de chaque œuvre (propriété P170 de l'œuvre, dont l'identifiant Q
 *     est celui de la fiche d'œuvre) ;
 *   - lire les artistes par lots : nom, alias, dates, lieu et pays de naissance, nationalités,
 *     disciplines, mouvements, portrait, pages de référence ;
 *   - traduire professions, mouvements et nationalités vers les listes de l'application, à l'aide
 *     de tables modifiables (scripts/catalog/registres/).
 *
 * Les fonctions prennent un "fetchJson" (adresse -> objet JSON) pour être testables sans réseau.
 */

import { enonces, etiquette, fetchJsonWikimedia } from './wikidata-musees.mjs';

const API = 'https://www.wikidata.org/w/api.php';
const LOT_OEUVRES = 50;
const LOT_ARTISTES = 10; // fiches complètes : volumineuses, donc petits lots
const LOT_LIEUX = 20;
const LOT_LEGER = 50; // libellés seuls
const SOUS_DIVISIONS = /arrondissement|quartier|district|borough|canton|secteur/i;
const MAX_NIVEAUX_LIEU = 6;
const MAX_ALIAS = 12;
const QID_HUMAIN = 'Q5';
const QID_CIRCA = 'Q5727902';

/** Minuscules, sans accents ni ponctuation ; les lettres spéciales (œ, æ, ø, ß…) sont développées. */
export function normaliser(texte) {
  return String(texte)
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/ß/g, 'ss')
    .replace(/đ/g, 'd')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const existe = (entite) => Boolean(entite) && entite.missing === undefined;
const idsDe = (entite, propriete) =>
  enonces(entite, propriete).map((e) => e.mainsnak.datavalue.value?.id).filter(Boolean);
const valeurDe = (enonce) => enonce.mainsnak.datavalue.value;

async function chargerLot(ids, props, fetchJson, taille = LOT_LEGER, extra = {}) {
  const resultat = {};
  const uniques = [...new Set(ids)];
  for (let i = 0; i < uniques.length; i += taille) {
    const params = new URLSearchParams({
      action: 'wbgetentities', ids: uniques.slice(i, i + taille).join('|'), props,
      languages: 'fr|en', format: 'json', ...extra,
    });
    const donnees = await fetchJson(`${API}?${params}`);
    // Un élément fusionné avec un autre est renvoyé sous le nouvel identifiant : on le retrouve
    // aussi sous l'ancien, celui que l'on a demandé.
    for (const [cle, entite] of Object.entries(donnees.entities ?? {})) {
      resultat[cle] = entite;
      if (entite?.id && entite.id !== cle) resultat[entite.id] = entite;
      if (entite?.redirects?.from) resultat[entite.redirects.from] = entite;
    }
  }
  return resultat;
}

// ---------------------------------------------------------------- créateurs des œuvres

/**
 * Pour chaque œuvre (identifiant Q), ses créateurs sur Wikidata.
 * Retourne Map(oeuvreId -> { createurs: [Q…], inconnu: bool, absente: bool }).
 */
export async function createursDesOeuvres(oeuvresIds, { fetchJson = fetchJsonWikimedia } = {}) {
  const entites = await chargerLot(oeuvresIds, 'claims', fetchJson, LOT_OEUVRES);
  const resultat = new Map();
  for (const id of oeuvresIds) {
    const entite = entites[id];
    if (!existe(entite)) {
      resultat.set(id, { createurs: [], inconnu: false, absente: true });
      continue;
    }
    const declarations = (entite.claims?.P170 ?? []).filter((d) => d.rank !== 'deprecated');
    const preferees = declarations.filter((d) => d.rank === 'preferred');
    const createurs = [];
    let inconnu = false;
    for (const d of preferees.length > 0 ? preferees : declarations) {
      const snak = d.mainsnak;
      if (snak?.snaktype === 'value' && snak.datavalue?.value?.id) createurs.push(snak.datavalue.value.id);
      else if (snak?.snaktype === 'somevalue') inconnu = true;
    }
    resultat.set(id, { createurs: [...new Set(createurs)], inconnu, absente: false });
  }
  return resultat;
}

// ---------------------------------------------------------------- dates

/**
 * Date Wikidata -> { date, approx } : "AAAA-MM-JJ", "AAAA-MM" ou "AAAA" selon la précision.
 * approx est vrai si la date est incertaine (« vers », précision inférieure à l'année).
 */
export function lireDate(enonce) {
  const v = enonce?.mainsnak?.datavalue?.value;
  const m = typeof v?.time === 'string' ? v.time.match(/^([+-])(\d+)-(\d{2})-(\d{2})T/) : null;
  if (!m) return null;
  const annee = (m[1] === '-' ? '-' : '') + String(parseInt(m[2], 10)).padStart(4, '0');
  const mois = parseInt(m[3], 10);
  const jour = parseInt(m[4], 10);
  let date = annee;
  if (v.precision >= 10 && mois >= 1) date += `-${String(mois).padStart(2, '0')}`;
  if (v.precision >= 11 && mois >= 1 && jour >= 1) date += `-${String(jour).padStart(2, '0')}`;
  const circa = (enonce.qualifiers?.P1480 ?? []).some((q) => q.datavalue?.value?.id === QID_CIRCA);
  const incertitude = (v.before ?? 0) > 0 || (v.after ?? 0) > 0;
  return { date, approx: circa || v.precision < 9 || incertitude };
}

// ---------------------------------------------------------------- lieux

/**
 * Pour chaque lieu de naissance : la ville (on remonte les arrondissements et quartiers) et
 * l'identifiant du pays actuel (propriété P17 du lieu, ou de l'entité qui le contient).
 * "entites" est complété au fur et à mesure.
 */
async function resoudreLieux(lieuxIds, entites, fetchJson) {
  const etats = new Map([...new Set(lieuxIds)].map((id) => [id, { courant: id, ville: null, paysId: null, fini: false }]));
  for (let niveau = 0; niveau < MAX_NIVEAUX_LIEU; niveau++) {
    const aCharger = [...etats.values()].filter((s) => !s.fini).map((s) => s.courant).filter((id) => !entites[id]);
    if (aCharger.length > 0) Object.assign(entites, await chargerLot(aCharger, 'labels|claims', fetchJson, LOT_LIEUX));
    let encore = false;
    for (const s of etats.values()) {
      if (s.fini) continue;
      const info = entites[s.courant];
      if (!existe(info)) {
        s.fini = true;
        continue;
      }
      const nom = etiquette(info);
      if (s.ville === null && nom && !SOUS_DIVISIONS.test(nom)) s.ville = nom;
      if (!s.paysId) s.paysId = idsDe(info, 'P17')[0] ?? null;
      const suivant = idsDe(info, 'P131')[0];
      if ((s.ville !== null && s.paysId) || !suivant) {
        s.fini = true;
        continue;
      }
      s.courant = suivant;
      encore = true;
    }
    if (!encore) break;
  }
  const paysManquants = [...etats.values()].map((s) => s.paysId).filter((id) => id && !entites[id]);
  if (paysManquants.length > 0) Object.assign(entites, await chargerLot(paysManquants, 'labels', fetchJson));
  return etats;
}

// ---------------------------------------------------------------- correspondances

const motsDe = (label) => normaliser(label).split(' ').filter(Boolean);

/** Professions -> disciplines de l'application. regles : [{ mots: [...], discipline }]. */
export function mapperDisciplines(labels, regles) {
  const valeurs = [];
  const nonReconnus = [];
  for (const label of labels) {
    const mots = motsDe(label);
    const trouvees = regles.filter((r) => r.mots.some((m) => mots.includes(normaliser(m))));
    for (const regle of trouvees) {
      if (!valeurs.includes(regle.discipline)) valeurs.push(regle.discipline);
    }
    if (trouvees.length === 0) nonReconnus.push(label);
  }
  return { valeurs, nonReconnus };
}

/** Mouvements Wikidata -> mouvements de l'application. table : Map(libellé normalisé -> valeur). */
export function mapperMouvements(labels, table) {
  const valeurs = [];
  const nonReconnus = [];
  for (const label of labels) {
    const valeur = table.get(normaliser(label));
    if (valeur) {
      if (!valeurs.includes(valeur)) valeurs.push(valeur);
    } else {
      nonReconnus.push(label);
    }
  }
  return { valeurs, nonReconnus };
}

/**
 * Pays de citoyenneté -> nom de pays de l'application. tables.nationalites : États historiques
 * et variantes ; tables.pays : pays connus (Map libellé normalisé -> nom exact).
 */
export function mapperNationalites(labels, tables) {
  const valeurs = [];
  const nonReconnus = [];
  for (const label of labels) {
    const cle = normaliser(label);
    const valeur = tables.nationalites.get(cle) ?? tables.pays.get(cle);
    if (valeur) {
      if (!valeurs.includes(valeur)) valeurs.push(valeur);
    } else {
      nonReconnus.push(label);
    }
  }
  return { valeurs, nonReconnus };
}

/** « firmin auguste renoir » -> « Firmin Auguste Renoir » ; un texte déjà en casse normale est laissé tel quel. */
export function capitaliser(texte) {
  if (texte !== texte.toLowerCase() || texte === texte.toUpperCase()) return texte;
  return texte.replace(/(^|[\s\-'’.])(\p{L})/gu, (_, avant, lettre) => avant + lettre.toUpperCase());
}

/** Autres noms de l'artiste (français et anglais), sans doublon et sans le nom lui-même. */
export function aliasDe(entite, nom) {
  const candidats = [
    ...(entite.aliases?.fr ?? []).map((a) => a.value),
    ...(entite.aliases?.en ?? []).map((a) => a.value),
    entite.labels?.en?.value,
  ].filter((a) => typeof a === 'string' && a.trim() !== '');
  const vus = new Set(nom ? [normaliser(nom)] : []);
  const alias = [];
  for (const a of candidats) {
    const cle = normaliser(a);
    if (cle === '' || vus.has(cle)) continue;
    vus.add(cle);
    alias.push(capitaliser(a.trim()));
  }
  return alias.slice(0, MAX_ALIAS);
}

const urlCommons = (fichier) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fichier)}?width=1200`;

// ---------------------------------------------------------------- lecture des artistes

/**
 * Lit des artistes par lots. Retourne Map(qid -> lecture) ; lecture.estHumain est faux pour un
 * atelier, un groupe ou un élément introuvable (aucune fiche ne doit alors être créée).
 */
export async function lireArtistes(qids, { fetchJson = fetchJsonWikimedia, tables } = {}) {
  const entites = await chargerLot(qids, 'labels|aliases|claims|sitelinks|descriptions', fetchJson, LOT_ARTISTES, {
    sitefilter: 'frwiki|enwiki',
  });
  const lies = new Set();
  for (const qid of qids) {
    const e = entites[qid];
    if (!existe(e)) continue;
    for (const p of ['P27', 'P106', 'P135']) idsDe(e, p).forEach((id) => lies.add(id));
  }
  const liees = await chargerLot([...lies], 'labels', fetchJson);
  const lieuxIds = qids.map((q) => (existe(entites[q]) ? idsDe(entites[q], 'P19')[0] : null)).filter(Boolean);
  const lieux = await resoudreLieux(lieuxIds, liees, fetchJson);

  const etiquettes = (e, propriete) => idsDe(e, propriete).map((id) => etiquette(liees[id])).filter(Boolean);
  const resultat = new Map();
  for (const qid of qids) {
    const e = entites[qid];
    const avertissements = [];
    if (!existe(e)) {
      resultat.set(qid, { qid, estHumain: false, nom: null, avertissements: [`${qid} est introuvable sur Wikidata`] });
      continue;
    }
    const nom = etiquette(e);
    const qidActuel = e.id ?? qid;
    if (qidActuel !== qid) avertissements.push(`identifiant fusionné sur Wikidata : ${qid} est devenu ${qidActuel}`);
    const lecture = { qid: qidActuel, estHumain: idsDe(e, 'P31').includes(QID_HUMAIN), nom, avertissements };
    lecture.descriptionWikidata = e.descriptions?.fr?.value ?? e.descriptions?.en?.value ?? null;
    lecture.alias = aliasDe(e, nom);
    const nomNaissance = enonces(e, 'P1477').map(valeurDe).find((v) => v?.text)?.text;
    if (nomNaissance && normaliser(nomNaissance) !== normaliser(nom ?? '')) lecture.nomNaissance = nomNaissance.trim();

    const naissances = enonces(e, 'P569').map(lireDate).filter(Boolean);
    const deces = enonces(e, 'P570').map(lireDate).filter(Boolean);
    if (naissances[0]) lecture.naissance = naissances[0].date;
    if (deces[0]) lecture.deces = deces[0].date;
    const distinctes = (liste) => [...new Set(liste.map((x) => x.date))];
    if (distinctes(naissances).length > 1) {
      avertissements.push(
        `plusieurs dates de naissance (${distinctes(naissances).join(', ')}) : ${naissances[0].date} retenue`,
      );
    }
    if (distinctes(deces).length > 1) {
      avertissements.push(
        `plusieurs dates de décès (${distinctes(deces).join(', ')}) : ${deces[0].date} retenue`,
      );
    }
    lecture.datesApproximatives = Boolean(naissances[0]?.approx || deces[0]?.approx);

    const lieuId = idsDe(e, 'P19')[0];
    const lieu = lieuId ? lieux.get(lieuId) : null;
    if (lieu?.ville) lecture.villeNaissance = lieu.ville;
    if (lieu?.paysId) lecture.paysNaissance = etiquette(liees[lieu.paysId]) ?? undefined;
    if (lecture.paysNaissance === undefined) delete lecture.paysNaissance;

    const professions = etiquettes(e, 'P106');
    const mouvements = etiquettes(e, 'P135');
    const nationalites = etiquettes(e, 'P27');
    const d = mapperDisciplines(professions, tables.disciplines);
    const m = mapperMouvements(mouvements, tables.mouvements);
    const n = mapperNationalites(nationalites, tables);
    lecture.disciplines = d.valeurs;
    lecture.mouvements = m.valeurs;
    lecture.nationalites = n.valeurs;
    if (n.valeurs.length === 0 && lecture.paysNaissance) {
      lecture.nationalites = [lecture.paysNaissance];
      if (nationalites.length > 0) avertissements.push(`nationalité déduite du lieu de naissance (Wikidata : ${nationalites.join(', ')})`);
    }
    lecture.nonReconnus = { professions: d.nonReconnus, mouvements: m.nonReconnus, nationalites: n.nonReconnus };

    const image = enonces(e, 'P18').map(valeurDe).find((v) => typeof v === 'string' && v.trim() !== '');
    if (image) lecture.imageUrl = urlCommons(image);
    const ulan = enonces(e, 'P245').map(valeurDe).find((v) => typeof v === 'string');
    if (ulan) lecture.ulanId = ulan;
    const lien = e.sitelinks?.frwiki ?? e.sitelinks?.enwiki;
    if (lien?.title) {
      const langue = e.sitelinks.frwiki ? 'fr' : 'en';
      lecture.wikipediaUrl = `https://${langue}.wikipedia.org/wiki/${encodeURIComponent(lien.title.replace(/ /g, '_'))}`;
    }
    if (!lecture.estHumain) avertissements.push(`${qid} (${nom ?? 'sans nom'}) n'est pas une personne : atelier, groupe ou autre`);
    resultat.set(qid, lecture);
  }
  return resultat;
}
