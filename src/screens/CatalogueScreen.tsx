import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ARTWORKS } from '../data/artworks';
import { Artwork } from '../types/artwork';
import { ArtworkCard } from '../components/ArtworkCard';
import { ArtworkDetail } from '../components/ArtworkDetail';
import { colors } from '../theme/colors';
import { useCarnet } from '../store/CarnetContext';

const ONGLETS = ['Catalogue', 'Mon carnet'] as const;

export function CatalogueScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>('Catalogue');
  const { notes, favoris, setNote, toggleFavori } = useCarnet();

  const data = useMemo(() => {
    if (onglet === 'Catalogue') return ARTWORKS;
    return ARTWORKS.filter((a) => favoris[a.id] || (notes[a.id] ?? 0) > 0);
  }, [onglet, favoris, notes]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Catalogue</Text>

      <View style={styles.ongletsRow}>
        {ONGLETS.map((o) => (
          <Pressable
            key={o}
            style={[styles.onglet, onglet === o && styles.ongletActif]}
            onPress={() => setOnglet(o)}
          >
            <Text style={[styles.ongletText, onglet === o && styles.ongletTextActif]}>{o}</Text>
          </Pressable>
        ))}
      </View>

      {onglet === 'Mon carnet' && data.length === 0 ? (
        <Text style={styles.vide}>
          Aucune œuvre pour l'instant. Note une œuvre ou ajoute-la en favori pour la retrouver ici.
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ArtworkCard artwork={item} onPress={() => setSelected(item)} />
          )}
        />
      )}

      <ArtworkDetail
        artwork={selected}
        onClose={() => setSelected(null)}
        note={selected ? notes[selected.id] ?? 0 : 0}
        onChangeNote={(note) => selected && setNote(selected.id, note)}
        favori={selected ? favoris[selected.id] ?? false : false}
        onToggleFavori={() => selected && toggleFavori(selected.id)}
        onNavigateTab={(tab) => {
          setSelected(null);
          navigation.navigate(tab as never);
        }}
        onOuvrirBoutique={(artworkId) => {
          setSelected(null);
          (navigation.navigate as (name: string, params?: object) => void)('Boutique', {
            artworkId,
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  ongletsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  onglet: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ongletActif: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ongletText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  ongletTextActif: {
    color: '#FFFFFF',
  },
  vide: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
