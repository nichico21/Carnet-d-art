import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';

export function ClassementItem({ contenu, rang }: { contenu: ContenuVeille; rang: number }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => contenu.url && Linking.openURL(contenu.url)}
    >
      <Text style={styles.rang}>{rang}</Text>
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
        {contenu.audience && <Text style={styles.audience}>{contenu.audience}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rang: {
    width: 20,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  thumb: {
    width: 60,
    height: 60,
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
  audience: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
