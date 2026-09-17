export type TypeProduit = 'livre' | 'affiche' | 'textile' | 'mug' | 'carnet' | 'puzzle';

export const ICONE_PRODUIT: Record<TypeProduit, string> = {
  livre: 'library-outline',
  affiche: 'image-outline',
  textile: 'bag-outline',
  mug: 'cafe-outline',
  carnet: 'book-outline',
  puzzle: 'grid-outline',
};

export interface Produit {
  id: string;
  type: TypeProduit;
  titre: string;
  sousTitre?: string;
  categorie: string;
  prix: number;
  couleur: string;
}

export interface IdeeGout {
  id: string;
  label: string;
  nombreProduits: number;
  couleur: string;
}
