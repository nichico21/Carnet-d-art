import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DERNIERS_AJOUTS } from '../../data/veille.generated';
import { TypeContenuVeille, ContenuVeille } from '../../types/veille';
import { AjoutListItem } from '../../components/veille/AjoutListItem';
import { ContenuDetail } from '../../components/veille/ContenuDetail';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const FILTRES: { label: string; type: TypeContenuVeille | 'tous' }[] = [
  { label: 'Tous', type: 'tous' },
  { label: 'Podcasts', type: 'podcast' },
  { label: 'Vidéos', type: 'video' },
  { label: 'Articles', type: 'article' },
  { label: 'Expos', type: 'expo' },
];

/** Transforme une date ISO (dateAjout) en libellé de groupe lisible. */
function libelleGroupe(dateAjoutISO: string): string {
  const date = new Date(dateAjoutISO);
  const aujourdhui = new Date();
  const hier = new Date(aujourdhui);
  hier.setDate(hier.getDate() - 1);

  const memeJour = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (memeJour(date, aujourdhui)) return "Aujourd'hui";
  if (memeJour(date, hier)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

export function DerniersAjoutsScreen() {
  const navigation = useNavigation();
  const { setVeilleDerniereConsultation } = useCarnet();
  const [filtre, setFiltre] = useState<TypeContenuVeille | 'tous'>('tous');
  const [selectionne, setSelectionne] = useState<ContenuVeille | null>(null);

  function ouvrir(contenu: ContenuVeille) {
    setVeilleDerniereConsultation(contenu.id);
    setSelectionne(contenu);
  }

  const groupes = useMemo(() => {
    const items =
      filtre === 'tous' ? DERNIERS_AJOUTS : DERNIERS_AJOUTS.filter((c) => c.type === filtre);
    const parGroupe = new Map<string, typeof DERNIERS_AJOUTS>();
    for (const item of items) {
      const cle = libelleGroupe(item.dateAjout);
      if (!parGroupe.has(cle)) parGroupe.set(cle, []);
      parGroupe.get(cle)!.push(item);
    }
    return Array.from(parGroupe.entries());
  }, [filtre]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.titre}>Derniers ajouts</Text>
        <Ionicons name="filter-outline" size={20} color={colors.textPrimary} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtresRow}>
        {FILTRES.map((f) => {
          const active = f.type === filtre;
          return (
            <Pressable
              key={f.type}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setFiltre(f.type)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groupes.length === 0 && <Text style={styles.vide}>Aucun contenu pour ce filtre.</Text>}
        {groupes.map(([groupe, items]) => (
          <View key={groupe} style={styles.groupe}>
            <Text style={styles.groupeTitre}>{groupe}</Text>
            {items.map((c) => (
              <AjoutListItem key={c.id} contenu={c} onPress={() => ouvrir(c)} />
            ))}
          </View>
        ))}
      </ScrollView>

      <ContenuDetail contenu={selectionne} onClose={() => setSelectionne(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titre: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  filtresRow: { marginTop: 18, paddingLeft: 20, flexGrow: 0 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: { backgroundColor: colors.stone, borderColor: colors.stone },
  pillText: { fontFamily: fonts.uiMedium, fontSize: 14, color: colors.textSecondary },
  pillTextActive: { color: colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  groupe: { marginBottom: 16 },
  groupeTitre: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  vide: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
});