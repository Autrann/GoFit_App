import React, { useState, useEffect } from 'react';
import { SafeAreaView, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebase';

// Importamos las pantallas
import AuthScreen from './src/screens/AuthScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha en tiempo real los cambios de sesión
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    // Limpieza del listener
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  // Si hay usuario, ve al perfil. Si no, ve a la autenticación.
  return user ? <ProfileScreen /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F5F5F5' 
  }
});