export const THEMES = [
  'portrait',
  'nature_morte',
  'paysage',
  'scene_historique',
  'scene_religieuse',
  'mythologie',
  'scene_de_genre',
  'abstrait',
  'architecture',
  'animalier',
  'marine',
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  portrait: 'Portrait',
  nature_morte: 'Nature morte',
  paysage: 'Paysage',
  scene_historique: 'Scène historique',
  scene_religieuse: 'Scène religieuse',
  mythologie: 'Mythologie',
  scene_de_genre: 'Scène de genre',
  abstrait: 'Abstrait',
  architecture: 'Architecture',
  animalier: 'Animalier',
  marine: 'Marine',
};

export type Valence = 'positive' | 'negative' | 'neutre';

export interface Emotion {
  valence: Valence;
  /** 1 = très douce, 5 = très intense */
  intensite: 1 | 2 | 3 | 4 | 5;
  /** Tags libres, ex: "mélancolie", "sérénité", "tension" */
  tags: string[];
}

export interface CouleurDominante {
  nom: string;
  hex: string;
}

export interface Artwork {
  id: string;
  titre: string;
  artiste: string;
  annee: string;
  technique: string;
  dimensions?: string;
  lieuConservation: string;
  ville: string;
  pays: string;
  mouvements: string[];
  theme: Theme;
  couleursDominantes: CouleurDominante[];
  emotion: Emotion;
  description?: string;
}
