import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { EXPOSITIONS } from '../data/expositions.generated';
import { Exposition, StatutExposition } from '../types/exposition';
import { ExpositionCard } from '../components/ExpositionCard';
import { ExpositionDetail } from '../components/ExpositionDetail';
import { statutExposition } from '../expositions/dates';
import { jourISO } from '../games/progression';
import { AccueilStackParamList } from '../navigation/AccueilStack';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { useCarnet } from '../store/CarnetContext';

type Vue = StatutExposition | 'favoris';

const ONGLETS: { label: string; vue: Vue }[] = [
  { label: "À l'affiche", vue: 'a_laffiche' },
  { label: 'À venir', vue: 'a_venir' },
  { label: 'Passées', vue: 'passee' },
  { label: 'Favoris', vue: 'favoris' },
];

export function ExpositionsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AccueilStackParamList, 'Expositions'>>();
  const expositionId = route.params?.expositionId;

  const [vue, setVue] = useState<Vue>('a_laffiche');
  const [selected, setSelected] = useState<Exposition | null>(null);
  const { expositionNotes, setExpositionNote, expositionsFavorites, toggleExpositionFavori } =
    useCarnet();

  // Arrivée depuis la carte de l'Accueil : ouvre directement la fiche demandée.
  useEffect(() => {
    if (!expositionId) return;
    const demandee = EXPOSITIONS.find((e) => e.id === expositionId);
    if (demandee) setSelected(demandee);
  }, [expositionId]);

  const aujourdhui = jourISO();

  const parStatut = useMemo(() => {
    const groupes: Record<StatutExposition, Exposition[]> = {
      a_laffiche: [],
      a_venir: [],
      passee: [],
    };
    for (const e of EXPOSITIONS) {
      groupes[statutExposition(e.dateDebut, e.dateFin, aujourdhui)].push(e);
    }
    groupes.a_laffiche.sort((a, b) => a.dateFin.localeCompare(b.dateFin));
    groupes.a_venir.sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
    groupes.passee.sort((a, b) => b.dateFin.localeCompare(a.dateFin));
    return groupes;
  }, [aujourdhui]);

  const favorites = useMemo(
    () =>
      EXPOSITIONS.filter((e) => expositionsFavorites[e.id]).sort((a, b) =>
        b.dateFin.localeCompare(a.dateFin),
      ),
    [expositionsFavorites],
  );

  const data = vue === 'favoris' ? favorites : parStatut[vue];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
      <Text style={styles.titre}>Expositions</Text>
      <Text style={styles.sousTitre}>Relevées sur les sites officiels des musées.</Text>

      <View style={styles.ongletsRow}>
        {ONGLETS.map((o) => {
          const active = o.vue === vue;
          return (
            <Pressable key={o.vue} onPress={() => setVue(o.vue)} style={styles.ongletItem}>
              <Text style={[styles.ongletText, active ? styles.ongletTextActif : null]}>
                {o.label}
              </Text>
              {active ? <View style={styles.ongletUnderline} /> : null}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data.length === 0 ? (
          <Text style={styles.vide}>
            {vue === 'favoris'
              ? "Aucune exposition en favori. Touchez le cœur d'une exposition pour la retrouver ici."
              : "Aucune exposition dans cette catégorie pour l'instant."}
          </Text>
        ) : (
          data.map((e) => (
            <ExpositionCard
              key={e.id}
              exposition={e}
              statut={statutExposition(e.dateDebut, e.dateFin, aujourdhui)}
              favori={expositionsFavorites[e.id] ?? false}
              onToggleFavori={() => toggleExpositionFavori(e.id)}
              onPress={() => setSelected(e)}
            />
          ))
        )}
        <Text style={styles.mention}>
          Vérifiez toujours dates, horaires et disponibilité des billets sur le site officiel avant
          votre visite.
        </Text>
      </ScrollView>

      <ExpositionDetail
        exposition={selected}
        onClose={() => setSelected(null)}
        note={selected ? expositionNotes[selected.id] ?? 0 : 0}
        onChangeNote={(note) => selected && setExpositionNote(selected.id, note)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  titre: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sousTitre: {
    fontFamily: fonts.displayRegular,
    fontSize: 17,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 2,
  },
  ongletsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ongletItem: { paddingBottom: 10 },
  ongletText: { fontFamily: fonts.display, fontSize: 17, color: colors.textSecondary },
  ongletTextActif: { color: colors.accent },
  ongletUnderline: { height: 2, backgroundColor: colors.accent, marginTop: 8, borderRadius: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28 },
  vide: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  mention: { fontFamily: fonts.ui, fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
});