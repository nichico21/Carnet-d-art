import { IdeeGout, Produit } from '../types/boutique';

export const SELECTION_BOUTIQUE: Produit[] = [
  {
    id: 'catalogue-vallotton-feu-glace',
    type: 'livre',
    titre: 'Félix Vallotton',
    sousTitre: 'Le feu sous la glace',
    categorie: "Catalogue d'exposition",
    prix: 42,
    couleur: '#0F1E3D',
  },
  {
    id: 'affiche-nuit-effet-lune',
    type: 'affiche',
    titre: 'La Nuit, effet de lune',
    categorie: 'Affiche d\'art · 30 × 40 cm',
    prix: 19,
    couleur: '#1B2A4A',
  },
  {
    id: 'tote-bag-nabis',
    type: 'textile',
    titre: 'Tote bag',
    sousTitre: 'Les Nabis',
    categorie: 'Coton bio',
    prix: 22,
    couleur: '#C9A227',
  },
];

export const DERNIERS_PRODUITS_VUS: Produit[] = [
  {
    id: 'mug-nuit-etoilee',
    type: 'mug',
    titre: 'Mug',
    sousTitre: 'Nuit étoilée',
    categorie: 'Van Gogh',
    prix: 15,
    couleur: '#1B2A4A',
  },
  {
    id: 'carnet-motifs-nabis',
    type: 'carnet',
    titre: 'Carnet',
    sousTitre: 'Motifs Nabis',
    categorie: 'Papeterie',
    prix: 16,
    couleur: '#7A2E2E',
  },
  {
    id: 'puzzle-vallotton',
    type: 'puzzle',
    titre: 'Puzzle Vallotton',
    sousTitre: '1000 pièces',
    categorie: 'Jeux',
    prix: 29,
    couleur: '#0F1E3D',
  },
];

export const IDEES_GOUTS: IdeeGout[] = [
  { id: 'nabis', label: 'Les Nabis', nombreProduits: 12, couleur: '#7A2E2E' },
  { id: 'paysages', label: 'Paysages', nombreProduits: 23, couleur: '#2E9E6B' },
  { id: 'nuits', label: 'Nuits', nombreProduits: 18, couleur: '#1B2A4A' },
];
