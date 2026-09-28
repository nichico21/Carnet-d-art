import { Ionicons } from '@expo/vector-icons';
import { CategorieJeu, JeuDef } from '../types/jeux';

export const CATEGORIES: {
  id: CategorieJeu;
  label: string;
  sousTitre: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'regard', label: 'Regard', sousTitre: 'Affûtez votre œil', icone: 'eye-outline' },
  { id: 'memoire', label: 'Mémoire', sousTitre: 'Testez votre mémoire', icone: 'bulb-outline' },
  { id: 'culture', label: 'Culture', sousTitre: 'Enrichissez vos connaissances', icone: 'library-outline' },
  { id: 'gouts', label: 'Goûts', sousTitre: 'Découvrez vos préférences', icone: 'heart-outline' },
];

// Passer "disponible" à true dès qu'un jeu est construit.
export const JEUX: JeuDef[] = [
  {
    id: 'daily-art',
    titre: 'Daily Art',
    description: '3 questions, 1 œuvre par jour. Testez vos connaissances et gagnez des points.',
    categorie: 'culture',
    disponible: false,
    nouveauChaqueJour: true,
  },
  {
    id: 'memo',
    titre: 'Mémo',
    description: "Trouvez les paires d'œuvres et révisez en vous amusant.",
    categorie: 'memoire',
    disponible: false,
  },
  {
    id: 'quel-detail',
    titre: 'Quel détail ?',
    description: 'Reconnaissez l’œuvre grâce à un détail zoomé.',
    categorie: 'regard',
    disponible: false,
  },
  {
    id: 'qui-a-peint',
    titre: 'Qui a peint ?',
    description: "Devinez l'artiste de l'œuvre proposée.",
    categorie: 'culture',
    disponible: false,
  },
  {
    id: 'intrus',
    titre: "L'intrus",
    description: "Trouvez l'œuvre qui ne correspond pas aux autres.",
    categorie: 'regard',
    disponible: false,
  },
  {
    id: 'deux-oeuvres',
    titre: 'Deux œuvres, un artiste',
    description: 'Les deux œuvres ont-elles été peintes par le même artiste ?',
    categorie: 'culture',
    disponible: false,
  },
  {
    id: 'ordre',
    titre: "Remettez-les dans l'ordre",
    description: "Classez ces œuvres dans l'ordre chronologique.",
    categorie: 'memoire',
    disponible: false,
  },
  {
    id: 'quel-mouvement',
    titre: 'Quel mouvement ?',
    description: "Associez l'œuvre au mouvement artistique correspondant.",
    categorie: 'culture',
    disponible: false,
  },
  {
    id: 'ou-sommes-nous',
    titre: 'Où sommes-nous ?',
    description: 'Dans quel musée cette œuvre est-elle conservée ?',
    categorie: 'culture',
    disponible: false,
  },
  {
    id: 'battle',
    titre: "Battle d'artistes",
    description: 'Choisissez votre œuvre préférée entre deux propositions.',
    categorie: 'gouts',
    disponible: false,
  },
];