import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfilScreen } from '../screens/ProfilScreen';
import { AccueilScreen } from '../screens/AccueilScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { ExploreStack } from './ExploreStack';
import { CarnetStack } from './CarnetStack';
import { CustomTabBar } from './CustomTabBar';

export type RootTabParamList = {
  Accueil: undefined;
  Explorer: undefined;
  Carte: undefined;
  Carnet: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <CustomTabBar
          active={state.routes[state.index].name}
          onPress={(key) => navigation.navigate(key)}
        />
      )}
    >
      <Tab.Screen name="Accueil" component={AccueilScreen} />
      <Tab.Screen name="Explorer" component={ExploreStack} />
      <Tab.Screen name="Carte">{() => <PlaceholderScreen nom="Carte" />}</Tab.Screen>
      <Tab.Screen name="Carnet" component={CarnetStack} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
