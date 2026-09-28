export const XP_PAR_NIVEAU = 250;

export function niveauDepuisXp(xp: number) {
  const niveau = Math.floor(xp / XP_PAR_NIVEAU) + 1;
  const xpDansNiveau = xp % XP_PAR_NIVEAU;
  return { niveau, xpDansNiveau, xpPourSuivant: XP_PAR_NIVEAU };
}

export function titreNiveau(niveau: number): string {
  if (niveau <= 2) return "Curieux d'art";
  if (niveau <= 5) return 'Œil aiguisé';
  return 'Connaisseur';
}

/** Date locale au format AAAA-MM-JJ (pas d'UTC : le "jour" de l'utilisateur, pas du serveur). */
export function jourISO(date: Date = new Date()): string {
  const a = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const j = String(date.getDate()).padStart(2, '0');
  return `${a}-${m}-${j}`;
}

function jourPrecedent(jour: string): string {
  const [a, m, j] = jour.split('-').map(Number);
  return jourISO(new Date(a, m - 1, j - 1));
}

/** Série à enregistrer quand on joue aujourd'hui. */
export function calculerSerie(serie: number, dernierJour: string | null, aujourdhui: string): number {
  if (dernierJour === aujourdhui) return serie;
  if (dernierJour === jourPrecedent(aujourdhui)) return serie + 1;
  return 1;
}

/** Série à afficher : elle retombe à 0 si on a sauté un jour. */
export function serieAffichee(serie: number, dernierJour: string | null, aujourdhui: string): number {
  if (dernierJour === aujourdhui || dernierJour === jourPrecedent(aujourdhui)) return serie;
  return 0;
}