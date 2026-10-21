import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { imageMap } from '../assets/imgs/imageMap';
import catalog from '../assets/data/catalogo_app.json';
import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

const { width } = Dimensions.get('window');

type DailyData = { date: string; dayName: string; volume: number; finished: boolean; };
type ExerciseHistory = { date: string; shortDate: string; maxWeight: number; };

type WorkoutLogData = {
  date: string;
  finished?: boolean;
  exercises?: Record<string, any>;
};

export default function StatsScreen() {
  const { isDark } = useContext(ThemeContext); 
  const colors = isDark ? darkColors : lightColors;
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  
  // Datos Generales
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);

  // Datos de Progreso Específico
  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isExerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<WorkoutLogData[]>([]);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    const fetchStats = async () => {
      try {
        const routineSnap = await getDoc(doc(db, 'users', user.uid, 'data', 'routine'));
        const uniqueExercises = new Map();
        if (routineSnap.exists()) {
          const rData = routineSnap.data();
          Object.values(rData).forEach((day: any) => {
            if (day.exercises && !day.isRest) {
              day.exercises.forEach((ex: any) => uniqueExercises.set(ex.id, ex));
            }
          });
        }
        const exercisesArray = Array.from(uniqueExercises.values());
        setRoutineExercises(exercisesArray);
        if (exercisesArray.length > 0) setSelectedExerciseId(exercisesArray[0].id);

        const logsSnap = await getDocs(collection(db, 'users', user.uid, 'workout_logs'));
        const logs = logsSnap.docs.map(d => ({ date: d.id, ...d.data() } as WorkoutLogData)).sort((a, b) => a.date.localeCompare(b.date));
        setAllWorkoutLogs(logs);

        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const today = new Date();
        const tempWeeklyData: DailyData[] = [];

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
                  }
                }
              });
            }
          }

          tempWeeklyData.push({ date: dateStr, dayName, volume: dailyVolume, finished });
        }

        setWeeklyData(tempWeeklyData);

      } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    return () => unsubUser();
  }, []);

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
          const d = new Date(log.date + 'T12:00:00Z');
          const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
          history.push({ date: log.date, shortDate, maxWeight: maxW });
        }
      }
    });

    setExerciseHistory(history.slice(-8));
  }, [selectedExerciseId, allWorkoutLogs]);

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  const streakCount = userData?.streak || 0;
  const currentWeight = userData?.weight ? parseFloat(userData.weight) : null;
  const bestDay = [...weeklyData].sort((a, b) => b.volume - a.volume)[0];

  const exerciseMaxWeight = exerciseHistory.length > 0 ? Math.max(...exerciseHistory.map(h => h.maxWeight)) : 0;
  const exerciseLastWeight = exerciseHistory.length > 0 ? exerciseHistory[exerciseHistory.length - 1].maxWeight : 0;
  const activeExerciseObj = routineExercises.find(ex => ex.id === selectedExerciseId);

  // --- HISTORIAL DE PESO SIMULADO ---
  const mockWeightHistory = currentWeight ? [
    currentWeight + 1.5, 
    currentWeight + 0.8, 
    currentWeight + 0.2, 
    currentWeight - 0.5, 
    currentWeight
  ] : [];
  const mockWeightLabels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Hoy"];

  // --- CONFIGURACIONES GLOBALES DE GRÁFICAS ---
  const chartWidth = width - 72; // Adaptado al ancho de la tarjeta

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

        {/* 1. SECCIÓN DE PROGRESO POR EJERCICIO (BAR CHART) */}
        {routineExercises.length > 0 && (
          <View style={styles.card}>
            <View style={styles.rowAlign}>
              <Ionicons name="trending-up" size={24} color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Progreso por Ejercicio</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Mira la evolución de tus cargas máximas.</Text>

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

            {exerciseHistory.length > 0 ? (
              <View style={styles.exerciseStatsContainer}>
                <View style={styles.exerciseMetricsRow}>
                  <View>
                    <Text style={styles.metricLabel}>Último Registro</Text>
                    <Text style={styles.metricValue}>{exerciseLastWeight} kg</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metricLabel}>Récord Histórico</Text>
                    <Text style={[styles.metricValue, { color: colors.success }]}>{exerciseMaxWeight} kg 🏆</Text>
                  </View>
                </View>

                <View style={{ marginTop: 10, alignItems: 'center' }}>
                  <BarChart
                    data={{
                      labels: exerciseHistory.map(h => h.shortDate),
                      datasets: [{ data: exerciseHistory.map(h => h.maxWeight) }]
                    }}
                    width={chartWidth - 32} // Más padding interno
                    height={180}
                    yAxisLabel=""
                    yAxisSuffix="k"
                    fromZero={true}
                    showValuesOnTopOfBars={true}
                    chartConfig={{
                      backgroundColor: colors.cardAlt,
                      backgroundGradientFrom: colors.cardAlt,
                      backgroundGradientTo: colors.cardAlt,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`, // Verde
                      labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(142, 142, 147, ${opacity})`,
                      barPercentage: 0.6,
                      propsForBackgroundLines: { strokeWidth: 0.5, stroke: colors.border }
                    }}
                    style={{ borderRadius: 16, marginLeft: -16 }}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.emptyGraphContainer}>
                <Ionicons name="barbell-outline" size={40} color="#E5E5EA" />
                <Text style={styles.emptyText}>No hay registros de peso para este ejercicio aún.</Text>
              </View>
            )}
          </View>
        )}

        {/* 2. GRÁFICA DE VOLUMEN GENERAL SEMANAL (BAR CHART) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Volumen General de Carga</Text>
          <Text style={styles.sectionSubtitle}>Suma de repeticiones × peso en los últimos 7 días.</Text>
          
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <BarChart
              data={{
                labels: weeklyData.map(d => d.dayName),
                datasets: [{ data: weeklyData.map(d => d.volume) }]
              }}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero={true}
              showValuesOnTopOfBars={false} // Se apaga porque el volumen suele ser un número de 4 dígitos y se empalma
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`, // Azul primario
                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(142, 142, 147, ${opacity})`,
                barPercentage: 0.5,
                propsForBackgroundLines: { strokeWidth: 0.5, stroke: colors.border }
              }}
              style={{ borderRadius: 16, marginLeft: -16 }}
            />
          </View>
        </View>

        {/* 3. SECCIÓN DE PESO CORPORAL (LINE CHART) */}
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
            <View style={{ marginTop: 24, alignItems: 'center' }}>
              <LineChart
                data={{
                  labels: mockWeightLabels,
                  datasets: [{ data: mockWeightHistory }]
                }}
                width={chartWidth}
                height={180}
                yAxisSuffix="kg"
                withInnerLines={true}
                withOuterLines={false}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`, // Morado
                  labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(142, 142, 147, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "5", strokeWidth: "2", stroke: colors.card },
                  propsForBackgroundLines: { strokeWidth: 0.5, stroke: colors.border, strokeDasharray: "" } // Líneas sólidas tenues
                }}
                bezier
                style={{ borderRadius: 16, marginLeft: -16 }}
              />
            </View>
          )}

          <TouchableOpacity style={styles.weightBtn} onPress={() => navigation.navigate('Perfil')}>
            <Text style={styles.weightBtnText}>Actualizar mi peso</Text>
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  
  headerContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowAlign: { flexDirection: 'row', alignItems: 'center' },

  summaryBox: { flex: 0.48, backgroundColor: colors.card, padding: 20, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '500' },

  card: { backgroundColor: colors.card, borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  sectionSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 10 },
  emptyText: { color: colors.textSecondary, fontSize: 14, marginTop: 12, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },

  dropdownSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.cardAlt, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginVertical: 8 },
  dropdownImg: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: colors.imagePlaceholder },
  dropdownText: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1 },
  
  exerciseOption: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.cardAlt, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  exerciseOptionActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  exerciseOptionImg: { width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: colors.imagePlaceholder },
  exerciseOptionText: { fontSize: 16, fontWeight: '500', color: colors.text },
  exerciseOptionTextActive: { fontWeight: '700', color: colors.primary },

  exerciseStatsContainer: { backgroundColor: colors.cardAlt, borderRadius: 16, padding: 16, marginTop: 12 },
  exerciseMetricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  metricValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  emptyGraphContainer: { alignItems: 'center', padding: 30, backgroundColor: colors.cardAlt, borderRadius: 16, marginTop: 12 },

  weightCard: { borderColor: colors.border, borderWidth: 1 },
  weightValue: { fontSize: 28, fontWeight: '800', color: colors.text },
  weightAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningBg, padding: 12, borderRadius: 12, marginTop: 16 },
  weightAlertText: { fontSize: 13, color: colors.warning, fontWeight: '600', flex: 1, lineHeight: 18 },
  weightBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryLight, padding: 16, borderRadius: 16, marginTop: 16 },
  weightBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
});