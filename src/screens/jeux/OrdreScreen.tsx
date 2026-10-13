import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ARTWORKS } from '../../data/artworks.generated';
import { Artwork } from '../../types/artwork';
import { ArtworkCover } from '../../components/ArtworkCover';
import { ArtworkDetail } from '../../components/ArtworkDetail';
import {
  genererManchesOrdre,
  MancheOrdre,
  OeuvreDatee,
  positionsCorrectes,
} from '../../games/ordre';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const XP_PAR_BONNE_PLACE = 5;
const { width: LARGEUR_ECRAN } = Dimensions.get('window');
const MARGE = 20;
const ECART = 12;
const TAILLE_CASE = (LARGEUR_ECRAN - MARGE * 2 - ECART) / 2;

/** Masque les noms d'artiste inexploitables (codes ou liens Wikidata). */
function artisteLisible(nom: string): string | null {
  if (!nom || nom === 'Artiste inconnu') return null;
  if (/^Q\d+/.test(nom) || /^https?:\/\//.test(nom) || nom.includes('wikidata.org')) return null;
  return nom;
}

export function OrdreScreen() {
  const navigation = useNavigation();
  const { notes, favoris, setNote, toggleFavori, enregistrerPartie } = useCarnet();

  const manches = useMemo(() => genererManchesOrdre(ARTWORKS, 5, 4), []);
  const [index, setIndex] = useState(0);
  const [choix, setChoix] = useState<string[]>([]);
  const [valide, setValide] = useState(false);
  const [score, setScore] = useState(0);
  const [bilans, setBilans] = useState<{ manche: MancheOrdre; ok: boolean[] }[]>([]);
  const [termine, setTermine] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);

  // Précharge les images de la manche suivante pendant que le joueur réfléchit.
  useEffect(() => {
    const suivante = manches[index + 1];
    if (!suivante) return;
    for (const o of suivante.affichees) {
      if (o.artwork.imageUrl) Image.prefetch(`${o.artwork.imageUrl}?width=500`);
    }
  }, [index, manches]);

  if (manches.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitre}>Remettez-les dans l'ordre</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.videBloc}>
          <Text style={styles.videTexte}>
            Pas encore assez d'œuvres datées pour lancer ce jeu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const manche = manches[index];
  const okManche = positionsCorrectes(choix, manche);
  const pret = choix.length === manche.affichees.length;

  const detail = (
    <ArtworkDetail
      artwork={artworkOuvert}
      onClose={() => setArtworkOuvert(null)}
      note={artworkOuvert ? notes[artworkOuvert.id] ?? 0 : 0}
      onChangeNote={(note) => artworkOuvert && setNote(artworkOuvert.id, note)}
      favori={artworkOuvert ? favoris[artworkOuvert.id] ?? false : false}
      onToggleFavori={() => artworkOuvert && toggleFavori(artworkOuvert.id)}
      onNavigateTab={(tab) => {
        setArtworkOuvert(null);
        navigation.navigate(tab as never);
      }}
      onOuvrirBoutique={(artworkId) => {
        setArtworkOuvert(null);
        (navigation.navigate as (name: string, params?: object) => void)('Boutique', { artworkId });
      }}
    />
  );

  function toucher(id: string) {
    if (valide) return;
    setChoix((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function valider() {
    setScore((s) => s + okManche.filter(Boolean).length);
    setBilans((b) => [...b, { manche, ok: okManche }]);
    setValide(true);
  }

  function suivant() {
    if (index + 1 < manches.length) {
      setIndex((i) => i + 1);
      setChoix([]);
      setValide(false);
    } else {
      if (!enregistre) {
        enregistrerPartie('ordre', score, score * XP_PAR_BONNE_PLACE);
        setEnregistre(true);
      }
      setTermine(true);
    }
  }

  if (termine) {
    const total = bilans.reduce((n, b) => n + b.manche.ordreCorrect.length, 0);
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.finScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.finHeader}>
            <Ionicons name="trophy" size={40} color={colors.accent} />
            <Text style={styles.finTitre}>Partie terminée</Text>
            <Text style={styles.finScore}>
              {score} / {total} œuvres bien placées
            </Text>
            <Text style={styles.finXp}>+{score * XP_PAR_BONNE_PLACE} XP</Text>
          </View>

          {bilans.map((b, n) => (
            <View key={n} style={styles.finManche}>
              <Text style={styles.finMancheTitre}>
                Manche {n + 1} · {b.ok.filter(Boolean).length}/{b.manche.ordreCorrect.length}
              </Text>
              {b.manche.ordreCorrect.map((o, i) => (
                <LigneOeuvre
                  key={o.artwork.id}
                  oeuvre={o}
                  ok={b.ok[i]}
                  onPress={() => setArtworkOuvert(o.artwork)}
                />
              ))}
            </View>
          ))}
        </ScrollView>

        <View style={styles.boutonZone}>
          <Pressable style={styles.boutonPrincipal} onPress={() => navigation.goBack()}>
            <Text style={styles.boutonPrincipalTexte}>Retour aux jeux</Text>
          </Pressable>
        </View>
        {detail}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitre}>
          Manche {index + 1}/{manches.length}
        </Text>
        <Text style={styles.headerScore}>{score} pts</Text>
      </View>

      <View style={styles.progressRow}>
        {manches.map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, i <= index && styles.progressSegmentFait]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.consigne}>Du plus ancien au plus récent</Text>
        <Text style={styles.consigneSous}>
          {valide
            ? 'Voici l’ordre chronologique.'
            : 'Touchez les œuvres dans l’ordre. Retouchez-en une pour la retirer.'}
        </Text>

        <View style={styles.grille}>
          {manche.affichees.map((o) => {
            const rang = choix.indexOf(o.artwork.id);
            const rangCorrect = manche.ordreCorrect.findIndex((x) => x.artwork.id === o.artwork.id);
            const bonnePlace = okManche[rangCorrect];

            return (
              <Pressable
                key={o.artwork.id}
                style={[styles.case, rang >= 0 && !valide ? styles.caseChoisie : null]}
                onPress={() => toucher(o.artwork.id)}
                disabled={valide}
              >
                <ArtworkCover artwork={o.artwork} width={500} contentFit="contain" />
                {!valide && rang >= 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexte}>{rang + 1}</Text>
                  </View>
                )}
                {valide && (
                  <>
                    <View style={[styles.badge, bonnePlace ? styles.badgeOk : styles.badgeKo]}>
  <Text style={styles.badgeTexte}>{rangCorrect + 1}</Text>
</View>
                    <View style={styles.anneeZone}>
                      <View style={styles.anneePill}>
                        <Text style={styles.anneeTexte}>{o.annee}</Text>
                      </View>
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>

        {valide && (
          <View style={styles.reponse}>
            <Text style={styles.reponseTitre}>Ordre chronologique</Text>
            {manche.ordreCorrect.map((o, i) => (
              <LigneOeuvre
                key={o.artwork.id}
                oeuvre={o}
                ok={okManche[i]}
                onPress={() => setArtworkOuvert(o.artwork)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.boutonZone}>
        {valide ? (
          <Pressable style={styles.boutonPrincipal} onPress={suivant}>
            <Text style={styles.boutonPrincipalTexte}>
              {index + 1 < manches.length ? 'Manche suivante' : 'Voir le résultat'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.boutonsRow}>
            <Pressable
              style={[styles.boutonSecondaire, choix.length === 0 ? styles.desactive : null]}
              onPress={() => setChoix([])}
              disabled={choix.length === 0}
            >
              <Text style={styles.boutonSecondaireTexte}>Réinitialiser</Text>
            </Pressable>
            <Pressable
              style={[styles.boutonPrincipal, styles.boutonValider, !pret ? styles.desactive : null]}
              onPress={valider}
              disabled={!pret}
            >
              <Text style={styles.boutonPrincipalTexte}>Valider</Text>
            </Pressable>
          </View>
        )}
      </View>

      {detail}
    </SafeAreaView>
  );
}

function LigneOeuvre({
  oeuvre,
  ok,
  onPress,
}: {
  oeuvre: OeuvreDatee;
  ok: boolean;
  onPress: () => void;
}) {
  const artiste = artisteLisible(oeuvre.artwork.artiste);
  return (
    <Pressable style={styles.ligne} onPress={onPress}>
      <View style={styles.ligneCover}>
        <ArtworkCover artwork={oeuvre.artwork} width={200} />
      </View>
      <View style={styles.ligneCorps}>
        <Text style={styles.ligneTitre} numberOfLines={1}>
          {oeuvre.artwork.titre}
        </Text>
        {artiste && (
          <Text style={styles.ligneArtiste} numberOfLines={1}>
            {artiste}
          </Text>
        )}
      </View>
      <Text style={styles.ligneAnnee}>{oeuvre.annee}</Text>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'close-circle'}
        size={20}
        color={ok ? colors.positive : colors.negative}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitre: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.textPrimary },
  headerScore: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.accent },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginTop: 14 },
  progressSegment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  progressSegmentFait: { backgroundColor: colors.accent },
  scrollContent: { paddingBottom: 16 },

  consigne: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  consigneSous: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },

  grille: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ECART,
    paddingHorizontal: MARGE,
    marginTop: 16,
  },
  case: {
    width: TAILLE_CASE,
    height: TAILLE_CASE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.stone,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  caseChoisie: { borderColor: colors.accent },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOk: { backgroundColor: colors.positive },
  badgeKo: { backgroundColor: colors.negative },
  badgeTexte: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.surface },
  anneeZone: { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' },
  anneePill: {
    backgroundColor: 'rgba(23,21,19,0.78)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  anneeTexte: { fontFamily: fonts.display, fontSize: 18, color: colors.surface },

  reponse: { paddingHorizontal: MARGE, marginTop: 22 },
  reponseTitre: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginBottom: 10 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  ligneCover: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  ligneCorps: { flex: 1 },
  ligneTitre: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary },
  ligneArtiste: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
  ligneAnnee: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },

  boutonZone: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  boutonsRow: { flexDirection: 'row', gap: 10 },
  boutonPrincipal: {
    backgroundColor: colors.textPrimary,
    borderRadius: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonValider: { flex: 2 },
  boutonSecondaire: {
    flex: 1,
    backgroundColor: colors.stone,
    borderRadius: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonPrincipalTexte: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.surface },
  boutonSecondaireTexte: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.textPrimary },
  desactive: { opacity: 0.4 },

  videBloc: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  videTexte: { fontFamily: fonts.ui, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  finScroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  finHeader: { alignItems: 'center', gap: 4, marginBottom: 24 },
  finTitre: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary, marginTop: 8 },
  finScore: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.textPrimary },
  finXp: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.accent },
  finManche: { marginBottom: 14 },
  finMancheTitre: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, marginBottom: 8 },
});