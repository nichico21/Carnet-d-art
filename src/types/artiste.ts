export interface MuseeDeArtiste {
  /** Identifiant d'une fiche musée. */
  id: string;
  /** Nombre d'œuvres de l'artiste conservées dans ce musée (d'après le catalogue). */
  nombre: number;
}

export interface Artiste {
  id: string;
  nom: string;
  /** Autres graphies et pseudonymes. */
  alias: string[];
  nomNaissance?: string;
  wikidataId?: string;
  wikipediaUrl?: string;
  ulanId?: string;
  imageUrl?: string;
  /** AAAA, AAAA-MM ou AAAA-MM-JJ (année négative avant notre ère). */
  naissance?: string;
  /** Même format ; absent pour un artiste vivant. */
  deces?: string;
  datesApproximatives?: boolean;
  anneeNaissance?: number;
  anneeDeces?: number;
  villeNaissance?: string;
  paysNaissance?: string;
  nationalites: string[];
  /** Europe, Amériques, Asie, Afrique ou Océanie (d'après la nationalité). */
  region?: string;
  disciplines: string[];
  mouvements: string[];
  epoques: string[];
  description?: string;
  anecdote?: string;
  /** Une phrase courte pour le bandeau « À la une » (90 caractères au plus). */
  accroche?: string;
  /** Citation de l'artiste ; publiée seulement avec sa source. */
  citation?: string;
  citationSource?: string;
  incontournable?: boolean;
  oeuvresIncontournablesIds: string[];
  /** Noms de l'artiste tels qu'ils sont écrits dans les fiches d'œuvres. */
  nomsCatalogue: string[];
  /** Identifiants des œuvres du catalogue de cet artiste. */
  oeuvresIds: string[];
  nombreOeuvres: number;
  /** Musées où voir ses œuvres, du plus fourni au moins fourni. */
  musees: MuseeDeArtiste[];
}
