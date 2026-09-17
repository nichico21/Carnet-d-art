export interface StatsProfil {
  oeuvres: number;
  expositions: number;
  villes: number;
  abonnes: number;
  abonnements: number;
}

export interface ArtisteFavori {
  nom: string;
  couleur: string;
}

export interface OeuvreAjoutee {
  artworkId: string;
  note: number;
}

export interface ExpositionVisitee {
  id: string;
  titre: string;
  lieu: string;
  date: string;
  couleur: string;
}

export interface Profil {
  nom: string;
  verifie: boolean;
  ville: string;
  pays: string;
  bio: string;
  couvertureCouleurs: string[];
  stats: StatsProfil;
  artistesFavoris: ArtisteFavori[];
  dernieresOeuvres: OeuvreAjoutee[];
  dernieresExpositions: ExpositionVisitee[];
}
