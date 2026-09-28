import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CONTENUS_VEILLE, DERNIERS_AJOUTS } from '../../data/veille.generated';
import { TYPE_VEILLE_LABELS, ContenuVeille } from '../../types/veille';
import { SelectionCard } from '../../components/veille/SelectionCard';
import { ContenuDetail } from '../../components/veille/ContenuDetail';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { ExploreStackParamList } from '../../navigation/ExploreStack';

const ONGLETS = ['Pour vous', 'Derniers ajouts', 'Les plus consultés'] as const;

export function VeilleAccueilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { veilleEnregistres, veilleDerniereConsultationId, setVeilleDerniereConsultation } = useCarnet();
  const [selectionne, setSelectionne] = useState<ContenuVeille | null>(null);

  function ouvrir(contenu: ContenuVeille) {
    setVeilleDerniereConsultation(contenu.id);
    setSelectionne(contenu);
  }

  const derniereConsultation =
    CONTENUS_VEILLE.find((c) => c.id === veilleDerniereConsultationId) ?? null;

  const compteursEnregistres = useMemo(() => {
    const enregistres = CONTENUS_VEILLE.filter((c) => veilleEnregistres[c.id]);
    const aLire = enregistres.filter((c) => c.type === 'article' || c.type === 'expo').length;
    const aEcouter = enregistres.filter((c) => c.type === 'podcast').length;
    const aRegarder = enregistres.filter((c) => c.type === 'documentaire' || c.type === 'video').length;
    return { aLire, aEcouter, aRegarder };
  }, [veilleEnregistres]);

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

        <View style={styles.ongletsRow}>
          {ONGLETS.map((o) => {
            const active = o === 'Pour vous';
            return (
              <Pressable
                key={o}
                style={styles.ongletItem}
                onPress={() => {
                  if (o === 'Derniers ajouts') navigation.navigate('DerniersAjouts');
                  if (o === 'Les plus consultés') navigation.navigate('PlusConsultes');
                }}
              >
                <Text style={[styles.ongletText, active && styles.ongletTextActive]}>{o}</Text>
                {active && <View style={styles.ongletUnderline} />}
              </Pressable>
            );
          })}
        </View>

        <Section title="Sélection pour vous">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {DERNIERS_AJOUTS.slice(0, 5).map((c) => (
              <SelectionCard key={c.id} contenu={c} onPress={() => ouvrir(c)} />
            ))}
          </ScrollView>
        </Section>

        {derniereConsultation && (
          <Section title="Reprendre vos contenus" noAction>
            <Pressable style={styles.reprendreCard} onPress={() => ouvrir(derniereConsultation)}>
              <View style={styles.reprendreThumb}>
                {derniereConsultation.imageUrl ? (
                  <Image
                    source={{ uri: derniereConsultation.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.border }]} />
                )}
              </View>
              <View style={styles.reprendreBody}>
                <Text style={styles.reprendreType}>
                  {TYPE_VEILLE_LABELS[derniereConsultation.type].toUpperCase()}
                </Text>
                <Text style={styles.reprendreTitre} numberOfLines={2}>
                  {derniereConsultation.titre}
                </Text>
              </View>
              <Ionicons name="play-circle" size={28} color={colors.accent} />
            </Pressable>
          </Section>
        )}

        <Section title="Vos contenus enregistrés" noAction>
          <View style={styles.tilesRow}>
            <Tile icon="book-outline" label="À lire" value={compteursEnregistres.aLire} />
            <Tile icon="headset-outline" label="À écouter" value={compteursEnregistres.aEcouter} />
            <Tile icon="videocam-outline" label="À regarder" value={compteursEnregistres.aRegarder} />
          </View>
        </Section>
      </ScrollView>
      <ContenuDetail contenu={selectionne} onClose={() => setSelectionne(null)} />
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

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
}) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  titre: { fontFamily: fonts.display, fontSize: 34, color: colors.textPrimary },
  sousTitre: {
    fontFamily: fonts.displayRegular,
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: 260,
  },
  ongletsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 18,
    marginBottom: 14,
  },
  ongletItem: { paddingBottom: 10 },
  ongletText: { fontFamily: fonts.display, fontSize: 18, color: colors.textSecondary },
  ongletTextActive: { color: colors.accent },
  ongletUnderline: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  section: { marginTop: 10, paddingLeft: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  voirTout: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.accent },
  hScroll: { marginRight: -20 },
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
  reprendreThumb: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden' },
  reprendreBody: { flex: 1 },
  reprendreType: {
    fontFamily: fonts.uiSemiBold,
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  reprendreTitre: { fontFamily: fonts.display, fontSize: 17, color: colors.textPrimary, marginTop: 2 },
  tilesRow: { flexDirection: 'row', gap: 10, paddingRight: 20, paddingBottom: 20 },
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
  tileValue: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
  tileLabel: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary },
});