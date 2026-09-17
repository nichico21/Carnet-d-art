import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Artwork, THEME_LABELS, Valence } from '../types/artwork';
import { colors } from '../theme/colors';

interface Props {
  artwork: Artwork | null;
  onClose: () => void;
}

const VALENCE_LABELS: Record<Valence, string> = {
  positive: 'Positive',
  negative: 'Négative',
  neutre: 'Neutre',
};

const VALENCE_COLORS: Record<Valence, string> = {
  positive: colors.positive,
  negative: colors.negative,
  neutre: colors.neutre,
};

export function ArtworkDetail({ artwork, onClose }: Props) {
  return (
    <Modal visible={artwork !== null} animationType="slide" onRequestClose={onClose}>
      {artwork && (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>

          <View style={styles.cover}>
            {artwork.couleursDominantes.map((c) => (
              <View key={c.hex} style={[styles.swatch, { backgroundColor: c.hex }]} />
            ))}
          </View>

          <Text style={styles.titre}>{artwork.titre}</Text>
          <Text style={styles.artiste}>
            {artwork.artiste}, {artwork.annee}
          </Text>
          <Text style={styles.meta}>
            {artwork.technique}
            {artwork.dimensions ? ` • ${artwork.dimensions}` : ''}
          </Text>
          <Text style={styles.meta}>
            {artwork.lieuConservation}, {artwork.ville}
          </Text>

          <Section title="Thème">
            <Text style={styles.value}>{THEME_LABELS[artwork.theme]}</Text>
          </Section>

          <Section title="Mouvement(s)">
            <View style={styles.tagsRow}>
              {artwork.mouvements.map((m) => (
                <View key={m} style={styles.tag}>
                  <Text style={styles.tagText}>{m}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Couleurs dominantes">
            <View style={styles.tagsRow}>
              {artwork.couleursDominantes.map((c) => (
                <View key={c.hex} style={styles.colorTag}>
                  <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  <Text style={styles.tagText}>{c.nom}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Tonalité émotionnelle">
            <View style={styles.emotionRow}>
              <View
                style={[
                  styles.valenceBadge,
                  { backgroundColor: VALENCE_COLORS[artwork.emotion.valence] },
                ]}
              >
                <Text style={styles.valenceBadgeText}>
                  {VALENCE_LABELS[artwork.emotion.valence]} · intensité{' '}
                  {artwork.emotion.intensite}/5
                </Text>
              </View>
            </View>
            <View style={styles.tagsRow}>
              {artwork.emotion.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
          </Section>

          {artwork.description && (
            <Section title="À propos">
              <Text style={styles.description}>{artwork.description}</Text>
            </Section>
          )}
        </ScrollView>
      )}
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  closeButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  cover: {
    flexDirection: 'row',
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  swatch: {
    flex: 1,
  },
  titre: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginTop: 16,
  },
  artiste: {
    fontSize: 16,
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 16,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  value: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  colorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emotionRow: {
    marginBottom: 8,
  },
  valenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  valenceBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
