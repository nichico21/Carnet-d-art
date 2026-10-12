import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { IDEES_GOUTS } from '../data/boutique';
import { PRODUITS_REELS } from '../data/boutique.generated';
import { ProductCard } from '../components/boutique/ProductCard';
import { ProduitDetail } from '../components/boutique/ProduitDetail';
import { GoutCircle } from '../components/boutique/GoutCircle';
import { CategorieBoutiqueId, Produit } from '../types/boutique';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { CarnetStackParamList } from '../navigation/CarnetStack';

const { width: LARGEUR_ECRAN } = Dimensions.get('window');
const MARGE = 20;
const ECART = 12;
const LARGEUR_TUILE = (LARGEUR_ECRAN - MARGE * 2 - ECART) / 2;

const CATEGORIES_BOUTIQUE: {
  id: CategorieBoutiqueId;
  label: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'reproductions', label: 'Reproductions', icone: 'image-outline' },
  { id: 'livres', label: 'Livres', icone: 'library-outline' },
  { id: 'objets', label: 'Objets', icone: 'cube-outline' },
  { id: 'deco', label: 'Déco', icone: 'home-outline' },
  { id: 'vetements', label: 'Vêtements', icone: 'shirt-outline' },
  { id: 'cadeaux', label: 'Cadeaux', icone: 'gift-outline' },
];

export function BoutiqueScreen() {
  const route = useRoute<RouteProp<CarnetStackParamList, 'Boutique'>>();
  const artworkId = route.params?.artworkId;

  const [categorie, setCategorie] = useState<CategorieBoutiqueId | null>(null);
  const [recherche, setRecherche] = useState('');
  const [produitSelectionne, setProduitSelectionne] = useState<Produit | null>(null);

  const compteursParCategorie = useMemo(() => {
    const compte: Record<string, number> = {};
    for (const p of PRODUITS_REELS) compte[p.categorie] = (compte[p.categorie] ?? 0) + 1;
    return compte;
  }, []);

  const produitsInspires = useMemo(
    () => (artworkId ? PRODUITS_REELS.filter((p) => p.oeuvreLieeId === artworkId) : []),
    [artworkId],
  );

  const resultatsRecherche = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return null;
    return PRODUITS_REELS.filter((p) =>
      [p.titre, p.sousTitre, p.sousCategorie].filter(Boolean).some((champ) => champ!.toLowerCase().includes(q)),
    );
  }, [recherche]);

  const produitsCategorie = useMemo(
    () => (categorie ? PRODUITS_REELS.filter((p) => p.categorie === categorie) : []),
    [categorie],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.titre}>Boutique</Text>
        <Text style={styles.sousTitre}>Prolongez votre passion pour l'art</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.textSecondary}
            value={recherche}
            onChangeText={(t) => {
              setRecherche(t);
              setCategorie(null);
            }}
          />
        </View>

        {resultatsRecherche ? (
          <Section title={`Résultats pour « ${recherche} »`} noAction>
            {resultatsRecherche.length === 0 ? (
              <Text style={styles.vide}>Aucun produit ne correspond à cette recherche.</Text>
            ) : (
              <View style={styles.grille}>
                {resultatsRecherche.map((p) => (
                  <ProductCard
                    key={p.id}
                    produit={p}
                    largeur={LARGEUR_TUILE}
                    onPress={() => setProduitSelectionne(p)}
                  />
                ))}
              </View>
            )}
          </Section>
        ) : categorie ? (
          <>
            <Pressable onPress={() => setCategorie(null)} style={styles.retourCategorie} hitSlop={8}>
              <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
              <Text style={styles.retourCategorieTexte}>Toutes les catégories</Text>
            </Pressable>
            <Text style={styles.sectionTitre}>
              {CATEGORIES_BOUTIQUE.find((c) => c.id === categorie)?.label}
            </Text>
            {produitsCategorie.length === 0 ? (
              <Text style={styles.vide}>Aucun produit dans cette catégorie pour l'instant.</Text>
            ) : (
              <View style={styles.grille}>
                {produitsCategorie.map((p) => (
                  <ProductCard
                    key={p.id}
                    produit={p}
                    largeur={LARGEUR_TUILE}
                    onPress={() => setProduitSelectionne(p)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <Section title="Catégories">
              <View style={styles.grille}>
                {CATEGORIES_BOUTIQUE.map((c) => (
                  <Pressable key={c.id} style={styles.tuile} onPress={() => setCategorie(c.id)}>
                    <Ionicons name={c.icone} size={22} color={colors.textPrimary} />
                    <View style={styles.tuileTexte}>
                      <Text style={styles.tuileLabel}>{c.label}</Text>
                      <Text style={styles.tuileSous}>{compteursParCategorie[c.id] ?? 0} produits</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Section>

            {produitsInspires.length > 0 && (
              <Section title="Inspirée par cette œuvre" noAction>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hScroll}
                  contentContainerStyle={styles.hScrollContent}
                >
                  {produitsInspires.map((p) => (
                    <ProductCard key={p.id} produit={p} onPress={() => setProduitSelectionne(p)} />
                  ))}
                </ScrollView>
              </Section>
            )}

            <Section title="Idées autour de vos goûts">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.hScroll}
                contentContainerStyle={styles.hScrollContent}
              >
                {IDEES_GOUTS.map((idee) => (
                  <GoutCircle key={idee.id} idee={idee} />
                ))}
              </ScrollView>
            </Section>

            <Section title="Tous les produits" noAction>
              {PRODUITS_REELS.length === 0 ? (
                <Text style={styles.vide}>Aucun produit collecté pour l'instant.</Text>
              ) : (
                <View style={styles.grille}>
                  {PRODUITS_REELS.map((p) => (
                    <ProductCard
                      key={p.id}
                      produit={p}
                      largeur={LARGEUR_TUILE}
                      onPress={() => setProduitSelectionne(p)}
                    />
                  ))}
                </View>
              )}
            </Section>
          </>
        )}
      </ScrollView>

      <ProduitDetail produit={produitSelectionne} onClose={() => setProduitSelectionne(null)} />
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
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: MARGE, paddingTop: 12, paddingBottom: 32 },
  titre: { fontFamily: fonts.display, fontSize: 34, color: colors.textPrimary },
  sousTitre: { fontFamily: fonts.displayRegular, fontSize: 17, color: colors.textSecondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontFamily: fonts.ui, fontSize: 14, color: colors.textPrimary },

  section: { marginTop: 26 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  voirTout: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.accent },
  sectionTitre: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, marginTop: 16, marginBottom: 14 },

  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART },
  tuile: {
    width: LARGEUR_TUILE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  tuileTexte: { flex: 1 },
  tuileLabel: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary },
  tuileSous: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  retourCategorie: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22 },
  retourCategorieTexte: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textPrimary },

  hScroll: { marginRight: -MARGE },
  hScrollContent: { gap: ECART },
  vide: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },
});