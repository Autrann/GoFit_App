import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import CatalogScreen from './src/screens/CatalogScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <CatalogScreen />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});