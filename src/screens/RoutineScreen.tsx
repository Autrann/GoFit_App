import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Datos locales
import catalog from '../assets/data/catalogo_app.json';
import { imageMap } from '../assets/imgs/imageMap';

// Tipos
type Exercise = { id: string; name: string; muscle: string; image: string; };
type DayPlan = { isRest: boolean; title: string; muscles: string[]; cardio: boolean; exercises: Exercise[]; };
type Routine = { [key: string]: DayPlan };

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Tríceps', 'Bíceps', 'Antebrazo', 'Pierna', 'Glúteo', 'Abdomen'];

const defaultDayPlan: DayPlan = { isRest: false, title: '', muscles: [], cardio: false, exercises: [] };
const initialRoutine = DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDayPlan } }), {} as Routine);

export default function RoutineScreen() {
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [activeDay, setActiveDay] = useState<string>('Lunes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para Modales
  const [isCatalogVisible, setCatalogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // 1. Cargar rutina desde Firebase
  useEffect(() => {
    const fetchRoutine = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'data', 'routine');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Fusionamos la rutina guardada con la estructura base por si faltan días
          setRoutine({ ...initialRoutine, ...docSnap.data() });
        }
      }
      setLoading(false);
    };
    fetchRoutine();
  }, []);

  // 2. Guardar rutina en Firebase
  const handleSaveRoutine = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'data', 'routine');
        await setDoc(docRef, routine);
      }
    } catch (error) {
      console.error("Error guardando rutina:", error);
    } finally {
      setSaving(false);
    }
  };

  // 3. Funciones de actualización del día activo
  const updateActiveDay = (updates: Partial<DayPlan>) => {
    setRoutine(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], ...updates } }));
  };

  const toggleMuscle = (muscle: string) => {
    const currentMuscles = routine[activeDay].muscles;
    const newMuscles = currentMuscles.includes(muscle)
      ? currentMuscles.filter(m => m !== muscle)
      : [...currentMuscles, muscle];
    updateActiveDay({ muscles: newMuscles });
  };

  const handleAddExercise = () => {
    if (previewExercise) {
      const currentExercises = routine[activeDay].exercises;
      // Evitar duplicados exactos
      if (!currentExercises.find(e => e.id === previewExercise.id)) {
        updateActiveDay({ exercises: [...currentExercises, previewExercise] });
      }
      setPreviewExercise(null);
      setCatalogVisible(false);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    const currentExercises = routine[activeDay].exercises;
    updateActiveDay({ exercises: currentExercises.filter(e => e.id !== exerciseId) });
  };

  // 4. Filtrado del catálogo
  const filteredCatalog = catalog.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ex.muscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  const currentPlan = routine[activeDay];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header y Selector de Días */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Rutina</Text>
        <TouchableOpacity onPress={handleSaveRoutine} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayTab, activeDay === day && styles.dayTabActive]} 
              onPress={() => setActiveDay(day)}
            >
              <Text style={[styles.dayTabText, activeDay === day && styles.dayTabTextActive]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido del Día */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.card}>
          
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Día de Descanso</Text>
            <Switch 
              value={currentPlan.isRest} 
              onValueChange={(val) => updateActiveDay({ isRest: val })}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            />
          </View>

          {!currentPlan.isRest && (
            <>
              <View style={styles.divider} />
              
              <Text style={styles.label}>Título (Ej. Push, Pierna Pesada)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Nombre de la sesión" 
                value={currentPlan.title}
                onChangeText={(val) => updateActiveDay({ title: val })}
              />

              <Text style={styles.label}>Músculos a trabajar</Text>
              <View style={styles.chipsContainer}>
                {MUSCLE_GROUPS.map(muscle => {
                  const isActive = currentPlan.muscles.includes(muscle);
                  return (
                    <TouchableOpacity 
                      key={muscle} 
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => toggleMuscle(muscle)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{muscle}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.rowBetween, { marginTop: 16 }]}>
                <Text style={styles.label}>¿Harás Cardio?</Text>
                <Switch 
                  value={currentPlan.cardio} 
                  onValueChange={(val) => updateActiveDay({ cardio: val })}
                  trackColor={{ false: '#E5E5EA', true: '#FF9500' }}
                />
              </View>

              <View style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Ejercicios ({currentPlan.exercises.length})</Text>
              
              {currentPlan.exercises.map((ex, index) => (
                <View key={`${ex.id}-${index}`} style={styles.exerciseListItem}>
                  <Image source={imageMap[ex.id as keyof typeof imageMap]} style={styles.exerciseListImg} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.exerciseListName}>{ex.name}</Text>
                    <Text style={styles.exerciseListMuscle}>{ex.muscle}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveExercise(ex.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addBtn} onPress={() => setCatalogVisible(true)}>
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addBtnText}>Agregar Ejercicio</Text>
              </TouchableOpacity>
            </>
          )}

          {currentPlan.isRest && (
            <View style={styles.restContainer}>
              <Ionicons name="bed-outline" size={60} color="#AEAEB2" />
              <Text style={styles.restText}>Toca recargar energías.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL 1: Catálogo de Búsqueda */}
      <Modal visible={isCatalogVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCatalogVisible(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Catálogo</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar ejercicio o músculo..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredCatalog}
            keyExtractor={item => item.id}
            initialNumToRender={12}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.catalogCard} onPress={() => setPreviewExercise(item as Exercise)}>
                {imageMap[item.id as keyof typeof imageMap] ? (
                  <Image source={imageMap[item.id as keyof typeof imageMap]} style={styles.catalogImg} />
                ) : (
                  <View style={[styles.catalogImg, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={24} color="#C7C7CC" />
                  </View>
                )}
                <View style={styles.catalogInfo}>
                  <Text style={styles.catalogName}>{item.name}</Text>
                  <Text style={styles.catalogMuscle}>{item.muscle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* MODAL 2: Vista Previa del Ejercicio */}
      <Modal visible={!!previewExercise} animationType="fade" transparent={true}>
        <View style={styles.previewOverlay}>
          <View style={styles.previewContent}>
            <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setPreviewExercise(null)}>
              <Ionicons name="close-circle" size={30} color="#AEAEB2" />
            </TouchableOpacity>
            
            {previewExercise && imageMap[previewExercise.id as keyof typeof imageMap] ? (
              <Image source={imageMap[previewExercise.id as keyof typeof imageMap]} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <View style={[styles.previewImg, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{color: '#999'}}>Sin imagen disponible</Text>
              </View>
            )}

            <Text style={styles.previewTitle}>{previewExercise?.name}</Text>
            <Text style={styles.previewMuscle}>Músculo principal: {previewExercise?.muscle}</Text>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
              <Text style={styles.primaryButtonText}>Agregar a {activeDay}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  saveBtn: { backgroundColor: '#E5F1FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  saveBtnText: { color: '#007AFF', fontWeight: '700' },
  
  // Days Selector
  daysScroll: { paddingHorizontal: 16, paddingBottom: 10 },
  dayTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#E5E5EA', marginRight: 10 },
  dayTabActive: { backgroundColor: '#1C1C1E' },
  dayTabText: { color: '#8E8E93', fontWeight: '600', textTransform: 'capitalize' },
  dayTabTextActive: { color: '#FFF' },

  // Content
  content: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F2F2F7', padding: 14, borderRadius: 12, fontSize: 16, color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 20 },

  // Chips
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: '#E5F1FF', borderColor: '#007AFF' },
  chipText: { color: '#8E8E93', fontWeight: '500' },
  chipTextActive: { color: '#007AFF', fontWeight: '700' },

  // Added Exercises List
  exerciseListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 10, borderRadius: 12, marginBottom: 8 },
  exerciseListImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#FFF' },
  exerciseListName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  exerciseListMuscle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, marginTop: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#C7C7CC' },
  addBtnText: { color: '#007AFF', fontWeight: '600', marginLeft: 8 },

  restContainer: { alignItems: 'center', paddingVertical: 40 },
  restText: { fontSize: 16, color: '#AEAEB2', marginTop: 12, fontWeight: '500' },

  // Catalog Modal
  modalContainer: { flex: 1, backgroundColor: '#F2F2F7' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  cancelText: { color: '#007AFF', fontSize: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA', margin: 16, paddingHorizontal: 12, borderRadius: 10, height: 40 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  catalogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  catalogImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F2F2F7' },
  catalogInfo: { flex: 1, marginLeft: 12 },
  catalogName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  catalogMuscle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },

  // Preview Modal
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  closePreviewBtn: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  previewImg: { width: '100%', height: 250, borderRadius: 16, backgroundColor: '#F2F2F7', marginBottom: 20 },
  previewTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  previewMuscle: { fontSize: 16, color: '#8E8E93', marginTop: 8, marginBottom: 24 },
  primaryButton: { backgroundColor: '#007AFF', width: '100%', padding: 16, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});