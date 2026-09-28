import { Dimensions, StyleSheet, View, Pressable } from 'react-native';
import { Artwork } from '../types/artwork';
import { ArtworkCover } from './ArtworkCover';

const GRID_GAP = 3;
const COLUMNS = 3;
const CONTAINER_PADDING = 16;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

type CellSpec = { col: number; row: number; colSpan: number; rowSpan: number };

const PATTERN_A: CellSpec[] = [
  { col: 0, row: 0, colSpan: 1, rowSpan: 2 },
  { col: 1, row: 0, colSpan: 1, rowSpan: 1 },
  { col: 2, row: 0, colSpan: 1, rowSpan: 1 },
  { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
  { col: 2, row: 1, colSpan: 1, rowSpan: 1 },
];

const PATTERN_B: CellSpec[] = [
  { col: 0, row: 0, colSpan: 2, rowSpan: 2 },
  { col: 2, row: 0, colSpan: 1, rowSpan: 2 },
];

const PATTERNS = [PATTERN_A, PATTERN_B];

export interface Bloc {
  key: string;
  pattern: CellSpec[];
  rows: number;
  artworks: Artwork[];
  simple?: boolean; // true = grille flexible classique plutôt que motif à positions absolues
}

/** Découpe la liste d'œuvres en blocs, en alternant les motifs A et B. */
export function construireBlocs(artworks: Artwork[]): Bloc[] {
  const blocs: Bloc[] = [];
  let i = 0;
  let patternIndex = 0;

  while (i < artworks.length) {
    const pattern = PATTERNS[patternIndex % PATTERNS.length];
    const tranche = artworks.slice(i, i + pattern.length);

    if (tranche.length < pattern.length) {
      // Reste insuffisant pour un motif complet : grille flexible simple,
      // sans positionnement absolu — évite tout calcul de hauteur fragile
      // sur les petits lots (ex. "Mon carnet" avec peu d'œuvres).
      blocs.push({
        key: `reste-${i}`,
        pattern: [],
        rows: 0,
        artworks: tranche,
        simple: true,
      });
      break;
    }

    blocs.push({ key: `bloc-${i}`, pattern, rows: 2, artworks: tranche });
    i += pattern.length;
    patternIndex += 1;
  }

  return blocs;
}

function GridCell({
  artwork,
  style,
  onPress,
}: {
  artwork: Artwork;
  style: any;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.cell, style]} onPress={onPress}>
      <ArtworkCover artwork={artwork} />
    </Pressable>
  );
}

export function GridBlock({ bloc, onPressItem }: { bloc: Bloc; onPressItem: (a: Artwork) => void }) {
  if (bloc.simple) {
    return (
      <View style={styles.simpleGrid}>
        {bloc.artworks.map((artwork) => (
          <GridCell
            key={artwork.id}
            artwork={artwork}
            onPress={() => onPressItem(artwork)}
            style={{
              width: COLUMN_WIDTH,
              height: COLUMN_WIDTH,
              marginBottom: GRID_GAP,
            }}
          />
        ))}
      </View>
    );
  }

  const hauteurBloc = bloc.rows * COLUMN_WIDTH + (bloc.rows - 1) * GRID_GAP;

  return (
    <View style={{ height: hauteurBloc, marginBottom: GRID_GAP }}>
      {bloc.artworks.map((artwork, idx) => {
        const cell = bloc.pattern[idx];
        const largeur = cell.colSpan * COLUMN_WIDTH + (cell.colSpan - 1) * GRID_GAP;
        const hauteur = cell.rowSpan * COLUMN_WIDTH + (cell.rowSpan - 1) * GRID_GAP;
        return (
          <GridCell
            key={artwork.id}
            artwork={artwork}
            onPress={() => onPressItem(artwork)}
            style={{
              position: 'absolute',
              left: cell.col * (COLUMN_WIDTH + GRID_GAP),
              top: cell.row * (COLUMN_WIDTH + GRID_GAP),
              width: largeur,
              height: hauteur,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    overflow: 'hidden',
  },
  simpleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
});