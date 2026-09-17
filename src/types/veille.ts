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

export interface ContenuVeille {
  id: string;
  type: TypeContenuVeille;
  titre: string;
  source: string;
  duree: string;
  couleurs: string[];
  /** Regroupement chronologique pour l'écran "Derniers ajouts" */
  dateGroupe?: string;
  /** Compteur d'audience pour l'écran "Les plus consultés" */
  audience?: string;
  /** Lien vers la source d'origine (ouvert dans le navigateur) */
  url?: string;
}
