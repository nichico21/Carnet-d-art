import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DERNIERS_AJOUTS } from '../../data/veille';
import { TypeContenuVeille } from '../../types/veille';
import { AjoutListItem } from '../../components/veille/AjoutListItem';
import { colors } from '../../theme/colors';

const FILTRES: { label: string; type: TypeContenuVeille | 'tous' }[] = [
  { label: 'Tous', type: 'tous' },
  { label: 'Podcasts', type: 'podcast' },
  { label: 'Vidéos', type: 'video' },
  { label: 'Articles', type: 'article' },
  { label: 'Expos', type: 'expo' },
];

export function DerniersAjoutsScreen() {
  const navigation = useNavigation();
  const [filtre, setFiltre] = useState<TypeContenuVeille | 'tous'>('tous');

  const groupes = useMemo(() => {
    const items =
      filtre === 'tous' ? DERNIERS_AJOUTS : DERNIERS_AJOUTS.filter((c) => c.type === filtre);
    const parGroupe = new Map<string, typeof DERNIERS_AJOUTS>();
    for (const item of items) {
      const cle = item.dateGroupe ?? '';
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
        {groupes.length === 0 && (
          <Text style={styles.vide}>Aucun contenu pour ce filtre.</Text>
        )}
        {groupes.map(([groupe, items]) => (
          <View key={groupe} style={styles.groupe}>
            {groupe.length > 0 && <Text style={styles.groupeTitre}>{groupe}</Text>}
            {items.map((c) => (
              <AjoutListItem key={c.id} contenu={c} />
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titre: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filtresRow: {
    marginTop: 16,
    paddingLeft: 20,
    flexGrow: 0,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  groupe: {
    marginBottom: 12,
  },
  groupeTitre: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  vide: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
