import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>📊 Estadísticas (Próximamente)</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' }, text: { fontSize: 18, color: '#666' } });