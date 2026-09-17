import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CatalogueScreen } from './src/screens/CatalogueScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <CatalogueScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
