import { Artwork } from '../types/artwork';

// Ordre d'affichage des œuvres du catalogue.

/** « aleatoire » est l'ordre actuel de l'appli (la liste est mélangée) ; les deux autres sont chronologiques. */
export type OrdreOeuvres = 'aleatoire' | 'ancien' | 'recent';

export const LIBELLES_ORDRE: Record<OrdreOeuvres, string> = {
  aleatoire: 'Aléatoire',
  ancien: 'Du plus ancien au plus récent',
  recent: 'Du plus récent au plus ancien',
};

/** Version courte, affichée à côté de l'icône quand un tri chronologique est actif. */
export const LIBELLES_ORDRE_COURTS: Record<OrdreOeuvres, string> = {
  aleatoire: 'Aléatoire',
  ancien: "Anciennes d'abord",
  recent: "Récentes d'abord",
};

/** Première année du texte de date (« 1879 », « vers 1890 », « 1250-1300 », « -450 ») ; null s'il n'y en a pas. */
export function anneeDeOeuvre(oeuvre: Pick<Artwork, 'annee'>): number | null {
  const m = /-?\d{3,4}/.exec(oeuvre.annee ?? '');
  return m ? parseInt(m[0], 10) : null;
}

/**
 * Œuvres triées par année. Les œuvres sans date viennent toujours en dernier, dans les deux sens,
 * et à année égale l'ordre de départ est conservé. La liste d'origine n'est pas modifiée.
 */
export function trierParAnnee(oeuvres: readonly Artwork[], ordre: 'ancien' | 'recent'): Artwork[] {
  const sens = ordre === 'ancien' ? 1 : -1;
  return oeuvres
    .map((oeuvre, rang) => ({ oeuvre, rang, annee: anneeDeOeuvre(oeuvre) }))
    .sort((a, b) => {
      if (a.annee === null && b.annee === null) return a.rang - b.rang;
      if (a.annee === null) return 1;
      if (b.annee === null) return -1;
      return (a.annee - b.annee) * sens || a.rang - b.rang;
    })
    .map((e) => e.oeuvre);
}
