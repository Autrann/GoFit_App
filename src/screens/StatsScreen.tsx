import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../context/ThemeContext';
import { DAYS_FROM_SUNDAY, DAYS_SHORT, DAYS_LETTER } from '../constants/appConstants';
import KineticHeader from '../components/common/KineticHeader';
import ExerciseStatsModal from '../components/modals/ExerciseStatsModal';

const { width } = Dimensions.get('window');

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type WeightEntry = {
  date: string;
  weight: number;
  updatedAt?: string;
};

export default function StatsScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [routineData, setRoutineData] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1S' | '1M' | '3M' | '1A'>('3M');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('Todos');

  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isExerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 1. Escuchar datos del usuario
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    // 2. Escuchar historial REAL de peso desde la subcolección weight_logs
    const unsubWeight = onSnapshot(collection(db, 'users', user.uid, 'weight_logs'), (snap) => {
      const entries: WeightEntry[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            date: d.id,
            weight: parseFloat(data.weight) || 0,
            updatedAt: data.updatedAt,
          };
        })
        .filter((e) => e.weight > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

      setWeightHistory(entries);
    });

    // 3. Escuchar rutina
    const unsubRoutine = onSnapshot(doc(db, 'users', user.uid, 'data', 'routine'), (routineSnap) => {
      const uniqueExercises = new Map();
      if (routineSnap.exists()) {
        const rData = routineSnap.data();
        setRoutineData(rData);
        Object.values(rData).forEach((day: any) => {
          if (day.exercises && !day.isRest) {
            day.exercises.forEach((ex: any) => uniqueExercises.set(ex.id, ex));
          }
        });
      }
      const arr = Array.from(uniqueExercises.values());
      setRoutineExercises(arr);
      setSelectedExerciseId((prev) => prev || (arr.length > 0 ? arr[0].id : null));
    });

    // 4. Escuchar workout_logs
    const unsubLogs = onSnapshot(collection(db, 'users', user.uid, 'workout_logs'), (logsSnap) => {
      const logs = logsSnap.docs
        .map((d) => ({ date: d.id, ...d.data() } as any))
        .sort((a, b) => a.date.localeCompare(b.date));
      setAllWorkoutLogs(logs);

      const today = new Date();
      const tempWeekly: any[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = logs.find((l) => l.date === dateStr);
        let dailyVolume = 0;
        let rpeSum = 0;
        let rpeCount = 0;

        if (log?.exercises) {
          Object.values(log.exercises).forEach((ex: any) => {
            if (!ex.skipped && ex.reps && ex.weights) {
              for (let j = 0; j < ex.sets; j++) {
                const r = parseInt(ex.reps[j]) || 0;
                const w = parseFloat(ex.weights[j]) || 1;
                if (r > 0) dailyVolume += r * w;
                if (ex.rpes?.[j]) {
                  rpeSum += parseFloat(ex.rpes[j]);
                  rpeCount++;
                }
              }
            }
          });
        }

        tempWeekly.push({
          date: dateStr,
          dayName: i === 0 ? 'Hoy' : DAYS_SHORT[d.getDay()],
          fullDayName: DAYS_FROM_SUNDAY[d.getDay()],
          shortLetter: DAYS_LETTER[d.getDay()],
          volume: dailyVolume,
          finished: log?.finished || false,
          avgRpe: rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : '8.5',
        });
      }
      setWeeklyData(tempWeekly);
      setLoading(false);
    });

    return () => {
      unsubUser();
      unsubWeight();
      unsubRoutine();
      unsubLogs();
    };
  }, []);

  const getHistoryForExercise = (exId: string) => {
    const history: any[] = [];
    allWorkoutLogs.forEach((log) => {
      const exData = log.exercises?.[exId];
      if (exData && !exData.skipped) {
        let maxW = 0;
        let bestReps = 0;
        const setsCount = exData.sets || exData.reps?.length || 0;
        for (let i = 0; i < setsCount; i++) {
          const w = parseFloat(exData.weights?.[i]) || 0;
          const r = parseInt(exData.reps?.[i]) || 0;
          if (r > 0 && w >= maxW) {
            maxW = w;
            bestReps = r;
          }
        }
        if (maxW > 0) {
          const d = new Date(log.date + 'T12:00:00Z');
          history.push({
            date: log.date,
            shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
            maxWeight: maxW,
            bestReps,
            est1RM: Math.round(maxW * (1 + bestReps / 30)),
            lastSetsCount: setsCount,
          });
        }
      }
    });
    return history;
  };

  // --- PROCESAMIENTO DEL HISTORIAL REAL DE PESO SEGÚN EL FILTRO TEMPORAL ---
  const buildRealWeightChartData = () => {
    const currentWeight = userData?.weight ? parseFloat(userData.weight) : null;

    // Si el usuario ya tenía un peso antes de esta actualización pero aún no tiene documentos en weight_logs
    let sourceLogs: WeightEntry[] = [...weightHistory];
    if (sourceLogs.length === 0 && currentWeight) {
      const fallbackDate = userData?.lastWeightUpdate
        ? userData.lastWeightUpdate.split('T')[0]
        : new Date().toISOString().split('T')[0];
      sourceLogs = [{ date: fallbackDate, weight: currentWeight }];
    }

    if (sourceLogs.length === 0) {
      return { hasData: false, labels: [], data: [], diffValue: 0, count: 0 };
    }

    // Filtrar por ventana de tiempo seleccionada (1S = 7d, 1M = 30d, 3M = 90d, 1A = 365d)
    const daysMap = { '1S': 7, '1M': 30, '3M': 90, '1A': 365 };
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysMap[timeframe]);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    let filtered = sourceLogs.filter((entry) => entry.date >= cutoffStr);
    // Si en ese rango no hay registros, mostramos los últimos disponibles para no dejar la gráfica en blanco
    if (filtered.length === 0) {
      filtered = sourceLogs.slice(-6);
    }

    const firstWeight = filtered[0].weight;
    const latestWeight = filtered[filtered.length - 1].weight;
    const diffValue = parseFloat((latestWeight - firstWeight).toFixed(1));

    // Seleccionar máximo 6 puntos distribuidos uniformemente para que las etiquetas de fechas se lean limpias
    let chartEntries = filtered;
    if (filtered.length > 6) {
      const step = (filtered.length - 1) / 5;
      chartEntries = [0, 1, 2, 3, 4, 5].map((i) => filtered[Math.round(i * step)]);
    }

    const formatShortDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const monthIdx = parseInt(parts[1], 10) - 1;
      const dayNum = parseInt(parts[2], 10);
      return `${dayNum} ${MONTHS_SHORT[monthIdx] || ''}`;
    };

    // LineChart requiere al menos 2 puntos para trazar la línea curva sin errores en SVG
    if (chartEntries.length === 1) {
      const single = chartEntries[0];
      return {
        hasData: true,
        labels: ['Inicio', formatShortDate(single.date)],
        data: [single.weight, single.weight],
        diffValue: 0,
        count: sourceLogs.length,
      };
    }

    return {
      hasData: true,
      labels: chartEntries.map((e) => formatShortDate(e.date)),
      data: chartEntries.map((e) => e.weight),
      diffValue,
      count: filtered.length,
    };
  };

  if (loading) {
    return (
      <View style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={k.lime} />
      </View>
    );
  }

  const realWeightStats = buildRealWeightChartData();
  const latestWeightVal =
    weightHistory.length > 0
      ? weightHistory[weightHistory.length - 1].weight
      : userData?.weight
      ? parseFloat(userData.weight)
      : null;

  const bestDay = [...weeklyData].sort((a, b) => b.volume - a.volume)[0];
  const totalWeeklyVolume = weeklyData.reduce((acc, d) => acc + d.volume, 0);
  const muscleCategories = ['Todos', ...Array.from(new Set(routineExercises.map((e) => e.muscle).filter(Boolean)))];
  const filteredExercises =
    selectedMuscleFilter === 'Todos'
      ? routineExercises
      : routineExercises.filter((e) => e.muscle === selectedMuscleFilter);

  const selectedExHistory = selectedExerciseId ? getHistoryForExercise(selectedExerciseId).slice(-8) : [];

  return (
    <SafeAreaView style={kStyles.container}>
      <KineticHeader
        userData={userData}
        fallbackName={auth.currentUser?.displayName}
        onAvatarPress={() => navigation.navigate('Perfil')}
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <View style={kStyles.intelPill}>
            <View style={kStyles.intelDot} />
            <Text style={kStyles.intelPillText}>PERFORMANCE INTELLIGENCE</Text>
          </View>
          <Text style={kStyles.mainHeadline}>
            MÉTRICAS & <Text style={{ color: k.lime }}>EVOLUCIÓN</Text>
          </Text>
        </View>

        {/* Racha & Matriz de Consistencia Semanal */}
        <View style={kStyles.card}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerMuted}>🔥 RACHA ININTERRUMPIDA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 42, fontWeight: '900', fontStyle: 'italic', color: k.lime }}>
                  {userData?.streak || 0}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }}>DÍAS</Text>
              </View>
            </View>
            <Text style={kStyles.bodyMuted}>
              {weeklyData.filter((d) => d.finished || d.volume > 0).length}/7 días activos
            </Text>
          </View>

          <View style={[kStyles.divider, { marginVertical: 12 }]} />

          <View style={kStyles.rowBetween}>
            {weeklyData.map((day) => {
              const isBest = bestDay?.volume > 0 && day.date === bestDay.date;
              const isDone = day.finished || day.volume > 0;
              return (
                <View key={day.date} style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: isBest ? k.cyan : k.textMuted }}>
                    {day.shortLetter}
                  </Text>
                  <View
                    style={[
                      styles.matrixDot,
                      {
                        backgroundColor: isBest ? k.cyan : isDone ? k.limeBg : k.surfaceHighest,
                      },
                    ]}
                  >
                    {isDone && (
                      <Ionicons name={isBest ? 'flash' : 'checkmark'} size={12} color="#000" />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Mejor Día de la Semana */}
        <View style={kStyles.surfaceCard}>
          <View style={kStyles.leftNotch} />
          <View style={{ paddingLeft: 6, gap: 10 }}>
            <View style={kStyles.rowBetween}>
              <View>
                <Text style={kStyles.kickerCyan}>RENDIMIENTO MÁXIMO</Text>
                <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                  {bestDay?.volume > 0 ? bestDay.fullDayName.toUpperCase() : 'SIN REGISTROS'}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: k.cyan }}>
                {routineData?.[bestDay?.fullDayName]?.title || 'Sesión'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.statBox, { backgroundColor: k.surfaceLow }]}>
                <Text style={kStyles.bodyMuted}>Volumen Pico</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: k.textMain }}>
                  {Math.round(bestDay?.volume || 0).toLocaleString()} <Text style={{ fontSize: 10, color: k.lime }}>KG</Text>
                </Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: k.surfaceLow }]}>
                <Text style={kStyles.bodyMuted}>Intensidad Media</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: k.textMain }}>
                  RPE {bestDay?.avgRpe || '8.5'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Evolución REAL de Peso Corporal */}
        <View style={kStyles.surfaceCard}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerMuted}>HISTORIAL BIOMÉTRICO REAL</Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: k.textMain }}>PESO CORPORAL</Text>
            </View>
            <View style={[styles.tfRow, { backgroundColor: k.surfaceLowest }]}>
              {(['1S', '1M', '3M', '1A'] as const).map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.tfBtn, timeframe === tf && { backgroundColor: k.limeBg }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimeframe(tf);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '900',
                      color: timeframe === tf ? '#3a4a00' : k.textMuted,
                    }}
                  >
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {realWeightStats.hasData && latestWeightVal !== null ? (
            <>
              {/* Resumen numérico del periodo seleccionado */}
              <View style={[kStyles.rowBetween, { marginTop: 14, alignItems: 'flex-end' }]}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                    <Text style={{ fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                      {latestWeightVal.toFixed(1)}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: k.textMuted }}>KG</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: k.textMuted }}>
                    {weightHistory.length > 0
                      ? `Último registro: ${weightHistory[weightHistory.length - 1].date}`
                      : 'Peso inicial registrado'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.deltaBadge, { backgroundColor: 'rgba(202, 253, 0, 0.14)' }]}>
                    <Ionicons
                      name={
                        realWeightStats.diffValue > 0
                          ? 'trending-up'
                          : realWeightStats.diffValue < 0
                          ? 'trending-down'
                          : 'remove'
                      }
                      size={13}
                      color={k.lime}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: k.lime }}>
                      {realWeightStats.diffValue > 0 ? `+${realWeightStats.diffValue}` : realWeightStats.diffValue} kg ({timeframe})
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: k.cyan, marginTop: 4 }}>
                    {realWeightStats.count} {realWeightStats.count === 1 ? 'pesaje en rango' : 'pesajes en rango'}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <LineChart
                  data={{
                    labels: realWeightStats.labels,
                    datasets: [{ data: realWeightStats.data }],
                  }}
                  width={width - 64}
                  height={170}
                  yAxisSuffix="k"
                  withOuterLines={false}
                  chartConfig={{
                    backgroundColor: k.surface,
                    backgroundGradientFrom: k.surface,
                    backgroundGradientTo: k.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(0, 244, 254, ${opacity})`,
                    labelColor: () => k.textMuted,
                    propsForDots: { r: '4.5', strokeWidth: '2', stroke: k.limeBg },
                    propsForBackgroundLines: {
                      strokeWidth: 0.6,
                      stroke: k.outline,
                      strokeDasharray: '4',
                    },
                  }}
                  bezier
                  style={{ borderRadius: 12, marginLeft: -16 }}
                />
              </View>
            </>
          ) : (
            <Text style={[kStyles.bodyMuted, { marginTop: 12 }]}>
              Registra tu peso en la pestaña Entrenar para empezar a trazar tu curva histórica.
            </Text>
          )}
        </View>

        {/* Sobrecarga Progresiva por Ejercicio */}
        <View style={{ gap: 10 }}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerLime}>FUERZA REAL</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                SOBRECARGA PROGRESIVA
              </Text>
            </View>
            <TouchableOpacity onPress={() => setExerciseModalVisible(true)}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>COMPARADOR →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {muscleCategories.map((m) => {
              const active = selectedMuscleFilter === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.filterPill, { backgroundColor: active ? k.limeBg : k.surfaceHigh }]}
                  onPress={() => setSelectedMuscleFilter(m)}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#3a4a00' : k.textMuted }}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {filteredExercises.map((ex, idx) => {
            const hist = getHistoryForExercise(ex.id);
            const latest = hist[hist.length - 1];
            const max1RM = hist.length > 0 ? Math.max(...hist.map((h) => h.est1RM)) : 0;
            const accent = idx % 2 === 0 ? k.lime : k.cyan;

            return (
              <TouchableOpacity
                key={ex.id}
                style={kStyles.surfaceCard}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedExerciseId(ex.id);
                  setExerciseModalVisible(true);
                }}
              >
                <View style={kStyles.rowBetween}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={kStyles.kickerMuted}>
                      {ex.muscle} • {hist.length} SESIONES
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase', marginTop: 2 }}>
                      {ex.name}
                    </Text>
                    <Text style={kStyles.bodyMuted}>
                      {latest
                        ? `Última: ${latest.lastSetsCount}x${latest.bestReps} @ ${latest.maxWeight} kg`
                        : 'Toca para ver detalle'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={kStyles.kickerMuted}>EST. 1RM</Text>
                    <Text style={{ fontSize: 22, fontWeight: '900', fontStyle: 'italic', color: accent }}>
                      {max1RM > 0 ? `${max1RM} kg` : '--'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Píldora de Tonelaje Semanal */}
        <View style={[kStyles.card, kStyles.rowBetween, { padding: 14 }]}>
          <View style={kStyles.rowAlign}>
            <Ionicons name="pulse" size={20} color={k.cyan} />
            <View>
              <Text style={kStyles.kickerMuted}>VOLUMEN SEMANAL ACUMULADO</Text>
              <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }}>
                {Math.round(totalWeeklyVolume).toLocaleString()} kg • <Text style={{ color: k.cyan }}>SNC Óptimo</Text>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <ExerciseStatsModal
        visible={isExerciseModalVisible}
        routineExercises={routineExercises}
        selectedExerciseId={selectedExerciseId}
        exerciseHistory={selectedExHistory}
        onClose={() => setExerciseModalVisible(false)}
        onSelectExercise={setSelectedExerciseId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  matrixDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  statBox: { flex: 1, padding: 10, borderRadius: 10 },
  tfRow: { flexDirection: 'row', padding: 3, borderRadius: 18, gap: 2 },
  tfBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deltaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
});