import { Artwork } from '../types/artwork';

// Époques (siècles) du catalogue d'œuvres. La règle est celle du script de génération (build-app-data.mjs),
// pour que les nombres affichés dans la liste des époques correspondent toujours aux résultats du filtre.

const ROMAINS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** « 1879 » -> « XIXe siècle » ; une année vide ou illisible n'a pas d'époque (null). */
export function epoqueDeAnnee(annee: string | undefined): string | null {
  const n = parseInt(annee ?? '', 10);
  if (!n || isNaN(n)) return null;
  const siecle = Math.ceil(n / 100);
  return `${ROMAINS[siecle] ?? siecle}e siècle`;
}

export function epoqueDeOeuvre(oeuvre: Pick<Artwork, 'annee'>): string | null {
  return epoqueDeAnnee(oeuvre.annee);
}

/** Vrai si l'œuvre appartient à l'époque choisie ; sans époque choisie, toutes les œuvres conviennent. */
export function correspondEpoque(oeuvre: Pick<Artwork, 'annee'>, epoque: string | undefined): boolean {
  if (!epoque) return true;
  return epoqueDeOeuvre(oeuvre) === epoque;
}

/** « XIXe siècle » -> 19 ; un libellé inconnu donne une valeur très grande (il passe en dernier). */
export function numeroDeSiecle(epoque: string): number {
  const m = /^([IVXL]+)e siècle$/.exec(epoque);
  const rang = m ? ROMAINS.indexOf(m[1]) : -1;
  return rang > 0 ? rang : 999;
}

export interface FacetteEpoque {
  valeur: string;
  nombre: number;
}

/** Les époques du plus ancien siècle au plus récent (la liste générée est classée par nombre d'œuvres). */
export function trierEpoques<T extends FacetteEpoque>(epoques: readonly T[]): T[] {
  return [...epoques].sort((a, b) => numeroDeSiecle(a.valeur) - numeroDeSiecle(b.valeur));
}
