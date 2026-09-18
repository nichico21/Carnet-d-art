import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Artwork } from '../types/artwork';

/**
 * Couverture d'une œuvre : la vraie image quand on l'a (domaine public,
 * Wikimedia Commons), sinon un aplat des couleurs dominantes — utilisé
 * aussi en repli si l'image échoue à charger.
 * À placer dans un conteneur qui fixe hauteur/overflow/arrondi.
 */
export function ArtworkCover({ artwork }: { artwork: Artwork }) {
  const [echec, setEchec] = useState(false);

  if (artwork.imageUrl && !echec) {
    return (
      <Image
        source={{ uri: artwork.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={150}
        onError={() => setEchec(true)}
      />
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
