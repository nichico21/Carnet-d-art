import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PLUS_CONSULTES } from '../../data/veille';
import { ClassementItem } from '../../components/veille/ClassementItem';
import { colors } from '../../theme/colors';

const PERIODES = ['Cette semaine', 'Ce mois-ci', 'Tous les temps'];

export function PlusConsultesScreen() {
  const navigation = useNavigation();
  const [periode, setPeriode] = useState(PERIODES[0]);

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
          <ClassementItem key={c.id} contenu={c} rang={i + 1} />
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
  periodesRow: {
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
});
