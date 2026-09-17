import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export const TABS = [
  { key: 'Accueil', label: 'Accueil', icon: 'home-outline' as const },
  { key: 'Explorer', label: 'Explorer', icon: 'search-outline' as const },
  { key: 'Carte', label: 'Carte', icon: 'location-outline' as const },
  { key: 'Carnet', label: 'Carnet', icon: 'bookmark-outline' as const },
  { key: 'Profil', label: 'Profil', icon: 'person-outline' as const },
];

interface Props {
  active: string;
  onPress: (key: string) => void;
}

export function CustomTabBar({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onPress(tab.key)}>
            <Ionicons
              name={isActive ? (tab.icon.replace('-outline', '') as any) : tab.icon}
              size={22}
              color={isActive ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
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
