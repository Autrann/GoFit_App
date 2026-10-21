import React, { useState, useEffect, useContext } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebase';

import AuthScreen from './src/screens/AuthScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext'; // <-- Importación

// Subcomponente que lee el tema global
function RootNavigator({ user, loading }: { user: User | null, loading: boolean }) {
  const { isDark } = useContext(ThemeContext);

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return user ? (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <MainTabNavigator />
    </NavigationContainer>
  ) : (
    <AuthScreen />
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator user={user} loading={loading} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});