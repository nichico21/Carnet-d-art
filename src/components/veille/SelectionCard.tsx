import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';

export function SelectionCard({ contenu }: { contenu: ContenuVeille }) {
  const gradient =
    contenu.couleurs.length > 1 ? contenu.couleurs : [contenu.couleurs[0], contenu.couleurs[0]];

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.badgeRow}>
          <View
            style={[styles.badge, { backgroundColor: TYPE_VEILLE_COLORS[contenu.type] }]}
          >
            <Text style={styles.badgeText}>{TYPE_VEILLE_LABELS[contenu.type].toUpperCase()}</Text>
          </View>
          <Text style={styles.duree}>{contenu.duree}</Text>
        </View>
      </View>
      <Text style={styles.titre} numberOfLines={2}>
        {contenu.titre}
      </Text>
      <Text style={styles.source}>{contenu.source}</Text>
    </View>
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
  titre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  source: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
