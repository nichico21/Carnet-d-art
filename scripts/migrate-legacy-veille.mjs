#!/usr/bin/env node
/**
 * Migration unique : reprend les 5 contenus déjà repérés dans l'ancien
 * src/data/veille.ts et les place dans scripts/output/veille-brutes.json
 * (fusionné avec ce qui existe déjà), prêts pour generate-fiches-veille.mjs.
 * L'imageUrl est laissée à null ici — le fetch-veille.mjs pourra la
 * compléter séparément en relançant recupererVignette sur ces mêmes URLs,
 * ou tu la renseignes à la main dans la fiche une fois en 0_workspace.
 *
 * Usage : node scripts/migrate-legacy-veille.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, 'output', 'veille-brutes.json');

const CONTENUS_LEGACY = [
  { id: 'brancusi-metamorphoses', titre: 'Brancusi : les métamorphoses de la sculpture', type: 'documentaire', source: 'Arte', url: 'https://www.arte.tv/fr/videos/115033-000-A/brancusi-les-metamorphoses-de-la-sculpture/', duree: '52 min' },
  { id: 'vallotton-couleurs-desir', titre: 'Félix Vallotton, les couleurs du désir', type: 'documentaire', source: 'Arte', url: 'https://www.arte.tv/fr/videos/116820-000-A/felix-vallotton-les-couleurs-du-desir/', duree: '52 min' },
  { id: 'visages-de-satan', titre: "Révolté, affreux, séduisant... Les visages de Satan illustrés en 8 œuvres d'art", type: 'article', source: 'Historia', url: 'https://www.historia.fr/guide-culture-loisirs/expositions-sorties/revolte-affreux-seduisant-les-visages-de-satan-illustres-en-8-oeuvres-dart-2251646', duree: '7 min' },
  { id: 'louvre-genie-xviie', titre: 'Paris cet automne : le Musée du Louvre dévoile une exposition exceptionnelle consacrée à un génie de la peinture du XVIIe siècle', type: 'article', source: 'Connaissance des Arts', url: 'https://www.connaissancedesarts.com/arts-expositions/paris-cet-automne-le-musee-du-louvre-devoile-une-exposition-exceptionnelle-consacree-a-un-genie-de-la-peinture-du-xviie-siecle-11214699/', duree: '6 min' },
  { id: 'monet-femmes-au-jardin-article', titre: '« Femmes au jardin » de Claude Monet : l\'impressionnisme en éclosion', type: 'article', source: 'Beaux Arts', url: 'https://www.beauxarts.com/grand-format/femmes-au-jardin-de-monet-limpressionnisme-en-eclosion/', duree: '8 min' },
];

function main() {
  let existants = [];
  if (fs.existsSync(OUTPUT_FILE)) {
    existants = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  }
  const idsExistants = new Set(existants.map((c) => c.id));

  const aAjouter = CONTENUS_LEGACY
    .filter((c) => !idsExistants.has(c.id))
    .map((c) => ({ ...c, imageUrl: null, datePublication: null }));

  const fusion = [...existants, ...aAjouter];
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fusion, null, 2), 'utf-8');

  console.log(`${aAjouter.length} contenu(s) legacy ajouté(s).`);
  console.log(`${CONTENUS_LEGACY.length - aAjouter.length} déjà présent(s), ignoré(s).`);
  console.log('Rappel : imageUrl reste à null pour ces 5 — à compléter (voir message).');
}

main();