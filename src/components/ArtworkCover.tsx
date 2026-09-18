import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Artwork } from '../types/artwork';

/**
 * Couverture d'une œuvre : la vraie image quand on l'a (domaine public,
 * Wikimedia Commons), sinon un aplat des couleurs dominantes en repli.
 * À placer dans un conteneur qui fixe hauteur/overflow/arrondi.
 */
export function ArtworkCover({ artwork }: { artwork: Artwork }) {
  if (artwork.imageUrl) {
    return (
      <Image source={{ uri: artwork.imageUrl }} style={styles.image} resizeMode="cover" />
    );
  }

  return (
    <View style={styles.swatchRow}>
      {artwork.couleursDominantes.map((c) => (
        <View key={c.hex} style={[styles.swatch, { backgroundColor: c.hex }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  swatchRow: {
    flex: 1,
    flexDirection: 'row',
  },
  swatch: {
    flex: 1,
  },
});
