import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Artwork } from '../types/artwork';
import { colors } from '../theme/colors';
import { StarRating } from './StarRating';
import { ContentCard } from './ContentCard';
import { CustomTabBar } from '../navigation/CustomTabBar';

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
  note: number;
  onChangeNote: (note: number) => void;
  favori: boolean;
  onToggleFavori: () => void;
  onNavigateTab: (tab: string) => void;
}

export function ArtworkDetail({
  artwork,
  onClose,
  note,
  onChangeNote,
  favori,
  onToggleFavori,
  onNavigateTab,
}: Props) {
  const [descriptionOuverte, setDescriptionOuverte] = useState(false);

  return (
    <Modal
      visible={artwork !== null}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {artwork && (
        <View style={styles.container}>
          <ScrollView bounces={false}>
            <Hero
              artwork={artwork}
              onClose={onClose}
              favori={favori}
              onToggleFavori={onToggleFavori}
            />

            <View style={styles.sheet}>
              <Section title="À propos de l'œuvre">
                <Text
                  style={styles.description}
                  numberOfLines={descriptionOuverte ? undefined : 3}
                >
                  {artwork.description}
                </Text>
                {artwork.description && artwork.description.length > 140 && (
                  <Pressable onPress={() => setDescriptionOuverte((v) => !v)}>
                    <Text style={styles.link}>
                      {descriptionOuverte ? 'Voir moins' : 'Voir plus'}
                    </Text>
                  </Pressable>
                )}
              </Section>

              <View style={styles.divider} />

              <Section title="Votre appréciation">
                <View style={styles.appreciationRow}>
                  <StarRating value={note} onChange={onChangeNote} />
                  <Text style={styles.note}>{note.toFixed(1).replace('.', ',')}</Text>
                  <Text style={styles.noteLabel}>Ma note</Text>
                </View>
              </Section>

              {artwork.contenusAssocies && artwork.contenusAssocies.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <Section
                    title="Pour approfondir"
                    action={<Text style={styles.link}>Voir tout</Text>}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.contenusScroll}
                    >
                      {artwork.contenusAssocies.map((c) => (
                        <ContentCard key={c.titre} contenu={c} />
                      ))}
                    </ScrollView>
                  </Section>
                </>
              )}

              <View style={styles.promo}>
                <Ionicons name="bag-outline" size={20} color={colors.accent} />
                <View style={styles.promoTextBlock}>
                  <Text style={styles.promoTitle}>Prolonger l'expérience</Text>
                  <Text style={styles.promoDescription}>
                    Livres, affiches, objets… une sélection inspirée par cette œuvre et
                    l'univers de {artwork.artiste.split(' ').slice(-1)[0]}.
                  </Text>
                </View>
              </View>
              <Pressable style={styles.promoButton}>
                <Text style={styles.promoButtonText}>Découvrir la sélection</Text>
              </Pressable>
            </View>
          </ScrollView>

          <CustomTabBar
            active="Carnet"
            onPress={(tab) => {
              if (tab !== 'Carnet') onNavigateTab(tab);
            }}
          />
        </View>
      )}
    </Modal>
  );
}

function Hero({
  artwork,
  onClose,
  favori,
  onToggleFavori,
}: {
  artwork: Artwork;
  onClose: () => void;
  favori: boolean;
  onToggleFavori: () => void;
}) {
  const insets = useSafeAreaInsets();
  const gradientColors = artwork.couleursDominantes.map((c) => c.hex);
  const scrimColors = ['transparent', 'rgba(0,0,0,0.75)'] as const;

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={gradientColors.length > 1 ? (gradientColors as any) : [gradientColors[0], gradientColors[0]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={scrimColors} style={StyleSheet.absoluteFill} />

      <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.iconButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.heroTopBarRight}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="share-outline" size={19} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.favoriButton} onPress={onToggleFavori}>
        <Ionicons
          name={favori ? 'heart' : 'heart-outline'}
          size={20}
          color={favori ? colors.negative : colors.textPrimary}
        />
      </Pressable>

      <View style={styles.heroTextBlock}>
        <Text style={styles.heroTitre}>{artwork.titre}</Text>
        <Text style={styles.heroAnnee}>{artwork.annee}</Text>
        <Text style={styles.heroArtiste}>
          {artwork.artiste}
          {artwork.artisteAnnees ? ` (${artwork.artisteAnnees})` : ''}
        </Text>
        <Text style={styles.heroMeta}>
          {artwork.technique}
          {artwork.dimensions ? ` • ${artwork.dimensions}` : ''}
        </Text>
        <View style={styles.heroLieuRow}>
          <Ionicons name="location-outline" size={13} color="#FFFFFF" />
          <Text style={styles.heroLieu}>
            {artwork.lieuConservation}, {artwork.ville}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  hero: {
    height: 340,
    justifyContent: 'flex-end',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  heroTopBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriButton: {
    position: 'absolute',
    right: 16,
    bottom: 130,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTitre: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroAnnee: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  heroArtiste: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  heroMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  heroLieuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  heroLieu: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  sheet: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  link: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
    marginHorizontal: 20,
  },
  appreciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  note: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 10,
  },
  noteLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  contenusScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  promo: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.accentSoft,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
  },
  promoTextBlock: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  promoButton: {
    backgroundColor: colors.accent,
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
