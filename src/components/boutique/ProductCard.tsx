import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ICONE_PRODUIT, Produit } from '../../types/boutique';
import { colors } from '../../theme/colors';

export function ProductCard({ produit }: { produit: Produit }) {
  const [favori, setFavori] = useState(false);

  return (
    <View style={styles.card}>
      <View style={[styles.cover, { backgroundColor: produit.couleur }]}>
        <Ionicons name={ICONE_PRODUIT[produit.type] as any} size={30} color="rgba(255,255,255,0.9)" />
        <Pressable style={styles.heart} onPress={() => setFavori((v) => !v)} hitSlop={6}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={15}
            color={favori ? colors.negative : colors.textPrimary}
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
      <Text style={styles.categorie} numberOfLines={1}>
        {produit.categorie}
      </Text>
      <Text style={styles.prix}>{produit.prix.toFixed(2).replace('.', ',')} €</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
  },
  cover: {
    height: 120,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  sousTitre: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 1,
  },
  categorie: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  prix: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
  },
});
