import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PLUS_CONSULTES } from '../../data/veille.generated';
import { ContenuVeille } from '../../types/veille';
import { ClassementItem } from '../../components/veille/ClassementItem';
import { ContenuDetail } from '../../components/veille/ContenuDetail';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const PERIODES = ['Cette semaine', 'Ce mois-ci', 'Tous les temps'];

export function PlusConsultesScreen() {
  const navigation = useNavigation();
  const { setVeilleDerniereConsultation } = useCarnet();
  const [periode, setPeriode] = useState(PERIODES[0]);
  const [selectionne, setSelectionne] = useState<ContenuVeille | null>(null);

  function ouvrir(contenu: ContenuVeille) {
    setVeilleDerniereConsultation(contenu.id);
    setSelectionne(contenu);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.titre}>Les plus consultés</Text>
        <Ionicons name="filter-outline" size={20} color={colors.textPrimary} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodesRow}>
        {PERIODES.map((p) => {
          const active = p === periode;
          return (
            <Pressable
              key={p}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => setPeriode(p)}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{p}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {PLUS_CONSULTES.map((c, i) => (
          <ClassementItem key={c.id} contenu={c} rang={i + 1} onPress={() => ouvrir(c)} />
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
  periodesRow: { marginTop: 18, paddingLeft: 20, flexGrow: 0 },
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
});