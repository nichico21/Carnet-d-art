export type StatutExposition = 'a_laffiche' | 'a_venir' | 'passee';

export interface Exposition {
  id: string;
  titre: string;
  sousTitre?: string;
  museeId: string;
  /** Lieu, ville, pays et adresse sont repris du registre des musées. */
  lieu: string;
  ville: string;
  pays: string;
  adresse?: string;
  /** Dates au format AAAA-MM-JJ. */
  dateDebut: string;
  dateFin: string;
  description: string;
  /** Tarifs tels que publiés par le musée. */
  tarifs?: string;
  duree?: string;
  /** Page de l'exposition sur le site du musée. */
  url: string;
  imageUrl: string;
    /** Pages consultées pour rédiger la fiche (la page officielle d'abord). */
  sources: string[];
  /** Date du relevé, AAAA-MM-JJ. */
  dateReleve: string;
  type: string;
  epoques: string[];
  mouvements: string[];
  artistes: string[];
  oeuvresLieesIds: string[];
}