import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';

export function ProductCover({
  imageUrl,
  width = 400,
  contentFit = 'cover',
}: {
  imageUrl?: string;
  width?: number;
  contentFit?: 'cover' | 'contain';
}) {
  const [tentative, setTentative] = useState(0);
  const [echecDefinitif, setEchecDefinitif] = useState(false);
  const uri = imageUrl ? `${imageUrl}?width=${width}` : undefined;

  if (uri && !echecDefinitif) {
    return (
      <Image
        key={tentative}
        source={{ uri }}
        style={styles.image}
        contentFit={contentFit}
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
  image: { width: '100%', height: '100%' },
  repli: { flex: 1, backgroundColor: colors.border },
});