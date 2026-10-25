import React from 'react';
import { StyleSheet, View } from 'react-native';
import { opaciteDegrade } from '../../musees/musees';

const BANDES = 24;

/** Dégradé noir vers le bas, sans bibliothèque : des bandes de plus en plus opaques (comme la page d'un musée). */
export function DegradeSombre({ hauteur, opaciteMax = 0.8 }: { hauteur: number; opaciteMax?: number }) {
  return (
    <View pointerEvents="none" style={[styles.degrade, { height: hauteur }]}>
      {Array.from({ length: BANDES }, (_, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: `rgba(23,21,19,${opaciteDegrade(i, BANDES, opaciteMax)})` }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  degrade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
