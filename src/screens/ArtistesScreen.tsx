import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ARTISTES } from '../data/artistes.generated';
import { ARTWORKS, FACETTES } from '../data/artworks.generated';
import { ArtisteDetail } from '../components/artistes/ArtisteDetail';
import { ArtistesView } from '../components/artistes/ArtistesView';
import { ArtisteOeuvresModal } from '../components/ArtisteOeuvresModal';
import { oeuvreAffichable } from '../artistes/artistes';
import { ArtisteExposition } from '../expositions/oeuvres';
import { Artiste } from '../types/artiste';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * L'onglet « Artistes » : la même section que dans le Catalogue, sur son propre écran.
 * Un artiste du catalogue sans fiche ouvre la fenêtre de ses œuvres (celle des pages d'exposition).
 */
export function ArtistesScreen() {
  const navigation = useNavigation();
  const [artisteOuvert, setArtisteOuvert] = useState<Artiste | null>(null);
  const [artisteCatalogue, setArtisteCatalogue] = useState<ArtisteExposition | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titre}>Artistes</Text>

      <ArtistesView
        artistes={ARTISTES}
        artworks={ARTWORKS}
        facettesArtistes={FACETTES.artistes}
        onOuvrirArtiste={setArtisteOuvert}
        onSelectArtisteCatalogue={(nom) =>
          setArtisteCatalogue({ nom, oeuvres: ARTWORKS.filter((a) => a.artiste === nom && oeuvreAffichable(a)) })
        }
      />

      <ArtisteDetail
        artiste={artisteOuvert}
        onClose={() => setArtisteOuvert(null)}
        onOuvrirExposition={(expositionId) => {
          setArtisteOuvert(null);
          (navigation.navigate as (name: string, params?: object) => void)('Accueil', {
            screen: 'Expositions',
            params: { expositionId },
          });
        }}
      />

      <ArtisteOeuvresModal
        artiste={artisteCatalogue}
        onClose={() => setArtisteCatalogue(null)}
        onFermerTout={() => setArtisteCatalogue(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titre: { fontFamily: fonts.display, fontSize: 38, color: colors.textPrimary, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
});
