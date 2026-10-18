import { Exposition } from '../types/exposition';
import { statutExposition } from './dates';

let idChoisi: string | null = null;

/**
 * Exposition en cours mise en avant sur l'Accueil : tirée au hasard parmi celles
 * qui sont en cours à l'ouverture de l'application, puis conservée tant que
 * l'application reste ouverte et que l'exposition est encore en cours.
 * Retourne null s'il n'y en a aucune en cours.
 */
export function expositionALaUne(
  expositions: Exposition[],
  aujourdhui: string,
  hasard: () => number = Math.random,
): Exposition | null {
  const enCours = expositions.filter(
    (e) => statutExposition(e.dateDebut, e.dateFin, aujourdhui) === 'a_laffiche',
  );
  if (enCours.length === 0) return null;

  const dejaChoisie = enCours.find((e) => e.id === idChoisi);
  if (dejaChoisie) return dejaChoisie;

  const indice = Math.min(enCours.length - 1, Math.floor(hasard() * enCours.length));
  const choisie = enCours[indice];
  idChoisi = choisie.id;
  return choisie;
}

/** Oublie le choix déjà fait (utile pour les tests). */
export function reinitialiserExpositionALaUne(): void {
  idChoisi = null;
}