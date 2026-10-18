import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Exposition, StatutExposition } from '../types/exposition';
import { Artwork } from '../types/artwork';
import { ARTWORKS } from '../data/artworks.generated';
import { ArtworkCover } from './ArtworkCover';
import { ArtworkDetail } from './ArtworkDetail';
import { ArtisteOeuvresModal } from './ArtisteOeuvresModal';
import { ExpositionImage } from './ExpositionImage';
import { StarRating } from './StarRating';
import { formaterPeriode, statutExposition } from '../expositions/dates';
import { artistesDeLExposition, oeuvresLieesDeLExposition } from '../expositions/oeuvres';
import { jourISO } from '../games/progression';
import { useCarnet } from '../store/CarnetContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const LIBELLE_STATUT: Record<StatutExposition, string> = {
  a_laffiche: 'EN COURS',
  a_venir: 'À VENIR',
  passee: 'TERMINÉE',
};

interface Props {
  exposition: Exposition | null;
  onClose: () => void;
  note: number;
  onChangeNote: (note: number) => void;
}

export function ExpositionDetail({ exposition, onClose, note, onChangeNote }: Props) {
  const navigation = useNavigation();
  const { expositionsFavorites, toggleExpositionFavori, notes, favoris, setNote, toggleFavori } =
    useCarnet();
  const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);
  const [artisteSelectionne, setArtisteSelectionne] = useState<string | null>(null);

  const expositionId = exposition?.id;
  useEffect(() => {
    setArtisteSelectionne(null);
  }, [expositionId]);

  const oeuvresLiees = useMemo(
    () => (exposition ? oeuvresLieesDeLExposition(exposition, ARTWORKS) : []),
    [exposition],
  );
  const artistes = useMemo(
    () => (exposition ? artistesDeLExposition(exposition, ARTWORKS) : []),
    [exposition],
  );

  if (!exposition) return null;

  const statut = statutExposition(exposition.dateDebut, exposition.dateFin, jourISO());
  const termine = statut === 'passee';
  const url = exposition.url;
  const favori = expositionsFavorites[exposition.id] ?? false;
  const adresseComplete = exposition.adresse
    ? `${exposition.adresse}, ${exposition.ville}`
    : exposition.ville;
  const tags = [exposition.type, ...exposition.epoques, ...exposition.mouvements];
  const artisteActif = artistes.find((a) => a.nom === artisteSelectionne);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <ExpositionImage imageUrl={exposition.imageUrl} />
            <Pressable onPress={onClose} style={[styles.boutonRond, styles.closeButton]}>
              <Ionicons name="close" size={20} color={colors.surface} />
            </Pressable>
            <Pressable
              onPress={() => toggleExpositionFavori(exposition.id)}
              style={[styles.boutonRond, styles.favoriButton]}
              hitSlop={6}
            >
              <Ionicons
                name={favori ? 'heart' : 'heart-outline'}
                size={20}
                color={favori ? colors.accent : colors.surface}
              />
            </Pressable>
          </View>

          <View style={styles.sheet}>
            <Text style={[styles.statut, termine ? styles.statutPassee : null]}>
              {LIBELLE_STATUT[statut]}
            </Text>
            <Text style={styles.titre}>{exposition.titre}</Text>
            {exposition.sousTitre ? <Text style={styles.sousTitre}>{exposition.sousTitre}</Text> : null}
            <Text style={styles.periode}>
              {formaterPeriode(exposition.dateDebut, exposition.dateFin)}
            </Text>

            <View style={styles.tags}>
              {tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagTexte}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.infos}>
              <View style={styles.infoLigne}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <View style={styles.infoTexte}>
                  <Text style={styles.infoPrincipal}>{exposition.lieu}</Text>
                  <Text style={styles.infoSecondaire}>{adresseComplete}</Text>
                </View>
              </View>
              {exposition.tarifs ? (
                <View style={styles.infoLigne}>
                  <Ionicons name="ticket-outline" size={18} color={colors.textSecondary} />
                  <View style={styles.infoTexte}>
                    <Text style={styles.infoPrincipal}>{exposition.tarifs}</Text>
                  </View>
                </View>
              ) : null}
              {exposition.duree ? (
                <View style={styles.infoLigne}>
                  <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                  <View style={styles.infoTexte}>
                    <Text style={styles.infoPrincipal}>{exposition.duree}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <Pressable style={styles.boutonPrincipal} onPress={() => Linking.openURL(url)}>
              <Ionicons
                name={termine ? 'open-outline' : 'ticket-outline'}
                size={16}
                color={colors.surface}
              />
              <Text style={styles.boutonPrincipalTexte}>
                {termine ? "Voir la page de l'exposition" : 'Réserver un billet'}
              </Text>
            </Pressable>

            <Text style={styles.sectionTitre}>À propos</Text>
            <Text style={styles.texte}>{exposition.description}</Text>

            <Text style={styles.sectionTitre}>Votre note</Text>
            <View style={styles.noteRow}>
              <StarRating value={note} onChange={onChangeNote} />
              <Text style={styles.noteValeur}>{note.toFixed(1).replace('.', ',')}</Text>
            </View>

            {oeuvresLiees.length > 0 ? (
              <>
                <Text style={styles.sectionTitre}>Œuvres présentées</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.oeuvresScroll}
                  contentContainerStyle={styles.oeuvresRow}
                >
                  {oeuvresLiees.map((a) => (
                    <Pressable key={a.id} style={styles.oeuvreCard} onPress={() => setArtworkOuvert(a)}>
                      <View style={styles.oeuvreCover}>
                        <ArtworkCover artwork={a} />
                      </View>
                      <Text style={styles.oeuvreTitre} numberOfLines={1}>
                        {a.titre}
                      </Text>
                      {a.annee ? <Text style={styles.oeuvreAnnee}>{a.annee}</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            {artistes.length > 0 ? (
              <>
                <Text style={styles.sectionTitre}>Dans le catalogue</Text>
                <Text style={styles.sectionSous}>
                  Artistes de l'exposition. Touchez un artiste pour voir ses œuvres.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.oeuvresScroll}
                  contentContainerStyle={styles.oeuvresRow}
                >
                  {artistes.map((artiste) => {
                    const n = artiste.oeuvres.length;
                    return (
                      <Pressable
                        key={artiste.nom}
                        style={styles.artisteCard}
                        onPress={() => setArtisteSelectionne(artiste.nom)}
                      >
                        <View style={styles.artisteCover}>
                          <ArtworkCover artwork={artiste.oeuvres[0]} width={400} />
                          <View style={styles.artisteVoile}>
                            <Text style={styles.artisteNombre}>{n}</Text>
                            <Text style={styles.artisteLabel}>{n > 1 ? 'œuvres' : 'œuvre'}</Text>
                          </View>
                        </View>
                        <Text style={styles.artisteNom} numberOfLines={2}>
                          {artiste.nom}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}
          </View>
        </ScrollView>

        <ArtisteOeuvresModal
          artiste={artisteActif ?? null}
          onClose={() => setArtisteSelectionne(null)}
          onFermerTout={() => {
            setArtisteSelectionne(null);
            onClose();
          }}
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
  content: { paddingBottom: 40 },
  hero: { height: 240, backgroundColor: colors.stone },
  boutonRond: {
    position: 'absolute',
    top: 50,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(23,21,19,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: { left: 16 },
  favoriButton: { right: 16 },
  sheet: { paddingHorizontal: 20, paddingTop: 20 },
  statut: { fontFamily: fonts.uiSemiBold, fontSize: 11, letterSpacing: 0.8, color: colors.accent },
  statutPassee: { color: colors.textSecondary },
  titre: { fontFamily: fonts.display, fontSize: 32, lineHeight: 35, color: colors.textPrimary, marginTop: 6 },
  sousTitre: { fontFamily: fonts.displayRegular, fontSize: 20, color: colors.textSecondary, marginTop: 2 },
  periode: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textPrimary, marginTop: 12 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tag: { backgroundColor: colors.stone, borderRadius: 16, paddingVertical: 5, paddingHorizontal: 12 },
  tagTexte: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.textPrimary },

  infos: { marginTop: 20, gap: 12 },
  infoLigne: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoTexte: { flex: 1 },
  infoPrincipal: { fontFamily: fonts.uiMedium, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  infoSecondaire: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, marginTop: 1 },

  boutonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.textPrimary,
    borderRadius: 28,
    height: 48,
    marginTop: 22,
  },
  boutonPrincipalTexte: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.surface },

  sectionTitre: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, marginTop: 28, marginBottom: 10 },
  sectionSous: { fontFamily: fonts.ui, fontSize: 12.5, color: colors.textSecondary, marginTop: -6, marginBottom: 10 },
  texte: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: colors.textPrimary },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteValeur: { fontFamily: fonts.uiSemiBold, fontSize: 16, color: colors.textPrimary },

  oeuvresScroll: { marginHorizontal: -20 },
  oeuvresRow: { paddingHorizontal: 20, gap: 12 },
  oeuvreCard: { width: 120 },
  oeuvreCover: { height: 96, borderRadius: 10, overflow: 'hidden' },
  oeuvreTitre: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.textPrimary, marginTop: 6 },
  oeuvreAnnee: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary },

  artisteCard: { width: 132 },
  artisteCover: { width: 132, height: 132, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.stone },
  artisteVoile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(158,35,69,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artisteNombre: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 40,
    color: colors.surface,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  artisteLabel: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    letterSpacing: 0.3,
    color: colors.surface,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  artisteNom: { fontFamily: fonts.uiMedium, fontSize: 13, lineHeight: 17, color: colors.textPrimary, marginTop: 8 },
});
