import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROFIL_COURANT } from '../data/profile';
import { ARTWORKS } from '../data/artworks';
import { colors } from '../theme/colors';

const ONGLETS = ['Aperçu', 'Carnet', 'Expositions', 'Collections', 'Activité'];

function initiales(nom: string) {
  return nom
    .split(' ')
    .filter((p) => /^[A-ZÀ-Ý]/.test(p))
    .map((p) => p[0])
    .join('')
    .slice(0, 2);
}

function MiniStars({ note }: { note: number }) {
  const stars = [1, 2, 3, 4, 5].map((n) => {
    if (note >= n) return 'star';
    if (note >= n - 0.5) return 'star-half';
    return 'star-outline';
  });
  return (
    <View style={styles.miniStarsRow}>
      {stars.map((name, i) => (
        <Ionicons key={i} name={name as any} size={11} color={colors.accent} />
      ))}
    </View>
  );
}

export function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const [onglet, setOnglet] = useState('Aperçu');
  const profil = PROFIL_COURANT;

  return (
    <View style={styles.container}>
      <ScrollView bounces={false}>
        <View style={styles.hero}>
          <LinearGradient
            colors={profil.couvertureCouleurs as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
            <View style={styles.iconButton}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.heroTopBarRight}>
              <View style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              </View>
              <View style={styles.iconButton}>
                <Ionicons name="ellipsis-horizontal" size={19} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initiales(profil.nom)}</Text>
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.nom}>{profil.nom}</Text>
            {profil.verifie && (
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            )}
          </View>
          <View style={styles.lieuRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.lieu}>
              {profil.ville}, {profil.pays}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat label="œuvres" value={profil.stats.oeuvres} />
          <Stat label="expositions" value={profil.stats.expositions} />
          <Stat label="villes" value={profil.stats.villes} />
          <Stat label="abonnés" value={profil.stats.abonnes} />
          <Stat label="abonnements" value={profil.stats.abonnements} />
        </View>

        <Text style={styles.bio}>{profil.bio}</Text>

        <View style={styles.ongletsRow}>
          {ONGLETS.map((o) => (
            <Pressable key={o} onPress={() => setOnglet(o)} style={styles.ongletItem}>
              <Text style={[styles.ongletText, onglet === o && styles.ongletTextActive]}>
                {o}
              </Text>
              {onglet === o && <View style={styles.ongletUnderline} />}
            </Pressable>
          ))}
        </View>

        {onglet !== 'Aperçu' ? (
          <Text style={styles.bientotDisponible}>Bientôt disponible.</Text>
        ) : (
          <>
            <Section title="Ses artistes favoris">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profil.artistesFavoris.map((a) => (
                  <View key={a.nom} style={styles.artisteItem}>
                    <View style={[styles.artisteAvatar, { backgroundColor: a.couleur }]}>
                      <Text style={styles.artisteAvatarText}>{initiales(a.nom)}</Text>
                    </View>
                    <Text style={styles.artisteNom} numberOfLines={1}>
                      {a.nom}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </Section>

            <Section title="Dernières œuvres ajoutées">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profil.dernieresOeuvres.map(({ artworkId, note }) => {
                  const oeuvre = ARTWORKS.find((a) => a.id === artworkId);
                  if (!oeuvre) return null;
                  return (
                    <View key={artworkId} style={styles.oeuvreCard}>
                      <View style={styles.oeuvreCover}>
                        {oeuvre.couleursDominantes.map((c) => (
                          <View
                            key={c.hex}
                            style={[styles.oeuvreSwatch, { backgroundColor: c.hex }]}
                          />
                        ))}
                        <View style={styles.oeuvreHeart}>
                          <Ionicons name="heart-outline" size={14} color={colors.textPrimary} />
                        </View>
                      </View>
                      <MiniStars note={note} />
                      <Text style={styles.oeuvreTitre} numberOfLines={1}>
                        {oeuvre.titre}, {oeuvre.annee}
                      </Text>
                      <Text style={styles.oeuvreArtiste} numberOfLines={1}>
                        {oeuvre.artiste}
                      </Text>
                      <Text style={styles.oeuvreLieu} numberOfLines={1}>
                        {oeuvre.lieuConservation}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </Section>

            <Section title="Dernières expositions visitées">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profil.dernieresExpositions.map((e) => (
                  <View key={e.id} style={styles.expoCard}>
                    <View style={[styles.expoCover, { backgroundColor: e.couleur }]} />
                    <Text style={styles.expoTitre} numberOfLines={2}>
                      {e.titre}
                    </Text>
                    <Text style={styles.expoLieu} numberOfLines={1}>
                      {e.lieu}
                    </Text>
                    <Text style={styles.expoDate}>{e.date}</Text>
                  </View>
                ))}
              </ScrollView>
            </Section>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.voirTout}>Voir tout</Text>
      </View>
      {children}
    </View>
  );
}

const AVATAR_SIZE = 84;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    height: 220,
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
  headerBlock: {
    paddingHorizontal: 20,
    marginTop: -AVATAR_SIZE / 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  nom: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lieuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lieu: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginTop: 14,
    lineHeight: 18,
  },
  ongletsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 18,
    paddingHorizontal: 20,
    gap: 18,
  },
  ongletItem: {
    paddingBottom: 10,
  },
  ongletText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ongletTextActive: {
    color: colors.accent,
  },
  ongletUnderline: {
    height: 2,
    backgroundColor: colors.accent,
    marginTop: 8,
    borderRadius: 1,
  },
  bientotDisponible: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 40,
  },
  section: {
    paddingTop: 20,
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
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  voirTout: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  artisteItem: {
    alignItems: 'center',
    width: 76,
    marginRight: 12,
  },
  artisteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artisteAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  artisteNom: {
    fontSize: 11,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  oeuvreCard: {
    width: 140,
    marginRight: 12,
  },
  oeuvreCover: {
    flexDirection: 'row',
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
  },
  oeuvreSwatch: {
    flex: 1,
  },
  oeuvreHeart: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStarsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  oeuvreTitre: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 4,
  },
  oeuvreArtiste: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  oeuvreLieu: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  expoCard: {
    width: 130,
    marginRight: 12,
    paddingBottom: 20,
  },
  expoCover: {
    height: 90,
    borderRadius: 12,
  },
  expoTitre: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 6,
  },
  expoLieu: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  expoDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
