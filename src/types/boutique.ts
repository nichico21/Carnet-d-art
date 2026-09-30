export type CategorieBoutiqueId = 'reproductions' | 'livres' | 'objets' | 'deco' | 'vetements' | 'cadeaux';

export interface Produit {
  id: string;
  titre: string;
  sousTitre?: string;
  categorie: CategorieBoutiqueId;
  sousCategorie: string;
  prix: number;
  imageUrl?: string;
  url?: string;
  offres?: OffreVendeur[];
  oeuvreLieeId?: string;
}

export interface IdeeGout {
  id: string;
  label: string;
  nombreProduits: number;
  couleur: string;
}

export interface OffreVendeur {
  source: string;
  url: string;
  prix: number;
  dateReleve: string;
}

