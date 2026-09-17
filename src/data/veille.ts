import { ContenuVeille } from '../types/veille';

/**
 * Durées approximatives (formats standards Arte 26/52/90 min pour les
 * documentaires, temps de lecture usuel pour les articles) : à corriger
 * une fois les pages consultées, cet environnement ne peut pas les
 * atteindre pour vérifier (réseau bloqué vers ces domaines).
 */
export const CONTENUS_VEILLE: ContenuVeille[] = [
  {
    id: 'brancusi-metamorphoses',
    type: 'documentaire',
    titre: 'Brancusi : les métamorphoses de la sculpture',
    source: 'Arte',
    duree: '52 min',
    couleurs: ['#8C7A5C', '#D9CBB8'],
    url: 'https://www.arte.tv/fr/videos/115033-000-A/brancusi-les-metamorphoses-de-la-sculpture/',
  },
  {
    id: 'vallotton-couleurs-desir',
    type: 'documentaire',
    titre: 'Félix Vallotton, les couleurs du désir',
    source: 'Arte',
    duree: '52 min',
    couleurs: ['#0F1E3D', '#7A2E2E'],
    url: 'https://www.arte.tv/fr/videos/116820-000-A/felix-vallotton-les-couleurs-du-desir/',
  },
  {
    id: 'visages-de-satan',
    type: 'article',
    titre: "Révolté, affreux, séduisant... Les visages de Satan illustrés en 8 œuvres d'art",
    source: 'Historia',
    duree: '7 min',
    couleurs: ['#7A2E2E', '#1A1A1A'],
    url: 'https://www.historia.fr/guide-culture-loisirs/expositions-sorties/revolte-affreux-seduisant-les-visages-de-satan-illustres-en-8-oeuvres-dart-2251646',
  },
  {
    id: 'louvre-genie-xviie',
    type: 'article',
    titre:
      'Paris cet automne : le Musée du Louvre dévoile une exposition exceptionnelle consacrée à un génie de la peinture du XVIIe siècle',
    source: 'Connaissance des Arts',
    duree: '6 min',
    couleurs: ['#C9A227', '#3B2A20'],
    url: 'https://www.connaissancedesarts.com/arts-expositions/paris-cet-automne-le-musee-du-louvre-devoile-une-exposition-exceptionnelle-consacree-a-un-genie-de-la-peinture-du-xviie-siecle-11214699/',
  },
  {
    id: 'monet-femmes-au-jardin',
    type: 'article',
    titre: '« Femmes au jardin » de Claude Monet : l\'impressionnisme en éclosion',
    source: 'Beaux Arts',
    duree: '8 min',
    couleurs: ['#6E9B7A', '#EDEAE3'],
    url: 'https://www.beauxarts.com/grand-format/femmes-au-jardin-de-monet-limpressionnisme-en-eclosion/',
  },
];

export const DERNIERS_AJOUTS: ContenuVeille[] = CONTENUS_VEILLE;

export const PLUS_CONSULTES: ContenuVeille[] = CONTENUS_VEILLE;

export const SELECTION_POUR_VOUS: ContenuVeille[] = [
  CONTENUS_VEILLE[0],
  CONTENUS_VEILLE[4],
];

export const REPRENDRE_VOS_CONTENUS: { contenu: ContenuVeille; progression: number } = {
  contenu: CONTENUS_VEILLE[1],
  progression: 0.32,
};

export const CONTENUS_ENREGISTRES = {
  aLire: 12,
  aEcouter: 8,
  aRegarder: 6,
};
