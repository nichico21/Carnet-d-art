import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccueilScreen } from '../screens/AccueilScreen';
import { ExpositionsScreen } from '../screens/ExpositionsScreen';

export type AccueilStackParamList = {
  AccueilHome: undefined;
  Expositions: undefined;
};

const Stack = createNativeStackNavigator<AccueilStackParamList>();

export function AccueilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccueilHome" component={AccueilScreen} />
      <Stack.Screen name="Expositions" component={ExpositionsScreen} />
    </Stack.Navigator>
  );
}
