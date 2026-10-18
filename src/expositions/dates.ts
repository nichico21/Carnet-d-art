import { StatutExposition } from '../types/exposition';

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MOIS_COURTS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** Vrai pour une date au format AAAA-MM-JJ qui existe réellement dans le calendrier. */
export function estDateISO(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const [a, m, j] = valeur.split('-').map(Number);
  const date = new Date(a, m - 1, j);
  return date.getFullYear() === a && date.getMonth() === m - 1 && date.getDate() === j;
}

/**
 * Statut d'une exposition à une date donnée (toutes au format AAAA-MM-JJ,
 * qui se comparent comme du texte). La date de fin est incluse.
 */
export function statutExposition(
  dateDebut: string,
  dateFin: string,
  aujourdhui: string,
): StatutExposition {
  if (aujourdhui < dateDebut) return 'a_venir';
  if (aujourdhui > dateFin) return 'passee';
  return 'a_laffiche';
}

/** "2026-10-07" -> "7 octobre 2026" (ou "7 oct. 2026" en version courte). */
export function formaterDate(iso: string, court: boolean = false): string {
  const [a, m, j] = iso.split('-').map(Number);
  const mois = (court ? MOIS_COURTS : MOIS)[m - 1];
  return `${j === 1 ? '1er' : j} ${mois} ${a}`;
}

export function formaterPeriode(debut: string, fin: string, court: boolean = false): string {
  return `${formaterDate(debut, court)} – ${formaterDate(fin, court)}`;
}