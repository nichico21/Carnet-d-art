import { CategorieBoutiqueId, IdeeGout, Produit } from '../types/boutique';
import { ARTWORKS } from './artworks.generated';

/** Cherche une œuvre réelle du catalogue par nom d'artiste (recherche partielle, insensible à la casse). */
function oeuvreParArtiste(motCle: string) {
  return ARTWORKS.find(
    (a) => a.imageUrl && !a.contenuSensible && a.artiste.toLowerCase().includes(motCle.toLowerCase()),
  );
}

function produitDepuisOeuvre(
  base: Omit<Produit, 'imageUrl' | 'oeuvreLieeId' | 'sousTitre'> & { motCleArtiste: string },
): Produit {
  const { motCleArtiste, ...reste } = base;
  const oeuvre = oeuvreParArtiste(motCleArtiste);
  return {
    ...reste,
    sousTitre: oeuvre?.titre,
    imageUrl: oeuvre?.imageUrl,
    oeuvreLieeId: oeuvre?.id,
  };
}

// Produits encore fictifs (aucun vrai lien d'achat) — les images et titres
// d'œuvre associés, eux, sont réels : trouvés dynamiquement dans le catalogue.
export const PRODUITS: Produit[] = [
  // Reproductions
  produitDepuisOeuvre({ id: 'affiche-monet', titre: 'Affiche', categorie: 'reproductions', sousCategorie: 'Affiches', prix: 19, motCleArtiste: 'Monet' }),
  produitDepuisOeuvre({ id: 'poster-vangogh', titre: 'Poster', categorie: 'reproductions', sousCategorie: 'Posters', prix: 15, motCleArtiste: 'Gogh' }),
  produitDepuisOeuvre({ id: 'tirage-degas', titre: "Tirage d'art", categorie: 'reproductions', sousCategorie: "Tirages d'art", prix: 65, motCleArtiste: 'Degas' }),
  produitDepuisOeuvre({ id: 'carte-renoir', titre: 'Carte postale', categorie: 'reproductions', sousCategorie: 'Cartes', prix: 3.5, motCleArtiste: 'Renoir' }),

  // Livres
 {
  id: 'catalogue-vallotton-feu-glace',
  titre: 'Félix Vallotton : le feu sous la glace',
  categorie: 'livres',
  sousCategorie: "Catalogues d'exposition",
  prix: 45,
  offres: [
    { source: 'Fnac', url: 'https://www.fnac.com/a6108338/Collectif-Felix-vallotton-au-grand-palais', prix: 45, dateReleve: '2026-09-29' },
  ],
},
  produitDepuisOeuvre({ id: 'monographie-degas', titre: 'Monographie', categorie: 'livres', sousCategorie: 'Monographies', prix: 38, motCleArtiste: 'Degas' }),
  { id: 'guide-orsay', titre: "Guide du musée d'Orsay", categorie: 'livres', sousCategorie: 'Guides de musées', prix: 12, sousTitre: undefined },

  // Objets
  produitDepuisOeuvre({ id: 'puzzle-monet', titre: 'Puzzle', sousCategorie: 'Puzzles', categorie: 'objets', prix: 29, motCleArtiste: 'Monet' }),
  produitDepuisOeuvre({ id: 'carnet-renoir', titre: 'Carnet', categorie: 'objets', sousCategorie: 'Carnets', prix: 16, motCleArtiste: 'Renoir' }),
  { id: 'jeu-memo-impressionnistes', titre: 'Mémo des impressionnistes', categorie: 'objets', sousCategorie: 'Jeux', prix: 18 },

  // Déco
  {
  id: 'assiette-tokyo-design-vague',
  titre: 'Bol Hokusai - Blanc & Bleu',
  categorie: 'deco',
  sousCategorie: 'Objets décoratifs',
  prix: 32,
  url: 'https://tokyo-design-studio.com/en/tds-tayo-bowl-hokusai-white-blue-o-12-6-x-7-cm-item-no-33729.html',
},
  produitDepuisOeuvre({ id: 'tapisserie-vangogh', titre: 'Tapisserie murale', categorie: 'deco', sousCategorie: 'Textiles', prix: 55, motCleArtiste: 'Gogh' }),

  // Vêtements
  {
  id: 'baskets-vangogh-nuit-etoilee',
  titre: 'Baskets « Nuit étoilée »',
  categorie: 'vetements',
  sousCategorie: 'Chaussures',
  prix: 104,
  imageUrl: 'https://galartsy.com/cdn/shop/products/Sfca793478749404191fa15f2fb2b26bcs.png',
  url: 'https://galartsy.com/products/van-gogh-starry-night-inspired-sneakers',
},
  

  // Cadeaux
  produitDepuisOeuvre({ id: 'mug-vangogh', titre: 'Mug', categorie: 'cadeaux', sousCategorie: 'Mugs', prix: 15, motCleArtiste: 'Gogh' }),
  produitDepuisOeuvre({ id: 'tote-bag-renoir', titre: 'Tote bag', categorie: 'cadeaux', sousCategorie: 'Tote bags', prix: 22, motCleArtiste: 'Renoir' }),
  produitDepuisOeuvre({ id: 'bijou-degas', titre: 'Pendentif', categorie: 'cadeaux', sousCategorie: "Bijoux inspirés d'œuvres", prix: 48, motCleArtiste: 'Degas' }),
];

export const SELECTION_BOUTIQUE: Produit[] = PRODUITS.slice(0, 3);
export const DERNIERS_PRODUITS_VUS: Produit[] = PRODUITS.slice(3, 6);

export const IDEES_GOUTS: IdeeGout[] = [
  { id: 'nabis', label: 'Les Nabis', nombreProduits: 12, couleur: '#7A2E2E' },
  { id: 'paysages', label: 'Paysages', nombreProduits: 23, couleur: '#2E9E6B' },
  { id: 'nuits', label: 'Nuits', nombreProduits: 18, couleur: '#1B2A4A' },
];

export function compterParCategorie(categorieId: CategorieBoutiqueId): number {
  return PRODUITS.filter((p) => p.categorie === categorieId).length;
}