import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para los desplegables (valores por defecto)
  const [selectedWeight, setSelectedWeight] = useState('70');
  const [selectedHeight, setSelectedHeight] = useState('170');
  const [needsMetrics, setNeedsMetrics] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          
          // Si no tiene peso o altura, activamos la vista de configuración
          if (!data.weight || !data.height) {
            setNeedsMetrics(true);
          }
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleSaveMetrics = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        
        // UDATE DOC PARA ACTUALIZAR INFO DEL USUARIO
        await updateDoc(docRef, {
          weight: selectedWeight,
          height: selectedHeight
        });

        
        setUserData({ ...userData, weight: selectedWeight, height: selectedHeight });
        setNeedsMetrics(false);
      }
    } catch (error) {
      console.error("Error guardando datos:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  //Arrays para los dropdowns
  const weightOptions = Array.from({ length: 111 }, (_, i) => (i + 40).toString()); // 40 a 150 kg
  const heightOptions = Array.from({ length: 81 }, (_, i) => (i + 140).toString()); // 140 a 220 cm

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  // VISTA 1: Pedir datos físicos tras crear la cuenta
  if (needsMetrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.header}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>Para personalizar tu experiencia, necesitamos tus medidas actuales.</Text>
          
          <Text style={styles.label}>Peso (kg):</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedWeight}
              onValueChange={(itemValue) => setSelectedWeight(itemValue)}
            >
              {weightOptions.map(w => <Picker.Item key={w} label={`${w} kg`} value={w} />)}
            </Picker>
          </View>

          <Text style={styles.label}>Estatura (cm):</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedHeight}
              onValueChange={(itemValue) => setSelectedHeight(itemValue)}
            >
              {heightOptions.map(h => <Picker.Item key={h} label={`${h} cm`} value={h} />)}
            </Picker>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveMetrics} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Guardar y Continuar</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // VISTA 2: Perfil Principal
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

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.label}>Peso</Text>
            <Text style={styles.metricValue}>{userData?.weight} kg</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.label}>Estatura</Text>
            <Text style={styles.metricValue}>{userData?.height} cm</Text>
          </View>
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
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  infoGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  value: { fontSize: 18, color: '#333', fontWeight: '500' },
  
  //Dropdowns
  pickerContainer: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, marginBottom: 16, backgroundColor: '#FAFAFA' },
  
  // Estilos para la vista principal
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 24 },
  metricBox: { flex: 1, backgroundColor: '#F8F9FA', padding: 16, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  metricValue: { fontSize: 22, fontWeight: 'bold', color: '#007AFF', marginTop: 4 },
  
  // Botones
  primaryButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { backgroundColor: '#FF3B30', padding: 16, borderRadius: 8, alignItems: 'center' },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});