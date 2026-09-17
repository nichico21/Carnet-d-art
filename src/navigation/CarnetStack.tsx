import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CatalogueScreen } from '../screens/CatalogueScreen';
import { BoutiqueScreen } from '../screens/BoutiqueScreen';

export type CarnetStackParamList = {
  CatalogueAccueil: undefined;
  Boutique: { artworkId?: string } | undefined;
};

const Stack = createNativeStackNavigator<CarnetStackParamList>();

export function CarnetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CatalogueAccueil" component={CatalogueScreen} />
      <Stack.Screen name="Boutique" component={BoutiqueScreen} />
    </Stack.Navigator>
  );
}
