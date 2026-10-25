import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formaterNombre } from '../musees/musees';
import { LIBELLES_ORDRE, LIBELLES_ORDRE_COURTS, OrdreOeuvres } from '../oeuvres/tri';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const ORDRES: OrdreOeuvres[] = ['aleatoire', 'ancien', 'recent'];

interface Props {
  /** Nombre d'œuvres affichées, rappelé à gauche de l'icône. */
  nombre: number;
  ordre: OrdreOeuvres;
  onChange: (ordre: OrdreOeuvres) => void;
}

/**
 * Ligne « 1 057 œuvres » avec, à droite, l'icône de tri (trois traits de longueur décroissante).
 * Un tri chronologique actif colore l'icône et affiche son nom à côté. L'icône ouvre une fenêtre
 * qui monte du bas pour choisir l'ordre.
 */
export function TriOeuvres({ nombre, ordre, onChange }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const actif = ordre !== 'aleatoire';

  return (
    <View style={styles.ligne}>
      <Text style={styles.compte}>
        {formaterNombre(nombre)} {nombre > 1 ? 'œuvres' : 'œuvre'}
      </Text>

      <Pressable
        onPress={() => setOuvert(true)}
        hitSlop={8}
        style={styles.declencheur}
        accessibilityRole="button"
        accessibilityLabel="Trier les œuvres"
      >
        {actif ? <Text style={styles.ordreActif}>{LIBELLES_ORDRE_COURTS[ordre]}</Text> : null}
        <View style={[styles.icone, actif ? styles.iconeActive : null]}>
          <MaterialIcons name="filter-list" size={22} color={actif ? colors.surface : colors.textPrimary} />
        </View>
      </Pressable>

      <Modal visible={ouvert} transparent animationType="slide" onRequestClose={() => setOuvert(false)}>
        <View style={styles.voile}>
          <Pressable style={styles.voileFond} onPress={() => setOuvert(false)} />
          <View style={styles.feuille}>
            <View style={styles.entete}>
              <Text style={styles.titre}>Trier les œuvres</Text>
              <Pressable onPress={() => setOuvert(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            {ORDRES.map((o) => (
              <Pressable
                key={o}
                style={styles.choix}
                onPress={() => {
                  onChange(o);
                  setOuvert(false);
                }}
              >
                <Text style={[styles.choixTexte, o === ordre ? styles.choixTexteActif : null]}>{LIBELLES_ORDRE[o]}</Text>
                {o === ordre ? <Ionicons name="checkmark" size={18} color={colors.accent} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  compte: { fontFamily: fonts.ui, fontSize: 13, color: colors.textSecondary },
  declencheur: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ordreActif: { fontFamily: fonts.uiMedium, fontSize: 12.5, color: colors.accent },
  icone: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' },
  iconeActive: { backgroundColor: colors.accent },

  voile: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(23,21,19,0.45)' },
  voileFond: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  feuille: { paddingBottom: 28, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18 },
  titre: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 15, borderTopWidth: 1, borderTopColor: colors.border },
  choixTexte: { flex: 1, fontFamily: fonts.uiMedium, fontSize: 15, color: colors.textPrimary },
  choixTexteActif: { color: colors.accent },
});
