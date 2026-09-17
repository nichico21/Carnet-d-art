import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Artwork } from '../../types/artwork';
import { colors } from '../../theme/colors';

export function NouveauteCard({ artwork }: { artwork: Artwork }) {
  const [favori, setFavori] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {artwork.couleursDominantes.map((c) => (
          <View key={c.hex} style={[styles.swatch, { backgroundColor: c.hex }]} />
        ))}
        <Pressable style={styles.heart} onPress={() => setFavori((v) => !v)} hitSlop={6}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={13}
            color={favori ? colors.negative : colors.textPrimary}
          />
        </Pressable>
      </View>
      <Text style={styles.titre} numberOfLines={1}>
        {artwork.titre}
      </Text>
      <Text style={styles.artiste} numberOfLines={1}>
        {artwork.artiste}
      </Text>
      <Text style={styles.annee}>{artwork.annee}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 104,
    marginRight: 12,
  },
  cover: {
    flexDirection: 'row',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swatch: {
    flex: 1,
  },
  heart: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  artiste: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  annee: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
