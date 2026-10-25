import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Artwork } from '../../types/artwork';
import { ArtworkCover } from '../ArtworkCover';
import { ExpositionImage } from '../ExpositionImage';
import { monogramme } from '../../artistes/artistes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  nom: string;
  /** Portrait de l'artiste, si sa fiche en a un. */
  imageUrl?: string;
  /** À défaut, une de ses œuvres sert d'illustration. */
  oeuvre?: Artwork;
  width?: number;
}

/** Illustration d'un artiste : son portrait, sinon une de ses œuvres, sinon ses initiales sur un fond neutre. */
export function PortraitArtiste({ nom, imageUrl, oeuvre, width = 600 }: Props) {
  if (imageUrl) return <ExpositionImage imageUrl={imageUrl} />;
  if (oeuvre) return <ArtworkCover artwork={oeuvre} width={width} />;
  return (
    <View style={styles.neutre}>
      <Text style={styles.initiales}>{monogramme(nom)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  neutre: { flex: 1, backgroundColor: colors.stone, alignItems: 'center', justifyContent: 'center' },
  initiales: { fontFamily: fonts.display, fontSize: 36, color: colors.textSecondary },
});
