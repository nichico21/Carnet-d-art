import React, { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text } from 'react-native';
import { ARTWORKS } from '../data/artworks';
import { Artwork } from '../types/artwork';
import { ArtworkCard } from '../components/ArtworkCard';
import { ArtworkDetail } from '../components/ArtworkDetail';
import { colors } from '../theme/colors';

export function CatalogueScreen() {
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [favoris, setFavoris] = useState<Record<string, boolean>>({});

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Catalogue</Text>
      <FlatList
        data={ARTWORKS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ArtworkCard artwork={item} onPress={() => setSelected(item)} />
        )}
      />
      <ArtworkDetail
        artwork={selected}
        onClose={() => setSelected(null)}
        note={selected ? notes[selected.id] ?? 0 : 0}
        onChangeNote={(note) =>
          selected && setNotes((prev) => ({ ...prev, [selected.id]: note }))
        }
        favori={selected ? favoris[selected.id] ?? false : false}
        onToggleFavori={() =>
          selected &&
          setFavoris((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }))
        }
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
    paddingBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
