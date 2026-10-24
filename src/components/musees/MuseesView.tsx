import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artwork } from '../../types/artwork';
import { Musee } from '../../types/musee';
import { FacetteValeur } from '../../data/artworks.generated';
import { MuseeImage } from './MuseeImage';
import {
  filtrerMusees,
  largeurVignette,
  museesSansFiche,
  oeuvresParMusee,
  puces,
  regionsAvecNombre,
} from '../../musees/musees';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  musees: Musee[];
  artworks: Artwork[];
  /** Lieux de conservation du catalogue (FACETTES.musees). */
  lieux: FacetteValeur[];
  onOuvrirMusee: (musee: Musee) => void;
  /** Un lieu du catalogue qui n'a pas encore de fiche musée. */
  onSelectLieu: (nom: string) => void;
}

const MARGE = 20;
const ECART = 12;
const COTE_VIGNETTE_DEFILANTE = 190;
const LARGEUR_REGION = 150;
const SEUIL_VOIR_TOUT = 2;
const MAX_LIEUX_SANS_FICHE = 50;

interface Illustration {
  imageUrl?: string;
  oeuvre?: Artwork;
}

interface VignetteProps {
  musee: Musee;
  illustration: Illustration;
  nombreOeuvres: number;
  cote: number;
  onPress: () => void;
}

/** Vignette carrée : la photo du musée en carré, puis son nom, sa ville et son pays. */
function Vignette({ musee, illustration, nombreOeuvres, cote, onPress }: VignetteProps) {
  return (
    <Pressable style={[styles.carte, { width: cote }]} onPress={onPress}>
      <View style={{ width: cote, height: cote, backgroundColor: colors.stone }}>
        <MuseeImage imageUrl={illustration.imageUrl} oeuvre={illustration.oeuvre} width={500} />
      </View>
      <View style={styles.carteTexte}>
        <Text style={styles.carteNom} numberOfLines={2}>
          {musee.nom}
        </Text>
        <Text style={styles.carteLieu} numberOfLines={1}>
          {musee.ville}, {musee.pays}
        </Text>
        {nombreOeuvres > 0 ? (
          <Text style={styles.carteMeta}>
            {nombreOeuvres} {nombreOeuvres > 1 ? 'œuvres' : 'œuvre'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

interface CarteRegionProps {
  region: string;
  nombre: number;
  illustration: Illustration;
  largeur: number;
  onPress: () => void;
}

/** Carte d'une région : une photo, puis le nom, le nombre de musées et une flèche. */
function CarteRegion({ region, nombre, illustration, largeur, onPress }: CarteRegionProps) {
  return (
    <Pressable style={[styles.carte, { width: largeur }]} onPress={onPress}>
      <View style={{ width: largeur, height: Math.round(largeur * 0.68), backgroundColor: colors.stone }}>
        <MuseeImage imageUrl={illustration.imageUrl} oeuvre={illustration.oeuvre} width={400} />
      </View>
      <View style={styles.regionTexte}>
        <View style={styles.regionNoms}>
          <Text style={styles.carteNom} numberOfLines={1}>
            {region}
          </Text>
          <Text style={styles.carteLieu}>
            {nombre} {nombre > 1 ? 'musées' : 'musée'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
      </View>
    </Pressable>
  );
}

export function MuseesView({ musees, artworks, lieux, onOuvrirMusee, onSelectLieu }: Props) {
  const { width: largeurEcran } = useWindowDimensions();
  const [recherche, setRecherche] = useState('');
  const [puce, setPuce] = useState('Tous');
  const [incontournablesEnGrille, setIncontournablesEnGrille] = useState(false);
  const [regionsEnGrille, setRegionsEnGrille] = useState(false);

  const oeuvres = useMemo(() => oeuvresParMusee(musees, artworks), [musees, artworks]);
  const listePuces = useMemo(() => puces(musees), [musees]);
  const liste = useMemo(() => filtrerMusees(musees, recherche, puce), [musees, recherche, puce]);
  const incontournables = useMemo(() => musees.filter((m) => m.incontournable), [musees]);
  const regions = useMemo(() => regionsAvecNombre(musees), [musees]);
  const sansFiche = useMemo(() => museesSansFiche(lieux, musees), [lieux, musees]);

  const accueil = recherche.trim() === '' && puce === 'Tous';
  const coteGrille = largeurVignette(largeurEcran, 2, MARGE, ECART);

  const illustration = (m: Musee): Illustration => ({
    imageUrl: m.imageUrl,
    oeuvre: (oeuvres.get(m.id) ?? []).find((a) => Boolean(a.imageUrl)),
  });

  const illustrationRegion = (region: string): Illustration => {
    const dansRegion = musees.filter((m) => m.region === region);
    const avecImage = dansRegion.find((m) => m.imageUrl);
    if (avecImage) return { imageUrl: avecImage.imageUrl };
    for (const m of dansRegion) {
      const oeuvre = (oeuvres.get(m.id) ?? []).find((a) => Boolean(a.imageUrl));
      if (oeuvre) return { oeuvre };
    }
    return {};
  };

  const vignette = (m: Musee, cote: number) => (
    <Vignette
      key={m.id}
      musee={m}
      illustration={illustration(m)}
      nombreOeuvres={(oeuvres.get(m.id) ?? []).length}
      cote={cote}
      onPress={() => onOuvrirMusee(m)}
    />
  );

  const titreSection = (titre: string, ouvert: boolean, bascule: (() => void) | null) => (
    <View style={styles.sectionEntete}>
      <Text style={styles.sectionTitre}>{titre}</Text>
      {bascule ? (
        <Pressable onPress={bascule} hitSlop={8}>
          <Text style={styles.voirTout}>{ouvert ? 'Réduire' : 'Voir tout'}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const entete = (
    <View>
      <Text style={styles.sousTitre}>Explorez les plus beaux musées du monde</Text>

      <View style={styles.recherche}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.rechercheTexte}
          value={recherche}
          onChangeText={setRecherche}
          placeholder="Rechercher un musée, une ville, un pays…"
          placeholderTextColor={colors.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
        />
        {recherche !== '' ? (
          <Pressable onPress={() => setRecherche('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {listePuces.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.defilement}
          contentContainerStyle={styles.puces}
        >
          {listePuces.map((p) => (
            <Pressable
              key={p}
              style={[styles.puce, p === puce ? styles.puceActive : null]}
              onPress={() => setPuce(p)}
            >
              <Text style={[styles.puceTexte, p === puce ? styles.puceTexteActive : null]}>{p}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {accueil && incontournables.length > 0 ? (
        <View>
          {titreSection(
            'Incontournables',
            incontournablesEnGrille,
            incontournables.length > SEUIL_VOIR_TOUT
              ? () => setIncontournablesEnGrille(!incontournablesEnGrille)
              : null,
          )}
          {incontournablesEnGrille ? (
            <View style={styles.grilleEnTete}>{incontournables.map((m) => vignette(m, coteGrille))}</View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.defilement}
              contentContainerStyle={styles.cartes}
            >
              {incontournables.map((m) => vignette(m, COTE_VIGNETTE_DEFILANTE))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {accueil && regions.length > 1 ? (
        <View>
          {titreSection(
            'Parcourir par région',
            regionsEnGrille,
            regions.length > SEUIL_VOIR_TOUT ? () => setRegionsEnGrille(!regionsEnGrille) : null,
          )}
          {regionsEnGrille ? (
            <View style={styles.grilleEnTete}>
              {regions.map((r) => (
                <CarteRegion
                  key={r.region}
                  region={r.region}
                  nombre={r.nombre}
                  illustration={illustrationRegion(r.region)}
                  largeur={coteGrille}
                  onPress={() => setPuce(r.region)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.defilement}
              contentContainerStyle={styles.cartes}
            >
              {regions.map((r) => (
                <CarteRegion
                  key={r.region}
                  region={r.region}
                  nombre={r.nombre}
                  illustration={illustrationRegion(r.region)}
                  largeur={LARGEUR_REGION}
                  onPress={() => setPuce(r.region)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      {titreSection(
        accueil ? 'Tous les musées' : `${liste.length} ${liste.length > 1 ? 'musées' : 'musée'}`,
        false,
        null,
      )}
    </View>
  );

  const pied =
    accueil && sansFiche.length > 0 ? (
      <View>
        {titreSection('Autres lieux du catalogue', false, null)}
        <Text style={styles.note}>Ces lieux n'ont pas encore de fiche musée.</Text>
        {sansFiche.slice(0, MAX_LIEUX_SANS_FICHE).map((l) => (
          <Pressable key={l.valeur} style={styles.lieuLigne} onPress={() => onSelectLieu(l.valeur)}>
            <Text style={styles.lieuNom} numberOfLines={1}>
              {l.valeur}
            </Text>
            <Text style={styles.lieuNombre}>
              {l.nombre} {l.nombre > 1 ? 'œuvres' : 'œuvre'}
            </Text>
          </Pressable>
        ))}
      </View>
    ) : null;

  return (
    <FlatList
      data={liste}
      keyExtractor={(m) => m.id}
      numColumns={2}
      columnWrapperStyle={styles.colonnes}
      renderItem={({ item }) => vignette(item, coteGrille)}
      ListHeaderComponent={entete}
      ListFooterComponent={pied}
      ListEmptyComponent={<Text style={styles.vide}>Aucun musée ne correspond à votre recherche.</Text>}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: MARGE, paddingBottom: 24 },
  colonnes: { gap: ECART, marginBottom: ECART },
  sousTitre: { fontFamily: fonts.ui, fontSize: 15, color: colors.textSecondary, marginBottom: 14 },
  recherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.stone,
  },
  rechercheTexte: { flex: 1, fontFamily: fonts.ui, fontSize: 14, color: colors.textPrimary },
  defilement: { marginHorizontal: -MARGE },
  puces: { paddingHorizontal: MARGE, paddingTop: 14, gap: 8 },
  puce: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.stone },
  puceActive: { backgroundColor: colors.accent },
  puceTexte: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textPrimary },
  puceTexteActive: { color: colors.surface },

  sectionEntete: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitre: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  voirTout: { fontFamily: fonts.uiSemiBold, fontSize: 13.5, color: colors.accent },
  note: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: -6, marginBottom: 10 },

  cartes: { paddingHorizontal: MARGE, gap: ECART },
  grilleEnTete: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART },
  carte: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  carteTexte: { padding: 10, minHeight: 96 },
  carteNom: { fontFamily: fonts.display, fontSize: 17, lineHeight: 20, color: colors.textPrimary },
  carteLieu: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },
  carteMeta: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 3 },
  regionTexte: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: 10,
  },
  regionNoms: { flex: 1 },

  lieuLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lieuNom: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textPrimary },
  lieuNombre: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary },
  vide: {
    fontFamily: fonts.ui,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 32,
  },
});
