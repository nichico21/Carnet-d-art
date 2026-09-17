import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpoAVenir } from '../../data/accueil';
import { colors } from '../../theme/colors';

export function ExpoAVenirCard({ expo }: { expo: ExpoAVenir }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cover, { backgroundColor: expo.couleur }]}>
        <Ionicons name="business-outline" size={26} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.body}>
        <Text style={styles.titre}>{expo.titre}</Text>
        <Text style={styles.lieu}>{expo.lieu}</Text>
        <Text style={styles.date}>{expo.dateFin}</Text>
        <View style={styles.footer}>
          <View style={styles.avatars}>
            <View style={[styles.avatar, { backgroundColor: colors.accent }]} />
            <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: '#C9A227' }]} />
            <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: '#2E9E6B' }]} />
          </View>
          <Text style={styles.footerText}>
            {expo.oeuvresLiees} œuvres liées à votre carnet
          </Text>
        </View>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 20;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cover: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 14,
  },
  titre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lieu: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  avatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  footerText: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
