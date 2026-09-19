import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exposition } from '../types/exposition';
import { ARTWORKS } from '../data/artworks.generated';
import { colors } from '../theme/colors';
import { StarRating } from './StarRating';
import { ArtworkCover } from './ArtworkCover';

interface Props {
  exposition: Exposition | null;
  onClose: () => void;
  note: number;
  onChangeNote: (note: number) => void;
}

export function ExpositionDetail({ exposition, onClose, note, onChangeNote }: Props) {
  const oeuvresLiees =
    exposition?.oeuvresLieesIds
      ?.map((id) => ARTWORKS.find((a) => a.id === id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a)) ?? [];

  return (
    <Modal visible={exposition !== null} animationType="slide" onRequestClose={onClose}>
      {exposition && (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={[styles.cover, { backgroundColor: exposition.couleur }]}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
            <Ionicons name="business-outline" size={44} color="rgba(255,255,255,0.9)" />
          </View>

          <Text style={styles.titre}>{exposition.titre}</Text>
          <Text style={styles.lieu}>
            {exposition.lieu}, {exposition.ville}
          </Text>
          <Text style={styles.dates}>
            {exposition.dateDebut} – {exposition.dateFin}
          </Text>

          <Text style={styles.description}>{exposition.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre note</Text>
            <View style={styles.noteRow}>
              <StarRating value={note} onChange={onChangeNote} />
              <Text style={styles.noteValue}>{note.toFixed(1).replace('.', ',')}</Text>
            </View>
            <Pressable style={styles.avisButton}>
              <Text style={styles.avisButtonText}>Écrire un avis</Text>
            </Pressable>
          </View>

          {oeuvresLiees.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Œuvres en lien</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {oeuvresLiees.map((a) => (
                  <View key={a.id} style={styles.oeuvreCard}>
                    <View style={styles.oeuvreCover}>
                      <ArtworkCover artwork={a} />
                    </View>
                    <Text style={styles.oeuvreTitre} numberOfLines={1}>
                      {a.titre}
                    </Text>
                    <Text style={styles.oeuvreArtiste} numberOfLines={1}>
                      {a.artiste}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      )}
    </Modal>
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
  cover: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titre: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 18,
  },
  lieu: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 4,
  },
  dates: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 20,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginHorizontal: 20,
    marginTop: 16,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  avisButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  avisButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  oeuvreCard: {
    width: 110,
    marginRight: 12,
  },
  oeuvreCover: {
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
  },
  oeuvreTitre: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 6,
  },
  oeuvreArtiste: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
