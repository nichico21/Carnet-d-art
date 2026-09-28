// src/components/CategoryList.tsx
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { FacetteValeur } from '../data/artworks.generated';

export function CategoryList({
  items,
  onSelect,
}: {
  items: FacetteValeur[];
  onSelect: (valeur: string) => void;
}) {
  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.valeur}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onSelect(item.valeur)}>
          <Text style={styles.label} numberOfLines={1}>{item.valeur}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.nombre}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { fontSize: 15, color: colors.textPrimary, flex: 1, marginRight: 12 },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.accent },
});