#!/usr/bin/env node
/**
 * Migration UNIQUE (à lancer une seule fois) : reprend les 28 œuvres
 * curées à la main dans l'ancien src/data/artworks.ts et les écrit comme
 * fiches VALIDÉES dans scripts/catalog/artworks/ — au format de notre
 * catalogue commun. Les identifiants d'origine sont conservés à l'identique
 * (ex. "vangogh-nuit-etoilee"), donc data/accueil.ts continue de fonctionner
 * sans modification.
 *
 * Ne supprime PAS src/data/artworks.ts — à faire toi-même une fois que tu
 * as vérifié que ces fiches sont bien apparues dans scripts/catalog/artworks/.
 *
 * Usage : node scripts/migrate-legacy-artworks.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTWORKS_DIR = path.join(__dirname, 'catalog', 'artworks');

// Correspondance entre l'ancien enum Theme (singulier) et notre vocabulaire "themes" (pluriel)
const THEME_VERS_THEMES = {
  portrait: ['Portrait'],
  nature_morte: ['Natures mortes et vanités'],
  paysage: ['Paysage'],
  scene_historique: ['Scène historique'],
  scene_religieuse: ['Scène religieuse'],
  mythologie: ['Mythologie'],
  scene_de_genre: ['Scène de vie quotidienne'],
  abstrait: ['Abstraction'],
  architecture: ['Architecture'],
  animalier: ["Animaux dans l'art"],
  marine: ['Marine'],
};

// Les 28 œuvres, reprises telles quelles depuis l'ancien src/data/artworks.ts
const OEUVRES_LEGACY = [
  { id: 'vangogh-nuit-etoilee', titre: 'La Nuit étoilée', artiste: 'Vincent van Gogh', annee: '1889', image: null, technique: 'Huile sur toile', lieuConservation: 'MoMA', ville: 'New York', pays: 'États-Unis', mouvements: ['Post-impressionnisme'], theme: 'paysage', description: "Peinte en juin 1889 depuis sa chambre à l'asile Saint-Paul-de-Mausole à Saint-Rémy-de-Provence, cette toile transforme un ciel nocturne banal en tourbillon cosmique. Van Gogh y superpose observation directe et mémoire, entre le village endormi et les tourbillons d'étoiles qui dominent la composition." },
  { id: 'vermeer-jeune-fille-perle', titre: 'La Jeune Fille à la perle', artiste: 'Johannes Vermeer', annee: '1665', image: null, technique: 'Huile sur toile', lieuConservation: 'Mauritshuis', ville: 'La Haye', pays: 'Pays-Bas', mouvements: ['Baroque'], theme: 'portrait', description: "Surnommée la \"Joconde du Nord\", cette tronie doit son intensité au regard direct du modèle et à l'éclat de la perle, obtenu par une simple touche de blanc. Son identité reste inconnue à ce jour." },
  { id: 'monet-nympheas', titre: 'Les Nymphéas', artiste: 'Claude Monet', annee: '1906', image: null, technique: 'Huile sur toile', lieuConservation: "Musée de l'Orangerie", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'paysage', description: "Monet cherche ici à capturer l'instant et à effacer les frontières entre l'eau et le ciel. Peinte dans son jardin de Giverny, cette toile fait partie d'une série de près de 250 œuvres qu'il a consacrée à ce même bassin pendant plus de trente ans." },
  { id: 'klimt-baiser', titre: 'Le Baiser', artiste: 'Gustav Klimt', annee: '1907-1908', image: null, technique: "Huile et feuille d'or sur toile", lieuConservation: 'Belvédère', ville: 'Vienne', pays: 'Autriche', mouvements: ['Art nouveau', 'Symbolisme'], theme: 'scene_de_genre', description: "Chef-d'œuvre de la \"période dorée\" de Klimt, cette toile fusionne les deux amants dans un unique manteau d'or orné de motifs géométriques. L'œuvre est devenue l'un des symboles les plus reproduits de l'Art nouveau viennois." },
  { id: 'vallotton-nuit-effet-lune', titre: 'La Nuit, effet de lune', artiste: 'Félix Vallotton', annee: '1895', image: null, technique: 'Huile sur carton', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Nabis'], theme: 'paysage', description: "Peinte en 1895 lors d'un séjour en Normandie, cette œuvre illustre la maîtrise de Vallotton dans le rendu des atmosphères nocturnes. Le clair de lune y découpe les silhouettes en aplats sombres, proches de son travail de graveur." },
  { id: 'hopper-room-new-york', titre: 'Room in New York', artiste: 'Edward Hopper', annee: '1932', image: null, technique: 'Huile sur toile', lieuConservation: 'Sheldon Museum of Art', ville: 'Lincoln', pays: 'États-Unis', mouvements: ['Réalisme américain'], theme: 'scene_de_genre', description: "Vu comme depuis la rue à travers une fenêtre éclairée, ce couple silencieux incarne l'incommunicabilité chère à Hopper. La composition, presque cinématographique, invite le spectateur dans le rôle du voyeur urbain." },
  { id: 'signac-baie-saint-tropez', titre: 'La baie de Saint-Tropez', artiste: 'Paul Signac', annee: '1895', image: null, technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Néo-impressionnisme', 'Pointillisme'], theme: 'marine', description: "Peinte lors de son installation à Saint-Tropez, cette toile applique la technique divisionniste : la couleur y est posée par petites touches juxtaposées plutôt que mélangées, pour une vibration lumineuse propre au pointillisme." },
  { id: 'klimt-portrait-ada', titre: "Portrait d'Ada", artiste: 'Gustav Klimt', annee: '1907', image: null, technique: "Huile et feuille d'or sur toile", lieuConservation: 'Belvédère', ville: 'Vienne', pays: 'Autriche', mouvements: ['Art nouveau', 'Symbolisme'], theme: 'portrait', description: "Comme dans Le Baiser, Klimt enveloppe son modèle d'un halo doré orné de motifs symboliques, effaçant la frontière entre portrait et ornement." },
  { id: 'vangogh-champs-ble-auvers', titre: 'Champs de blé à Auvers', artiste: 'Vincent van Gogh', annee: '1890', image: null, technique: 'Huile sur toile', lieuConservation: 'Van Gogh Museum', ville: 'Amsterdam', pays: 'Pays-Bas', mouvements: ['Post-impressionnisme'], theme: 'paysage', description: "Peinte dans les dernières semaines de sa vie à Auvers-sur-Oise, cette toile aux touches tourmentées et au ciel instable est souvent lue comme un écho de la détresse de Van Gogh à cette période." },
  { id: 'manet-dejeuner-sur-herbe', titre: "Le Déjeuner sur l'herbe", artiste: 'Édouard Manet', annee: '1863', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edouard%20Manet%20-%20Luncheon%20on%20the%20Grass%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_de_genre', description: "Refusé au Salon officiel de 1863 puis exposé au Salon des refusés, ce tableau scandalise par la nudité crue d'une femme attablée avec deux hommes habillés, sans justification mythologique ou historique." },
  { id: 'renoir-bal-moulin-galette', titre: 'Bal du moulin de la Galette', artiste: 'Auguste Renoir', annee: '1876', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Renoir%2C%20Pierre-Auguste%20-%20Dance%20at%20Le%20Moulin%20de%20la%20Galette%2C%201876.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'scene_de_genre', description: "Peint sur le vif à Montmartre, ce grand tableau restitue la lumière tachetée d'un bal populaire du dimanche après-midi, entre danse, discussion et flânerie." },
  { id: 'manet-olympia', titre: 'Olympia', artiste: 'Édouard Manet', annee: '1863', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edouard%20Manet%20-%20Olympia%20-%20Google%20Art%20Project%203.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'portrait', description: "Le regard frontal et assuré d'Olympia, courtisane clairement identifiable comme telle par ses attributs, provoqua un scandale retentissant au Salon de 1865." },
  { id: 'vangogh-eglise-auvers', titre: "L'Église d'Auvers-sur-Oise", artiste: 'Vincent van Gogh', annee: '1890', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vincent%20van%20Gogh%20-%20The%20Church%20in%20Auvers-sur-Oise%2C%20View%20from%20the%20Chevet%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Post-impressionnisme'], theme: 'architecture', description: "Peinte quelques semaines avant sa mort, cette église aux formes distordues sous un ciel bleu intense illustre la tension entre observation directe et vision intérieure chez Van Gogh." },
  { id: 'courbet-enterrement-ornans', titre: 'Un enterrement à Ornans', artiste: 'Gustave Courbet', annee: '1850', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gustave%20Courbet%20-%20A%20Burial%20at%20Ornans%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_historique', description: "Format monumental jusque-là réservé à la peinture d'histoire, appliqué ici à l'enterrement d'un anonyme dans une petite ville de province : Courbet impose le réalisme comme sujet noble." },
  { id: 'bouguereau-naissance-venus', titre: 'La Naissance de Vénus', artiste: 'William Bouguereau', annee: '1879', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/William-Adolphe%20Bouguereau%20%281825-1905%29%20-%20The%20Birth%20of%20Venus%20%281879%29.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Académisme'], theme: 'mythologie', description: "Exemple emblématique de la peinture académique du Salon, cette Vénus au canon de beauté lisse et idéalisé s'oppose frontalement au réalisme naissant de peintres comme Courbet ou Manet." },
  { id: 'whistler-arrangement-gris-noir', titre: 'Arrangement en gris et noir n°1', artiste: 'James Abbott McNeill Whistler', annee: '1871', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Whistlers%20Mother%20high%20res.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'portrait', description: "Connu populairement comme « le portrait de la mère de Whistler », ce tableau fut d'abord conçu par son auteur comme une étude formelle d'harmonie entre gris et noirs plutôt que comme un portrait sentimental." },
  { id: 'courbet-atelier-peintre', titre: "L'Atelier du peintre", artiste: 'Gustave Courbet', annee: '1855', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Courbet%20LAtelier%20du%20peintre.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_de_genre', description: "Sous-titrée \"Allégorie réelle\", cette toile monumentale met en scène Courbet peignant, entouré de figures représentant les forces sociales et intellectuelles de son époque." },
  { id: 'degas-absinthe', titre: "L'Absinthe", artiste: 'Edgar Degas', annee: '1875', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edgar%20Degas%20-%20In%20a%20Caf%C3%A9%20-%20Google%20Art%20Project%202.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'scene_de_genre', description: "Deux silhouettes attablées au café, le regard vide : Degas capte l'isolement urbain avec une composition volontairement déséquilibrée, presque photographique." },
  { id: 'ingres-la-source', titre: 'La Source', artiste: 'Jean-Auguste-Dominique Ingres', annee: '1856', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jean%20Auguste%20Dominique%20Ingres%20-%20The%20Spring%20-%20Google%20Art%20Project%202.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Néoclassicisme'], theme: 'mythologie', description: "Allégorie de la source personnifiée par une jeune femme nue portant une cruche, cette toile incarne l'idéal de pureté formelle défendu par Ingres jusqu'à la fin de sa vie." },
  { id: 'manet-balcon', titre: 'Le Balcon', artiste: 'Édouard Manet', annee: '1868', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edouard%20Manet%20-%20The%20Balcony%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_de_genre', description: "Inspiré des balcons de Goya, ce groupe de trois figures aux regards divergents, dont la peintre Berthe Morisot, dégage une étrangeté que Manet ne cherche pas à résoudre." },
  { id: 'millet-glaneuses', titre: 'Des glaneuses', artiste: 'Jean-François Millet', annee: '1857', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jean-Fran%C3%A7ois%20Millet%20-%20Des%20glaneuses.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_de_genre', description: "Trois glaneuses courbées ramassent les épis oubliés après la moisson : Millet dignifie le travail paysan le plus humble à une échelle jusque-là réservée aux grands sujets." },
  { id: 'renoir-balancoire', titre: 'La Balançoire', artiste: 'Auguste Renoir', annee: '1876', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Swing-Renoir.jpeg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'scene_de_genre', description: "Les taches de lumière bleutées qui criblent les vêtements et le sol traduisent l'intérêt de Renoir pour l'effet du soleil filtré par le feuillage sur une scène de loisir ordinaire." },
  { id: 'vangogh-portrait-artiste', titre: "Portrait de l'artiste", artiste: 'Vincent van Gogh', annee: '1889', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Vincent%20van%20Gogh%20-%20Self-Portrait%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Post-impressionnisme'], theme: 'portrait', description: "L'un des derniers autoportraits de Van Gogh, peint peu après son internement à Saint-Rémy-de-Provence : le fond en tourbillons bleus fait écho à son état intérieur." },
  { id: 'monet-femmes-au-jardin', titre: 'Femmes au jardin', artiste: 'Claude Monet', annee: '1866', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude%20Monet%20024.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'scene_de_genre', description: "Peint en grande partie en extérieur sur une toile immense creusée dans le sol pour atteindre le haut de la composition, ce tableau annonce déjà les recherches de Monet sur la lumière naturelle." },
  { id: 'manet-emile-zola', titre: 'Émile Zola', artiste: 'Édouard Manet', annee: '1868', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edouard%20Manet%20049.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'portrait', description: "Manet peint l'écrivain qui prit publiquement sa défense face aux critiques, entouré d'objets qui évoquent leurs goûts communs : estampe japonaise, gravure d'après Vélasquez et de l'Olympia elle-même." },
  { id: 'degas-classe-danse', titre: 'La Classe de danse', artiste: 'Edgar Degas', annee: '1871', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Edgar%20Degas%20-%20The%20Ballet%20Class%20-%20Google%20Art%20Project.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Impressionnisme'], theme: 'scene_de_genre', description: "Fasciné par le mouvement et les cadrages inhabituels, Degas saisit ici l'envers du décor de l'Opéra : l'attente, l'échauffement et la discipline qui précèdent la grâce du spectacle." },
  { id: 'millet-angelus', titre: "L'Angélus", artiste: 'Jean-François Millet', annee: '1857', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/JEAN-FRAN%C3%87OIS%20MILLET%20-%20El%20%C3%81ngelus%20%28Museo%20de%20Orsay%2C%201857-1859.%20%C3%93leo%20sobre%20lienzo%2C%2055.5%20x%2066%20cm%29.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'scene_religieuse', description: "Deux paysans interrompent leur travail dans les champs pour réciter l'Angélus à la sonnerie du soir : Millet transforme un geste de dévotion simple en scène silencieuse et monumentale." },
  { id: 'courbet-origine-du-monde', titre: "L'Origine du monde", artiste: 'Gustave Courbet', annee: '1866', image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Origin-of-the-World.jpg', technique: 'Huile sur toile', lieuConservation: "Musée d'Orsay", ville: 'Paris', pays: 'France', mouvements: ['Réalisme'], theme: 'portrait', description: "Ce cadrage frontal et sans détour sur un corps féminin nu, peint pour un commanditaire privé, resta caché du public pendant plus d'un siècle avant d'entrer dans les collections nationales en 1995." },
];

function convertir(oeuvre) {
  const themes = THEME_VERS_THEMES[oeuvre.theme] ?? [];
  return {
    id: oeuvre.id,
    titre: oeuvre.titre,
    artiste: oeuvre.artiste,
    annee: oeuvre.annee,
    image: oeuvre.image, // certaines œuvres n'avaient pas d'image dans l'ancien fichier : reste null, à compléter
    technique: oeuvre.technique,
    lieuConservation: oeuvre.lieuConservation,
    ville: oeuvre.ville,
    pays: oeuvre.pays,
    localisationSuspecte: false,
    contenuSensible: oeuvre.id === 'courbet-origine-du-monde',
    mouvement: oeuvre.mouvements[0], // notre schéma n'accepte qu'un mouvement principal
    themes,
    description_formelle: oeuvre.description,
    contexte_creation: null,
    anecdote: null,
    pourquoi_ca_compte: null,
    statut: 'valide', // déjà curées à la main, considérées comme fiables
  };
}

function main() {
  fs.mkdirSync(ARTWORKS_DIR, { recursive: true });
  let ecrites = 0;
  let ignorees = 0;

  for (const oeuvre of OEUVRES_LEGACY) {
    const chemin = path.join(ARTWORKS_DIR, `${oeuvre.id}.json`);
    if (fs.existsSync(chemin)) {
      ignorees += 1;
      continue; // ne jamais écraser une fiche déjà migrée ou déjà collectée sous le même id
    }
    fs.writeFileSync(chemin, JSON.stringify(convertir(oeuvre), null, 2), 'utf-8');
    ecrites += 1;
  }

  console.log(`${ecrites} fiche(s) legacy écrite(s) dans scripts/catalog/artworks/`);
  console.log(`${ignorees} déjà présente(s), ignorée(s)`);
  console.log('\nVérifie le résultat avant de supprimer src/data/artworks.ts.');
}

main();