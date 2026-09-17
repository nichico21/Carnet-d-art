import React from 'react';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CONTENUS_ENREGISTRES,
  REPRENDRE_VOS_CONTENUS,
  SELECTION_POUR_VOUS,
} from '../../data/veille';
import { SelectionCard } from '../../components/veille/SelectionCard';
import { colors } from '../../theme/colors';
import { ExploreStackParamList } from '../../navigation/ExploreStack';

export function VeilleAccueilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { contenu: enCours, progression } = REPRENDRE_VOS_CONTENUS;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.titre}>Veille culturelle</Text>
            <Text style={styles.sousTitre}>
              Votre sélection personnalisée pour nourrir votre curiosité.
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </View>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, styles.pillActive]}>
            <Text style={styles.pillTextActive}>Pour vous</Text>
          </View>
          <Pressable style={styles.pill} onPress={() => navigation.navigate('DerniersAjouts')}>
            <Text style={styles.pillText}>Derniers ajouts</Text>
          </Pressable>
          <Pressable style={styles.pill} onPress={() => navigation.navigate('PlusConsultes')}>
            <Text style={styles.pillText}>Les plus consultés</Text>
          </Pressable>
        </View>

        <Section title="Sélection pour vous">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {SELECTION_POUR_VOUS.map((c) => (
              <SelectionCard key={c.id} contenu={c} />
            ))}
          </ScrollView>
        </Section>

        <Section title="Reprendre vos contenus">
          <Pressable
            style={styles.reprendreCard}
            onPress={() => enCours.url && Linking.openURL(enCours.url)}
          >
            <View style={[styles.reprendreThumb, { backgroundColor: enCours.couleurs[0] }]}>
              <View style={styles.playButton}>
                <Ionicons name="play" size={16} color={colors.accent} />
              </View>
            </View>
            <View style={styles.reprendreBody}>
              <Text style={styles.reprendreType}>{enCours.source}</Text>
              <Text style={styles.reprendreTitre} numberOfLines={2}>
                {enCours.titre}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progression * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.progressPct}>{Math.round(progression * 100)}%</Text>
          </Pressable>
        </Section>

        <Section title="Vos contenus enregistrés" noAction>
          <View style={styles.tilesRow}>
            <Tile icon="book-outline" label="À lire" value={CONTENUS_ENREGISTRES.aLire} />
            <Tile icon="headset-outline" label="À écouter" value={CONTENUS_ENREGISTRES.aEcouter} />
            <Tile
              icon="videocam-outline"
              label="À regarder"
              value={CONTENUS_ENREGISTRES.aRegarder}
            />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  noAction,
  children,
}: {
  title: string;
  noAction?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!noAction && <Text style={styles.voirTout}>Voir tout</Text>}
      </View>
      {children}
    </View>
  );
}

function Tile({ icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sousTitre: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: 260,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 24,
    paddingLeft: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  voirTout: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  hScroll: {
    marginRight: -20,
  },
  reprendreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    marginRight: 20,
    gap: 12,
  },
  reprendreThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reprendreBody: {
    flex: 1,
  },
  reprendreType: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  reprendreTitre: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  progressPct: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
    paddingBottom: 20,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 4,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tileLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
