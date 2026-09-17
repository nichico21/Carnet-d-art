import { Profil } from '../types/profile';

export const PROFIL_COURANT: Profil = {
  nom: 'Juliette R.',
  verifie: true,
  ville: 'Paris',
  pays: 'France',
  bio: 'Amoureuse des lumières, des paysages et des histoires qu’elles racontent.',
  couvertureCouleurs: ['#1B2A4A', '#3B5A8A', '#0F1E3D'],
  stats: {
    oeuvres: 127,
    expositions: 23,
    villes: 14,
    abonnes: 312,
    abonnements: 186,
  },
  artistesFavoris: [
    { nom: 'Félix Vallotton', couleur: '#0F1E3D' },
    { nom: 'Edward Hopper', couleur: '#8C3B3B' },
    { nom: 'Gustav Klimt', couleur: '#C9A227' },
    { nom: 'Canaletto', couleur: '#2D7DD2' },
    { nom: 'Vilhelm Hammershøi', couleur: '#6B6B7B' },
  ],
  dernieresOeuvres: [
    { artworkId: 'vallotton-nuit-effet-lune', note: 5 },
    { artworkId: 'hopper-room-new-york', note: 4.5 },
    { artworkId: 'klimt-baiser', note: 5 },
  ],
  dernieresExpositions: [
    {
      id: 'vallotton-orsay-2024',
      titre: 'Vallotton. Le feu sous la glace',
      lieu: "Musée d'Orsay",
      date: 'Mars 2024',
      couleur: '#0F1E3D',
    },
    {
      id: 'klimt-lumieres-2024',
      titre: 'Klimt. The Immersive Experience',
      lieu: 'Atelier des Lumières',
      date: 'Février 2024',
      couleur: '#C9A227',
    },
    {
      id: 'canaletto-correr-2024',
      titre: 'Canaletto & Venise',
      lieu: 'Museo Correr',
      date: 'Janvier 2024',
      couleur: '#2D7DD2',
    },
  ],
};
