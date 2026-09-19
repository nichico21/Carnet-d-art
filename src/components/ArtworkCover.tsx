import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Artwork } from '../types/artwork';
import { colors } from '../theme/colors';

/**
 * Couverture d'une œuvre : la vraie image (domaine public, Wikimedia
 * Commons ou autre source), redimensionnée en vignette légère par défaut.
 * En cas d'échec (429, réseau...), jusqu'à 2 nouvelles tentatives avec un
 * délai croissant avant de basculer sur un aplat neutre en repli.
 * À placer dans un conteneur qui fixe hauteur/overflow/arrondi.
 */
export function ArtworkCover({ artwork, width = 500 }: { artwork: Artwork; width?: number }) {
  const [tentative, setTentative] = useState(0);
  const [echecDefinitif, setEchecDefinitif] = useState(false);
  const uri = artwork.imageUrl ? `${artwork.imageUrl}?width=${width}` : undefined;

  if (uri && !echecDefinitif) {
    return (
      <Image
        key={tentative}
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        onError={() => {
          if (tentative < 2) {
            setTimeout(() => setTentative((t) => t + 1), 1500 * (tentative + 1));
          } else {
            setEchecDefinitif(true);
          }
        }}
      />
    );
  }

  return <View style={styles.repli} />;
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  repli: {
    flex: 1,
    backgroundColor: colors.border,
  },
});