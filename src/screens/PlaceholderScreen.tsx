import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export function PlaceholderScreen({ nom }: { nom: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>{nom}</Text>
      <Text style={styles.texte}>Bientôt disponible.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titre: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  texte: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
