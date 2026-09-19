import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exposition } from '../types/exposition';
import { colors } from '../theme/colors';

export function ExpositionCard({
  exposition,
  onPress,
}: {
  exposition: Exposition;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={[styles.cover, { backgroundColor: exposition.couleur }]}>
        <Ionicons name="business-outline" size={28} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.body}>
        <Text style={styles.titre} numberOfLines={2}>
          {exposition.titre}
        </Text>
        <Text style={styles.lieu}>
          {exposition.lieu}, {exposition.ville}
        </Text>
        <Text style={styles.dates}>
          {exposition.dateDebut} – {exposition.dateFin}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    gap: 12,
  },
  cover: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  titre: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lieu: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dates: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
