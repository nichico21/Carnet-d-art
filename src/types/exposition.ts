export type StatutExposition = 'a_laffiche' | 'a_venir' | 'passee';

export interface Exposition {
  id: string;
  titre: string;
  lieu: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutExposition;
  couleur: string;
  description: string;
  /** Œuvres du catalogue en lien avec cette exposition */
  oeuvresLieesIds?: string[];
}
