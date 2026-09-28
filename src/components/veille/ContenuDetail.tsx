// src/components/veille/ContenuDetail.tsx
import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ContenuVeille, TYPE_VEILLE_COLORS, TYPE_VEILLE_LABELS } from '../../types/veille';
import { ARTWORKS } from '../../data/artworks.generated';
import { ArtworkCover } from '../ArtworkCover';
import { SourceLogo } from './SourceLogo';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { useCarnet } from '../../store/CarnetContext';

const ONGLETS = ['À propos', 'Œuvres liées', 'Voir aussi'] as const;

interface Props {
  contenu: ContenuVeille | null;
  onClose: () => void;
}

const LIBELLE_ACTION: Record<ContenuVeille['type'], string> = {
  article: 'Lire',
  documentaire: 'Regarder',
  video: 'Regarder',
  podcast: 'Écouter',
  expo: 'Voir',
};

export function ContenuDetail({ contenu, onClose }: Props) {
  const { veilleEnregistres, toggleVeilleEnregistre } = useCarnet();
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]>('À propos');
  const [echecImage, setEchecImage] = useState(false);

  if (!contenu) return null;
  const enregistre = veilleEnregistres[contenu.id] ?? false;

  const oeuvresLiees = (contenu.oeuvresLiees ?? [])
    .map((id) => ARTWORKS.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <Modal visible={contenu !== null} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {contenu.imageUrl && !echecImage ? (
              <Image
                source={{ uri: contenu.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                onError={() => setEchecImage(true)}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.border }]} />
            )}
            <View style={styles.heroTopBar}>
              <Pressable style={styles.iconButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={20} color={colors.surface} />
              </Pressable>
              <View style={styles.heroTopBarRight}>
                <Pressable style={styles.iconButton}>
                  <Ionicons name="share-outline" size={19} color={colors.surface} />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => toggleVeilleEnregistre(contenu.id)}>
                  <Ionicons
                    name={enregistre ? 'bookmark' : 'bookmark-outline'}
                    size={19}
                    color={colors.surface}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.sheet}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: TYPE_VEILLE_COLORS[contenu.type] }]}>
                <Text style={styles.badgeText}>{TYPE_VEILLE_LABELS[contenu.type].toUpperCase()}</Text>
              </View>
              {contenu.duree && <Text style={styles.duree}>{contenu.duree}</Text>}
            </View>

            <Text style={styles.titre}>{contenu.titre}</Text>

            <View style={styles.sourceRow}>
              <SourceLogo url={contenu.url} size={16} />
              <Text style={styles.source}>{contenu.source}</Text>
            </View>

            <View style={styles.boutonsRow}>
              <Pressable style={styles.boutonPrincipal} onPress={() => Linking.openURL(contenu.url)}>
  <Ionicons
    name={contenu.type === 'article' ? 'book-outline' : 'play'}
    size={15}
    color={colors.surface}
  />
  <Text style={styles.boutonPrincipalText}>{LIBELLE_ACTION[contenu.type]}</Text>
</Pressable>
              <Pressable style={styles.boutonSecondaire} onPress={() => toggleVeilleEnregistre(contenu.id)}>
                <Ionicons
                  name={enregistre ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={colors.textPrimary}
                />
                <Text style={styles.boutonSecondaireText}>{enregistre ? 'Enregistré' : 'Enregistrer'}</Text>
              </Pressable>
            </View>

            <View style={styles.ongletsRow}>
              {ONGLETS.map((o) => (
                <Pressable key={o} onPress={() => setOnglet(o)} style={styles.ongletItem}>
                  <Text style={[styles.ongletText, onglet === o && styles.ongletTextActive]}>{o}</Text>
                  {onglet === o && <View style={styles.ongletUnderline} />}
                </Pressable>
              ))}
            </View>

            {onglet === 'À propos' && (
              <View style={styles.ongletContenu}>
                <Text style={styles.description}>
                  {contenu.description ?? "Pas encore de description pour ce contenu."}
                </Text>
                {contenu.motsCles && contenu.motsCles.length > 0 && (
                  <>
                    <Text style={styles.sousTitre}>Mots-clés</Text>
                    <View style={styles.motsClesRow}>
                      {contenu.motsCles.map((m) => (
                        <View key={m} style={styles.motCle}>
                          <Text style={styles.motCleText}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {onglet === 'Œuvres liées' && (
              <View style={styles.ongletContenu}>
                {oeuvresLiees.length === 0 ? (
                  <Text style={styles.vide}>Aucune œuvre liée à ce contenu pour l'instant.</Text>
                ) : (
                  <View style={styles.oeuvresGrid}>
                    {oeuvresLiees.map((a) => (
                      <View key={a.id} style={styles.oeuvreCard}>
                        <View style={styles.oeuvreCover}>
                          <ArtworkCover artwork={a} />
                        </View>
                        <Text style={styles.oeuvreTitre} numberOfLines={1}>{a.titre}</Text>
                        <Text style={styles.oeuvreAnnee}>{a.annee}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {onglet === 'Voir aussi' && (
              <View style={styles.ongletContenu}>
                <Text style={styles.vide}>Pas encore de suggestions pour ce contenu.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { height: 260 },
  heroTopBar: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroTopBarRight: { flexDirection: 'row', gap: 8 },
  iconButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  sheet: { padding: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontFamily: fonts.uiSemiBold, fontSize: 10, color: '#FFFFFF', letterSpacing: 0.4 },
  duree: { fontFamily: fonts.ui, fontSize: 12, color: colors.textSecondary },
  titre: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, lineHeight: 30 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  source: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },
  boutonsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  boutonPrincipal: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.textPrimary, borderRadius: 28, height: 46,
  },
  boutonPrincipalText: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.surface },
  boutonSecondaire: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.stone, borderRadius: 28, height: 46,
  },
  boutonSecondaireText: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.textPrimary },
  ongletsRow: {
    flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
    marginTop: 26,
  },
  ongletItem: { paddingBottom: 10 },
  ongletText: { fontFamily: fonts.uiMedium, fontSize: 13, color: colors.textSecondary },
  ongletTextActive: { color: colors.accent },
  ongletUnderline: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  ongletContenu: { paddingTop: 18 },
  description: { fontFamily: fonts.ui, fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  sousTitre: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary, marginTop: 20, marginBottom: 10 },
  motsClesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  motCle: { backgroundColor: colors.stone, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  motCleText: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.textPrimary },
  vide: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },
  oeuvresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  oeuvreCard: { width: '31%' },
  oeuvreCover: { height: 90, borderRadius: 8, overflow: 'hidden' },
  oeuvreTitre: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.textPrimary, marginTop: 6 },
  oeuvreAnnee: { fontFamily: fonts.ui, fontSize: 11, color: colors.textSecondary },
});