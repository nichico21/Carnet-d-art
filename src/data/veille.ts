import { ContenuVeille } from '../types/veille';

export const DERNIERS_AJOUTS: ContenuVeille[] = [
  {
    id: 'vallotton-clair-obscur',
    type: 'podcast',
    titre: 'Vallotton, la modernité en clair-obscur',
    source: 'France Culture',
    duree: '28 min',
    couleurs: ['#0F1E3D', '#DCE3E8'],
    dateGroupe: "Aujourd'hui",
  },
  {
    id: 'vallotton-singulier',
    type: 'article',
    titre: 'Pourquoi Vallotton est-il si singulier ?',
    source: 'Beaux Arts Magazine',
    duree: '8 min',
    couleurs: ['#7A2E2E', '#1A1A1A'],
    dateGroupe: "Aujourd'hui",
  },
  {
    id: 'hilma-af-klint',
    type: 'video',
    titre: "Hilma af Klint : la double vie d'une pionnière",
    source: 'Arte',
    duree: '52 min',
    couleurs: ['#C9A227', '#3B5A8A'],
    dateGroupe: "Aujourd'hui",
  },
  {
    id: 'orientalisme-fantasme',
    type: 'documentaire',
    titre: "L'Orientalisme, fantasme et réalité",
    source: 'Arte',
    duree: '45 min',
    couleurs: ['#8C3B3B', '#D9A441'],
    dateGroupe: 'Hier',
  },
  {
    id: 'couleur-xixe',
    type: 'podcast',
    titre: 'Les mystères de la couleur au XIXe siècle',
    source: 'France Culture',
    duree: '35 min',
    couleurs: ['#2E9E6B', '#6E9B7A'],
    dateGroupe: 'Hier',
  },
];

export const PLUS_CONSULTES: ContenuVeille[] = [
  {
    id: 'vangogh-emotions',
    type: 'podcast',
    titre: 'Histoire de l\'art : Van Gogh, le peintre des émotions',
    source: 'France Culture',
    duree: '32 min',
    couleurs: ['#1B2A4A', '#F4D35E'],
    audience: '12,4K écoutes',
  },
  {
    id: 'vermeer-lumiere',
    type: 'documentaire',
    titre: 'Vermeer, la lumière et le silence',
    source: 'Arte',
    duree: '48 min',
    couleurs: ['#3B5A8A', '#D9A441'],
    audience: '9,8K vues',
  },
  {
    id: 'orientalisme-10-oeuvres',
    type: 'article',
    titre: "L'orientalisme en 10 œuvres incontournables",
    source: 'Connaissance des Arts',
    duree: '6 min',
    couleurs: ['#D97A34', '#7A2E2E'],
    audience: '8,7K lectures',
  },
  {
    id: 'klimt-secession',
    type: 'video',
    titre: 'Klimt et la Sécession viennoise',
    source: 'Arte',
    duree: '41 min',
    couleurs: ['#C9A227', '#2F5D50'],
    audience: '7,1K vues',
  },
  {
    id: 'monet-instant-present',
    type: 'article',
    titre: "Monet : peindre l'instant présent",
    source: 'Beaux Arts Magazine',
    duree: '7 min',
    couleurs: ["#6E9B7A", '#EDEAE3'],
    audience: '6,3K lectures',
  },
];

export const SELECTION_POUR_VOUS: ContenuVeille[] = [
  DERNIERS_AJOUTS[0],
  DERNIERS_AJOUTS[2],
];

export const REPRENDRE_VOS_CONTENUS: { contenu: ContenuVeille; progression: number } = {
  contenu: {
    id: 'nabis-revolution-silencieuse',
    type: 'documentaire',
    titre: 'Les Nabis, une révolution silencieuse',
    source: 'Arte',
    duree: '52 min',
    couleurs: ['#7A2E2E', '#0F1E3D'],
  },
  progression: 0.32,
};

export const CONTENUS_ENREGISTRES = {
  aLire: 12,
  aEcouter: 8,
  aRegarder: 6,
};
