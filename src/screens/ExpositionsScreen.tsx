import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { EXPOSITIONS } from '../data/expositions';
import { Exposition, StatutExposition } from '../types/exposition';
import { ExpositionCard } from '../components/ExpositionCard';
import { ExpositionDetail } from '../components/ExpositionDetail';
import { colors } from '../theme/colors';
import { useCarnet } from '../store/CarnetContext';

const ONGLETS: { label: string; statut: StatutExposition }[] = [
  { label: "À l'affiche", statut: 'a_laffiche' },
  { label: 'À venir', statut: 'a_venir' },
  { label: 'Passées', statut: 'passee' },
];

export function ExpositionsScreen() {
  const navigation = useNavigation();
  const [statut, setStatut] = useState<StatutExposition>('a_laffiche');
  const [selected, setSelected] = useState<Exposition | null>(null);
  const { expositionNotes, setExpositionNote } = useCarnet();

  const data = useMemo(() => EXPOSITIONS.filter((e) => e.statut === statut), [statut]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.titre}>Expositions</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.ongletsRow}>
        {ONGLETS.map((o) => {
          const active = o.statut === statut;
          return (
            <Pressable
              key={o.statut}
              style={[styles.onglet, active && styles.ongletActif]}
              onPress={() => setStatut(o.statut)}
            >
              <Text style={[styles.ongletText, active && styles.ongletTextActif]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data.length === 0 ? (
          <Text style={styles.vide}>Aucune exposition dans cette catégorie.</Text>
        ) : (
          data.map((e) => (
            <ExpositionCard key={e.id} exposition={e} onPress={() => setSelected(e)} />
          ))
        )}
      </ScrollView>

      <ExpositionDetail
        exposition={selected}
        onClose={() => setSelected(null)}
        note={selected ? expositionNotes[selected.id] ?? 0 : 0}
        onChangeNote={(note) => selected && setExpositionNote(selected.id, note)}
      />
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
  ongletsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  onglet: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ongletActif: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ongletText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  ongletTextActif: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  vide: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
