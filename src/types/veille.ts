export type TypeContenuVeille = 'podcast' | 'documentaire' | 'video' | 'article' | 'expo';

export const TYPE_VEILLE_LABELS: Record<TypeContenuVeille, string> = {
  podcast: 'Podcast',
  documentaire: 'Documentaire',
  video: 'Vidéo',
  article: 'Article',
  expo: 'Expo',
};

export const TYPE_VEILLE_COLORS: Record<TypeContenuVeille, string> = {
  podcast: '#6C5CE7',
  documentaire: '#2E9E6B',
  video: '#C0392B',
  article: '#2D7DD2',
  expo: '#D97A34',
};

export type StatutVeille = 'brouillon' | 'valide';

export interface ContenuVeille {
  id: string;
  titre: string;
  type: TypeContenuVeille;
  source: string;
  url: string;
  imageUrl?: string;
  duree?: string;
  datePublication?: string;
  dateAjout: string;
  compteurConsultations: number;
  themesLies?: string[];
  description?: string;
  motsCles?: string[];
  oeuvresLiees?: string[];
  statut?: StatutVeille;
}