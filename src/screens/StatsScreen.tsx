import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

import { imageMap } from '../assets/imgs/imageMap';
import catalog from '../assets/data/catalogo_app.json';

const { width } = Dimensions.get('window');

type DailyData = { date: string; dayName: string; volume: number; finished: boolean; };
type ExerciseHistory = { date: string; shortDate: string; maxWeight: number; };

type WorkoutLogData = {
  date: string;
  finished?: boolean;
  exercises?: Record<string, any>;
};

export default function StatsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  // Datos Generales
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [maxVolume, setMaxVolume] = useState(0);
  const [personalRecord, setPersonalRecord] = useState<{name: string, weight: number} | null>(null);

  // Datos de Progreso Específico
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isExerciseModalVisible, setExerciseModalVisible] = useState(false); // NUEVO: Estado del Modal
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<WorkoutLogData[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Escuchar datos del usuario (peso y racha)
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    const fetchStats = async () => {
      try {
        // --- A. OBTENER RUTINA PARA EXTRAER EJERCICIOS ÚNICOS ---
        const routineSnap = await getDoc(doc(db, 'users', user.uid, 'data', 'routine'));
        const uniqueExercises = new Map();
        if (routineSnap.exists()) {
          const rData = routineSnap.data();
          Object.values(rData).forEach((day: any) => {
            if (day.exercises && !day.isRest) {
              day.exercises.forEach((ex: any) => {
                uniqueExercises.set(ex.id, ex);
              });
            }
          });
        }
        const exercisesArray = Array.from(uniqueExercises.values());
        setRoutineExercises(exercisesArray);
        if (exercisesArray.length > 0) setSelectedExerciseId(exercisesArray[0].id);

        // --- B. OBTENER TODO EL HISTORIAL DE ENTRENAMIENTOS ---
        const logsSnap = await getDocs(collection(db, 'users', user.uid, 'workout_logs'));
        const logs = logsSnap.docs.map(d => ({ 
  date: d.id, 
  ...d.data() 
} as WorkoutLogData)).sort((a, b) => a.date.localeCompare(b.date));
        setAllWorkoutLogs(logs);

        // --- C. PROCESAR ÚLTIMOS 7 DÍAS PARA VOLUMEN GENERAL ---
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const today = new Date();
        const tempWeeklyData: DailyData[] = [];
        let currentMaxVolume = 0;
        let highestWeight = 0;
        let prExerciseId = '';

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dayName = i === 0 ? 'Hoy' : days[d.getDay()];

          const log = logs.find(l => l.date === dateStr);
          let dailyVolume = 0;
          let finished = false;

          if (log) {
            finished = log.finished || false;
            if (log.exercises) {
              Object.keys(log.exercises).forEach(exId => {
                const ex = log.exercises![exId];
                if (!ex.skipped && ex.reps && ex.weights) {
                  for (let j = 0; j < ex.sets; j++) {
                    const r = parseInt(ex.reps[j]) || 0;
                    const w = parseFloat(ex.weights[j]) || 1;
                    dailyVolume += (r * w);

                    const actualWeight = parseFloat(ex.weights[j]) || 0;
                    if (actualWeight > highestWeight) {
                      highestWeight = actualWeight;
                      prExerciseId = exId;
                    }
                  }
                }
              });
            }
          }

          if (dailyVolume > currentMaxVolume) currentMaxVolume = dailyVolume;
          tempWeeklyData.push({ date: dateStr, dayName, volume: dailyVolume, finished });
        }

        setWeeklyData(tempWeeklyData);
        setMaxVolume(currentMaxVolume);

        if (prExerciseId) {
          const exDetail = catalog.find(e => e.id === prExerciseId);
          if (exDetail) setPersonalRecord({ name: exDetail.name, weight: highestWeight });
        }

      } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => unsubUser();
  }, []);

  // --- D. ACTUALIZAR GRÁFICA DE EJERCICIO ESPECÍFICO ---
  useEffect(() => {
    if (!selectedExerciseId || allWorkoutLogs.length === 0) return;

    const history: ExerciseHistory[] = [];
    allWorkoutLogs.forEach(log => {
      if (log.exercises && log.exercises[selectedExerciseId] && !log.exercises[selectedExerciseId].skipped) {
        const exData = log.exercises[selectedExerciseId];
        let maxW = 0;
        
        exData.weights?.forEach((w: string) => {
          const weightVal = parseFloat(w) || 0;
          if (weightVal > maxW) maxW = weightVal;
        });

        if (maxW > 0) {
          const d = new Date(log.date + 'T12:00:00Z'); // Evitar desfase de zona horaria
          const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
          history.push({ date: log.date, shortDate, maxWeight: maxW });
        }
      }
    });

    setExerciseHistory(history.slice(-8));
  }, [selectedExerciseId, allWorkoutLogs]);

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  const streakCount = userData?.streak || 0;
  const currentWeight = userData?.weight;
  const bestDay = [...weeklyData].sort((a, b) => b.volume - a.volume)[0];

  const exerciseMaxWeight = exerciseHistory.length > 0 ? Math.max(...exerciseHistory.map(h => h.maxWeight)) : 0;
  const exerciseLastWeight = exerciseHistory.length > 0 ? exerciseHistory[exerciseHistory.length - 1].maxWeight : 0;
  
  // Objeto del ejercicio actualmente seleccionado
  const activeExerciseObj = routineExercises.find(ex => ex.id === selectedExerciseId);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Tus Estadísticas</Text>
        <Text style={styles.headerSubtitle}>El progreso se construye día a día.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* FILA DE RESUMEN RÁPIDO */}
        <View style={styles.rowBetween}>
          <View style={styles.summaryBox}>
            <Ionicons name="flame" size={28} color="#FF9500" />
            <Text style={styles.summaryValue}>{streakCount}</Text>
            <Text style={styles.summaryLabel}>Días de racha</Text>
          </View>
          <View style={styles.summaryBox}>
            <Ionicons name="trophy" size={28} color="#FFD60A" />
            <Text style={styles.summaryValue}>{bestDay?.volume > 0 ? bestDay.dayName : '--'}</Text>
            <Text style={styles.summaryLabel}>Mejor día</Text>
          </View>
        </View>

        {/* 1. SECCIÓN DE PROGRESO POR EJERCICIO */}
        {routineExercises.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowAlign}>
              <Ionicons name="trending-up" size={24} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Progreso por Ejercicio</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Mira la evolución de tus cargas máximas.</Text>

            {/* BOTÓN TIPO DROPDOWN */}
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setExerciseModalVisible(true)}>
              {activeExerciseObj ? (
                <View style={styles.rowAlign}>
                  <Image source={imageMap[activeExerciseObj.id as keyof typeof imageMap]} style={styles.dropdownImg} />
                  <Text style={styles.dropdownText} numberOfLines={1}>{activeExerciseObj.name}</Text>
                </View>
              ) : (
                <Text style={styles.dropdownText}>Selecciona un ejercicio...</Text>
              )}
              <Ionicons name="chevron-down" size={20} color="#8E8E93" />
            </TouchableOpacity>

            {/* Gráfica y Datos del Ejercicio */}
            {exerciseHistory.length > 0 ? (
              <View style={styles.exerciseStatsContainer}>
                <View style={styles.exerciseMetricsRow}>
                  <View>
                    <Text style={styles.metricLabel}>Último Registro</Text>
                    <Text style={styles.metricValue}>{exerciseLastWeight} kg</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metricLabel}>Récord Histórico</Text>
                    <Text style={[styles.metricValue, { color: '#34C759' }]}>{exerciseMaxWeight} kg 🏆</Text>
                  </View>
                </View>

                {/* Gráfica de Barras para el Ejercicio */}
                <View style={styles.chartContainer}>
                  {exerciseHistory.map((session, index) => {
                    const barHeight = exerciseMaxWeight > 0 ? (session.maxWeight / exerciseMaxWeight) * 100 : 0;
                    const isLast = index === exerciseHistory.length - 1;

                    return (
                      <View key={session.date} style={styles.barCol}>
                        <Text style={styles.barValue}>{session.maxWeight}</Text>
                        <View style={styles.barTrack}>
                          <View style={[
                            styles.barFill, 
                            { height: `${barHeight}%`, backgroundColor: isLast ? '#34C759' : '#C6F6D5' }
                          ]} />
                        </View>
                        <Text style={[styles.barLabel, isLast && styles.barLabelToday]}>{session.shortDate}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.emptyGraphContainer}>
                <Ionicons name="barbell-outline" size={40} color="#E5E5EA" />
                <Text style={styles.emptyText}>No hay registros de peso para este ejercicio aún. ¡Regístralo en tu próxima sesión!</Text>
              </View>
            )}
          </View>
        )}

        {/* 2. GRÁFICA DE VOLUMEN GENERAL SEMANAL */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Volumen General de Carga</Text>
          <Text style={styles.sectionSubtitle}>Suma total de repeticiones × peso en los últimos 7 días.</Text>
          
          <View style={styles.chartContainer}>
            {weeklyData.map((day, index) => {
              const barHeight = maxVolume > 0 ? (day.volume / maxVolume) * 100 : 0;
              const isToday = index === 6;

              return (
                <View key={day.date} style={styles.barCol}>
                  {day.volume > 0 && <Text style={styles.barValue}>{Math.round(day.volume)}</Text>}
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill, 
                      { height: `${barHeight}%`, backgroundColor: isToday ? '#007AFF' : '#AADAFF' }
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{day.dayName}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. SECCIÓN DE PESO CORPORAL */}
        <View style={[styles.card, styles.weightCard]}>
          <View style={styles.rowBetween}>
            <View style={styles.rowAlign}>
              <Ionicons name="scale" size={24} color="#5856D6" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Peso Corporal</Text>
            </View>
            <Text style={styles.weightValue}>{currentWeight ? `${currentWeight} kg` : '--'}</Text>
          </View>

          {!currentWeight ? (
            <View style={styles.weightAlert}>
              <Ionicons name="alert-circle" size={20} color="#FF9500" style={{ marginRight: 8 }} />
              <Text style={styles.weightAlertText}>¡No tienes un peso registrado! Es vital para medir tus ganancias o déficit.</Text>
            </View>
          ) : (
            <Text style={styles.weightMotivator}>Registrar tu peso regularmente te ayuda a ver qué tan efectiva está siendo tu rutina.</Text>
          )}

          <TouchableOpacity style={styles.weightBtn} onPress={() => navigation.navigate('Perfil')}>
            <Text style={styles.weightBtnText}>Actualizar mi peso en el Perfil</Text>
            <Ionicons name="arrow-forward" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL PARA SELECCIONAR EJERCICIO */}
      <Modal visible={isExerciseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Ver estadísticas de...</Text>
              <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#AEAEB2" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {routineExercises.map(ex => {
                const isActive = selectedExerciseId === ex.id;
                return (
                  <TouchableOpacity 
                    key={ex.id}
                    style={[styles.exerciseOption, isActive && styles.exerciseOptionActive]}
                    onPress={() => {
                      setSelectedExerciseId(ex.id);
                      setExerciseModalVisible(false);
                    }}
                  >
                    <Image source={imageMap[ex.id as keyof typeof imageMap]} style={styles.exerciseOptionImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.exerciseOptionText, isActive && styles.exerciseOptionTextActive]}>{ex.name}</Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={24} color="#007AFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 15, color: '#8E8E93', marginTop: 4 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowAlign: { flexDirection: 'row', alignItems: 'center' },

  // Tarjetas de Resumen
  summaryBox: { flex: 0.48, backgroundColor: '#FFF', padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginTop: 8 },
  summaryLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '500' },

  // Tarjetas Generales
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  sectionSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4, marginBottom: 10 },
  emptyText: { color: '#8E8E93', fontSize: 14, marginTop: 12, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },

  // Selector Dropdown
  dropdownSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA', marginVertical: 8 },
  dropdownImg: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: '#FFF' },
  dropdownText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', flex: 1 },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', flex: 1 },
  
  // Lista de opciones dentro del modal
  exerciseOption: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  exerciseOptionActive: { backgroundColor: '#E5F1FF', borderColor: '#007AFF' },
  exerciseOptionImg: { width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: '#FFF' },
  exerciseOptionText: { fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  exerciseOptionTextActive: { fontWeight: '700', color: '#007AFF' },

  // Progreso Específico
  exerciseStatsContainer: { backgroundColor: '#F8F9FA', borderRadius: 16, padding: 16, marginTop: 12 },
  exerciseMetricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricLabel: { fontSize: 12, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginTop: 4 },
  emptyGraphContainer: { alignItems: 'center', padding: 30, backgroundColor: '#F8F9FA', borderRadius: 16, marginTop: 12 },

  // Gráfica de Barras Nativa
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, marginTop: 10 },
  barCol: { alignItems: 'center', flex: 1 },
  barValue: { fontSize: 10, color: '#8E8E93', fontWeight: '700', marginBottom: 4 },
  barTrack: { width: 14, height: 110, backgroundColor: '#E5E5EA', borderRadius: 7, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 7 },
  barLabel: { fontSize: 11, color: '#8E8E93', marginTop: 8, fontWeight: '600' },
  barLabelToday: { color: '#007AFF', fontWeight: '800' },

  // Módulo de Peso
  weightCard: { borderColor: '#E5E5EA', borderWidth: 1 },
  weightValue: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  weightAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0D9', padding: 12, borderRadius: 12, marginTop: 16 },
  weightAlertText: { fontSize: 13, color: '#FF9500', fontWeight: '600', flex: 1, lineHeight: 18 },
  weightMotivator: { fontSize: 14, color: '#8E8E93', marginTop: 16, lineHeight: 20 },
  weightBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 16, borderRadius: 16, marginTop: 16 },
  weightBtnText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
});