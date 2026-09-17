import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ARTWORKS } from '../data/artworks';
import {
  EXPOSITIONS_A_VENIR,
  NOUVEAUTES_IDS,
  PARCE_QUE_VOUS_AIMEZ,
  SELECTION_ACCUEIL_ID,
} from '../data/accueil';
import { NouveauteCard } from '../components/accueil/NouveauteCard';
import { ExpoAVenirCard } from '../components/accueil/ExpoAVenirCard';
import { colors } from '../theme/colors';

const ONGLETS = ['Pour vous', 'Artistes', 'Mouvements', 'Thèmes'];

export function AccueilScreen() {
  const [onglet, setOnglet] = useState('Pour vous');
  const [favoriSelection, setFavoriSelection] = useState(false);

  const selection = ARTWORKS.find((a) => a.id === SELECTION_ACCUEIL_ID)!;
  const nouveautes = NOUVEAUTES_IDS.map((id) => ARTWORKS.find((a) => a.id === id)!).filter(
    Boolean,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.titre}>Accueil</Text>
            <Text style={styles.sousTitre}>Découvrez, apprenez, inspirez-vous.</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </View>

        <View style={styles.ongletsRow}>
          {ONGLETS.map((o) => (
            <Text
              key={o}
              onPress={() => setOnglet(o)}
              style={[styles.onglet, onglet === o && styles.ongletActif]}
            >
              {o}
            </Text>
          ))}
        </View>

        {onglet !== 'Pour vous' ? (
          <Text style={styles.bientotDisponible}>Bientôt disponible.</Text>
        ) : (
          <>
            <Section title="Sélection pour vous" action="Pourquoi ces œuvres ?" />
            <View style={styles.heroCard}>
              <View style={styles.heroCover}>
                {selection.couleursDominantes.map((c) => (
                  <View key={c.hex} style={[styles.heroSwatch, { backgroundColor: c.hex }]} />
                ))}
                <Pressable
                  style={styles.heroHeart}
                  onPress={() => setFavoriSelection((v) => !v)}
                  hitSlop={6}
                >
                  <Ionicons
                    name={favoriSelection ? 'heart' : 'heart-outline'}
                    size={16}
                    color={favoriSelection ? colors.negative : colors.textPrimary}
                  />
                </Pressable>
              </View>
              <Text style={styles.heroTitre}>{selection.titre}</Text>
              <Text style={styles.heroArtiste}>
                {selection.artiste}, {selection.annee}
              </Text>
            </View>

            <View style={styles.parceQueSection}>
              <Text style={styles.parceQueTitre}>Parce que vous aimez...</Text>
              <View style={styles.pillsRow}>
                {PARCE_QUE_VOUS_AIMEZ.map((label) => (
                  <View key={label} style={styles.pill}>
                    <Text style={styles.pillText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Section title="Nouveautés" action="Voir tout" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {nouveautes.map((a) => (
                <NouveauteCard key={a.id} artwork={a} />
              ))}
            </ScrollView>

            <Section title="Expositions à ne pas manquer" action="Voir tout" />
            {EXPOSITIONS_A_VENIR.map((e) => (
              <ExpoAVenirCard key={e.id} expo={e} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  ongletsRow: {
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 16,
  },
  onglet: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingBottom: 10,
  },
  ongletActif: {
    color: colors.accent,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  bientotDisponible: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionAction: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  heroCard: {},
  heroCover: {
    flexDirection: 'row',
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroSwatch: {
    flex: 1,
  },
  heroHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitre: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 10,
  },
  heroArtiste: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  parceQueSection: {
    marginTop: 22,
  },
  parceQueTitre: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  hScroll: {
    marginRight: -20,
  },
});
