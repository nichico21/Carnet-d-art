import React, { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ARTWORKS } from '../../data/artworks.generated';
import { Artwork } from '../../types/artwork';
import { ArtworkCover } from '../../components/ArtworkCover';
import { ArtworkDetail } from '../../components/ArtworkDetail';
import { genererQuestionsQuiAPeint, QuestionQuiAPeint } from '../../games/questions';
import { useCarnet } from '../../store/CarnetContext';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

const XP_PAR_BONNE_REPONSE = 10;

export function QuiAPeintScreen() {
  const navigation = useNavigation();
  const { notes, favoris, setNote, toggleFavori, enregistrerPartie } = useCarnet();

  const questions = useMemo(() => genererQuestionsQuiAPeint(ARTWORKS, 10), []);
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [resultats, setResultats] = useState<boolean[]>([]);
  const [termine, setTermine] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

const [artworkOuvert, setArtworkOuvert] = useState<Artwork | null>(null);

useEffect(() => {
  if (selection === null) return;
  const suivante = questions[index + 1];
  if (suivante?.artwork.imageUrl) {
    Image.prefetch(`${suivante.artwork.imageUrl}?width=800`);
  }
}, [selection, index, questions]);


  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitre}>Qui a peint ?</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.videBloc}>
          <Text style={styles.videTexte}>
            Pas encore assez d'œuvres avec artiste identifié pour lancer ce jeu.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const question = questions[index];
  const xpGagne = score * XP_PAR_BONNE_REPONSE;

  function repondre(i: number) {
    if (selection !== null) return;
    setSelection(i);
    const correct = i === question.correctIndex;
    if (correct) setScore((s) => s + 1);
    setResultats((r) => [...r, correct]);
  }

  function suivant() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelection(null);
    } else {
      if (!enregistre) {
        enregistrerPartie('qui-a-peint', score, xpGagne);
        setEnregistre(true);
      }
      setTermine(true);
    }
  }

  if (termine) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.finScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.finHeader}>
            <Ionicons name="trophy" size={40} color={colors.accent} />
            <Text style={styles.finTitre}>Partie terminée</Text>
            <Text style={styles.finScore}>
              {score} / {questions.length} bonnes réponses
            </Text>
            <Text style={styles.finXp}>+{xpGagne} XP</Text>
          </View>

          <Text style={styles.finSectionTitre}>Œuvres de cette partie</Text>
          {questions.map((q: QuestionQuiAPeint, i) => (
            <Pressable
              key={q.artwork.id}
              style={styles.finItem}
              onPress={() => setArtworkOuvert(q.artwork)}
            >
              <View style={styles.finItemCover}>
                <ArtworkCover artwork={q.artwork} width={200} />
              </View>
              <View style={styles.finItemBody}>
                <Text style={styles.finItemTitre} numberOfLines={1}>
                  {q.artwork.titre}
                </Text>
                <Text style={styles.finItemArtiste} numberOfLines={1}>
                  {q.artwork.artiste}
                </Text>
              </View>
              <Ionicons
                name={resultats[i] ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={resultats[i] ? colors.positive : colors.negative}
              />
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.boutonZone}>
          <Pressable style={styles.boutonPrincipal} onPress={() => navigation.goBack()}>
            <Text style={styles.boutonPrincipalTexte}>Retour aux jeux</Text>
          </Pressable>
        </View>

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
          Question {index + 1}/{questions.length}
        </Text>
        <Text style={styles.headerScore}>{score} pts</Text>
      </View>

      <View style={styles.progressRow}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[styles.progressSegment, i <= index && styles.progressSegmentFait]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.image}>
          <ArtworkCover artwork={question.artwork} width={800} contentFit="contain" />
        </View>

        <Text style={styles.question}>Qui a peint cette œuvre ?</Text>

        <View style={styles.optionsBloc}>
          {question.options.map((option, i) => {
            const estCorrecte = i === question.correctIndex;
            const estSelectionnee = i === selection;
            const revele = selection !== null && (estCorrecte || estSelectionnee);
            const styleBouton = [
              styles.option,
              selection !== null && estCorrecte ? styles.optionCorrecte : null,
              selection !== null && estSelectionnee && !estCorrecte ? styles.optionFausse : null,
            ];
            const styleTexte = [styles.optionTexte, revele ? styles.optionTexteRevele : null];

            return (
              <Pressable
                key={option}
                style={styleBouton}
                onPress={() => repondre(i)}
                disabled={selection !== null}
              >
                <Text style={styleTexte} numberOfLines={2}>
                  {option}
                </Text>
                {selection !== null && estCorrecte && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
                )}
                {selection !== null && estSelectionnee && !estCorrecte && (
                  <Ionicons name="close-circle" size={18} color={colors.surface} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {selection !== null && (
        <View style={styles.boutonZone}>
          <Pressable style={styles.boutonPrincipal} onPress={suivant}>
            <Text style={styles.boutonPrincipalTexte}>
              {index + 1 < questions.length ? 'Question suivante' : 'Voir le résultat'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
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
  image: {
    height: 260,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.stone,
  },
  question: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },
  optionsBloc: { paddingHorizontal: 20, marginTop: 18, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionCorrecte: { backgroundColor: colors.positive, borderColor: colors.positive },
  optionFausse: { backgroundColor: colors.negative, borderColor: colors.negative },
  optionTexte: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15, color: colors.textPrimary },
  optionTexteRevele: { color: colors.surface },
  boutonZone: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  boutonPrincipal: {
    backgroundColor: colors.textPrimary,
    borderRadius: 28,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonPrincipalTexte: { fontFamily: fonts.uiSemiBold, fontSize: 15, color: colors.surface },
  videBloc: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  videTexte: { fontFamily: fonts.ui, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  finScrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
  finHeader: { alignItems: 'center', gap: 4, marginBottom: 24 },
  finTitre: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary, marginTop: 8 },
  finScore: { fontFamily: fonts.uiMedium, fontSize: 16, color: colors.textPrimary },
  finXp: { fontFamily: fonts.uiSemiBold, fontSize: 14, color: colors.accent },
  finSectionTitre: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, marginBottom: 12 },
  finItem: {
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
  finItemCover: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  finItemBody: { flex: 1 },
  finItemTitre: { fontFamily: fonts.uiSemiBold, fontSize: 13, color: colors.textPrimary },
  finItemArtiste: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, marginTop: 1 },
});