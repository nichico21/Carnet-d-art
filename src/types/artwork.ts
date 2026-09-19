export type Statut = 'brouillon' | 'valide';

export interface Artwork {
  id: string;
  titre: string;
  artiste: string;
  artisteAnnees?: string;
  annee?: string;
  imageUrl?: string;
  technique?: string;
  dimensions?: string;
  lieuConservation: string;
  ville: string;
  pays: string;
  mouvement: string;
  themes: string[];
  description?: string;
  contexteCreation?: string;
  anecdote?: string;
  pourquoiCaCompte?: string;
  contenuSensible?: boolean;
  statut?: Statut;
}