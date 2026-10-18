import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exposition, StatutExposition } from '../types/exposition';
import { ExpositionImage } from './ExpositionImage';
import { formaterPeriode } from '../expositions/dates';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const LIBELLE_STATUT: Record<StatutExposition, string> = {
  a_laffiche: 'EN COURS',
  a_venir: 'À VENIR',
  passee: 'TERMINÉE',
};

interface Props {
  exposition: Exposition;
  statut: StatutExposition;
  favori: boolean;
  onToggleFavori: () => void;
  onPress: () => void;
}

export function ExpositionCard({ exposition, statut, favori, onToggleFavori, onPress }: Props) {
  const tags = [exposition.type, ...exposition.epoques].join(' · ');

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.image}>
        <ExpositionImage imageUrl={exposition.imageUrl} />
        <Pressable style={styles.coeur} onPress={onToggleFavori} hitSlop={8}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={18}
            color={favori ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </View>
      <View style={styles.corps}>
        <Text style={[styles.statut, statut === 'passee' ? styles.statutPassee : null]}>
          {LIBELLE_STATUT[statut]}
        </Text>
        <Text style={styles.titre}>{exposition.titre}</Text>
        {exposition.sousTitre ? <Text style={styles.sousTitre}>{exposition.sousTitre}</Text> : null}
        <Text style={styles.lieu}>
          {exposition.lieu}, {exposition.ville}
        </Text>
        <Text style={styles.dates}>
          {formaterPeriode(exposition.dateDebut, exposition.dateFin, true)}
        </Text>
        <Text style={styles.tags}>{tags}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: { height: 170, backgroundColor: colors.stone },
  coeur: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(252,251,248,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corps: { padding: 16 },
  statut: { fontFamily: fonts.uiSemiBold, fontSize: 10, letterSpacing: 0.8, color: colors.accent },
  statutPassee: { color: colors.textSecondary },
  titre: { fontFamily: fonts.display, fontSize: 24, lineHeight: 27, color: colors.textPrimary, marginTop: 6 },
  sousTitre: { fontFamily: fonts.displayRegular, fontSize: 17, color: colors.textSecondary, marginTop: 2 },
  lieu: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textPrimary, marginTop: 10 },
  dates: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tags: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 10 },
});