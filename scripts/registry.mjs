import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = path.join(__dirname, 'output', 'registry.json');

/** Charge le registre existant ({ [qid]: [wikidataId, ...] }) ou en crée un vide. */
export function chargerRegistre() {
  if (!fs.existsSync(REGISTRY_PATH)) return {};
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

/** Ajoute les identifiants nouvellement retenus au registre d'un musée, et sauvegarde. */
export function enregistrer(registre, museumQid, wikidataIds) {
  const existants = new Set(registre[museumQid] ?? []);
  for (const id of wikidataIds) existants.add(id);
  registre[museumQid] = Array.from(existants);
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registre, null, 2), 'utf-8');
  return registre;
}