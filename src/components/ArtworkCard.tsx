import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Artwork, THEME_LABELS } from '../types/artwork';
import { colors } from '../theme/colors';

interface Props {
  artwork: Artwork;
  onPress: () => void;
}

export function ArtworkCard({ artwork, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cover}>
        {artwork.couleursDominantes.map((c) => (
          <View key={c.hex} style={[styles.swatch, { backgroundColor: c.hex }]} />
        ))}
      </View>
      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={1}>
          {artwork.titre}
        </Text>
        <Text style={styles.artiste}>
          {artwork.artiste}, {artwork.annee}
        </Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{THEME_LABELS[artwork.theme]}</Text>
          </View>
          {artwork.mouvements.slice(0, 1).map((m) => (
            <View key={m} style={styles.tag}>
              <Text style={styles.tagText}>{m}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    flexDirection: 'row',
    height: 120,
  },
  swatch: {
    flex: 1,
  },
  body: {
    padding: 12,
  },
  titre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  artiste: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
});
