import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CatalogueScreen } from '../screens/CatalogueScreen';
import { ProfilScreen } from '../screens/ProfilScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { ExploreStack } from './ExploreStack';
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
      <Tab.Screen name="Accueil">{() => <PlaceholderScreen nom="Accueil" />}</Tab.Screen>
      <Tab.Screen name="Explorer" component={ExploreStack} />
      <Tab.Screen name="Carte">{() => <PlaceholderScreen nom="Carte" />}</Tab.Screen>
      <Tab.Screen name="Carnet" component={CatalogueScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}
