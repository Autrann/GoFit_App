import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebase';

import AuthScreen from './src/screens/AuthScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function RootNavigator({ user, loading }: { user: User | null; loading: boolean }) {
  const { isDark, colors, kStyles } = useTheme();

  if (loading) {
    return (
      <SafeAreaView style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={colors.lime} />
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