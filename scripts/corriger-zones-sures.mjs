#!/usr/bin/env node
/**
 * Corrige l'affichage sous la barre d'état d'Android (heure, batterie) dans tous les écrans.
 *
 * Le SafeAreaView de 'react-native' ne protège rien sur Android ; celui de
 * 'react-native-safe-area-context' (déjà installé, déjà utilisé par App.tsx) le fait.
 * Pour chaque fichier .tsx concerné, le script :
 *   1. retire SafeAreaView de l'import 'react-native' et l'importe depuis la bonne bibliothèque ;
 *   2. ajoute edges={['top']} aux balises <SafeAreaView> : seul le haut est protégé, le bas est déjà
 *      géré par la barre d'onglets.
 *
 *   node scripts/corriger-zones-sures.mjs            simulation : liste ce qui serait modifié
 *   node scripts/corriger-zones-sures.mjs --ecrire   applique les modifications
 *   --src <dossier>                                  dossier à parcourir (par défaut : src)
 *
 * Un fichier déjà corrigé est ignoré : on peut relancer sans risque.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMPORT_RN = /import\s*\{([^}]*)\}\s*from\s*(['"])react-native\2\s*;?/;
const IMPORT_LIB = /import\s*\{([^}]*)\}\s*from\s*(['"])react-native-safe-area-context\2\s*;?/;
const BALISE = /<SafeAreaView(?![A-Za-z0-9_])/g;

const noms = (liste) => liste.split(',').map((n) => n.trim()).filter(Boolean);

/**
 * Retourne { texte, importCorrige, balises, ignore } : le texte corrigé, ou la raison pour laquelle
 * le fichier est laissé tel quel.
 */
export function corrigerFichier(texte) {
  if (!/\bSafeAreaView\b/.test(texte)) return { texte, importCorrige: false, balises: 0, ignore: 'pas de SafeAreaView' };
  const rn = IMPORT_RN.exec(texte);
  const lib = IMPORT_LIB.exec(texte);
  const dejaDeLaBonneSource = lib !== null && noms(lib[1]).includes('SafeAreaView');
  if (dejaDeLaBonneSource) return { texte, importCorrige: false, balises: 0, ignore: 'déjà corrigé' };
  if (rn === null || !noms(rn[1]).includes('SafeAreaView')) return { texte, importCorrige: false, balises: 0, ignore: "SafeAreaView ne vient pas de 'react-native'" };

  let resultat = texte;
  // 2. les balises : seul le haut de l'écran est protégé (sauf si le fichier précise déjà ses bords)
  let balises = 0;
  if (!/\bedges\s*=/.test(resultat)) {
    resultat = resultat.replace(BALISE, () => {
      balises += 1;
      return "<SafeAreaView edges={['top']}";
    });
  }
  // 1. les imports (on repart de l'import 'react-native' du texte déjà modifié)
  const restants = noms(rn[1]).filter((n) => n !== 'SafeAreaView');
  const importRn = restants.length > 0 ? `import { ${restants.join(', ')} } from 'react-native';` : null;
  if (lib !== null) {
    const complete = `import { ${[...noms(lib[1]), 'SafeAreaView'].join(', ')} } from 'react-native-safe-area-context';`;
    resultat = resultat.replace(lib[0], () => complete);
    resultat = resultat.replace(rn[0], () => importRn ?? '').replace(/^\n/, '');
  } else {
    const nouveau = `${importRn ? `${importRn}\n` : ''}import { SafeAreaView } from 'react-native-safe-area-context';`;
    resultat = resultat.replace(rn[0], () => nouveau);
  }
  return { texte: resultat, importCorrige: true, balises, ignore: null };
}

function fichiersTsx(dossier) {
  const liste = [];
  for (const nom of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (nom.name === 'node_modules' || nom.name.startsWith('.')) continue;
    const chemin = path.join(dossier, nom.name);
    if (nom.isDirectory()) liste.push(...fichiersTsx(chemin));
    else if (nom.name.endsWith('.tsx')) liste.push(chemin);
  }
  return liste.sort();
}

function main() {
  const args = process.argv.slice(2);
  const ecrire = args.includes('--ecrire');
  const i = args.indexOf('--src');
  const src = i >= 0 ? args[i + 1] : 'src';
  if (!src || !fs.existsSync(src)) {
    console.error(`Dossier introuvable : ${src}. Lance la commande depuis la racine du projet.`);
    process.exit(1);
  }
  let corriges = 0;
  for (const chemin of fichiersTsx(src)) {
    const original = fs.readFileSync(chemin, 'utf-8');
    const r = corrigerFichier(original);
    if (r.ignore === null) {
      corriges += 1;
      console.log(`${(ecrire ? '✓ corrigé' : '→ à corriger').padEnd(12)}  ${chemin}  (${r.balises} balise${r.balises > 1 ? 's' : ''})`);
      if (r.balises === 0) console.log('    ⚠ aucune balise <SafeAreaView> trouvée ou edges déjà présent : vérifie ce fichier');
      if (r.balises > 1) console.log(`    ⚠ ${r.balises} usages de <SafeAreaView> : regarde si l'écran n'a pas de vide en trop en haut`);
      if (ecrire) fs.writeFileSync(chemin, r.texte, 'utf-8');
    } else if (r.ignore !== 'pas de SafeAreaView') {
      console.log(`  ignoré       ${chemin}  (${r.ignore})`);
    }
  }
  console.log(`\n${corriges} fichier(s) ${ecrire ? 'corrigé(s)' : 'à corriger'}.`);
  if (!ecrire && corriges > 0) console.log('Rien n\'a été modifié : relance avec --ecrire pour appliquer.');
  if (ecrire && corriges > 0) console.log('Étape suivante : npx tsc --noEmit puis eas update.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
