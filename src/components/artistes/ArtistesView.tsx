import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artiste } from '../../types/artiste';
import { Artwork } from '../../types/artwork';
import { FacetteValeur } from '../../data/artworks.generated';
import { DegradeSombre } from './DegradeSombre';
import { PortraitArtiste } from './PortraitArtiste';
import {
  artistesALaUne,
  artistesIncontournables,
  artistesSansFiche,
  CritereTri,
  facettes,
  filtrerArtistes,
  FILTRES_VIDES,
  FiltresArtistes,
  groupesParEpoque,
  indexerOeuvres,
  libelleDates,
  libelleDiscipline,
  LIBELLES_TRI,
  nombreFiltresActifs,
  normaliserTexte,
  oeuvreDeRepli,
} from '../../artistes/artistes';
import { largeurVignette } from '../../musees/musees';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  /** Fiches artistes publiées (ARTISTES). */
  artistes: Artiste[];
  artworks: Artwork[];
  /** Artistes du catalogue d'œuvres (FACETTES.artistes), pour ceux qui n'ont pas encore de fiche. */
  facettesArtistes: FacetteValeur[];
  onOuvrirArtiste: (artiste: Artiste) => void;
  /** Un artiste du catalogue sans fiche : on affiche ses œuvres, comme avant. */
  onSelectArtisteCatalogue: (nom: string) => void;
}

const MARGE = 20;
const ECART = 12;
const LARGEUR_INCONTOURNABLE = 118;
const HAUTEUR_INCONTOURNABLE = 156;
const LARGEUR_EPOQUE = 156;
const HAUTEUR_EPOQUE = 112;
const HAUTEUR_BANNIERE = 200;
const MAX_EPOQUES = 10;
const MAX_INCONTOURNABLES = 8;
const MAX_AUTRES = 80;
const MAX_AUTRES_RECHERCHE = 20;

type NomFeuille = 'epoque' | 'mouvement' | 'pays' | 'tri';

type IconeNom = React.ComponentProps<typeof Ionicons>['name'];

interface Choix {
  valeur: string;
  libelle: string;
  detail?: string;
}

// ------------------------------------------------------------------ petits composants

interface CarteProps {
  artiste: Artiste;
  oeuvre?: Artwork;
  largeur: number;
  hauteur: number;
  compact?: boolean;
  favori: boolean;
  onPress: () => void;
  onToggleFavori: () => void;
}

/** Carte portrait : la photo de l'artiste, son nom et ses dates en bas, un cœur en haut à droite. */
function CarteArtiste({ artiste, oeuvre, largeur, hauteur, compact, favori, onPress, onToggleFavori }: CarteProps) {
  const dates = libelleDates(artiste);
  return (
    <Pressable style={[styles.carte, { width: largeur, height: hauteur }]} onPress={onPress}>
      <PortraitArtiste nom={artiste.nom} imageUrl={artiste.imageUrl} oeuvre={oeuvre} width={compact ? 400 : 700} />
      <DegradeSombre hauteur={Math.round(hauteur * 0.55)} />
      <Pressable style={[styles.coeur, compact ? styles.coeurCompact : null]} onPress={onToggleFavori} hitSlop={8}>
        <Ionicons name={favori ? 'heart' : 'heart-outline'} size={compact ? 14 : 17} color={favori ? colors.accent : colors.textPrimary} />
      </Pressable>
      <View style={styles.carteTexte}>
        <Text style={compact ? styles.carteNomCompact : styles.carteNom} numberOfLines={2}>
          {artiste.nom}
        </Text>
        {dates ? <Text style={styles.carteDates}>{dates}</Text> : null}
      </View>
    </Pressable>
  );
}

function Pastille({ libelle, actif, icone, onPress }: { libelle: string; actif: boolean; icone?: IconeNom; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pastille, actif ? styles.pastilleActive : null]}>
      {icone ? <Ionicons name={icone} size={14} color={actif ? colors.surface : colors.textPrimary} /> : null}
      <Text style={[styles.pastilleTexte, actif ? styles.pastilleTexteActive : null]}>{libelle}</Text>
    </Pressable>
  );
}

function PuceFiltre({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.puce, actif ? styles.puceActive : null]}>
      <Text style={[styles.puceTexte, actif ? styles.puceTexteActive : null]} numberOfLines={1}>
        {libelle}
      </Text>
      <Ionicons name="chevron-down" size={14} color={actif ? colors.accent : colors.textSecondary} />
    </Pressable>
  );
}

interface FeuilleProps {
  visible: boolean;
  titre: string;
  choix: Choix[];
  actif: string | null;
  /** Montre la ligne qui retire le filtre (inutile pour le tri). */
  avecToutes: boolean;
  onChoisir: (valeur: string | null) => void;
  onFermer: () => void;
}

/** Fenêtre qui monte du bas : une liste de choix, avec une coche sur le choix actif. */
function FeuilleChoix({ visible, titre, choix, actif, avecToutes, onChoisir, onFermer }: FeuilleProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <View style={styles.voile}>
        <Pressable style={styles.voileFond} onPress={onFermer} />
        <View style={styles.feuille}>
          <View style={styles.feuilleEntete}>
            <Text style={styles.feuilleTitre}>{titre}</Text>
            <Pressable onPress={onFermer} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {avecToutes ? (
              <Pressable style={styles.choix} onPress={() => onChoisir(null)}>
                <Text style={[styles.choixTexte, actif === null ? styles.choixTexteActif : null]}>Tous</Text>
                {actif === null ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
              </Pressable>
            ) : null}
            {choix.map((c) => (
              <Pressable key={c.valeur} style={styles.choix} onPress={() => onChoisir(c.valeur)}>
                <Text style={[styles.choixTexte, actif === c.valeur ? styles.choixTexteActif : null]}>{c.libelle}</Text>
                {c.detail ? <Text style={styles.choixDetail}>{c.detail}</Text> : null}
                {actif === c.valeur ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ------------------------------------------------------------------ la vue

export function ArtistesView({ artistes, artworks, facettesArtistes, onOuvrirArtiste, onSelectArtisteCatalogue }: Props) {
  const { width: largeurEcran } = useWindowDimensions();
  const { artistesFavoris, toggleArtisteFavori } = useCarnet();
  const [filtres, setFiltres] = useState<FiltresArtistes>(FILTRES_VIDES);
  const [voirTout, setVoirTout] = useState(false);
  const [soloFavoris, setSoloFavoris] = useState(false);
  const [feuille, setFeuille] = useState<NomFeuille | null>(null);
  const [autresOuverts, setAutresOuverts] = useState(artistes.length === 0);
  const [pageBanniere, setPageBanniere] = useState(0);

  const parId = useMemo(() => indexerOeuvres(artworks), [artworks]);
  const repli = useMemo(() => new Map(artistes.map((a) => [a.id, oeuvreDeRepli(a, parId)])), [artistes, parId]);
  const disciplines = useMemo(() => facettes(artistes, 'disciplines'), [artistes]);
  const aLaUne = useMemo(() => artistesALaUne(artistes, 5), [artistes]);
  const incontournables = useMemo(() => artistesIncontournables(artistes, MAX_INCONTOURNABLES), [artistes]);
  const periodes = useMemo(() => groupesParEpoque(artistes).slice(0, MAX_EPOQUES), [artistes]);
  const autres = useMemo(() => artistesSansFiche(facettesArtistes, artistes), [facettesArtistes, artistes]);

  const resultats = useMemo(() => {
    const filtres_ = filtrerArtistes(artistes, filtres);
    return soloFavoris ? filtres_.filter((a) => artistesFavoris[a.id] === true) : filtres_;
  }, [artistes, filtres, soloFavoris, artistesFavoris]);

  const recherche = filtres.recherche.trim();
  const enGrille = voirTout || soloFavoris || recherche !== '' || nombreFiltresActifs(filtres) > 0;
  const nombreFavoris = useMemo(() => artistes.filter((a) => artistesFavoris[a.id] === true).length, [artistes, artistesFavoris]);

  const largeurCarte = largeurVignette(largeurEcran, 2, MARGE, ECART);
  const hauteurCarte = Math.round(largeurCarte * 1.3);

  const changer = (partiel: Partial<FiltresArtistes>) => setFiltres((f) => ({ ...f, ...partiel }));
  const toutReinitialiser = () => {
    setFiltres(FILTRES_VIDES);
    setVoirTout(false);
    setSoloFavoris(false);
  };
  const ouvrirEpoque = (epoque: string) => {
    setFiltres({ ...FILTRES_VIDES, epoque, tri: 'naissance' });
    setVoirTout(true);
  };
  const voirTousLesArtistes = () => {
    setFiltres({ ...FILTRES_VIDES, tri: 'oeuvres' });
    setVoirTout(true);
  };

  const carte = (a: Artiste, largeur: number, hauteur: number, compact: boolean) => (
    <CarteArtiste
      key={a.id}
      artiste={a}
      oeuvre={repli.get(a.id)}
      largeur={largeur}
      hauteur={hauteur}
      compact={compact}
      favori={artistesFavoris[a.id] === true}
      onPress={() => onOuvrirArtiste(a)}
      onToggleFavori={() => toggleArtisteFavori(a.id)}
    />
  );

  // ---- barre de recherche et pastilles de disciplines (toujours visibles)

  const barre = (
    <View>
      <View style={styles.recherche}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.rechercheTexte}
          value={filtres.recherche}
          onChangeText={(t: string) => changer({ recherche: t })}
          placeholder="Rechercher un artiste"
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
        />
        {filtres.recherche !== '' ? (
          <Pressable onPress={() => changer({ recherche: '' })} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
      {artistes.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defilement} contentContainerStyle={styles.pastilles}>
          <Pastille libelle={`Tous (${artistes.length})`} actif={filtres.discipline === null && !soloFavoris} onPress={() => { changer({ discipline: null }); setSoloFavoris(false); }} />
          {disciplines.map((d) => (
            <Pastille key={d.valeur} libelle={libelleDiscipline(d.valeur)} actif={filtres.discipline === d.valeur} onPress={() => { changer({ discipline: filtres.discipline === d.valeur ? null : d.valeur }); setSoloFavoris(false); }} />
          ))}
          <Pastille libelle={nombreFavoris > 0 ? `Favoris (${nombreFavoris})` : 'Favoris'} icone="heart-outline" actif={soloFavoris} onPress={() => setSoloFavoris(!soloFavoris)} />
        </ScrollView>
      ) : null}
    </View>
  );

  // ---- accueil

  const banniere =
    aLaUne.length > 0 ? (
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.defilement}
          onMomentumScrollEnd={(e: { nativeEvent: { contentOffset: { x: number } } }) => setPageBanniere(Math.round(e.nativeEvent.contentOffset.x / largeurEcran))}
        >
          {aLaUne.map((a) => (
            <View key={a.id} style={{ width: largeurEcran, paddingHorizontal: MARGE }}>
              <Pressable style={styles.banniere} onPress={() => onOuvrirArtiste(a)}>
                <PortraitArtiste nom={a.nom} imageUrl={a.imageUrl} oeuvre={repli.get(a.id)} width={900} />
                <DegradeSombre hauteur={Math.round(HAUTEUR_BANNIERE * 0.7)} />
                <View style={styles.banniereTexte}>
                  <Text style={styles.banniereNom} numberOfLines={2}>{a.nom}</Text>
                  <Text style={styles.banniereAccroche} numberOfLines={2}>{a.accroche}</Text>
                  <View style={styles.banniereBouton}>
                    <Text style={styles.banniereBoutonTexte}>Découvrir</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        {aLaUne.length > 1 ? (
          <View style={styles.points}>
            {aLaUne.map((a, i) => (
              <View key={a.id} style={[styles.point, i === pageBanniere ? styles.pointActif : null]} />
            ))}
          </View>
        ) : null}
      </View>
    ) : null;

  const autresBloc =
    autres.length > 0 ? (
      <View style={styles.autres}>
        <Pressable style={styles.autresEntete} onPress={() => setAutresOuverts(!autresOuverts)}>
          <View style={styles.autresTitres}>
            <Text style={styles.sectionTitre}>Autres artistes du catalogue</Text>
            <Text style={styles.autresSousTitre}>
              {autres.length} {autres.length > 1 ? 'artistes' : 'artiste'} dont la fiche arrive bientôt
            </Text>
          </View>
          <Ionicons name={autresOuverts ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
        </Pressable>
        {autresOuverts
          ? autres.slice(0, MAX_AUTRES).map((f) => (
              <Pressable key={f.valeur} style={styles.autreLigne} onPress={() => onSelectArtisteCatalogue(f.valeur)}>
                <Text style={styles.autreNom} numberOfLines={1}>{f.valeur}</Text>
                <Text style={styles.autreNombre}>{f.nombre}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))
          : null}
      </View>
    ) : null;

  const accueil = (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.accueil}>
      {banniere}

      {incontournables.length > 0 ? (
        <View>
          <View style={styles.sectionEntete}>
            <Text style={styles.sectionTitre}>Artistes incontournables</Text>
            {artistes.length > incontournables.length ? (
              <Pressable onPress={voirTousLesArtistes} hitSlop={6}>
                <Text style={styles.lien}>Voir tout</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defilement} contentContainerStyle={styles.rangee}>
            {incontournables.map((a) => carte(a, LARGEUR_INCONTOURNABLE, HAUTEUR_INCONTOURNABLE, true))}
          </ScrollView>
        </View>
      ) : null}

      {periodes.length >= 2 ? (
        <View>
          <View style={styles.sectionEntete}>
            <Text style={styles.sectionTitre}>Explorer par période</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defilement} contentContainerStyle={styles.rangee}>
            {periodes.map((g) => (
              <Pressable key={g.epoque} style={[styles.epoque, { width: LARGEUR_EPOQUE, height: HAUTEUR_EPOQUE }]} onPress={() => ouvrirEpoque(g.epoque)}>
                <PortraitArtiste nom={g.artistes[0].nom} imageUrl={g.artistes[0].imageUrl} oeuvre={repli.get(g.artistes[0].id)} width={400} />
                <DegradeSombre hauteur={72} />
                <View style={styles.epoqueTexte}>
                  <Text style={styles.epoqueNom}>{g.epoque}</Text>
                  <Text style={styles.epoqueSous}>
                    {g.artistes.length} {g.artistes.length > 1 ? 'artistes' : 'artiste'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {artistes.length === 0 ? <Text style={styles.vide}>Les fiches d'artistes arrivent bientôt. En attendant, tous les artistes du catalogue restent accessibles ci-dessous.</Text> : null}

      {autresBloc}
    </ScrollView>
  );

  // ---- grille (recherche, filtres, « Voir tout »)

  const titreGrille = recherche !== '' ? 'Résultats' : soloFavoris ? 'Mes artistes favoris' : filtres.epoque ?? (filtres.discipline ? libelleDiscipline(filtres.discipline) : 'Tous les artistes');
  const correspondantsCatalogue =
    recherche !== ''
      ? autres.filter((f) => normaliserTexte(f.valeur).includes(normaliserTexte(recherche))).slice(0, MAX_AUTRES_RECHERCHE)
      : [];

  const enteteGrille = (
    <View>
      <View style={styles.grilleTitreLigne}>
        <Pressable onPress={toutReinitialiser} hitSlop={8} style={styles.retour}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.grilleTitres}>
          <Text style={styles.grilleTitre} numberOfLines={1}>{titreGrille}</Text>
          <Text style={styles.grilleSousTitre}>
            {resultats.length} {resultats.length > 1 ? 'artistes' : 'artiste'}
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defilement} contentContainerStyle={styles.puces}>
        <PuceFiltre libelle={filtres.epoque ?? 'Période'} actif={filtres.epoque !== null} onPress={() => setFeuille('epoque')} />
        <PuceFiltre libelle={filtres.mouvement ?? 'Mouvement'} actif={filtres.mouvement !== null} onPress={() => setFeuille('mouvement')} />
        <PuceFiltre libelle={filtres.pays ?? 'Pays'} actif={filtres.pays !== null} onPress={() => setFeuille('pays')} />
        <PuceFiltre libelle={`Trier : ${LIBELLES_TRI[filtres.tri]}`} actif={false} onPress={() => setFeuille('tri')} />
      </ScrollView>
    </View>
  );

  const piedGrille =
    correspondantsCatalogue.length > 0 ? (
      <View style={styles.autres}>
        <Text style={styles.sectionTitre}>Dans le catalogue</Text>
        {correspondantsCatalogue.map((f) => (
          <Pressable key={f.valeur} style={styles.autreLigne} onPress={() => onSelectArtisteCatalogue(f.valeur)}>
            <Text style={styles.autreNom} numberOfLines={1}>{f.valeur}</Text>
            <Text style={styles.autreNombre}>{f.nombre}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    ) : null;

  const grille = (
    <FlatList
      data={resultats}
      numColumns={2}
      keyExtractor={(a: Artiste) => a.id}
      columnWrapperStyle={styles.ligneGrille}
      ListHeaderComponent={enteteGrille}
      ListFooterComponent={piedGrille}
      ListEmptyComponent={<Text style={styles.vide}>{soloFavoris ? "Touchez le cœur d'un artiste pour le retrouver ici." : 'Aucun artiste ne correspond à ces critères.'}</Text>}
      renderItem={({ item }: { item: Artiste }) => carte(item, largeurCarte, hauteurCarte, false)}
      showsVerticalScrollIndicator={false}
      initialNumToRender={8}
      contentContainerStyle={styles.contenuGrille}
    />
  );

  // ---- fenêtres de choix

  const contenuFeuille = (): { titre: string; choix: Choix[]; actif: string | null; avecToutes: boolean } => {
    if (feuille === 'epoque') return { titre: 'Période', choix: facettes(artistes, 'epoques').map((f) => ({ valeur: f.valeur, libelle: f.valeur, detail: String(f.nombre) })), actif: filtres.epoque, avecToutes: true };
    if (feuille === 'mouvement') return { titre: 'Mouvement', choix: facettes(artistes, 'mouvements').map((f) => ({ valeur: f.valeur, libelle: f.valeur, detail: String(f.nombre) })), actif: filtres.mouvement, avecToutes: true };
    if (feuille === 'pays') return { titre: 'Pays', choix: facettes(artistes, 'nationalites').map((f) => ({ valeur: f.valeur, libelle: f.valeur, detail: String(f.nombre) })), actif: filtres.pays, avecToutes: true };
    const criteres: CritereTri[] = ['nom', 'naissance', 'oeuvres'];
    return { titre: 'Trier par', choix: criteres.map((c) => ({ valeur: c, libelle: LIBELLES_TRI[c] })), actif: filtres.tri, avecToutes: false };
  };
  const f = contenuFeuille();
  const choisir = (valeur: string | null) => {
    if (feuille === 'epoque') changer({ epoque: valeur });
    else if (feuille === 'mouvement') changer({ mouvement: valeur });
    else if (feuille === 'pays') changer({ pays: valeur });
    else if (feuille === 'tri' && valeur !== null) changer({ tri: valeur as CritereTri });
    setFeuille(null);
  };

  return (
    <View style={styles.conteneur}>
      {barre}
      {enGrille ? grille : accueil}
      <FeuilleChoix visible={feuille !== null} titre={f.titre} choix={f.choix} actif={f.actif} avecToutes={f.avecToutes} onChoisir={choisir} onFermer={() => setFeuille(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1 },
  recherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    marginHorizontal: MARGE,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rechercheTexte: { flex: 1, fontFamily: fonts.ui, fontSize: 15, color: colors.textPrimary, paddingVertical: 0 },
  defilement: { flexGrow: 0 },
  pastilles: { paddingHorizontal: MARGE, gap: 8, paddingBottom: 14 },
  pastille: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 15, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.stone },
  pastilleActive: { backgroundColor: colors.textPrimary },
  pastilleTexte: { fontFamily: fonts.uiMedium, fontSize: 13.5, color: colors.textPrimary },
  pastilleTexteActive: { color: colors.surface },

  accueil: { paddingBottom: 32 },
  banniere: { height: HAUTEUR_BANNIERE, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.stone },
  banniereTexte: { position: 'absolute', left: 18, right: 18, bottom: 16 },
  banniereNom: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.surface },
  banniereAccroche: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, color: colors.surface, marginTop: 4 },
  banniereBouton: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.surface },
  banniereBoutonTexte: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary },
  points: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  pointActif: { backgroundColor: colors.accent },

  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 26, marginBottom: 12, paddingHorizontal: MARGE },
  sectionTitre: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  lien: { fontFamily: fonts.uiSemiBold, fontSize: 13.5, color: colors.accent },
  rangee: { paddingHorizontal: MARGE, gap: 12 },

  carte: { borderRadius: 14, overflow: 'hidden', backgroundColor: colors.stone },
  carteTexte: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  carteNom: { fontFamily: fonts.display, fontSize: 19, lineHeight: 21, color: colors.surface },
  carteNomCompact: { fontFamily: fonts.display, fontSize: 15, lineHeight: 17, color: colors.surface },
  carteDates: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.surface, marginTop: 2 },
  coeur: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(252,251,248,0.92)', alignItems: 'center', justifyContent: 'center' },
  coeurCompact: { width: 26, height: 26, borderRadius: 13, top: 6, right: 6 },

  epoque: { borderRadius: 14, overflow: 'hidden', backgroundColor: colors.stone },
  epoqueTexte: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  epoqueNom: { fontFamily: fonts.display, fontSize: 18, color: colors.surface },
  epoqueSous: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.surface, marginTop: 1 },

  autres: { marginTop: 28, paddingHorizontal: MARGE },
  autresEntete: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  autresTitres: { flex: 1 },
  autresSousTitre: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  autreLigne: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  autreNom: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14.5, color: colors.textPrimary },
  autreNombre: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },

  grilleTitreLigne: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: MARGE, marginBottom: 12 },
  retour: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' },
  grilleTitres: { flex: 1 },
  grilleTitre: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  grilleSousTitre: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary },
  puces: { paddingHorizontal: MARGE, gap: 8, paddingBottom: 14 },
  puce: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  puceActive: { borderColor: colors.accent },
  puceTexte: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textPrimary, maxWidth: 150 },
  puceTexteActive: { color: colors.accent },
  contenuGrille: { paddingBottom: 32 },
  ligneGrille: { gap: ECART, paddingHorizontal: MARGE, marginBottom: ECART },
  vide: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },

  voile: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23,21,19,0.45)' },
  voileFond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  feuille: { maxHeight: '70%', paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface },
  feuilleEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: MARGE, paddingVertical: 18 },
  feuilleTitre: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: MARGE, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  choixTexte: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15, color: colors.textPrimary },
  choixTexteActif: { color: colors.accent },
  choixDetail: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },
});
