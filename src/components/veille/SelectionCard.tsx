import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { SourceLogo } from './SourceLogo';

export function SelectionCard({ contenu, onPress }: { contenu: ContenuVeille; onPress: () => void }) {
  const [echec, setEchec] = useState(false);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cover}>
        {contenu.imageUrl && !echec ? (
          <Image
            source={{ uri: contenu.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            onError={() => setEchec(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.border }]} />
        )}
        <View style={styles.scrim} />
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: TYPE_VEILLE_COLORS[contenu.type] }]}>
            <Text style={styles.badgeText}>{TYPE_VEILLE_LABELS[contenu.type].toUpperCase()}</Text>
          </View>
          {contenu.duree && <Text style={styles.duree}>{contenu.duree}</Text>}
        </View>
      </View>
      <Text style={styles.titre} numberOfLines={2}>
        {contenu.titre}
      </Text>
      <View style={styles.sourceRow}>
        <SourceLogo url={contenu.url} size={12} />
        <Text style={styles.source}>{contenu.source}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 190,
    marginRight: 12,
  },
  cover: {
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  duree: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  titre: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: 8 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  source: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary },
});