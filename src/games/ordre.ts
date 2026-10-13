import { Artwork } from '../types/artwork';

export interface OeuvreDatee {
  artwork: Artwork;
  annee: number;
}

export interface MancheOrdre {
  /** Œuvres dans l'ordre d'affichage (mélangé). */
  affichees: OeuvreDatee[];
  /** Les mêmes œuvres, de la plus ancienne à la plus récente. */
  ordreCorrect: OeuvreDatee[];
}

const ANNEE_MIN = 1300;
const ANNEE_MAX = 2025;
const ECART_MIN = 10;

function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Année d'une œuvre si elle est exploitable (4 chiffres plausibles), sinon null. */
export function anneeDe(artwork: Artwork): number | null {
  if (!artwork.annee) return null;
  const n = parseInt(artwork.annee, 10);
  if (Number.isNaN(n) || n < ANNEE_MIN || n > ANNEE_MAX) return null;
  return n;
}

/** Œuvres utilisables : image réelle, année exploitable, titre résolu, rien de sensible. */
export function oeuvresDatables(artworks: Artwork[]): OeuvreDatee[] {
  const resultat: OeuvreDatee[] = [];
  for (const a of artworks) {
    if (!a.imageUrl || a.contenuSensible || /^Q\d+$/.test(a.titre)) continue;
    const annee = anneeDe(a);
    if (annee !== null) resultat.push({ artwork: a, annee });
  }
  return resultat;
}

/** Tire `nombre` œuvres dont les années sont toutes espacées d'au moins `ecartMin`. */
function tirerManche(pool: OeuvreDatee[], nombre: number, ecartMin: number): OeuvreDatee[] | null {
  const choisies: OeuvreDatee[] = [];
  for (const o of melanger(pool)) {
    if (choisies.every((c) => Math.abs(c.annee - o.annee) >= ecartMin)) choisies.push(o);
    if (choisies.length === nombre) return choisies;
  }
  return null;
}

function memeOrdre(a: OeuvreDatee[], b: OeuvreDatee[]): boolean {
  return a.every((o, i) => o.artwork.id === b[i].artwork.id);
}

export function genererManchesOrdre(
  artworks: Artwork[],
  nbManches: number = 5,
  nbOeuvres: number = 4,
): MancheOrdre[] {
  let pool = oeuvresDatables(artworks);
  const manches: MancheOrdre[] = [];

  while (manches.length < nbManches) {
    // Écart confortable d'abord ; à défaut, simplement des années toutes différentes.
    const choisies = tirerManche(pool, nbOeuvres, ECART_MIN) ?? tirerManche(pool, nbOeuvres, 1);
    if (!choisies) break;

    const ordreCorrect = [...choisies].sort((a, b) => a.annee - b.annee);
    let affichees = melanger(choisies);
    for (let essai = 0; essai < 10 && memeOrdre(affichees, ordreCorrect); essai++) {
      affichees = melanger(choisies);
    }
    manches.push({ affichees, ordreCorrect });

    const ids = new Set(choisies.map((c) => c.artwork.id));
    pool = pool.filter((o) => !ids.has(o.artwork.id));
  }
  return manches;
}

/** Pour chaque rang de l'ordre correct : l'œuvre choisie à ce rang est-elle la bonne ? */
export function positionsCorrectes(choix: string[], manche: MancheOrdre): boolean[] {
  return manche.ordreCorrect.map((o, i) => choix[i] === o.artwork.id);
}

export function scoreManche(choix: string[], manche: MancheOrdre): number {
  return positionsCorrectes(choix, manche).filter(Boolean).length;
}