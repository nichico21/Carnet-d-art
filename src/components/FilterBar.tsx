// src/components/FilterBar.tsx
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FacetteValeur } from '../data/artworks.generated';
import { fonts } from '../theme/typography';

export interface FiltresActifs {
  epoque?: string;
  musee?: string;
  mouvement?: string;
  artiste?: string;
  genre?: string;
}

interface Props {
  facettes: {
    epoques: FacetteValeur[];
    musees: FacetteValeur[];
    mouvements: FacetteValeur[];
    artistes: FacetteValeur[];
    genres: FacetteValeur[];
  };
  filtres: FiltresActifs;
  onChange: (f: FiltresActifs) => void;
}

const CATEGORIES: { cle: keyof FiltresActifs; label: string; facette: keyof Props['facettes'] }[] = [
  { cle: 'epoque', label: 'Époque', facette: 'epoques' },
  { cle: 'musee', label: 'Musée', facette: 'musees' },
  { cle: 'mouvement', label: 'Mouvement', facette: 'mouvements' },
  { cle: 'artiste', label: 'Artiste', facette: 'artistes' },
  { cle: 'genre', label: 'Genre', facette: 'genres' },
];

export function FilterBar({ facettes, filtres, onChange }: Props) {
  const [categorieOuverte, setCategorieOuverte] = useState<keyof FiltresActifs | null>(null);

  const toggle = (cle: keyof FiltresActifs, valeur: string) => {
    onChange({ ...filtres, [cle]: filtres[cle] === valeur ? undefined : valeur });
    setCategorieOuverte(null);
  };

  const categorieActive = CATEGORIES.find((c) => c.cle === categorieOuverte);
  const nbActifs = Object.values(filtres).filter(Boolean).length;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row} contentContainerStyle={styles.rowContent}>
        {CATEGORIES.map((c) => {
  const actif = Boolean(filtres[c.cle]);
  return (
    <View key={c.cle} style={styles.pillWrapper}>
      <Pressable
        style={[styles.pill, actif && styles.pillActive]}
        onPress={() => setCategorieOuverte(c.cle)}
      >
        <Text style={[styles.pillText, actif && styles.pillTextActive]} numberOfLines={1}>
          {filtres[c.cle] ?? c.label}
        </Text>
        {actif ? (
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              onChange({ ...filtres, [c.cle]: undefined });
            }}
          >
            <Ionicons name="close-circle" size={14} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
        )}
      </Pressable>
    </View>
  );
})}
        {nbActifs > 0 && (
          <Pressable style={styles.clearPill} onPress={() => onChange({})}>
            <Text style={styles.clearText}>Réinitialiser</Text>
          </Pressable>
        )}
      </ScrollView>

      <Modal visible={categorieOuverte !== null} transparent animationType="slide" onRequestClose={() => setCategorieOuverte(null)}>
        <Pressable style={styles.backdrop} onPress={() => setCategorieOuverte(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{categorieActive?.label}</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {categorieActive &&
                facettes[categorieActive.facette].map((f) => (
                  <Pressable
                    key={f.valeur}
                    style={styles.option}
                    onPress={() => toggle(categorieActive.cle, f.valeur)}
                  >
                    <Text style={styles.optionText}>{f.valeur}</Text>
                    <Text style={styles.optionCount}>{f.nombre}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
  height: 50,
  marginBottom: 14,
},
rowContent: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 20,
},
  pillWrapper: { marginRight: 8 },
  pill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 6,
  height: 34,
  borderRadius: 19,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
},
  pillActive: { backgroundColor: colors.stone, borderColor: colors.stone },
pillText: { fontFamily: fonts.display, fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  pillTextActive: { color: colors.textPrimary },
  clearPill: { justifyContent: 'center', paddingHorizontal: 4 },
  clearText: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.accent },
  backdrop: { flex: 1, backgroundColor: 'rgba(23,21,19,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, marginBottom: 14 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontFamily: fonts.ui, fontSize: 15, color: colors.textPrimary },
  optionCount: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary },
});