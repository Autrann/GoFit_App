import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de actualización
  const [isModalVisible, setModalVisible] = useState(false);
  const [tempWeight, setTempWeight] = useState('70');
  const [tempHeight, setTempHeight] = useState('170');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setTempWeight(data.weight || '70');
          setTempHeight(data.height || '170');
          
          // Si es usuario nuevo sin medidas, forzamos el modal
          if (!data.weight) setModalVisible(true);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleUpdateMetrics = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const today = new Date().toISOString();
        const docRef = doc(db, 'users', user.uid);
        
        await updateDoc(docRef, {
          weight: tempWeight,
          height: tempHeight,
          lastWeightUpdate: today
        });
        
        setUserData({ ...userData, weight: tempWeight, height: tempHeight, lastWeightUpdate: today });
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Error guardando datos:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => auth.signOut();

  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Usuario';
    return fullName.split(' ')[0];
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'Sin registro';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  const weightOptions = Array.from({ length: 111 }, (_, i) => (i + 40).toString());
  const heightOptions = Array.from({ length: 81 }, (_, i) => (i + 140).toString());

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header Moderno */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.greeting}>Hola, {getFirstName(userData?.name || auth.currentUser?.displayName)} 👋</Text>
          <Text style={styles.subGreeting}>{userData?.email}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{getFirstName(userData?.name || auth.currentUser?.displayName).charAt(0).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Tus Métricas</Text>
        
        {/* Tarjeta de Peso (Destacada) */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="scale-outline" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Peso Actual</Text>
          </View>
          <Text style={styles.mainMetric}>{userData?.weight ? `${userData.weight} kg` : '--'}</Text>
          <Text style={styles.dateText}>Actualizado: {formatDate(userData?.lastWeightUpdate)}</Text>
          
          <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.updateButtonText}>Actualizar Medidas</Text>
          </TouchableOpacity>
        </View>

        {/* Tarjeta Secundaria (Estatura) */}
        <View style={styles.secondaryCard}>
          <Ionicons name="body-outline" size={24} color="#34C759" />
          <View style={styles.secondaryCardText}>
            <Text style={styles.cardTitle}>Estatura</Text>
            <Text style={styles.subMetric}>{userData?.height ? `${userData.height} cm` : '--'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para actualizar métricas */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actualizar Medidas</Text>
            
            <Text style={styles.label}>Peso (kg):</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={tempWeight} onValueChange={setTempWeight}>
                {weightOptions.map(w => <Picker.Item key={w} label={`${w} kg`} value={w} />)}
              </Picker>
            </View>

            <Text style={styles.label}>Estatura (cm):</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={tempHeight} onValueChange={setTempHeight}>
                {heightOptions.map(h => <Picker.Item key={h} label={`${h} cm`} value={h} />)}
              </Picker>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleUpdateMetrics} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Guardar</Text>}
            </TouchableOpacity>
            
            {/* Solo permite cancelar si ya tiene medidas guardadas previas */}
            {userData?.weight && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  
  // Header
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  subGreeting: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginBottom: 16, marginTop: 10 },
  
  // Cards
  mainCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, marginBottom: 16 },
  secondaryCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, marginBottom: 32 },
  secondaryCardText: { marginLeft: 16 },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#8E8E93', marginLeft: 8 },
  mainMetric: { fontSize: 48, fontWeight: '900', color: '#1C1C1E', letterSpacing: -1 },
  subMetric: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  dateText: { fontSize: 13, color: '#AEAEB2', marginTop: 4, marginBottom: 20 },
  
  // Buttons
  updateButton: { backgroundColor: '#E5F1FF', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  updateButtonText: { color: '#007AFF', fontSize: 16, fontWeight: '700' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#FFE5E5' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700', marginLeft: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 14, color: '#8E8E93', marginBottom: 8, fontWeight: '500' },
  pickerContainer: { backgroundColor: '#F2F2F7', borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  primaryButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cancelButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
});