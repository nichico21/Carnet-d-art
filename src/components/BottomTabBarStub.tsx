import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const TABS = [
  { key: 'accueil', label: 'Accueil', icon: 'home-outline' as const },
  { key: 'explorer', label: 'Explorer', icon: 'search-outline' as const },
  { key: 'carte', label: 'Carte', icon: 'location-outline' as const },
  { key: 'carnet', label: 'Carnet', icon: 'bookmark-outline' as const },
  { key: 'profil', label: 'Profil', icon: 'person-outline' as const },
];

/**
 * Barre de navigation purement visuelle pour l'instant : la vraie
 * navigation entre écrans (Accueil, Explorer, Carte, Profil...) sera
 * branchée quand ces écrans existeront.
 */
export function BottomTabBarStub({ active = 'carnet' }: { active?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <View key={tab.key} style={styles.tab}>
            <Ionicons
              name={isActive ? (tab.icon.replace('-outline', '') as any) : tab.icon}
              size={22}
              color={isActive ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});
