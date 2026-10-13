import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JeuxAccueilScreen } from '../screens/jeux/JeuxAccueilScreen';
import { QuiAPeintScreen } from '../screens/jeux/QuiAPeintScreen';
import { OrdreScreen } from '../screens/jeux/OrdreScreen';

export type JeuxStackParamList = {
  JeuxAccueil: undefined;
  QuiAPeint: undefined;
  Ordre: undefined;
};

const Stack = createNativeStackNavigator<JeuxStackParamList>();

export function JeuxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="JeuxAccueil" component={JeuxAccueilScreen} />
      <Stack.Screen name="QuiAPeint" component={QuiAPeintScreen} />
      <Stack.Screen name="Ordre" component={OrdreScreen} />
    </Stack.Navigator>
  );
}