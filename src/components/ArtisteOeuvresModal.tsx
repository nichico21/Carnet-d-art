import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Artwork } from '../types/artwork';
import { ArtisteExposition } from '../expositions/oeuvres';
import { ArtworkDetail } from './ArtworkDetail';
import { GridBlock, construireBlocs } from './ArtworkGrid';
import { useCarnet } from '../store/CarnetContext';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const FOND_FENETRE = colors.surface;
// Doit rester égal à CONTAINER_PADDING de ArtworkGrid.tsx.
const PADDING_GRILLE = 16;

interface Props {
  artiste: ArtisteExposition | null;
  onClose: () => void;
  /** Ferme cette fenêtre et la page de l'exposition (navigation vers un autre onglet). */
  onFermerTout: () => void;
}

export function ArtisteOeuvresModal({ artiste, onClose, onFermerTout }: Props) {
  const navigation = useNavigation();
  const { notes, favoris, setNote, toggleFavori } = useCarnet();
  const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);

  const blocs = useMemo(() => (artiste ? construireBlocs(artiste.oeuvres) : []), [artiste]);

  if (!artiste) return null;

  const n = artiste.oeuvres.length;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.fermer}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.titres}>
            <Text style={styles.titre} numberOfLines={1}>
              {artiste.nom}
            </Text>
            <Text style={styles.sousTitre}>
              {n} {n > 1 ? 'œuvres' : 'œuvre'} dans le catalogue
            </Text>
          </View>
        </View>

        <FlatList
          data={blocs}
          keyExtractor={(b) => b.key}
          renderItem={({ item }) => <GridBlock bloc={item} onPressItem={setArtworkOuvert} />}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.liste}
        />

        <ArtworkDetail
          artwork={artworkOuvert}
          onClose={() => setArtworkOuvert(null)}
          note={artworkOuvert ? notes[artworkOuvert.id] ?? 0 : 0}
          onChangeNote={(note) => artworkOuvert && setNote(artworkOuvert.id, note)}
          favori={artworkOuvert ? favoris[artworkOuvert.id] ?? false : false}
          onToggleFavori={() => artworkOuvert && toggleFavori(artworkOuvert.id)}
          onNavigateTab={(tab) => {
            setArtworkOuvert(null);
            onFermerTout();
            navigation.navigate(tab as never);
          }}
          onOuvrirBoutique={(artworkId) => {
            setArtworkOuvert(null);
            onFermerTout();
            (navigation.navigate as (name: string, params?: object) => void)('Boutique', {
              artworkId,
            });
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: FOND_FENETRE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: PADDING_GRILLE,
    paddingTop: 12,
    paddingBottom: 14,
  },
  fermer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.stone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titres: { flex: 1 },
  titre: { fontFamily: fonts.display, fontSize: 28, lineHeight: 30, color: colors.textPrimary },
  sousTitre: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  liste: { paddingHorizontal: PADDING_GRILLE, paddingBottom: 24 },
});