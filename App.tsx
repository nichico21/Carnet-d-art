import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarnetProvider } from './src/store/CarnetContext';
import { RootTabs } from './src/navigation/RootTabs';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <CarnetProvider>
          <NavigationContainer>
            <RootTabs />
          </NavigationContainer>
          <StatusBar style="dark" />
        </CarnetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}