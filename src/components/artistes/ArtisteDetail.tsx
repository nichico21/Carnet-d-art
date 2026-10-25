import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Artiste } from '../../types/artiste';
import { Artwork } from '../../types/artwork';
import { ARTWORKS } from '../../data/artworks.generated';
import { EXPOSITIONS } from '../../data/expositions.generated';
import { MUSEES } from '../../data/musees.generated';
import { ArtworkCover } from '../ArtworkCover';
import { ArtworkDetail } from '../ArtworkDetail';
import { construireBlocs, GridBlock } from '../ArtworkGrid';
import { DegradeSombre } from './DegradeSombre';
import { PortraitArtiste } from './PortraitArtiste';
import {
  expositionsDeLArtiste,
  indexerOeuvres,
  joindreValeurs,
  libelleDates,
  libelleOeuvres,
  oeuvreDeRepli,
  oeuvresDeLArtiste,
  oeuvresMisesEnAvant,
  reperesDe,
} from '../../artistes/artistes';
import { formaterPeriode } from '../../expositions/dates';
import { jourISO } from '../../games/progression';
import { hauteurPhoto, StatutMusee } from '../../musees/musees';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type Onglet = 'Aperçu' | 'Œuvres' | 'Expos';

type IconeNom = React.ComponentProps<typeof Ionicons>['name'];

const LIBELLE_STATUT: Record<StatutMusee, string> = {
  a_laffiche: 'EN COURS',
  a_venir: 'À VENIR',
  passee: 'TERMINÉE',
};

/** Même marge que la grille d'œuvres du catalogue. */
const PADDING_GRILLE = 20;
const LONGUEUR_DESCRIPTION_COURTE = 260;

interface Repere {
  icone: IconeNom;
  libelle: string;
  valeur: string;
}

interface Props {
  artiste: Artiste | null;
  onClose: () => void;
  /** Ouvre la fiche d'une exposition (le parent gère la navigation). */
  onOuvrirExposition: (expositionId: string) => void;
}

export function ArtisteDetail({ artiste, onClose, onOuvrirExposition }: Props) {
  const navigation = useNavigation();
  const { notes, favoris, setNote, toggleFavori, artistesFavoris, toggleArtisteFavori } = useCarnet();
  const { height: hauteurEcran } = useWindowDimensions();
  const hauteurHero = hauteurPhoto(hauteurEcran);
  const [onglet, setOnglet] = useState<Onglet>('Aperçu');
  const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);
  const [descriptionOuverte, setDescriptionOuverte] = useState(false);

  const artisteId = artiste?.id;
  useEffect(() => {
    setOnglet('Aperçu');
    setDescriptionOuverte(false);
  }, [artisteId]);

  const parId = useMemo(() => indexerOeuvres(ARTWORKS), []);
  const oeuvres = useMemo(() => (artiste ? oeuvresDeLArtiste(artiste, parId) : []), [artiste, parId]);
  const blocs = useMemo(() => construireBlocs(oeuvres), [oeuvres]);
  const enAvant = useMemo(() => (artiste ? oeuvresMisesEnAvant(artiste, parId) : []), [artiste, parId]);
  const repli = useMemo(() => (artiste ? oeuvreDeRepli(artiste, parId) : undefined), [artiste, parId]);
  const expositions = useMemo(() => (artiste ? expositionsDeLArtiste(artiste, EXPOSITIONS, jourISO()) : []), [artiste]);
  const lieux = useMemo(() => {
    if (!artiste) return [];
    return artiste.musees
      .map((m) => MUSEES.find((x) => x.id === m.id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [artiste]);

  if (!artiste) return null;

  const dates = libelleDates(artiste);
  const description = artiste.description;
  const descriptionLongue = (description?.length ?? 0) > LONGUEUR_DESCRIPTION_COURTE;
  const favori = artistesFavoris[artiste.id] === true;

  const infos = reperesDe(artiste);
  const reperes: Repere[] = [];
  if (infos.pays.length > 0) reperes.push({ icone: 'location-outline', libelle: 'Pays', valeur: joindreValeurs(infos.pays, 2) });
  if (infos.periodes.length > 0) reperes.push({ icone: 'hourglass-outline', libelle: 'Période', valeur: joindreValeurs(infos.periodes, 2) });
  if (infos.mouvements.length > 0) reperes.push({ icone: 'color-palette-outline', libelle: 'Mouvement', valeur: joindreValeurs(infos.mouvements, 2) });

  const onglets: Onglet[] = expositions.length > 0 ? ['Aperçu', 'Œuvres', 'Expos'] : ['Aperçu', 'Œuvres'];
  const libelleOnglet = (o: Onglet) => (o === 'Œuvres' ? `Œuvres (${oeuvres.length})` : o);
  const ficheVide = !description && reperes.length === 0 && enAvant.length === 0 && expositions.length === 0 && !artiste.citation;

  const apercu = (
    <View>
      {reperes.length > 0 ? (
        <View style={styles.reperes}>
          {reperes.map((r, i) => (
            <View key={r.libelle} style={[styles.repere, i > 0 ? styles.repereSepare : null]}>
              <Ionicons name={r.icone} size={20} color={colors.textSecondary} />
              <Text style={styles.repereLibelle}>{r.libelle}</Text>
              <Text style={styles.repereValeur}>{r.valeur}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {description ? (
        <View style={styles.bloc}>
          <Text style={styles.texte} numberOfLines={descriptionOuverte || !descriptionLongue ? undefined : 5}>
            {description}
          </Text>
          {descriptionLongue ? (
            <Pressable onPress={() => setDescriptionOuverte(!descriptionOuverte)} hitSlop={6}>
              <Text style={styles.lien}>{descriptionOuverte ? 'Réduire' : 'Lire plus'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {artiste.citation && artiste.citationSource ? (
        <View style={styles.citation}>
          <Text style={styles.citationTexte}>« {artiste.citation} »</Text>
          <Text style={styles.citationSource}>— {artiste.nom}, {artiste.citationSource}</Text>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.defilement} contentContainerStyle={styles.cartes}>
            {enAvant.map((a) => (
              <Pressable key={a.id} style={styles.oeuvreCarte} onPress={() => setArtworkOuvert(a)}>
                <View style={styles.oeuvreImage}>
                  <ArtworkCover artwork={a} width={400} />
                </View>
                <Text style={styles.oeuvreTitre} numberOfLines={2}>{a.titre}</Text>
                {a.annee ? <Text style={styles.oeuvreAnnee}>{a.annee}</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {artiste.anecdote ? (
        <View style={styles.anecdote}>
          <Text style={styles.anecdoteTitre}>Une anecdote</Text>
          <Text style={styles.texte}>{artiste.anecdote}</Text>
        </View>
      ) : null}

      {lieux.length > 0 ? (
        <View>
          <Text style={styles.sectionTitre}>Où voir ses œuvres</Text>
          {lieux.map((m) => (
            <View key={m.id} style={styles.lieuLigne}>
              <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.lieuTexte} numberOfLines={1}>{m.nom}</Text>
              <Text style={styles.lieuVille}>{m.ville}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {artiste.wikipediaUrl ? (
        <Pressable onPress={() => Linking.openURL(artiste.wikipediaUrl as string)} hitSlop={6}>
          <Text style={[styles.lien, styles.lienSeul]}>En savoir plus sur Wikipédia</Text>
        </Pressable>
      ) : null}

      {ficheVide ? <Text style={styles.note}>La fiche de cet artiste est en cours de rédaction.</Text> : null}
    </View>
  );

  const listeExpositions = (
    <View style={styles.expositions}>
      {expositions.map(({ exposition, statut }) => (
        <Pressable key={exposition.id} style={styles.expoLigne} onPress={() => onOuvrirExposition(exposition.id)}>
          <View style={styles.expoTexte}>
            <Text style={[styles.expoStatut, statut === 'passee' ? styles.expoStatutPassee : null]}>{LIBELLE_STATUT[statut]}</Text>
            <Text style={styles.expoTitre} numberOfLines={2}>{exposition.titre}</Text>
            <Text style={styles.expoPeriode}>{formaterPeriode(exposition.dateDebut, exposition.dateFin)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      ))}
    </View>
  );

  const entete = (
    <View>
      <View style={[styles.hero, { height: hauteurHero }]}>
        <PortraitArtiste nom={artiste.nom} imageUrl={artiste.imageUrl} oeuvre={repli} width={1200} />
        <DegradeSombre hauteur={Math.round(hauteurHero * 0.5)} />
        <Pressable onPress={onClose} style={styles.boutonRetour} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={() => toggleArtisteFavori(artiste.id)} style={styles.boutonCoeur} hitSlop={8}>
          <Ionicons name={favori ? 'heart' : 'heart-outline'} size={22} color={favori ? colors.accent : colors.textPrimary} />
        </Pressable>
        <View style={styles.heroTitre}>
          <Text style={styles.nom}>{artiste.nom}</Text>
          {dates ? <Text style={styles.dates}>{dates}</Text> : null}
          {artiste.accroche ? <Text style={styles.accroche}>{artiste.accroche}</Text> : null}
        </View>
      </View>

      <View style={styles.feuille}>
        <View style={styles.onglets}>
          {onglets.map((o) => (
            <Pressable key={o} style={styles.onglet} onPress={() => setOnglet(o)}>
              <Text style={[styles.ongletTexte, o === onglet ? styles.ongletTexteActif : null]}>{libelleOnglet(o)}</Text>
              {o === onglet ? <View style={styles.soulignement} /> : null}
            </Pressable>
          ))}
        </View>
        {onglet === 'Aperçu' ? apercu : null}
        {onglet === 'Expos' ? listeExpositions : null}
        {onglet === 'Œuvres' ? <Text style={styles.compte}>{libelleOeuvres(oeuvres.length)} du catalogue</Text> : null}
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
          ListEmptyComponent={onglet === 'Œuvres' ? <Text style={styles.vide}>Aucune œuvre de cet artiste dans le catalogue pour l'instant.</Text> : null}
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
            (navigation.navigate as (name: string, params?: object) => void)('Boutique', { artworkId });
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
  boutonRetour: { position: 'absolute', top: 52, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(252,251,248,0.92)', alignItems: 'center', justifyContent: 'center' },
  boutonCoeur: { position: 'absolute', top: 52, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(252,251,248,0.92)', alignItems: 'center', justifyContent: 'center' },
  heroTitre: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingBottom: 44 },
  nom: { fontFamily: fonts.display, fontSize: 38, lineHeight: 41, color: colors.surface, textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 },
  dates: { fontFamily: fonts.ui, fontSize: 16, color: colors.surface, marginTop: 6 },
  accroche: { fontFamily: fonts.displayRegular, fontSize: 19, lineHeight: 23, color: colors.surface, marginTop: 6 },
  feuille: { marginTop: -28, paddingHorizontal: 20, paddingBottom: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.background },
  onglets: { flexDirection: 'row', gap: 26, borderBottomWidth: 1, borderBottomColor: colors.border },
  onglet: { paddingTop: 16, paddingBottom: 10 },
  ongletTexte: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textSecondary },
  ongletTexteActif: { color: colors.accent },
  soulignement: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  compte: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textSecondary, marginTop: 16 },

  reperes: { marginTop: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  repere: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  repereSepare: { borderTopWidth: 1, borderTopColor: colors.border },
  repereLibelle: { width: 84, fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },
  repereValeur: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14.5, lineHeight: 19, color: colors.textPrimary },

  bloc: { marginTop: 18 },
  texte: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  lien: { fontFamily: fonts.uiSemiBold, fontSize: 13.5, color: colors.accent, marginTop: 6 },
  lienSeul: { marginTop: 24 },
  note: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 18 },

  citation: { marginTop: 22, padding: 18, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  citationTexte: { fontFamily: fonts.displayRegular, fontSize: 18, lineHeight: 24, color: colors.textPrimary, textAlign: 'center' },
  citationSource: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },

  anecdote: { marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: colors.stone },
  anecdoteTitre: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, marginBottom: 6 },

  sectionEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 26, marginBottom: 12 },
  sectionTitre: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, marginTop: 26, marginBottom: 12 },
  defilement: { marginHorizontal: -20, flexGrow: 0 },
  cartes: { paddingHorizontal: 20, gap: 12 },
  oeuvreCarte: { width: 124 },
  oeuvreImage: { height: 140, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.stone },
  oeuvreTitre: { fontFamily: fonts.display, fontSize: 14.5, lineHeight: 17, color: colors.textPrimary, marginTop: 7 },
  oeuvreAnnee: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },

  lieuLigne: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  lieuTexte: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textPrimary },
  lieuVille: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },

  expositions: { marginTop: 18 },
  expoLigne: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  expoTexte: { flex: 1 },
  expoStatut: { fontFamily: fonts.uiSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.accent },
  expoStatutPassee: { color: colors.textSecondary },
  expoTitre: { fontFamily: fonts.display, fontSize: 18, lineHeight: 21, color: colors.textPrimary, marginTop: 3 },
  expoPeriode: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: 3 },

  grille: { paddingHorizontal: PADDING_GRILLE },
  vide: { fontFamily: fonts.ui, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 30, paddingHorizontal: 32 },
});
