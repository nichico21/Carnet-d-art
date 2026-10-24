import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '../../types/artwork';
import { ArtworkCover } from '../ArtworkCover';
import { ExpositionImage } from '../ExpositionImage';
import { colors } from '../../theme/colors';

interface Props {
  /** Image du musée, si sa fiche en a une. */
  imageUrl?: string;
  /** À défaut, une œuvre du musée sert d'illustration. */
  oeuvre?: Artwork;
  width?: number;
}

/** Illustration d'un musée : son image, sinon une de ses œuvres, sinon un fond neutre. */
export function MuseeImage({ imageUrl, oeuvre, width = 600 }: Props) {
  if (imageUrl) return <ExpositionImage imageUrl={imageUrl} />;
  if (oeuvre) return <ArtworkCover artwork={oeuvre} width={width} />;
  return <View style={styles.neutre} />;
}

const styles = StyleSheet.create({
  neutre: { flex: 1, backgroundColor: colors.stone },
});
