import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VeilleAccueilScreen } from '../screens/veille/VeilleAccueilScreen';
import { DerniersAjoutsScreen } from '../screens/veille/DerniersAjoutsScreen';
import { PlusConsultesScreen } from '../screens/veille/PlusConsultesScreen';

export type ExploreStackParamList = {
  VeilleAccueil: undefined;
  DerniersAjouts: undefined;
  PlusConsultes: undefined;
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VeilleAccueil" component={VeilleAccueilScreen} />
      <Stack.Screen name="DerniersAjouts" component={DerniersAjoutsScreen} />
      <Stack.Screen name="PlusConsultes" component={PlusConsultesScreen} />
    </Stack.Navigator>
  );
}
