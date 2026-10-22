import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Modal, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics'; // <-- NUEVO: Para vibraciones premium
import { LinearGradient } from 'expo-linear-gradient'; // <-- NUEVO: Fondos premium

// Datos locales
import catalog from '../assets/data/catalogo_app.json';
import { imageMap } from '../assets/imgs/imageMap';

import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

type Exercise = { id: string; name: string; muscle: string; image: string; instructions?: string[]; muscleImage?: string; };
type DayPlan = { isRest: boolean; title: string; muscles: string[]; cardio: boolean; exercises: Exercise[]; };
type Routine = { [key: string]: DayPlan };

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Tríceps', 'Bíceps', 'Antebrazo', 'Pierna', 'Glúteo', 'Abdomen'];

const muscleToImageKey: Record<string, keyof typeof imageMap> = {
  'Pecho': 'pectoralis-major.webp',
  'Espalda': 'trapezius.webp',
  'Hombro': 'lateral-deltoid.webp',
  'Tríceps': 'triceps-brachii.webp',
  'Bíceps': 'biceps-brachii.webp',
  'Antebrazo': 'forearm-flexors.webp',
  'Pierna': 'quadriceps.webp',
  'Glúteo': 'gluteus-maximus.webp',
  'Abdomen': 'rectus-abdominis.webp'
};

const defaultDayPlan: DayPlan = { isRest: false, title: '', muscles: [], cardio: false, exercises: [] };
const initialRoutine = DAYS.reduce((acc, day) => ({ ...acc, [day]: { ...defaultDayPlan } }), {} as Routine);

export default function RoutineScreen() {
  const { isDark } = useContext(ThemeContext); 
  const colors = isDark ? darkColors : lightColors;
  const styles = getStyles(colors);

  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [activeDay, setActiveDay] = useState<string>('Lunes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Modales
  const [isCatalogVisible, setCatalogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const fetchRoutine = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'data', 'routine');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setRoutine({ ...initialRoutine, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchRoutine();
  }, []);

  const handleSaveRoutine = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Feedback de éxito
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid, 'data', 'routine');
        await setDoc(docRef, routine);
      }
      setIsEditing(false);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Error guardando rutina:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateActiveDay = (updates: Partial<DayPlan>) => {
    setRoutine(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], ...updates } }));
  };

  const toggleMuscle = (muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentMuscles = routine[activeDay].muscles;
    const newMuscles = currentMuscles.includes(muscle)
      ? currentMuscles.filter(m => m !== muscle)
      : [...currentMuscles, muscle];
    updateActiveDay({ muscles: newMuscles });
  };

  const handleAddExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (previewExercise) {
      const currentExercises = routine[activeDay].exercises;
      if (!currentExercises.find(e => e.id === previewExercise.id)) {
        updateActiveDay({ exercises: [...currentExercises, previewExercise] });
      }
      setPreviewExercise(null);
      setShowGuide(false);
      setCatalogVisible(false);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const currentExercises = routine[activeDay].exercises;
    updateActiveDay({ exercises: currentExercises.filter(e => e.id !== exerciseId) });
  };

  const openPreview = (exercise: Exercise) => {
    Haptics.selectionAsync();
    const fullExercise = catalog.find(item => item.id === exercise.id) || exercise;
    setPreviewExercise(fullExercise as Exercise);
    setShowGuide(false);
  };

  const changeDay = (day: string) => {
    if (day !== activeDay) Haptics.selectionAsync(); // Feedback al cambiar pestaña
    setActiveDay(day);
    setIsEditing(false);
  };

  const toggleEditMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isEditing) handleSaveRoutine();
    else setIsEditing(true);
  };

  const filteredCatalog = catalog.filter(ex => 
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ex.muscle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const currentPlan = routine[activeDay];
  const isPreviewInRoutine = previewExercise ? currentPlan.exercises.some(e => e.id === previewExercise.id) : false;

  const renderMuscleImage = (muscleName: string, size = 24) => {
    const imageKey = muscleToImageKey[muscleName];
    const imageSource = imageMap[imageKey];
    if (imageSource) return <Image source={imageSource} style={{ width: size, height: size, borderRadius: size/2 }} resizeMode="cover" />;
    return <Ionicons name="body-outline" size={size} color="#8E8E93" />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Rutina</Text>
        <TouchableOpacity onPress={handleSaveRoutine} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
        </TouchableOpacity>
      </View>

      {/* Selector de Días Flotante */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {DAYS.map(day => (
            <TouchableOpacity 
              key={day} 
              style={[styles.dayTab, activeDay === day && styles.dayTabActive]} 
              onPress={() => changeDay(day)}
            >
              <Text style={[styles.dayTabText, activeDay === day && styles.dayTabTextActive]}>{day.slice(0, 3)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Tarjeta Principal con Gradiente */}
        <LinearGradient 
          colors={isDark ? ['#1C1C1E', '#2C2C2E'] : ['#FFFFFF', '#F2F2F7']} 
          style={styles.card}
        >
          {/* Cabecera de la Tarjeta */}
          <View style={[styles.rowBetween, { marginBottom: 16 }]}>
            <Text style={styles.sectionTitle}>
              {currentPlan.isRest ? 'Día de Descanso 🛏️' : (currentPlan.title || 'Día de Entrenamiento 🔥')}
            </Text>
            <TouchableOpacity style={styles.editToggleBtn} onPress={toggleEditMode} disabled={saving}>
              {isEditing ? (
                saving ? <ActivityIndicator size="small" color={colors.success} /> : <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="create" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {/* MODO EDICIÓN */}
          {isEditing && (
            <View style={styles.editSection}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>¿Día de descanso?</Text>
                <Switch 
                  value={currentPlan.isRest} 
                  onValueChange={(val) => { Haptics.selectionAsync(); updateActiveDay({ isRest: val }); }}
                  trackColor={{ false: colors.border, true: colors.success }}
                />
              </View>

              {!currentPlan.isRest && (
                <>
                  <Text style={styles.label}>Nombre de la sesión</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Push Pesado, Pierna Enfoque Glúteo" 
                    placeholderTextColor={colors.textSecondary}
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
                          <View style={{ marginRight: 6 }}>{renderMuscleImage(muscle, 20)}</View>
                          <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{muscle}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={[styles.rowBetween, { marginTop: 20 }]}>
                    <Text style={styles.label}>¿Incluir Cardio?</Text>
                    <Switch 
                      value={currentPlan.cardio} 
                      onValueChange={(val) => { Haptics.selectionAsync(); updateActiveDay({ cardio: val }); }}
                      trackColor={{ false: colors.border, true: '#FF9500' }}
                    />
                  </View>
                </>
              )}
              <View style={styles.divider} />
            </View>
          )}

          {/* MODO LECTURA */}
          {currentPlan.isRest ? (
            <View style={styles.restContainer}>
              <Ionicons name="battery-charging-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.restText}>Hoy el cuerpo se recupera para crecer.</Text>
            </View>
          ) : (
            <>
              {!isEditing && currentPlan.muscles.length > 0 && (
                <View style={styles.readOnlyMusclesContainer}>
                  <View style={styles.chipsContainer}>
                    {currentPlan.muscles.map(muscle => (
                      <View key={muscle} style={[styles.chip, styles.chipActive, { paddingVertical: 6 }]}>
                        <View style={{ marginRight: 6 }}>{renderMuscleImage(muscle, 18)}</View>
                        <Text style={styles.chipTextActive}>{muscle}</Text>
                      </View>
                    ))}
                    {currentPlan.cardio && (
                      <View style={styles.cardioBadge}>
                        <Ionicons name="flame" size={14} color="#FF9500" />
                        <Text style={styles.cardioBadgeText}>Cardio</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.divider} />
                </View>
              )}

              <Text style={styles.sectionTitle}>Ejercicios ({currentPlan.exercises.length})</Text>
              
              {currentPlan.exercises.length === 0 && !isEditing && (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={40} color={colors.border} />
                  <Text style={styles.emptyText}>Tu rutina está vacía. Toca el botón de editar para comenzar a construirla.</Text>
                </View>
              )}

              {currentPlan.exercises.map((ex, index) => (
                <View key={`${ex.id}-${index}`} style={styles.exerciseListItem}>
                  <TouchableOpacity style={styles.exerciseListContent} onPress={() => openPreview(ex)}>
                    <Image source={imageMap[ex.id as keyof typeof imageMap]} style={styles.exerciseListImg} />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <Text style={styles.exerciseListName}>{ex.name}</Text>
                      <Text style={styles.exerciseListMuscle}>{ex.muscle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  
                  {isEditing && (
                    <TouchableOpacity style={styles.deleteIconBtn} onPress={() => handleRemoveExercise(ex.id)}>
                      <Ionicons name="remove-circle" size={28} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {isEditing && (
                <TouchableOpacity style={styles.addBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCatalogVisible(true); }}>
                  <Ionicons name="add" size={24} color={colors.primary} />
                  <Text style={styles.addBtnText}>Añadir Ejercicio</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </LinearGradient>

        {isEditing && (
           <TouchableOpacity style={styles.bottomSaveBtn} onPress={handleSaveRoutine} disabled={saving}>
             {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.bottomSaveBtnText}>Confirmar Rutina</Text>}
           </TouchableOpacity>
        )}
      </ScrollView>

      {/* MODAL 1: Catálogo estilo Bottom Sheet */}
      <Modal visible={isCatalogVisible} animationType="slide" transparent={true}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.bottomSheetContent, { height: '85%' }]}>
            <View style={styles.dragHandle} />
            
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Catálogo</Text>
              <TouchableOpacity onPress={() => setCatalogVisible(false)}>
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Buscar por nombre o músculo..." 
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredCatalog}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.catalogCard} onPress={() => openPreview(item as Exercise)}>
                  {imageMap[item.id as keyof typeof imageMap] ? (
                    <Image source={imageMap[item.id as keyof typeof imageMap]} style={styles.catalogImg} />
                  ) : (
                    <View style={[styles.catalogImg, { justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image-outline" size={24} color={colors.border} />
                    </View>
                  )}
                  <View style={styles.catalogInfo}>
                    <Text style={styles.catalogName}>{item.name}</Text>
                    <Text style={styles.catalogMuscle}>{item.muscle}</Text>
                  </View>
                  <Ionicons name="add-circle" size={28} color={colors.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Detalles estilo Bottom Sheet */}
      <Modal visible={!!previewExercise} animationType="slide" transparent={true}>
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.dragHandle} />
            
            <TouchableOpacity style={styles.closePreviewBtn} onPress={() => setPreviewExercise(null)}>
              <Ionicons name="close-circle" size={30} color={colors.textSecondary} />
            </TouchableOpacity>
            
            {previewExercise && imageMap[previewExercise.id as keyof typeof imageMap] ? (
              <Image source={imageMap[previewExercise.id as keyof typeof imageMap]} style={styles.previewImg} resizeMode="contain" />
            ) : (
              <View style={[styles.previewImg, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#999'}}>Sin imagen</Text></View>
            )}

            <Text style={styles.previewTitle}>{previewExercise?.name}</Text>
            
            <View style={styles.muscleContainer}>
              <Text style={styles.previewMuscle}>Enfoque: <Text style={{fontWeight: '700', color: colors.primary}}>{previewExercise?.muscle}</Text></Text>
              {previewExercise?.muscleImage && imageMap[previewExercise.muscleImage as keyof typeof imageMap] && (
                <Image source={imageMap[previewExercise.muscleImage as keyof typeof imageMap]} style={styles.muscleIcon} resizeMode="contain" />
              )}
            </View>

            <TouchableOpacity style={styles.guideToggleBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowGuide(!showGuide); }}>
              <Ionicons name={showGuide ? "book" : "book-outline"} size={20} color={colors.primary} />
              <Text style={styles.guideToggleText}>{showGuide ? "Ocultar instrucciones" : "Cómo realizar el ejercicio"}</Text>
              <Ionicons name={showGuide ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
            </TouchableOpacity>

            {showGuide && (
              <ScrollView style={styles.instructionsScroll} showsVerticalScrollIndicator={false}>
                {previewExercise?.instructions && previewExercise.instructions.length > 0 ? (
                  previewExercise.instructions.map((step, index) => (
                    <Text key={index} style={styles.instructionStep}>
                      <Text style={styles.instructionNumber}>{index + 1}. </Text>{step}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No hay guía disponible para este ejercicio.</Text>
                )}
              </ScrollView>
            )}
            
            <View style={{ width: '100%', marginTop: 20 }}>
              {!isPreviewInRoutine ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercise}>
                  <Text style={styles.primaryButtonText}>Agregar a {activeDay}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.dangerBg }]} onPress={() => {
                  if(previewExercise) handleRemoveExercise(previewExercise.id);
                  setPreviewExercise(null);
                  setShowGuide(false);
                }}>
                  <Text style={[styles.primaryButtonText, { color: colors.danger }]}>Eliminar de la rutina</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  
  daysScroll: { paddingHorizontal: 16, paddingBottom: 16 },
  dayTab: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, backgroundColor: colors.card, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  dayTabActive: { backgroundColor: colors.text, borderColor: colors.text },
  dayTabText: { color: colors.textSecondary, fontWeight: '700', textTransform: 'capitalize', fontSize: 15 },
  dayTabTextActive: { color: colors.background },

  content: { paddingHorizontal: 16 },
  card: { borderRadius: 28, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  
  editToggleBtn: { backgroundColor: colors.cardAlt, padding: 8, borderRadius: 20 },
  
  editSection: { marginTop: 10 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 12 },
  input: { backgroundColor: colors.cardAlt, color: colors.text, padding: 16, borderRadius: 16, fontSize: 16, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 24 },

  readOnlyMusclesContainer: { marginBottom: 16 },
  cardioBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  cardioBadgeText: { color: colors.warning, fontWeight: '800', fontSize: 13, marginLeft: 4 },
  emptyState: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 15, lineHeight: 22 },

  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: colors.primary, fontWeight: '800' },

  exerciseListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  exerciseListContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  exerciseListImg: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.imagePlaceholder },
  exerciseListName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  exerciseListMuscle: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  deleteIconBtn: { padding: 8, marginLeft: 8 },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, padding: 16, borderRadius: 20, marginTop: 10 },
  addBtnText: { color: colors.primary, fontWeight: '700', fontSize: 16, marginLeft: 8 },

  bottomSaveBtn: { backgroundColor: colors.success, padding: 18, borderRadius: 24, alignItems: 'center', marginTop: 24, shadowColor: colors.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  bottomSaveBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  restContainer: { alignItems: 'center', paddingVertical: 40 },
  restText: { fontSize: 17, color: colors.textSecondary, marginTop: 16, fontWeight: '600' },

  // Estilos de Bottom Sheet
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12, maxHeight: '90%' },
  dragHandle: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, marginBottom: 16, paddingHorizontal: 16, borderRadius: 16, height: 50 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.text, fontWeight: '500' },
  catalogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: 12, marginBottom: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  catalogImg: { width: 64, height: 64, borderRadius: 14, backgroundColor: colors.imagePlaceholder },
  catalogInfo: { flex: 1, marginLeft: 16 },
  catalogName: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  catalogMuscle: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  closePreviewBtn: { position: 'absolute', top: 16, right: 24, zIndex: 10, backgroundColor: colors.card, borderRadius: 20 },
  previewImg: { width: '100%', height: 220, borderRadius: 24, backgroundColor: colors.imagePlaceholder, marginBottom: 20 },
  previewTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  
  muscleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  muscleIcon: { width: 40, height: 40, marginLeft: 12, borderRadius: 10, backgroundColor: colors.cardAlt },
  previewMuscle: { fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  
  guideToggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, alignSelf: 'center' },
  guideToggleText: { color: colors.primary, fontWeight: '700', fontSize: 15, marginHorizontal: 8 },

  instructionsScroll: { width: '100%', marginTop: 20, maxHeight: 200 },
  instructionStep: { fontSize: 16, color: colors.text, marginBottom: 14, lineHeight: 24 },
  instructionNumber: { fontWeight: '800', color: colors.primary },
  
  primaryButton: { backgroundColor: colors.primary, width: '100%', padding: 18, borderRadius: 20, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' }
});