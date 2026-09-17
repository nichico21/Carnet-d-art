import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { DERNIERS_PRODUITS_VUS, IDEES_GOUTS, SELECTION_BOUTIQUE } from '../data/boutique';
import { ARTWORKS } from '../data/artworks';
import { ProductCard } from '../components/boutique/ProductCard';
import { GoutCircle } from '../components/boutique/GoutCircle';
import { colors } from '../theme/colors';
import { CarnetStackParamList } from '../navigation/CarnetStack';

const ONGLETS = ['Pour vous', 'Par artiste', 'Par musée', 'Par thème'];

export function BoutiqueScreen() {
  const route = useRoute<RouteProp<CarnetStackParamList, 'Boutique'>>();
  const artworkId = route.params?.artworkId;
  const artwork = artworkId ? ARTWORKS.find((a) => a.id === artworkId) : undefined;

  const [onglet, setOnglet] = useState('Pour vous');
  const [recherche, setRecherche] = useState('');

  const tousLesProduits = useMemo(
    () => [...SELECTION_BOUTIQUE, ...DERNIERS_PRODUITS_VUS],
    [],
  );

  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return null;
    return tousLesProduits.filter((p) =>
      [p.titre, p.sousTitre, p.categorie].filter(Boolean).some((champ) =>
        champ!.toLowerCase().includes(q),
      ),
    );
  }, [recherche, tousLesProduits]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.titre}>Boutique</Text>
        <Text style={styles.sousTitre}>Prolongez votre passion pour l'art</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un artiste, une œuvre..."
            placeholderTextColor={colors.textSecondary}
            value={recherche}
            onChangeText={setRecherche}
          />
        </View>

        <View style={styles.ongletsRow}>
          {ONGLETS.map((o) => (
            <Text
              key={o}
              onPress={() => setOnglet(o)}
              style={[styles.onglet, onglet === o && styles.ongletActif]}
            >
              {o}
            </Text>
          ))}
        </View>

        {resultatsRecherche ? (
          <Section title={`Résultats pour « ${recherche} »`} noAction>
            {resultatsRecherche.length === 0 ? (
              <Text style={styles.vide}>Aucun produit ne correspond à cette recherche.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {resultatsRecherche.map((p) => (
                  <ProductCard key={p.id} produit={p} />
                ))}
              </ScrollView>
            )}
          </Section>
        ) : onglet !== 'Pour vous' ? (
          <Text style={styles.vide}>Bientôt disponible.</Text>
        ) : (
          <>
            <Section title="Sélection pour vous">
              {artwork && (
                <Text style={styles.contexte}>
                  Inspirée par « {artwork.titre} »
                </Text>
              )}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {SELECTION_BOUTIQUE.map((p) => (
                  <ProductCard key={p.id} produit={p} />
                ))}
              </ScrollView>
            </Section>

            <Section title="Idées autour de vos goûts">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {IDEES_GOUTS.map((idee) => (
                  <GoutCircle key={idee.id} idee={idee} />
                ))}
              </ScrollView>
            </Section>

            <Section title="Derniers produits vus">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {DERNIERS_PRODUITS_VUS.map((p) => (
                  <ProductCard key={p.id} produit={p} />
                ))}
              </ScrollView>
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  noAction,
  children,
}: {
  title: string;
  noAction?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!noAction && <Text style={styles.voirTout}>Voir tout</Text>}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sousTitre: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  ongletsRow: {
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 18,
  },
  onglet: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingBottom: 10,
  },
  ongletActif: {
    color: colors.accent,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  voirTout: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  contexte: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginBottom: 10,
  },
  vide: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 30,
  },
});
