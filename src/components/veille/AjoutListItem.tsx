import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { useCarnet } from '../../store/CarnetContext';
import { SourceLogo } from './SourceLogo';

export function AjoutListItem({ contenu, onPress }: { contenu: ContenuVeille; onPress: () => void }) {
  const [echec, setEchec] = useState(false);
  const { veilleEnregistres, toggleVeilleEnregistre } = useCarnet();
  const enregistre = veilleEnregistres[contenu.id] ?? false;

  return (
    <View style={styles.row}>
      <Pressable style={styles.pressableBody} onPress={onPress}>
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
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={() => toggleVeilleEnregistre(contenu.id)}>
        <Ionicons
          name={enregistre ? 'bookmark' : 'bookmark-outline'}
          size={18}
          color={enregistre ? colors.accent : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  pressableBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden' },
  body: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  type: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  duree: { fontSize: 11, color: colors.textSecondary },
  titre: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, marginTop: 3 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  source: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary },
});