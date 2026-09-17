import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ContenuAssocie, TYPE_CONTENU_LABELS } from '../types/artwork';
import { colors } from '../theme/colors';

const TYPE_COLORS: Record<ContenuAssocie['type'], string> = {
  podcast: '#6C5CE7',
  documentaire: '#2E9E6B',
  article: '#2D7DD2',
  video: '#D97A34',
};

export function ContentCard({ contenu }: { contenu: ContenuAssocie }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.type, { color: TYPE_COLORS[contenu.type] }]}>
        {TYPE_CONTENU_LABELS[contenu.type].toUpperCase()}
      </Text>
      <Text style={styles.titre} numberOfLines={3}>
        {contenu.titre}
      </Text>
      <Text style={styles.source}>{contenu.source}</Text>
      <Text style={styles.duree}>{contenu.duree}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  type: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    minHeight: 34,
  },
  source: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  duree: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
