import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { SourceLogo } from './SourceLogo';

/** Formate un compteur brut en affichage compact (ex. 12400 -> "12,4K vues"). */
function formaterAudience(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace('.0', '').replace('.', ',')}K vues`;
  }
  return `${n} vue${n > 1 ? 's' : ''}`;
}

export function ClassementItem({
  contenu,
  rang,
  onPress,
}: {
  contenu: ContenuVeille;
  rang: number;
  onPress: () => void;
}) {
  const [echec, setEchec] = useState(false);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rang}>{rang}</Text>
      <View style={styles.thumb}>
        {contenu.imageUrl && !echec ? (
          <Image
            source={{ uri: contenu.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            onError={() => setEchec(true)}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.border }]} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text style={[styles.type, { color: TYPE_VEILLE_COLORS[contenu.type] }]}>
            {TYPE_VEILLE_LABELS[contenu.type].toUpperCase()}
          </Text>
          {contenu.duree && <Text style={styles.duree}>{contenu.duree}</Text>}
        </View>
        <Text style={styles.titre} numberOfLines={2}>
          {contenu.titre}
        </Text>
        <View style={styles.sourceRow}>
          <SourceLogo url={contenu.url} size={12} />
          <Text style={styles.source}>{contenu.source}</Text>
        </View>
        {contenu.compteurConsultations > 0 && (
          <Text style={styles.audience}>{formaterAudience(contenu.compteurConsultations)}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rang: {
    width: 20,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  body: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  duree: { fontSize: 11, color: colors.textSecondary },
  titre: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, marginTop: 3 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  source: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary },
  audience: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});