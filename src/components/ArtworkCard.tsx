import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Artwork } from '../types/artwork';
import { colors } from '../theme/colors';
import { ArtworkCover } from './ArtworkCover';
import { Badge } from './Badge';

interface Props {
  artwork: Artwork;
  onPress: () => void;
}

export function ArtworkCard({ artwork, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cover}>
        <ArtworkCover artwork={artwork} />
      </View>
      <View style={styles.body}>
        {artwork.statut === 'brouillon' && <Badge label="Non finalisée" />}
        <Text style={styles.titre} numberOfLines={1}>
          {artwork.titre}
        </Text>
        <Text style={styles.artiste}>
          {artwork.artiste}
          {artwork.annee ? `, ${artwork.annee}` : ''}
        </Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{artwork.mouvement}</Text>
          </View>
          {artwork.themes.slice(0, 1).map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
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
  cover: { height: 120 },
  body: { padding: 12, gap: 4 },
  titre: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  artiste: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
});