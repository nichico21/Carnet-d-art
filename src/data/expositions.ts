import { Exposition } from '../types/exposition';

// Expositions "à l'affiche" / "à venir" vérifiées via recherche web (programmation
// annoncée à la date du 19 septembre 2026) ; les "passées" reprennent des
// expositions déjà mentionnées ailleurs dans l'app (Accueil, Profil).
export const EXPOSITIONS: Exposition[] = [
  {
    id: 'bartholdi-liberte-orsay',
    titre: 'Auguste Bartholdi, la Liberté éclairant le monde',
    lieu: "Musée d'Orsay",
    ville: 'Paris',
    dateDebut: '15 septembre 2026',
    dateFin: '31 janvier 2027',
    statut: 'a_laffiche',
    couleur: '#8C7A5C',
    description:
      "Consacrée à Auguste Bartholdi, sculpteur de la statue de la Liberté, qui collabora avec Eugène Viollet-le-Duc et Gustave Eiffel sur ce projet monumental.",
  },
  {
    id: 'cezanne-et-nous-grand-palais',
    titre: 'Cézanne et nous',
    lieu: 'Grand Palais',
    ville: 'Paris',
    dateDebut: '23 septembre 2026',
    dateFin: '17 janvier 2027',
    statut: 'a_venir',
    couleur: '#5B8CBE',
    description:
      "Une traversée de l'héritage de Paul Cézanne à travers le regard des générations d'artistes qui lui ont succédé.",
  },
  {
    id: 'mary-cassatt-orsay',
    titre: 'Mary Cassatt',
    lieu: "Musée d'Orsay",
    ville: 'Paris',
    dateDebut: 'Octobre 2026',
    dateFin: 'Janvier 2027',
    statut: 'a_venir',
    couleur: '#D9A441',
    description:
      "Rétrospective de près de 80 peintures, pastels et estampes, organisée avec la National Gallery de Londres et le MFA de Boston pour les 40 ans du musée d'Orsay.",
  },
  {
    id: 'zurbaran-louvre',
    titre: 'Zurbarán',
    lieu: 'Musée du Louvre',
    ville: 'Paris',
    dateDebut: 'Octobre 2026',
    dateFin: 'Janvier 2027',
    statut: 'a_venir',
    couleur: '#3B2A20',
    description:
      "Rétrospective consacrée au peintre du Siècle d'or espagnol : commandes monastiques, portraits et natures mortes.",
  },
  {
    id: 'gustave-fayet-vuitton',
    titre: 'Gustave Fayet, collectionneur',
    lieu: 'Fondation Louis Vuitton',
    ville: 'Paris',
    dateDebut: 'Octobre 2026',
    dateFin: 'À déterminer',
    statut: 'a_venir',
    couleur: '#2E9E6B',
    description:
      "La Fondation Louis Vuitton retrace le parcours du collectionneur et mécène Gustave Fayet, proche des Nabis et de Gauguin.",
  },
  {
    id: 'vallotton-forever-hermitage',
    titre: 'Vallotton Forever',
    lieu: "Fondation de l'Hermitage",
    ville: 'Lausanne',
    dateDebut: 'Mars 2025',
    dateFin: '15 février 2026',
    statut: 'passee',
    couleur: '#0F1E3D',
    description:
      "Rétrospective consacrée à Félix Vallotton, entre gravures, nus et paysages nocturnes.",
    oeuvresLieesIds: ['vallotton-nuit-effet-lune'],
  },
  {
    id: 'klimt-immersive-atelier-lumieres',
    titre: 'Klimt. The Immersive Experience',
    lieu: 'Atelier des Lumières',
    ville: 'Paris',
    dateDebut: 'Novembre 2023',
    dateFin: 'Février 2024',
    statut: 'passee',
    couleur: '#C9A227',
    description: 'Exposition immersive consacrée à Gustav Klimt et à la Sécession viennoise.',
    oeuvresLieesIds: ['klimt-baiser', 'klimt-portrait-ada'],
  },
  {
    id: 'canaletto-venise-correr',
    titre: 'Canaletto & Venise',
    lieu: 'Museo Correr',
    ville: 'Venise',
    dateDebut: 'Octobre 2023',
    dateFin: 'Janvier 2024',
    statut: 'passee',
    couleur: '#2D7DD2',
    description: 'Panoramas vénitiens de Canaletto au fil du Grand Canal.',
  },
];
