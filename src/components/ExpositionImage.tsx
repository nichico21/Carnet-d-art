import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';

export function ExpositionImage({
  imageUrl,
  contentFit = 'cover',
}: {
  imageUrl: string;
  contentFit?: 'cover' | 'contain';
}) {
  const [tentative, setTentative] = useState(0);
  const [echec, setEchec] = useState(false);

  if (echec) return <View style={styles.repli} />;

  return (
    <Image
      key={tentative}
      source={{ uri: imageUrl }}
      style={styles.image}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      onError={() => {
        if (tentative < 2) {
          setTimeout(() => setTentative((t) => t + 1), 1500 * (tentative + 1));
        } else {
          setEchec(true);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  repli: { flex: 1, backgroundColor: colors.stone },
});