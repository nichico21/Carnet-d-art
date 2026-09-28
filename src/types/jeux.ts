export type CategorieJeu = 'regard' | 'memoire' | 'culture' | 'gouts';

export interface JeuDef {
  id: string;
  titre: string;
  description: string;
  categorie: CategorieJeu;
  /** false tant que le jeu n'est pas construit : la carte affiche "Bientôt". */
  disponible: boolean;
  nouveauChaqueJour?: boolean;
}