import type { Artwork } from '../types/artwork';
import type { Exposition } from '../types/exposition';
import type { Musee } from '../types/musee';

/** Un lieu de conservation du catalogue (valeur de FACETTES.musees). */
export interface LieuCatalogue {
  valeur: string;
  nombre: number;
}

export type StatutMusee = 'a_laffiche' | 'a_venir' | 'passee';

export interface ExpositionDuMusee {
  exposition: Exposition;
  statut: StatutMusee;
}

export const REGIONS_ORDRE = ['Europe', 'Amériques', 'Asie', 'Afrique', 'Océanie'];

/** Minuscules sans accents ni ponctuation : "Musée d'Orsay" donne "musee d orsay". */
export function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Le nom du musée et les noms sous lesquels il apparaît dans les œuvres. */
export function nomsDuMusee(musee: Musee): string[] {
  return [musee.nom, ...musee.nomsCatalogue];
}

/** Table : nom normalisé d'un lieu du catalogue -> identifiant du musée qui le revendique. */
function proprietairesDesNoms(musees: Musee[]): Map<string, string> {
  const proprietaires = new Map<string, string>();
  for (const musee of musees) {
    for (const nom of nomsDuMusee(musee)) {
      const n = normaliser(nom);
      if (n && !proprietaires.has(n)) proprietaires.set(n, musee.id);
    }
  }
  return proprietaires;
}

/** Les œuvres du catalogue conservées dans chaque musée (une seule passe sur les œuvres). */
export function oeuvresParMusee(musees: Musee[], artworks: Artwork[]): Map<string, Artwork[]> {
  const proprietaires = proprietairesDesNoms(musees);
  const resultat = new Map<string, Artwork[]>();
  for (const musee of musees) resultat.set(musee.id, []);
  const cache = new Map<string, string>();
  for (const oeuvre of artworks) {
    const lieu = oeuvre.lieuConservation ?? '';
    let n = cache.get(lieu);
    if (n === undefined) {
      n = normaliser(lieu);
      cache.set(lieu, n);
    }
    const id = proprietaires.get(n);
    if (id) resultat.get(id)?.push(oeuvre);
  }
  return resultat;
}

/** Les lieux du catalogue qu'aucune fiche musée ne revendique. */
export function museesSansFiche(lieux: LieuCatalogue[], musees: Musee[]): LieuCatalogue[] {
  const proprietaires = proprietairesDesNoms(musees);
  return lieux.filter((l) => !proprietaires.has(normaliser(l.valeur)));
}

/** Puces de filtre : Tous, France (si présente), puis les régions présentes. */
export function puces(musees: Musee[]): string[] {
  const regions = REGIONS_ORDRE.filter((r) => musees.some((m) => m.region === r));
  const france = musees.some((m) => m.pays === 'France');
  return ['Tous', ...(france ? ['France'] : []), ...regions];
}

/** Musées correspondant à la recherche (nom, ville, pays) et à la puce choisie. */
export function filtrerMusees(musees: Musee[], recherche: string, puce: string): Musee[] {
  const q = normaliser(recherche);
  return musees.filter((m) => {
    if (puce === 'France' && m.pays !== 'France') return false;
    if (puce !== 'Tous' && puce !== 'France' && m.region !== puce) return false;
    if (!q) return true;
    return normaliser(`${m.nom} ${m.ville} ${m.pays}`).includes(q);
  });
}

export function regionsAvecNombre(musees: Musee[]): { region: string; nombre: number }[] {
  return REGIONS_ORDRE.map((region) => ({
    region,
    nombre: musees.filter((m) => m.region === region).length,
  })).filter((r) => r.nombre > 0);
}

/** Dates AAAA-MM-JJ : le dernier jour est inclus. */
export function statutDe(dateDebut: string, dateFin: string, aujourdhui: string): StatutMusee {
  if (aujourdhui < dateDebut) return 'a_venir';
  if (aujourdhui > dateFin) return 'passee';
  return 'a_laffiche';
}

const ORDRE_STATUT: Record<StatutMusee, number> = { a_laffiche: 0, a_venir: 1, passee: 2 };

/** Expositions du musée : en cours, puis à venir, puis passées (les plus récentes d'abord). */
export function expositionsDuMusee(
  musee: Musee,
  expositions: Exposition[],
  aujourdhui: string,
): ExpositionDuMusee[] {
  return expositions
    .filter((e) => e.museeId === musee.id)
    .map((exposition) => ({
      exposition,
      statut: statutDe(exposition.dateDebut, exposition.dateFin, aujourdhui),
    }))
    .sort((a, b) => {
      if (a.statut !== b.statut) return ORDRE_STATUT[a.statut] - ORDRE_STATUT[b.statut];
      if (a.statut === 'passee') return b.exposition.dateFin.localeCompare(a.exposition.dateFin);
      if (a.statut === 'a_venir') return a.exposition.dateDebut.localeCompare(b.exposition.dateDebut);
      return a.exposition.dateFin.localeCompare(b.exposition.dateFin);
    });
}

/**
 * Œuvres mises en avant : celles que la fiche désigne (par identifiant), sinon
 * les premières œuvres illustrées du musée.
 */
export function oeuvresMiseEnAvant(musee: Musee, oeuvres: Artwork[], max = 8): Artwork[] {
  const parId = new Map(oeuvres.map((a) => [a.id, a]));
  const choisies = musee.oeuvresIncontournablesIds
    .map((id) => parId.get(id))
    .filter((a): a is Artwork => a !== undefined);
  if (choisies.length > 0) return choisies.slice(0, max);
  return oeuvres.filter((a) => Boolean(a.imageUrl)).slice(0, max);
}

/** 57400 donne "57 400" (espace insécable). */
export function formaterNombre(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

export interface Repere {
  valeur: string;
  libelle: string;
}

/** Repères chiffrés du musée (création, surface, objets), seulement ceux qui sont connus. */
export function reperesDuMusee(musee: Musee): Repere[] {
  const reperes: Repere[] = [];
  if (musee.anneeCreation !== undefined) {
    reperes.push({ valeur: String(musee.anneeCreation), libelle: 'Création' });
  }
  if (musee.surfaceM2 !== undefined) {
    reperes.push({ valeur: `${formaterNombre(musee.surfaceM2)}\u00a0m²`, libelle: 'Surface' });
  }
  if (musee.nombreObjets !== undefined) {
    reperes.push({ valeur: formaterNombre(musee.nombreObjets), libelle: 'Objets' });
  }
  return reperes;
}

/** Lien vers une carte : les coordonnées si on les a, sinon l'adresse. */
export function lienCarte(musee: Musee): string {
  const requete =
    musee.latitude !== undefined && musee.longitude !== undefined
      ? `${musee.latitude},${musee.longitude}`
      : [musee.adresse, musee.ville, musee.pays].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(requete)}`;
}

/** Côté d'une vignette carrée pour `colonnes` colonnes, avec une marge et un écart donnés. */
export function largeurVignette(largeurEcran: number, colonnes = 2, marge = 20, ecart = 12): number {
  return Math.max(80, Math.floor((largeurEcran - 2 * marge - (colonnes - 1) * ecart) / colonnes));
}

/** Hauteur de la photo en tête de la fiche : un peu plus de la moitié de l'écran, bornée. */
export function hauteurPhoto(hauteurEcran: number): number {
  return Math.min(Math.max(Math.round(hauteurEcran * 0.52), 360), 560);
}

/** Opacité de la bande n° `i` (sur `n`) d'un dégradé noir qui s'épaissit progressivement. */
export function opaciteDegrade(i: number, n: number, opaciteMax = 0.8): number {
  return Math.round(opaciteMax * Math.pow((i + 1) / n, 1.7) * 1000) / 1000;
}
