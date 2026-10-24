export interface Musee {
  id: string;
  nom: string;
  ville: string;
  pays: string;
  /** Europe, Amériques, Asie, Afrique ou Océanie : déduite du pays à la génération. */
  region?: string;
  adresse?: string;
  /** Page d'accueil du site officiel. */
  siteUrl?: string;
  imageUrl?: string;
  description?: string;
  type?: string;
  collections: string[];
  /** Identifiant Wikidata (Q…), source des repères chiffrés. */
  wikidataId?: string;
  wikipediaUrl?: string;
  anneeCreation?: number;
  surfaceM2?: number;
  nombreObjets?: number;
  latitude?: number;
  longitude?: number;
  /** Affiché dans la rubrique « Incontournables ». */
  incontournable?: boolean;
  /** Identifiants d'œuvres du catalogue mises en avant sur la page du musée. */
  oeuvresIncontournablesIds: string[];
  /** Noms sous lesquels le musée apparaît dans les œuvres du catalogue (lieuConservation). */
  nomsCatalogue: string[];
}
