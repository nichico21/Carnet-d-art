import { Artwork } from '../types/artwork';

export interface QuestionQuiAPeint {
  artwork: Artwork;
  options: string[];
  correctIndex: number;
}

function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Quand Wikidata ne trouve pas de nom d'artiste en français/anglais, son
 * service de label renvoie l'adresse de la fiche elle-même
 * (ex. "http://www.wikidata.org/entity/Q7452089") au lieu d'un nom.
 * On l'exclut ici, en plus du code brut "Qxxxxx" déjà filtré ailleurs.
 */
function estArtisteInvalide(artiste: string | null | undefined): boolean {
  if (!artiste) return true;
  if (artiste === 'Artiste inconnu') return true;
  if (/^Q\d+/.test(artiste)) return true;
  if (/^https?:\/\//.test(artiste)) return true;
  if (artiste.includes('wikidata.org')) return true;
  return false;
}

/** Œuvres utilisables pour un jeu : image réelle, artiste identifié, rien de sensible. */
export function oeuvresJouables(artworks: Artwork[]): Artwork[] {
  return artworks.filter(
    (a) =>
      a.imageUrl &&
      !estArtisteInvalide(a.artiste) &&
      !/^Q\d+$/.test(a.titre) &&
      !a.contenuSensible,
  );
}

export function genererQuestionsQuiAPeint(
  artworks: Artwork[],
  nombre: number = 10,
): QuestionQuiAPeint[] {
  const eligibles = oeuvresJouables(artworks);
  const artistesDistincts = Array.from(new Set(eligibles.map((a) => a.artiste)));

  if (eligibles.length === 0 || artistesDistincts.length < 4) return [];

  const oeuvresTirees = melanger(eligibles).slice(0, Math.min(nombre, eligibles.length));

  return oeuvresTirees.map((artwork) => {
    const autres = melanger(artistesDistincts.filter((nom) => nom !== artwork.artiste)).slice(0, 3);
    const options = melanger([artwork.artiste, ...autres]);
    return { artwork, options, correctIndex: options.indexOf(artwork.artiste) };
  });
}