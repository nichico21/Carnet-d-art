import { Artiste } from '../types/artiste';
import { Artwork } from '../types/artwork';
import { Exposition } from '../types/exposition';
import { memeArtiste } from '../expositions/oeuvres';
import { ExpositionDuMusee, statutDe } from '../musees/musees';

// Logique de l'onglet Artistes : recherche, filtres, tri, regroupements et libellés.
// Fonctions pures, sans dépendance à React : elles se testent seules.

export type CritereTri = 'nom' | 'naissance' | 'oeuvres';

export interface FiltresArtistes {
  recherche: string;
  discipline: string | null;
  epoque: string | null;
  mouvement: string | null;
  /** Nationalité (nom de pays). */
  pays: string | null;
  tri: CritereTri;
}

export const FILTRES_VIDES: FiltresArtistes = {
  recherche: '',
  discipline: null,
  epoque: null,
  mouvement: null,
  pays: null,
  tri: 'nom',
};

export const LIBELLES_TRI: Record<CritereTri, string> = {
  nom: 'Nom',
  naissance: 'Date de naissance',
  oeuvres: "Nombre d'œuvres",
};

// ------------------------------------------------------------------ texte

/** Minuscules, sans accents ni ponctuation : « Œuvres  d'Édouard » -> « oeuvres d edouard ». */
export function normaliserTexte(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const PARTICULES = new Set(['de', 'du', 'des', 'd', 'van', 'von', 'der', 'den', 'ter', 'da', 'di', 'del', 'della', 'dos', 'le', 'la', 'el', 'al']);

/** Clé de tri par nom de famille, sans les particules : « Vincent van Gogh » -> « gogh vincent ». */
export function cleDeTriNom(nom: string): string {
  // chaque mot est normalisé séparément pour garder les noms composés : « Toulouse-Lautrec » reste un seul mot
  const mots = nom.split(/\s+/).map(normaliserTexte).filter((m) => m !== '');
  if (mots.length <= 1) return mots.join(' ');
  let debut = mots.length - 1;
  while (debut > 1 && PARTICULES.has(mots[debut - 1])) debut -= 1;
  const prenoms = mots.slice(0, debut);
  let famille = mots.slice(debut);
  while (famille.length > 1 && PARTICULES.has(famille[0])) famille = famille.slice(1);
  return [...famille, ...prenoms].join(' ');
}

/** Initiales pour un portrait manquant : « Vincent van Gogh » -> « VG », « Titien » -> « T ». */
export function monogramme(nom: string): string {
  const mots = nom.split(/\s+/).filter(Boolean);
  const significatifs = mots.filter((m, i) => i === 0 || !PARTICULES.has(m.toLowerCase()));
  if (significatifs.length === 0) return '';
  const premier = significatifs[0];
  const dernier = significatifs[significatifs.length - 1];
  const lettre = (m: string) => Array.from(m)[0]?.toUpperCase() ?? '';
  return significatifs.length === 1 ? lettre(premier) : lettre(premier) + lettre(dernier);
}

// ------------------------------------------------------------------ dates et libellés

const anneeTexte = (a: number): string => (a < 0 ? `${-a} av. J.-C.` : String(a));

/** « 1853 – 1890 », « né en 1940 », « v. 1450 – 1516 » ; chaîne vide si aucune date. */
export function libelleDates(artiste: Artiste): string {
  const n = artiste.anneeNaissance;
  const d = artiste.anneeDeces;
  const prefixe = artiste.datesApproximatives ? 'v. ' : '';
  if (n !== undefined && d !== undefined) return `${prefixe}${anneeTexte(n)} – ${anneeTexte(d)}`;
  if (n !== undefined) return `${prefixe ? 'v. ' : 'né en '}${anneeTexte(n)}`;
  if (d !== undefined) return `mort en ${prefixe}${anneeTexte(d)}`;
  return '';
}

export function libelleOeuvres(nombre: number): string {
  return `${nombre} ${nombre > 1 ? 'œuvres' : 'œuvre'}`;
}

/** « a · b » : au plus `max` valeurs (toutes si max est omis). */
export function joindreValeurs(valeurs: readonly string[], max?: number): string {
  return (max === undefined ? [...valeurs] : valeurs.slice(0, max)).join(' · ');
}

export interface Reperes {
  pays: string[];
  periodes: string[];
  mouvements: string[];
}

/** Les trois repères de la page artiste : pays, période, mouvement. */
export function reperesDe(artiste: Artiste): Reperes {
  const pays = artiste.nationalites.length > 0 ? artiste.nationalites : artiste.paysNaissance ? [artiste.paysNaissance] : [];
  return { pays: [...pays], periodes: [...artiste.epoques], mouvements: [...artiste.mouvements] };
}

/** Portrait de l'artiste, sinon l'image de sa première œuvre qui en a une, sinon null (monogramme). */
export function portraitDe(artiste: Artiste, imageDeOeuvre?: (oeuvreId: string) => string | undefined): string | null {
  if (artiste.imageUrl) return artiste.imageUrl;
  if (imageDeOeuvre) {
    for (const id of artiste.oeuvresIds) {
      const image = imageDeOeuvre(id);
      if (image) return image;
    }
  }
  return null;
}

// ------------------------------------------------------------------ époques

const VALEURS_ROMAINES: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };

function depuisRomain(texte: string): number {
  let total = 0;
  for (let i = 0; i < texte.length; i++) {
    const v = VALEURS_ROMAINES[texte[i]] ?? 0;
    const suivant = VALEURS_ROMAINES[texte[i + 1]] ?? 0;
    total += v < suivant ? -v : v;
  }
  return total;
}

/** Ordre chronologique d'une époque : Antiquité, Moyen Âge, puis les siècles ; inconnue en dernier. */
export function rangEpoque(libelle: string): number {
  const l = normaliserTexte(libelle);
  if (l === 'antiquite') return -2;
  if (l === 'moyen age') return -1;
  const m = /^([ivxlc]+)e? siecle$/.exec(l);
  return m ? depuisRomain(m[1].toUpperCase()) : 99;
}

export interface GroupeEpoque {
  epoque: string;
  artistes: Artiste[];
}

/** « Explorer par période » : un groupe par époque représentée, du plus ancien au plus récent. */
export function groupesParEpoque(artistes: readonly Artiste[]): GroupeEpoque[] {
  const groupes = new Map<string, Artiste[]>();
  for (const a of artistes) {
    for (const e of a.epoques) groupes.set(e, [...(groupes.get(e) ?? []), a]);
  }
  return [...groupes]
    .map(([epoque, liste]) => ({ epoque, artistes: trierArtistes(liste, 'oeuvres') }))
    .sort((x, y) => rangEpoque(x.epoque) - rangEpoque(y.epoque) || x.epoque.localeCompare(y.epoque, 'fr'));
}

// ------------------------------------------------------------------ recherche, filtres, tri

function correspondRecherche(artiste: Artiste, requete: string): boolean {
  const q = normaliserTexte(requete);
  if (q === '') return true;
  const noms = [artiste.nom, artiste.nomNaissance, ...artiste.alias].filter((x): x is string => typeof x === 'string');
  return noms.some((n) => normaliserTexte(n).includes(q));
}

export function trierArtistes(artistes: readonly Artiste[], tri: CritereTri): Artiste[] {
  const parNom = (a: Artiste, b: Artiste) => cleDeTriNom(a.nom).localeCompare(cleDeTriNom(b.nom), 'fr');
  const copie = [...artistes];
  if (tri === 'naissance') {
    return copie.sort((a, b) => {
      if (a.anneeNaissance === undefined && b.anneeNaissance === undefined) return parNom(a, b);
      if (a.anneeNaissance === undefined) return 1;
      if (b.anneeNaissance === undefined) return -1;
      return a.anneeNaissance - b.anneeNaissance || parNom(a, b);
    });
  }
  if (tri === 'oeuvres') return copie.sort((a, b) => b.nombreOeuvres - a.nombreOeuvres || parNom(a, b));
  return copie.sort(parNom);
}

export function filtrerArtistes(artistes: readonly Artiste[], filtres: FiltresArtistes): Artiste[] {
  const retenus = artistes.filter(
    (a) =>
      correspondRecherche(a, filtres.recherche) &&
      (filtres.discipline === null || a.disciplines.includes(filtres.discipline)) &&
      (filtres.epoque === null || a.epoques.includes(filtres.epoque)) &&
      (filtres.mouvement === null || a.mouvements.includes(filtres.mouvement)) &&
      (filtres.pays === null || a.nationalites.includes(filtres.pays)),
  );
  return trierArtistes(retenus, filtres.tri);
}

/** Nombre de filtres de la fenêtre « Filtrer » actuellement actifs (la recherche et le tri n'y comptent pas). */
export function nombreFiltresActifs(filtres: FiltresArtistes): number {
  return [filtres.discipline, filtres.epoque, filtres.mouvement, filtres.pays].filter((x) => x !== null).length;
}

export interface Facette {
  valeur: string;
  nombre: number;
}

/** Valeurs d'un critère avec le nombre d'artistes concernés, les plus fréquentes d'abord. */
export function facettes(artistes: readonly Artiste[], champ: 'disciplines' | 'epoques' | 'mouvements' | 'nationalites'): Facette[] {
  const compte = new Map<string, number>();
  for (const a of artistes) for (const v of a[champ]) compte.set(v, (compte.get(v) ?? 0) + 1);
  const liste = [...compte].map(([valeur, nombre]) => ({ valeur, nombre }));
  if (champ === 'epoques') return liste.sort((x, y) => rangEpoque(x.valeur) - rangEpoque(y.valeur));
  return liste.sort((x, y) => y.nombre - x.nombre || x.valeur.localeCompare(y.valeur, 'fr'));
}

// ------------------------------------------------------------------ sélections éditoriales

/** « Artistes incontournables » : ceux que tu as marqués, sinon les mieux représentés dans le catalogue. */
export function artistesIncontournables(artistes: readonly Artiste[], max = 8): Artiste[] {
  const marques = artistes.filter((a) => a.incontournable === true);
  const base = marques.length > 0 ? marques : artistes.filter((a) => a.nombreOeuvres > 0);
  return trierArtistes(base, 'oeuvres').slice(0, max);
}

/** Bandeau « À la une » : les artistes qui ont une accroche, les incontournables d'abord. */
export function artistesALaUne(artistes: readonly Artiste[], max = 5): Artiste[] {
  const avecAccroche = artistes.filter((a) => typeof a.accroche === 'string' && a.accroche.trim() !== '');
  const ordonnes = trierArtistes(avecAccroche, 'oeuvres');
  const marques = ordonnes.filter((a) => a.incontournable === true);
  return [...marques, ...ordonnes.filter((a) => a.incontournable !== true)].slice(0, max);
}

/** Artistes que l'utilisateur a mis en favoris. */
export function artistesFavorisListe(artistes: readonly Artiste[], favoris: Readonly<Record<string, boolean>>): Artiste[] {
  return trierArtistes(artistes.filter((a) => favoris[a.id] === true), 'nom');
}

// ------------------------------------------------------------------ œuvres, expositions, artistes sans fiche

/** Même règle que partout dans l'appli : une œuvre s'affiche si elle a une image et n'est pas sensible. */
export function oeuvreAffichable(oeuvre: Artwork): boolean {
  return !!oeuvre.imageUrl && !oeuvre.contenuSensible;
}

export function indexerOeuvres(oeuvres: readonly Artwork[]): Map<string, Artwork> {
  return new Map(oeuvres.map((o) => [o.id, o]));
}

/** Première année de 3 ou 4 chiffres du texte : « 1890 » et « vers 1890 » donnent 1890. */
function anneeDe(oeuvre: Artwork): number | null {
  const m = /\d{3,4}/.exec(oeuvre.annee ?? '');
  return m ? parseInt(m[0], 10) : null;
}

/** Œuvres affichables de l'artiste, de la plus ancienne à la plus récente (sans date en dernier). */
export function oeuvresDeLArtiste(artiste: Artiste, parId: ReadonlyMap<string, Artwork>): Artwork[] {
  const liste = artiste.oeuvresIds.map((id) => parId.get(id)).filter((o): o is Artwork => o !== undefined && oeuvreAffichable(o));
  return liste.sort((a, b) => {
    const x = anneeDe(a);
    const y = anneeDe(b);
    if (x === null && y === null) return a.titre.localeCompare(b.titre, 'fr');
    if (x === null) return 1;
    if (y === null) return -1;
    return x - y || a.titre.localeCompare(b.titre, 'fr');
  });
}

/** Œuvres mises en avant : celles que la fiche désigne, sinon les premières œuvres affichables. */
export function oeuvresMisesEnAvant(artiste: Artiste, parId: ReadonlyMap<string, Artwork>, max = 8): Artwork[] {
  const toutes = oeuvresDeLArtiste(artiste, parId);
  const choisies = artiste.oeuvresIncontournablesIds.map((id) => toutes.find((o) => o.id === id)).filter((o): o is Artwork => o !== undefined);
  return (choisies.length > 0 ? choisies : toutes).slice(0, max);
}

/** Image de repli quand l'artiste n'a pas de portrait : une œuvre affichable (jamais une œuvre sensible). */
export function oeuvreDeRepli(artiste: Artiste, parId: ReadonlyMap<string, Artwork>): Artwork | undefined {
  return oeuvresMisesEnAvant(artiste, parId, 1)[0];
}

const ORDRE_STATUT: Record<ExpositionDuMusee['statut'], number> = { a_laffiche: 0, a_venir: 1, passee: 2 };

/** Noms sous lesquels on peut reconnaître l'artiste dans une exposition (un seul mot = trop ambigu, écarté). */
function nomsPourExpositions(artiste: Artiste): string[] {
  const alias = artiste.alias.filter((a) => a.trim().split(/\s+/).length >= 2);
  return [artiste.nom, ...artiste.nomsCatalogue.filter((n) => n.trim().split(/\s+/).length >= 2), ...alias];
}

/** Expositions qui présentent l'artiste : en cours, puis à venir, puis passées. */
export function expositionsDeLArtiste(artiste: Artiste, expositions: readonly Exposition[], aujourdhui: string): ExpositionDuMusee[] {
  const noms = nomsPourExpositions(artiste);
  return expositions
    .filter((e) => e.artistes.some((nomExpo) => noms.some((n) => memeArtiste(nomExpo, n))))
    .map((exposition) => ({ exposition, statut: statutDe(exposition.dateDebut, exposition.dateFin, aujourdhui) }))
    .sort((a, b) => {
      if (a.statut !== b.statut) return ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut];
      if (a.statut === 'passee') return b.exposition.dateFin.localeCompare(a.exposition.dateFin);
      if (a.statut === 'a_venir') return a.exposition.dateDebut.localeCompare(b.exposition.dateDebut);
      return a.exposition.dateFin.localeCompare(b.exposition.dateFin);
    });
}

function nomDeCatalogueValide(nom: string): boolean {
  return nom.trim() !== '' && nom !== 'Artiste inconnu' && !/^Q\d+/.test(nom) && !/^https?:\/\//.test(nom) && !nom.includes('wikidata.org');
}

/** Artistes du catalogue d'œuvres qui n'ont pas (encore) de fiche : à garder accessibles, comme avant. */
export function artistesSansFiche(facettesArtistes: readonly Facette[], artistes: readonly Artiste[]): Facette[] {
  const connus = new Set<string>();
  for (const a of artistes) for (const n of [a.nom, ...a.nomsCatalogue, ...a.alias]) connus.add(normaliserTexte(n));
  return facettesArtistes.filter((f) => nomDeCatalogueValide(f.valeur) && !connus.has(normaliserTexte(f.valeur)));
}

export const LIBELLES_DISCIPLINE: Record<string, string> = {
  Peinture: 'Peintres',
  Sculpture: 'Sculpteurs',
  'Arts graphiques': 'Dessinateurs',
  Photographie: 'Photographes',
  Architecture: 'Architectes',
};

/** « Peinture » -> « Peintres » pour les pastilles ; les autres valeurs restent telles quelles. */
export function libelleDiscipline(discipline: string): string {
  return LIBELLES_DISCIPLINE[discipline] ?? discipline;
}
