import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IdeeGout } from '../../types/boutique';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function GoutCircle({ idee }: { idee: IdeeGout }) {
  return (
    <View style={styles.item}>
      <View style={[styles.cercle, { backgroundColor: idee.couleur }]}>
        <Ionicons name="color-palette-outline" size={22} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {idee.label}
      </Text>
      <Text style={styles.nombre}>{idee.nombreProduits} produits</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { width: 90, alignItems: 'center' },
  cercle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.uiSemiBold, fontSize: 12, color: colors.textPrimary, marginTop: 6 },
  nombre: { fontFamily: fonts.ui, fontSize: 10, color: colors.textSecondary, marginTop: 1 },
});