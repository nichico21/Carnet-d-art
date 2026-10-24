import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Artwork } from '../../types/artwork';
import { Musee } from '../../types/musee';
import { ARTWORKS } from '../../data/artworks.generated';
import { EXPOSITIONS } from '../../data/expositions.generated';
import { ArtworkCover } from '../ArtworkCover';
import { ArtworkDetail } from '../ArtworkDetail';
import { construireBlocs, GridBlock } from '../ArtworkGrid';
import { MuseeImage } from './MuseeImage';
import { formaterPeriode } from '../../expositions/dates';
import { jourISO } from '../../games/progression';
import {
  expositionsDuMusee,
  hauteurPhoto,
  lienCarte,
  opaciteDegrade,
  oeuvresMiseEnAvant,
  oeuvresParMusee,
  reperesDuMusee,
  StatutMusee,
} from '../../musees/musees';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const ONGLETS = ['Présentation', 'Œuvres', 'Infos pratiques'] as const;
type Onglet = (typeof ONGLETS)[number];

type IconeNom = React.ComponentProps<typeof Ionicons>['name'];

const ICONES_COLLECTIONS: Record<string, IconeNom> = {
  Peinture: 'color-palette-outline',
  Sculpture: 'cube-outline',
  Antiquités: 'business-outline',
  'Arts décoratifs': 'diamond-outline',
  'Arts graphiques': 'brush-outline',
  Photographie: 'camera-outline',
  'Art moderne et contemporain': 'albums-outline',
  "Arts d'Asie": 'earth-outline',
  "Arts d'Afrique et d'Océanie": 'earth-outline',
  "Arts de l'Islam": 'moon-outline',
};

const LIBELLE_STATUT: Record<StatutMusee, string> = {
  a_laffiche: 'EN COURS',
  a_venir: 'À VENIR',
  passee: 'TERMINÉE',
};

/** Marge horizontale de la grille d'œuvres : même valeur que la liste de CatalogueScreen. */
const PADDING_GRILLE = 20;
const LONGUEUR_DESCRIPTION_COURTE = 220;

const BANDES_DEGRADE = 24;

/** Dégradé noir vers le bas, sans bibliothèque : des bandes de plus en plus opaques. */
function DegradeSombre({ hauteur }: { hauteur: number }) {
  return (
    <View pointerEvents="none" style={[styles.degrade, { height: hauteur }]}>
      {Array.from({ length: BANDES_DEGRADE }, (_, i) => (
        <View
          key={i}
          style={{ flex: 1, backgroundColor: `rgba(23,21,19,${opaciteDegrade(i, BANDES_DEGRADE)})` }}
        />
      ))}
    </View>
  );
}

interface Props {
  musee: Musee | null;
  onClose: () => void;
  /** Ouvre la fiche d'une exposition du musée (le parent gère la navigation). */
  onOuvrirExposition: (expositionId: string) => void;
}

export function MuseeDetail({ musee, onClose, onOuvrirExposition }: Props) {
  const navigation = useNavigation();
  const { notes, favoris, setNote, toggleFavori } = useCarnet();
  const { height: hauteurEcran } = useWindowDimensions();
  const hauteurHero = hauteurPhoto(hauteurEcran);
  const [onglet, setOnglet] = useState<Onglet>('Présentation');
  const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);
  const [descriptionOuverte, setDescriptionOuverte] = useState(false);

  const museeId = musee?.id;
  useEffect(() => {
    setOnglet('Présentation');
    setDescriptionOuverte(false);
  }, [museeId]);

  const oeuvres = useMemo(
    () => (musee ? oeuvresParMusee([musee], ARTWORKS).get(musee.id) ?? [] : []),
    [musee],
  );
  const blocs = useMemo(() => construireBlocs(oeuvres), [oeuvres]);
  const enAvant = useMemo(() => (musee ? oeuvresMiseEnAvant(musee, oeuvres) : []), [musee, oeuvres]);
  const expositions = useMemo(
    () => (musee ? expositionsDuMusee(musee, EXPOSITIONS, jourISO()) : []),
    [musee],
  );

  if (!musee) return null;

  const siteUrl = musee.siteUrl;
  const description = musee.description;
  const descriptionLongue = (description?.length ?? 0) > LONGUEUR_DESCRIPTION_COURTE;
  const wikipediaUrl = musee.wikipediaUrl;
  const adresseComplete = musee.adresse ? musee.adresse : `${musee.ville}, ${musee.pays}`;
  const reperes = reperesDuMusee(musee);
  const ficheVide =
    !description &&
    reperes.length === 0 &&
    musee.collections.length === 0 &&
    enAvant.length === 0 &&
    expositions.length === 0;

  const ouvrirCarte = () => {
    Linking.openURL(lienCarte(musee));
  };

  const presentation = (
    <View>
      {musee.type ? (
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagTexte}>{musee.type}</Text>
          </View>
        </View>
      ) : null}

      {musee.collections.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.defilement}
          contentContainerStyle={styles.collections}
        >
          {musee.collections.map((c) => (
            <View key={c} style={styles.collection}>
              <Ionicons
                name={ICONES_COLLECTIONS[c] ?? 'albums-outline'}
                size={26}
                color={colors.textPrimary}
              />
              <Text style={styles.collectionLabel} numberOfLines={2}>
                {c}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {reperes.length > 0 ? (
        <View style={styles.reperes}>
          {reperes.map((r) => (
            <View key={r.libelle} style={styles.repere}>
              <Text style={styles.repereValeur}>{r.valeur}</Text>
              <Text style={styles.repereLibelle}>{r.libelle}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {description ? (
        <View style={styles.bloc}>
          <Text
            style={styles.texte}
            numberOfLines={descriptionOuverte || !descriptionLongue ? undefined : 4}
          >
            {description}
          </Text>
          {descriptionLongue ? (
            <Pressable onPress={() => setDescriptionOuverte(!descriptionOuverte)} hitSlop={6}>
              <Text style={styles.lien}>{descriptionOuverte ? 'Réduire' : 'En savoir plus'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {enAvant.length > 0 ? (
        <View>
          <View style={styles.sectionEntete}>
            <Text style={styles.sectionTitre}>Œuvres incontournables</Text>
            {oeuvres.length > enAvant.length ? (
              <Pressable onPress={() => setOnglet('Œuvres')} hitSlop={6}>
                <Text style={styles.lien}>Voir tout</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.defilement}
            contentContainerStyle={styles.cartes}
          >
            {enAvant.map((a) => (
              <Pressable key={a.id} style={styles.oeuvreCarte} onPress={() => setArtworkOuvert(a)}>
                <View style={styles.oeuvreImage}>
                  <ArtworkCover artwork={a} width={400} />
                </View>
                <Text style={styles.oeuvreTitre} numberOfLines={2}>
                  {a.titre}
                </Text>
                <Text style={styles.oeuvreArtiste} numberOfLines={1}>
                  {a.artiste}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {expositions.length > 0 ? (
        <View>
          <Text style={styles.sectionTitre}>Expositions</Text>
          {expositions.map(({ exposition, statut }) => (
            <Pressable
              key={exposition.id}
              style={styles.expoLigne}
              onPress={() => onOuvrirExposition(exposition.id)}
            >
              <View style={styles.expoTexte}>
                <Text style={[styles.expoStatut, statut === 'passee' ? styles.expoStatutPassee : null]}>
                  {LIBELLE_STATUT[statut]}
                </Text>
                <Text style={styles.expoTitre} numberOfLines={2}>
                  {exposition.titre}
                </Text>
                <Text style={styles.expoPeriode}>
                  {formaterPeriode(exposition.dateDebut, exposition.dateFin)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {ficheVide ? <Text style={styles.note}>La fiche de ce musée est en cours de création.</Text> : null}
    </View>
  );

  const infos = (
    <View style={styles.infos}>
      <View style={styles.infoLigne}>
        <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
        <View style={styles.infoTexte}>
          <Text style={styles.infoPrincipal}>{adresseComplete}</Text>
          <Pressable onPress={ouvrirCarte} hitSlop={6}>
            <Text style={styles.lien}>Voir sur la carte</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.note}>Horaires et tarifs : consultez le site officiel du musée.</Text>
      {wikipediaUrl ? (
        <Pressable onPress={() => Linking.openURL(wikipediaUrl)} hitSlop={6}>
          <Text style={styles.lien}>En savoir plus sur Wikipédia</Text>
        </Pressable>
      ) : null}
      {siteUrl ? (
        <Pressable style={styles.boutonPrincipal} onPress={() => Linking.openURL(siteUrl)}>
          <Ionicons name="globe-outline" size={16} color={colors.surface} />
          <Text style={styles.boutonPrincipalTexte}>Site officiel du musée</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const entete = (
    <View>
      <View style={[styles.hero, { height: hauteurHero }]}>
        <MuseeImage imageUrl={musee.imageUrl} oeuvre={enAvant[0] ?? oeuvres[0]} width={1200} />
        <DegradeSombre hauteur={Math.round(hauteurHero * 0.5)} />
        <Pressable onPress={onClose} style={styles.boutonRetour} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.heroTitre}>
          <Text style={styles.nom}>{musee.nom}</Text>
          <Text style={styles.lieu}>
            {musee.ville}, {musee.pays}
          </Text>
        </View>
      </View>

      <View style={styles.feuille}>
        <View style={styles.onglets}>
          {ONGLETS.map((o) => (
            <Pressable key={o} style={styles.onglet} onPress={() => setOnglet(o)}>
              <Text style={[styles.ongletTexte, o === onglet ? styles.ongletTexteActif : null]}>{o}</Text>
              {o === onglet ? <View style={styles.soulignement} /> : null}
            </Pressable>
          ))}
        </View>
        {onglet === 'Présentation' ? presentation : null}
        {onglet === 'Infos pratiques' ? infos : null}
        {onglet === 'Œuvres' ? (
          <Text style={styles.compte}>
            {oeuvres.length} {oeuvres.length > 1 ? 'œuvres' : 'œuvre'} du catalogue
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <FlatList
          data={onglet === 'Œuvres' ? blocs : []}
          keyExtractor={(b) => b.key}
          renderItem={({ item }) => (
            <View style={styles.grille}>
              <GridBlock bloc={item} onPressItem={setArtworkOuvert} />
            </View>
          )}
          ListHeaderComponent={entete}
          ListEmptyComponent={
            onglet === 'Œuvres' ? (
              <Text style={styles.vide}>
                Aucune œuvre de ce musée dans le catalogue pour l'instant.
              </Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          contentContainerStyle={styles.contenu}
        />

        <ArtworkDetail
          artwork={artworkOuvert}
          onClose={() => setArtworkOuvert(null)}
          note={artworkOuvert ? notes[artworkOuvert.id] ?? 0 : 0}
          onChangeNote={(n) => artworkOuvert && setNote(artworkOuvert.id, n)}
          favori={artworkOuvert ? favoris[artworkOuvert.id] ?? false : false}
          onToggleFavori={() => artworkOuvert && toggleFavori(artworkOuvert.id)}
          onNavigateTab={(tab) => {
            setArtworkOuvert(null);
            onClose();
            navigation.navigate(tab as never);
          }}
          onOuvrirBoutique={(artworkId) => {
            setArtworkOuvert(null);
            onClose();
            (navigation.navigate as (name: string, params?: object) => void)('Boutique', {
              artworkId,
            });
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contenu: { paddingBottom: 40 },
  hero: { backgroundColor: colors.stone },
  degrade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  boutonRetour: {
    position: 'absolute',
    top: 52,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(252,251,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitre: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  nom: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 41,
    color: colors.surface,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  lieu: { fontFamily: fonts.ui, fontSize: 16, color: colors.surface, marginTop: 6 },
  feuille: {
    marginTop: -28,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
  },
  onglets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  onglet: { paddingTop: 16, paddingBottom: 10 },
  ongletTexte: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textSecondary },
  ongletTexteActif: { color: colors.accent },
  soulignement: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  compte: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textSecondary, marginTop: 16 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tag: { backgroundColor: colors.stone, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 12 },
  tagTexte: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.textPrimary },

  defilement: { marginHorizontal: -20 },
  collections: { paddingHorizontal: 20, paddingTop: 18, gap: 18 },
  collection: { width: 84, alignItems: 'center', gap: 6 },
  collectionLabel: {
    fontFamily: fonts.ui,
    fontSize: 11.5,
    lineHeight: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  reperes: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  repere: { alignItems: 'center', flex: 1 },
  repereValeur: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.textPrimary },
  repereLibelle: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  bloc: { marginTop: 18 },
  texte: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  lien: { fontFamily: fonts.uiSemiBold, fontSize: 13.5, color: colors.accent, marginTop: 6 },
  note: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 18 },

  sectionEntete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitre: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, marginTop: 26, marginBottom: 12 },
  cartes: { paddingHorizontal: 20, gap: 12 },
  oeuvreCarte: { width: 124 },
  oeuvreImage: { height: 140, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.stone },
  oeuvreTitre: { fontFamily: fonts.display, fontSize: 14.5, lineHeight: 17, color: colors.textPrimary, marginTop: 7 },
  oeuvreArtiste: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  expoLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  expoTexte: { flex: 1 },
  expoStatut: { fontFamily: fonts.uiSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.accent },
  expoStatutPassee: { color: colors.textSecondary },
  expoTitre: { fontFamily: fonts.display, fontSize: 18, lineHeight: 21, color: colors.textPrimary, marginTop: 3 },
  expoPeriode: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },

  infos: { marginTop: 20, gap: 16 },
  infoLigne: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoTexte: { flex: 1 },
  infoPrincipal: { fontFamily: fonts.uiMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  boutonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    marginTop: 6,
    borderRadius: 28,
    backgroundColor: colors.textPrimary,
  },
  boutonPrincipalTexte: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.surface },

  grille: { paddingHorizontal: PADDING_GRILLE },
  vide: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 32,
  },
});
