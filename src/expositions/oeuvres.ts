import { Artwork } from '../types/artwork';
import { Exposition } from '../types/exposition';

function normaliser(texte: string): string {
  return texte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function mots(texte: string): string[] {
  return normaliser(texte).split(/[^a-z0-9]+/).filter(Boolean);
}

function artisteValide(nom: string): boolean {
  return (
    !!nom &&
    nom !== 'Artiste inconnu' &&
    !/^Q\d+/.test(nom) &&
    !/^https?:\/\//.test(nom) &&
    !nom.includes('wikidata.org')
  );
}

function exploitable(a: Artwork): boolean {
  return !!a.imageUrl && !a.contenuSensible;
}

/** Deux noms désignent le même artiste si tous les mots du plus court se retrouvent dans le plus long. */
export function memeArtiste(a: string, b: string): boolean {
  const ma = mots(a);
  const mb = mots(b);
  if (ma.length === 0 || mb.length === 0) return false;
  const [court, long] = ma.length <= mb.length ? [ma, mb] : [mb, ma];
  return court.every((m) => long.includes(m));
}

/** Œuvres que tu as reliées à la main à l'exposition (champ oeuvresLieesIds). */
export function oeuvresLieesDeLExposition(exposition: Exposition, artworks: Artwork[]): Artwork[] {
  return exposition.oeuvresLieesIds
    .map((id) => artworks.find((a) => a.id === id))
    .filter((a): a is Artwork => !!a && exploitable(a));
}

export interface ArtisteExposition {
  /** Nom tel qu'il figure dans la fiche de l'exposition. */
  nom: string;
  /** Toutes les œuvres de cet artiste dans le catalogue (sans plafond). */
  oeuvres: Artwork[];
}

/**
 * Pour chaque artiste de l'exposition, ses œuvres présentes dans le catalogue.
 * Un artiste sans aucune œuvre au catalogue n'est pas retourné.
 */
export function artistesDeLExposition(exposition: Exposition, artworks: Artwork[]): ArtisteExposition[] {
  const resultat: ArtisteExposition[] = [];
  const vus = new Set<string>();
  for (const nom of exposition.artistes) {
    const cle = normaliser(nom);
    if (vus.has(cle)) continue;
    vus.add(cle);
    const oeuvres = artworks.filter(
      (a) => exploitable(a) && artisteValide(a.artiste) && memeArtiste(nom, a.artiste),
    );
    if (oeuvres.length > 0) resultat.push({ nom, oeuvres });
  }
  return resultat;
}