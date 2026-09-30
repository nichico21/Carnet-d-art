import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produit } from '../../types/boutique';
import { ProductCover } from './ProductCover';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function ProductCard({
  produit,
  onPress,
  largeur = 140,
}: {
  produit: Produit;
  onPress?: () => void;
  largeur?: number;
}) {
  const [favori, setFavori] = useState(false);
  const hauteurCover = Math.round(largeur * 0.9);

  return (
    <Pressable style={[styles.card, { width: largeur }]} onPress={onPress}>
      <View style={[styles.cover, { height: hauteurCover }]}>
        <ProductCover imageUrl={produit.imageUrl} width={Math.round(largeur * 2)} />
        <Pressable style={styles.heart} onPress={() => setFavori((v) => !v)} hitSlop={6}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={15}
            color={favori ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </View>
      <Text style={styles.titre} numberOfLines={1}>
        {produit.titre}
      </Text>
      {produit.sousTitre && (
        <Text style={styles.sousTitre} numberOfLines={1}>
          {produit.sousTitre}
        </Text>
      )}
      <Text style={styles.sousCategorie} numberOfLines={1}>
        {produit.sousCategorie}
      </Text>
      <Text style={styles.prix}>{produit.prix.toFixed(2).replace('.', ',')} €</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {},
  cover: { borderRadius: 12, overflow: 'hidden' },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(252,251,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: { fontFamily: fonts.display, fontSize: 16, color: colors.textPrimary, marginTop: 8 },
  sousTitre: { fontFamily: fonts.ui, fontSize: 12, color: colors.textPrimary, marginTop: 1 },
  sousCategorie: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  prix: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary, marginTop: 4 },
});