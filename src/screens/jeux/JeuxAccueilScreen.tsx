import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ARTWORKS } from '../../data/artworks.generated';
import { ArtworkCover } from '../../components/ArtworkCover';
import { CATEGORIES, JEUX } from '../../data/jeux';
import { CategorieJeu, JeuDef } from '../../types/jeux';
import { Artwork } from '../../types/artwork';
import { useCarnet } from '../../store/CarnetContext';
import { jourISO, niveauDepuisXp, serieAffichee, titreNiveau } from '../../games/progression';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { JeuxStackParamList } from '../../navigation/JeuxStack';

const { width: LARGEUR_ECRAN } = Dimensions.get('window');
const MARGE = 20;
const ECART = 12;
const LARGEUR_CARTE = (LARGEUR_ECRAN - MARGE * 2 - ECART) / 2;

// Un jeu de navigable une fois construit : id du jeu -> écran du JeuxStack.
const ECRAN_PAR_JEU: Partial<Record<string, keyof JeuxStackParamList>> = {
  'qui-a-peint': 'QuiAPeint',
};

export function JeuxAccueilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<JeuxStackParamList>>();
  const { jeux } = useCarnet();
  const [categorie, setCategorie] = useState<CategorieJeu | null>(null);

  const serie = serieAffichee(jeux.serie, jeux.dernierJourJoue, jourISO());
  const { niveau, xpDansNiveau, xpPourSuivant } = niveauDepuisXp(jeux.xp);

  const { couvertures, hero } = useMemo(() => {
    const eligibles = ARTWORKS.filter((a) => a.imageUrl && !a.contenuSensible).sort((x, y) =>
      x.id.localeCompare(y.id),
    );
    if (eligibles.length === 0) return { couvertures: [] as Artwork[], hero: undefined };
    return {
      couvertures: JEUX.map((_, i) => eligibles[Math.floor((i * eligibles.length) / JEUX.length)]),
      hero: eligibles[Math.floor(eligibles.length / 2)],
    };
  }, []);

  const jeuxAffiches = JEUX.map((jeu, i) => ({ jeu, cover: couvertures[i] })).filter(
    ({ jeu }) => !categorie || jeu.categorie === categorie,
  );

  function ouvrir(jeu: JeuDef) {
    const ecran = ECRAN_PAR_JEU[jeu.id];
    if (ecran) navigation.navigate(ecran);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.titre}>Jeux</Text>
        <Text style={styles.sousTitre}>
          Apprenez, entraînez votre regard et découvrez l’art en vous amusant.
        </Text>

        <View style={styles.pillsRow}>
          <StatPill icone="flame-outline" valeur={String(serie)} label="série" />
          <StatPill icone="trophy-outline" valeur={String(jeux.xp)} label="points" />
          <StatPill icone="ribbon-outline" valeur={`Niv. ${niveau}`} label={titreNiveau(niveau)} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTexte}>
            <Text style={styles.heroKicker}>DÉFI DU JOUR</Text>
            <Text style={styles.heroTitre}>Daily Art</Text>
            <Text style={styles.heroDesc}>Répondez aux 3 questions du jour et gagnez des points !</Text>
            <View style={styles.heroBouton}>
              <Text style={styles.heroBoutonTexte}>Bientôt disponible</Text>
            </View>
          </View>
          {hero && (
            <View style={styles.heroImage}>
              <ArtworkCover artwork={hero} />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitre}>Toutes les catégories</Text>
        <View style={styles.grille}>
          {CATEGORIES.map((c) => {
            const actif = categorie === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.tuile, actif && styles.tuileActive]}
                onPress={() => setCategorie(actif ? null : c.id)}
              >
                <Ionicons name={c.icone} size={22} color={actif ? colors.accent : colors.textPrimary} />
                <View style={styles.tuileTexte}>
                  <Text style={styles.tuileLabel}>{c.label}</Text>
                  <Text style={styles.tuileSous} numberOfLines={2}>
                    {c.sousTitre}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionEntete}>
          <Text style={styles.sectionTitre}>Tous les jeux</Text>
          {categorie && (
            <Pressable onPress={() => setCategorie(null)} hitSlop={8}>
              <Text style={styles.reinit}>Réinitialiser</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.grille}>
          {jeuxAffiches.map(({ jeu, cover }) =>
            jeu.disponible ? (
              <Pressable key={jeu.id} onPress={() => ouvrir(jeu)}>
                <CarteJeu jeu={jeu} cover={cover} meilleur={jeux.meilleursScores[jeu.id]} />
              </Pressable>
            ) : (
              <CarteJeu key={jeu.id} jeu={jeu} cover={cover} meilleur={jeux.meilleursScores[jeu.id]} />
            ),
          )}
        </View>

        <Text style={styles.sectionTitre}>Votre progression</Text>
        <View style={styles.progression}>
          <Text style={styles.progNiveau}>Niveau {niveau}</Text>
          <Text style={styles.progTitre}>{titreNiveau(niveau)}</Text>
          <View style={styles.xpPiste}>
            <View style={[styles.xpRemplissage, { width: `${(xpDansNiveau / xpPourSuivant) * 100}%` }]} />
          </View>
          <Text style={styles.xpTexte}>
            {xpDansNiveau} / {xpPourSuivant} XP
          </Text>
          <View style={styles.statsRow}>
            <Stat valeur={jeux.parties} label="Parties jouées" />
            <Stat valeur={serie} label="Série actuelle" />
            <Stat valeur={Object.keys(jeux.meilleursScores).length} label="Jeux différents" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({
  icone,
  valeur,
  label,
}: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  valeur: string;
  label: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icone} size={18} color={colors.accent} />
      <View>
        <Text style={styles.pillValeur}>{valeur}</Text>
        <Text style={styles.pillLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

function CarteJeu({ jeu, cover, meilleur }: { jeu: JeuDef; cover?: Artwork; meilleur?: number }) {
  return (
    <View style={styles.carte}>
      <View style={styles.carteCover}>
        {cover ? (
          <ArtworkCover artwork={cover} width={400} />
        ) : (
          <View style={{ flex: 1, backgroundColor: colors.border }} />
        )}
        {jeu.nouveauChaqueJour && (
          <View style={styles.badgeNouveau}>
            <Text style={styles.badgeNouveauTexte}>NOUVEAU / JOUR</Text>
          </View>
        )}
        {!jeu.disponible && (
          <View style={styles.badgeBientot}>
            <Text style={styles.badgeBientotTexte}>Bientôt</Text>
          </View>
        )}
      </View>
      <View style={styles.carteCorps}>
        <Text style={styles.carteTitre} numberOfLines={2}>
          {jeu.titre}
        </Text>
        <Text style={styles.carteDesc} numberOfLines={3}>
          {jeu.description}
        </Text>
        <View style={styles.carteFooter}>
          <Ionicons name="trophy-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.carteFooterTexte}>
            {!jeu.disponible
              ? 'Bientôt disponible'
              : meilleur
                ? `Meilleur score : ${meilleur}`
                : 'Pas encore joué'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ valeur, label }: { valeur: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValeur}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: MARGE, paddingTop: 8, paddingBottom: 32 },
  titre: { fontFamily: fonts.display, fontSize: 38, color: colors.textPrimary },
  sousTitre: {
    fontFamily: fonts.displayRegular,
    fontSize: 18,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pillsRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  pillValeur: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.textPrimary },
  pillLabel: { fontFamily: fonts.ui, fontSize: 10, color: colors.textSecondary },

  hero: {
    flexDirection: 'row',
    backgroundColor: colors.textPrimary,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 18,
    height: 190,
  },
  heroTexte: { flex: 1, padding: 18, justifyContent: 'center' },
  heroKicker: { fontFamily: fonts.uiSemiBold, fontSize: 10, letterSpacing: 0.8, color: colors.stone },
  heroTitre: { fontFamily: fonts.display, fontSize: 30, color: colors.surface, marginTop: 4 },
  heroDesc: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 17, color: colors.stone, marginTop: 6 },
  heroBouton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(252,251,248,0.16)',
    borderRadius: 24,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  heroBoutonTexte: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.surface },
  heroImage: { width: 130, height: 190 },

  sectionTitre: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, marginTop: 28, marginBottom: 12 },
  sectionEntete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  reinit: { fontFamily: fonts.uiMedium, fontSize: 12, color: colors.accent },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: ECART },

  tuile: {
    width: LARGEUR_CARTE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  tuileActive: { borderColor: colors.accent, backgroundColor: colors.stone },
  tuileTexte: { flex: 1 },
  tuileLabel: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary },
  tuileSous: { fontFamily: fonts.ui, fontSize: 10.5, color: colors.textSecondary, marginTop: 1 },

  carte: {
    width: LARGEUR_CARTE,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  carteCover: { height: 110, overflow: 'hidden' },
  badgeNouveau: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  badgeNouveauTexte: { fontFamily: fonts.uiSemiBold, fontSize: 8.5, letterSpacing: 0.4, color: colors.surface },
  badgeBientot: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeBientotTexte: { fontFamily: fonts.uiSemiBold, fontSize: 10, color: colors.textPrimary },
  carteCorps: { padding: 12, flex: 1 },
  carteTitre: { fontFamily: fonts.display, fontSize: 20, lineHeight: 22, color: colors.textPrimary },
  carteDesc: { fontFamily: fonts.ui, fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, marginTop: 4 },
  carteFooter: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 'auto', paddingTop: 10 },
  carteFooterTexte: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.textSecondary },

  progression: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 18,
  },
  progNiveau: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary },
  progTitre: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  xpPiste: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 14, overflow: 'hidden' },
  xpRemplissage: { height: '100%', backgroundColor: colors.accent },
  xpTexte: { fontFamily: fonts.uiMedium, fontSize: 11, color: colors.textSecondary, marginTop: 6 },
  statsRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  stat: { flex: 1, backgroundColor: colors.background, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  statValeur: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
  statLabel: { fontFamily: fonts.ui, fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
});