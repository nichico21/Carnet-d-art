import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';

export function AjoutListItem({ contenu }: { contenu: ContenuVeille }) {
  return (
    <View style={styles.row}>
      <View style={[styles.thumb, { backgroundColor: contenu.couleurs[0] }]} />
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.type, { color: TYPE_VEILLE_COLORS[contenu.type] }]}>
            {TYPE_VEILLE_LABELS[contenu.type].toUpperCase()}
          </Text>
          <Text style={styles.duree}>{contenu.duree}</Text>
        </View>
        <Text style={styles.titre} numberOfLines={2}>
          {contenu.titre}
        </Text>
        <Text style={styles.source}>{contenu.source}</Text>
      </View>
      <Pressable hitSlop={8}>
        <Ionicons name="bookmark-outline" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  body: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  type: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  duree: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  titre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 3,
  },
  source: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
