import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ProfilScreen } from '../screens/ProfilScreen';
import { JeuxAccueilScreen } from '../screens/jeux/JeuxAccueilScreen';
import { AccueilStack } from './AccueilStack';
import { ExploreStack } from './ExploreStack';
import { CarnetStack } from './CarnetStack';
import { CustomTabBar } from './CustomTabBar';

export type RootTabParamList = {
  Accueil: undefined;
  Explorer: undefined;
  Carnet: undefined;
  Jeux: undefined;
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
      <Tab.Screen name="Accueil" component={AccueilStack} />
      <Tab.Screen name="Explorer" component={ExploreStack} />
      <Tab.Screen name="Carnet" component={CarnetStack} />
      <Tab.Screen name="Jeux" component={JeuxAccueilScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}