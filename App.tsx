import { StatusBar } from 'expo-status-bar';
import { CatalogueScreen } from './src/screens/CatalogueScreen';

export default function App() {
  return (
    <>
      <CatalogueScreen />
      <StatusBar style="dark" />
    </>
  );
}
