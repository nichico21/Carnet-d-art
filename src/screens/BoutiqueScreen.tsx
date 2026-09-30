import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  DERNIERS_PRODUITS_VUS,
  IDEES_GOUTS,
  PRODUITS,
  SELECTION_BOUTIQUE,
} from '../data/boutique';
import { PRODUITS_REELS } from '../data/boutique.generated';
import { ARTWORKS } from '../data/artworks.generated';
import { ProductCard } from '../components/boutique/ProductCard';
import { ProduitDetail } from '../components/boutique/ProduitDetail';
import { GoutCircle } from '../components/boutique/GoutCircle';
import { CategorieBoutiqueId, Produit } from '../types/boutique';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { CarnetStackParamList } from '../navigation/CarnetStack';

const { width: LARGEUR_ECRAN } = Dimensions.get('window');
const MARGE = 20;
const ECART = 12;
const LARGEUR_TUILE = (LARGEUR_ECRAN - MARGE * 2 - ECART) / 2;

const CATEGORIES_BOUTIQUE: {
  id: CategorieBoutiqueId;
  label: string;
  icone: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { id: 'reproductions', label: 'Reproductions', icone: 'image-outline' },
  { id: 'livres', label: 'Livres', icone: 'library-outline' },
  { id: 'objets', label: 'Objets', icone: 'cube-outline' },
  { id: 'deco', label: 'Déco', icone: 'home-outline' },
  { id: 'vetements', label: 'Vêtements', icone: 'shirt-outline' },
  { id: 'cadeaux', label: 'Cadeaux', icone: 'gift-outline' },
];