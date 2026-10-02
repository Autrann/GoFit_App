import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Consultamos la colección 'users' usando el ID único del usuario
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Mi Perfil</Text>
        
        <View style={styles.infoGroup}>
          <Text style={styles.label}>Nombre:</Text>
          <Text style={styles.value}>{userData?.name || auth.currentUser?.displayName || 'Sin nombre'}</Text>
        </View>

        <View style={styles.infoGroup}>
          <Text style={styles.label}>Correo:</Text>
          <Text style={styles.value}>{userData?.email || auth.currentUser?.email}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 24, justifyContent: 'center' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 24, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#333', textAlign: 'center' },
  infoGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  value: { fontSize: 18, color: '#333', fontWeight: '500' },
  logoutButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});