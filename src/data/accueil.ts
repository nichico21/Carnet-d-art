export const PARCE_QUE_VOUS_AIMEZ = ['Vallotton', 'Paysages', 'Nabis', 'Lumière'];

export interface ExpoAVenir {
  id: string;
  titre: string;
  lieu: string;
  dateFin: string;
  oeuvresLiees: number;
  couleur: string;
}

export const EXPOSITIONS_A_VENIR: ExpoAVenir[] = [
  {
    id: 'vallotton-forever-hermitage',
    titre: 'Vallotton Forever',
    lieu: "Fondation de l'Hermitage, Lausanne",
    dateFin: 'Jusqu’au 15 fév. 2026',
    oeuvresLiees: 24,
    couleur: '#0F1E3D',
  },
];
