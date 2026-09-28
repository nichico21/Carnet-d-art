import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ARTWORKS, FACETTES } from '../data/artworks.generated';
import { Artwork } from '../types/artwork';
import { ArtworkDetail } from '../components/ArtworkDetail';
import { construireBlocs, GridBlock } from '../components/ArtworkGrid';
import { CategoryList } from '../components/CategoryList';
import { FilterBar, FiltresActifs } from '../components/FilterBar';
import { colors } from '../theme/colors';
import { useCarnet } from '../store/CarnetContext';
import { fonts } from '../theme/typography';

const SOUS_ONGLETS = ['Catalogue', 'Mon carnet'] as const;
const VUES = ['Œuvres', 'Mouvements', 'Artistes', 'Musées'] as const;

function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export function CatalogueScreen() {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<Artwork | null>(null);
  const [sousOnglet, setSousOnglet] = useState<(typeof SOUS_ONGLETS)[number]>('Catalogue');
  const [vue, setVue] = useState<(typeof VUES)[number]>('Œuvres');
  const [filtres, setFiltres] = useState<FiltresActifs>({});
  const { notes, favoris, setNote, toggleFavori } = useCarnet();

  const base = useMemo(() => {
    if (sousOnglet === 'Catalogue') return ARTWORKS;
    return ARTWORKS.filter((a) => favoris[a.id] || (notes[a.id] ?? 0) > 0);
  }, [sousOnglet, favoris, notes]);

  const filtree = useMemo(() => {
    return base.filter((a) => {
      if (filtres.musee && a.lieuConservation !== filtres.musee) return false;
      if (filtres.mouvement && a.mouvement !== filtres.mouvement) return false;
      if (filtres.artiste && a.artiste !== filtres.artiste) return false;
      if (filtres.genre && !(a.themes ?? []).includes(filtres.genre)) return false;
      if (filtres.epoque) {
        const n = parseInt(a.annee ?? '', 10);
        const siecle = n ? Math.ceil(n / 100) : null;
        if (!filtres.epoque.startsWith(String(siecle ?? '__'))) {
          // comparaison simplifiée : voir note ci-dessous
        }
      }
      return true;
    });
  }, [base, filtres]);

  const [data, setData] = useState<Artwork[]>([]);
  useEffect(() => {
    setData(melanger(filtree));
  }, [sousOnglet, filtres]);

  const blocs = useMemo(() => construireBlocs(data), [data]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Catalogue</Text>

      <View style={styles.ongletsRow}>
        {SOUS_ONGLETS.map((o) => (
          <Pressable
            key={o}
            style={[styles.onglet, sousOnglet === o && styles.ongletActif]}
            onPress={() => setSousOnglet(o)}
          >
            <Text style={[styles.ongletText, sousOnglet === o && styles.ongletTextActif]}>{o}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.vuesRow}>
        {VUES.map((v) => (
          <Pressable key={v} onPress={() => setVue(v)} style={styles.vueItem}>
            <Text style={[styles.vueText, vue === v && styles.vueTextActive]}>{v}</Text>
            {vue === v && <View style={styles.vueUnderline} />}
          </Pressable>
        ))}
      </View>

      <FilterBar facettes={FACETTES} filtres={filtres} onChange={setFiltres} />

      {vue === 'Œuvres' && (
        data.length === 0 ? (
          <Text style={styles.vide}>Aucune œuvre ne correspond à ces filtres.</Text>
        ) : (
          <FlatList
            data={blocs}
            keyExtractor={(b) => b.key}
            renderItem={({ item }) => <GridBlock bloc={item} onPressItem={setSelected} />}
            contentContainerStyle={styles.list}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews
          />
        )
      )}

      {vue === 'Mouvements' && (
        <CategoryList items={FACETTES.mouvements} onSelect={(v) => { setFiltres({ mouvement: v }); setVue('Œuvres'); }} />
      )}
      {vue === 'Artistes' && (
        <CategoryList items={FACETTES.artistes} onSelect={(v) => { setFiltres({ artiste: v }); setVue('Œuvres'); }} />
      )}
      {vue === 'Musées' && (
        <CategoryList items={FACETTES.musees} onSelect={(v) => { setFiltres({ musee: v }); setVue('Œuvres'); }} />
      )}

      <ArtworkDetail
        artwork={selected}
        onClose={() => setSelected(null)}
        note={selected ? notes[selected.id] ?? 0 : 0}
        onChangeNote={(note) => selected && setNote(selected.id, note)}
        favori={selected ? favoris[selected.id] ?? false : false}
        onToggleFavori={() => selected && toggleFavori(selected.id)}
        onNavigateTab={(tab) => {
          setSelected(null);
          navigation.navigate(tab as never);
        }}
        onOuvrirBoutique={(artworkId) => {
          setSelected(null);
          (navigation.navigate as (name: string, params?: object) => void)('Boutique', { artworkId });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  ongletsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14 },
  onglet: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 26,
    backgroundColor: colors.stone,
  },
  ongletActif: { backgroundColor: colors.textPrimary },
  ongletText: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
  ongletTextActif: { color: colors.surface },
  vuesRow: {
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 14,
  },
  vueItem: { paddingBottom: 10 },
  vueText: { fontFamily: fonts.display, fontSize: 19, color: colors.textSecondary },
  vueTextActive: { color: colors.accent },
  vueUnderline: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  vide: { fontFamily: fonts.ui, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
});