import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductCover } from './ProductCover';
import { Produit } from '../../types/boutique';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

export function ProduitDetail({ produit, onClose }: { produit: Produit | null; onClose: () => void }) {
  if (!produit) return null;

  const offres = produit.offres && produit.offres.length > 0
    ? produit.offres
    : produit.url
      ? [{ source: 'Voir le produit', url: produit.url, prix: produit.prix, dateReleve: null }]
      : [];

  return (
    <Modal visible={produit !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <ProductCover imageUrl={produit.imageUrl} width={900} contentFit="contain" />
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.surface} />
            </Pressable>
          </View>

          <View style={styles.sheet}>
            <Text style={styles.titre}>{produit.titre}</Text>
            {produit.sousTitre && <Text style={styles.sousTitre}>{produit.sousTitre}</Text>}
            <Text style={styles.categorie}>{produit.sousCategorie}</Text>

            <Text style={styles.sectionTitre}>
              {offres.length > 1 ? 'Comparer les prix' : 'Prix'}
            </Text>
            {offres.map((offre) => (
              <Pressable
                key={offre.source + offre.url}
                style={styles.offreCard}
                onPress={() => Linking.openURL(offre.url)}
              >
                <View style={styles.offreInfo}>
                  <Text style={styles.offreSource}>{offre.source}</Text>
                  {offre.dateReleve && (
                    <Text style={styles.offreDate}>Prix relevé le {offre.dateReleve}</Text>
                  )}
                </View>
                <View style={styles.offreDroite}>
                  <Text style={styles.offrePrix}>{offre.prix.toFixed(2).replace('.', ',')} €</Text>
                  <Ionicons name="open-outline" size={16} color={colors.accent} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 320, backgroundColor: colors.stone },
  closeButton: {
    position: 'absolute', top: 50, left: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(23,21,19,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  sheet: { padding: 20 },
  titre: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary },
  sousTitre: { fontFamily: fonts.ui, fontSize: 14, color: colors.textPrimary, marginTop: 4 },
  categorie: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionTitre: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginTop: 24, marginBottom: 12 },
  offreCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  offreInfo: {},
  offreSource: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.textPrimary },
  offreDate: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  offreDroite: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offrePrix: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.textPrimary },
});