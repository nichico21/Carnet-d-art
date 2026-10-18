/**
 * Fonctions partagées par les scripts d'expositions : chargement du modèle
 * (champs, vocabulaires, registre des musées), validation d'une fiche et
 * conversion en objet Exposition pour l'app.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const CATALOG = path.join(__dirname, 'catalog');
export const FICHES_DIR = path.join(CATALOG, 'expositions');
export const WORKSPACE_DIR = path.join(__dirname, '..', '0_workspace_expositions');
export const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'expositions.generated.ts');
const CHAMPS_FILE = path.join(CATALOG, 'fields', 'exposition.fields.json');
const MUSEES_FILE = path.join(CATALOG, 'registres', 'musees.json');
const VOCAB_DIR = path.join(CATALOG, 'vocabularies');

export function lireJson(chemin, description) {
  if (!fs.existsSync(chemin)) throw new Error(`${description} introuvable : ${chemin}`);
  return JSON.parse(fs.readFileSync(chemin, 'utf-8'));
}

/** Charge les champs, le registre des musées et les vocabulaires référencés. */
export function chargerContexte() {
  const champs = lireJson(CHAMPS_FILE, 'Fichier de champs').champs;
  const musees = lireJson(MUSEES_FILE, 'Registre des musées');
  const vocabulaires = {};
  for (const champ of champs) {
    if (champ.vocabulaire && !vocabulaires[champ.vocabulaire]) {
      vocabulaires[champ.vocabulaire] = lireJson(
        path.join(VOCAB_DIR, `${champ.vocabulaire}.json`),
        `Vocabulaire "${champ.vocabulaire}"`,
      );
    }
  }
  return { champs, ctx: { musees, vocabulaires } };
}

export function estDateISO(valeur) {
  if (typeof valeur !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const [a, m, j] = valeur.split('-').map(Number);
  const date = new Date(a, m - 1, j);
  return date.getFullYear() === a && date.getMonth() === m - 1 && date.getDate() === j;
}

export const estVide = (v) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

function verifierUrl(valeur) {
  if (typeof valeur !== 'string' || !/^https:\/\/\S+$/.test(valeur)) {
    return 'adresse https:// attendue';
  }
  if (valeur.includes('&amp;')) {
    return 'contient "&amp;" (entité HTML non décodée) : remplacer par "&"';
  }
  try {
    new URL(valeur);
  } catch {
    return 'adresse illisible';
  }
  return null;
}

/** Retourne un message d'erreur, ou null si la valeur est correcte pour ce champ. */
function verifierValeur(champ, valeur, fiche, ctx) {
  switch (champ.type) {
    case 'texte':
      return typeof valeur === 'string' ? null : 'texte attendu';
    case 'slug':
      return typeof valeur === 'string' && /^[a-z0-9-]+$/.test(valeur)
        ? null
        : 'uniquement a-z, 0-9 et des tirets';
    case 'date':
      return estDateISO(valeur)
        ? null
        : `date AAAA-MM-JJ valide attendue (reçu : ${JSON.stringify(valeur)})`;
    case 'url':
      return verifierUrl(valeur);
    case 'url_musee': {
      const probleme = verifierUrl(valeur);
      if (probleme) return probleme;
      const musee = ctx.musees.find((m) => m.id === fiche.museeId);
      if (!musee) return null; // le musée inconnu est signalé sur "museeId"
      const hote = new URL(valeur).hostname;
      return hote === musee.domaine || hote.endsWith('.' + musee.domaine)
        ? null
        : `l'adresse doit être sur le site du musée (${musee.domaine}), reçu : ${hote}`;
    }
    case 'reference':
      return ctx.musees.some((m) => m.id === valeur)
        ? null
        : `musée inconnu : "${valeur}" (voir registres/musees.json)`;
    case 'vocabulaire':
      return (ctx.vocabulaires[champ.vocabulaire] ?? []).includes(valeur)
        ? null
        : `"${valeur}" absent du vocabulaire ${champ.vocabulaire}`;
    case 'vocabulaire_liste': {
      if (!Array.isArray(valeur)) return 'liste attendue';
      const liste = ctx.vocabulaires[champ.vocabulaire] ?? [];
      const inconnus = valeur.filter((v) => !liste.includes(v));
      return inconnus.length > 0
        ? `valeur(s) absente(s) du vocabulaire ${champ.vocabulaire} : ${inconnus.join(', ')}`
        : null;
    }
    case 'liste_texte':
      return Array.isArray(valeur) && valeur.every((v) => typeof v === 'string' && v.trim() !== '')
        ? null
        : 'liste de textes non vides attendue';
    default:
      return `type de champ inconnu dans exposition.fields.json : ${champ.type}`;
  }
}

/** Liste des problèmes d'une fiche (tableau vide = fiche valide). */
export function validerFiche(fiche, champs, ctx) {
  const erreurs = [];
  const connus = new Set(champs.map((c) => c.nom));
  for (const cle of Object.keys(fiche)) {
    if (!connus.has(cle)) erreurs.push(`champ inconnu : "${cle}" (faute de frappe ?)`);
  }
  for (const champ of champs) {
    const valeur = fiche[champ.nom];
    if (estVide(valeur)) {
      if (champ.obligatoire) erreurs.push(`champ obligatoire manquant ou vide : "${champ.nom}"`);
      continue;
    }
    const probleme = verifierValeur(champ, valeur, fiche, ctx);
    if (probleme) erreurs.push(`"${champ.nom}" : ${probleme}`);
  }
  if (estDateISO(fiche.dateDebut) && estDateISO(fiche.dateFin) && fiche.dateFin < fiche.dateDebut) {
    erreurs.push('"dateFin" est antérieure à "dateDebut"');
  }
  return erreurs;
}

/** Fiche -> objet Exposition de l'app, avec le lieu repris du registre des musées. */
export function versExposition(fiche, champs, ctx) {
  const musee = ctx.musees.find((m) => m.id === fiche.museeId);
  const resultat = {};
  for (const champ of champs) {
    const valeur = fiche[champ.nom];
    if (champ.type === 'liste_texte' || champ.type === 'vocabulaire_liste') {
      resultat[champ.nom] = estVide(valeur) ? [] : valeur;
    } else if (!estVide(valeur)) {
      resultat[champ.nom] = valeur;
    }
  }
  resultat.lieu = musee.nom;
  resultat.ville = musee.ville;
  resultat.pays = musee.pays;
  if (musee.adresse) resultat.adresse = musee.adresse;
  return resultat;
}