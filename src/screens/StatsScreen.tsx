import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';

import catalog from '../assets/data/catalogo_app.json';
import { imageMap } from '../assets/imgs/imageMap';
import { useTheme } from '../context/ThemeContext';
import { DAYS_FROM_SUNDAY, DAYS_SHORT, DAYS_LETTER, Exercise } from '../constants/appConstants';
import {
  buildRealWeightChartData,
  extractExerciseHistory,
  analyzeExerciseOverload,
  formatReadableDate,
  WeightEntry,
} from '../utils/analytics';
import KineticHeader from '../components/common/KineticHeader';
import ExerciseStatsModal from '../components/modals/ExerciseStatsModal';
import PRLogModal, { CustomPRItem } from '../components/modals/PRLogModal';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [routineData, setRoutineData] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1S' | '1M' | '3M' | '1A'>('3M');

  // Selector de Modo en Sobrecarga Progresiva: Por Ejercicio vs Por Día
  const [overloadViewMode, setOverloadViewMode] = useState<'by_exercise' | 'by_day'>('by_exercise');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('Todos');

  const [routineExercises, setRoutineExercises] = useState<any[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isExerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<any[]>([]);

  // Estados para el módulo aparte de Récords Personales (PRs)
  const [isPRModalVisible, setPRModalVisible] = useState(false);
  const [prInitialExercise, setPrInitialExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

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

        let hasTrained = false;
        if (log?.exercises) {
          Object.values(log.exercises).forEach((ex: any) => {
            if (!ex.skipped && ex.reps?.some((r: string) => parseInt(r, 10) > 0)) {
              hasTrained = true;
            }
          });
        }

        tempWeekly.push({
          date: dateStr,
          dayName: i === 0 ? 'Hoy' : DAYS_SHORT[d.getDay()],
          fullDayName: DAYS_FROM_SUNDAY[d.getDay()],
          shortLetter: DAYS_LETTER[d.getDay()],
          trained: log?.finished || hasTrained,
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

  if (loading) {
    return (
      <View style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={k.lime} />
      </View>
    );
  }

  const realWeightStats = buildRealWeightChartData(weightHistory, userData, timeframe);
  const latestWeightVal =
    weightHistory.length > 0
      ? weightHistory[weightHistory.length - 1].weight
      : userData?.weight
      ? parseFloat(userData.weight)
      : null;

  const targetWeightVal = userData?.targetWeight ? parseFloat(userData.targetWeight) : null;
  const muscleCategories = ['Todos', ...Array.from(new Set(routineExercises.map((e) => e.muscle).filter(Boolean)))];
  const filteredExercises =
    selectedMuscleFilter === 'Todos'
      ? routineExercises
      : routineExercises.filter((e) => e.muscle === selectedMuscleFilter);

  const selectedExHistory = selectedExerciseId
    ? extractExerciseHistory(selectedExerciseId, allWorkoutLogs)
    : [];

  // Entrenamientos pasados (del más reciente al más antiguo) que tengan al menos 1 ejercicio registrado
  const pastWorkoutDays = [...allWorkoutLogs]
    .filter((log) => {
      if (!log.exercises) return false;
      return Object.values(log.exercises).some(
        (ex: any) => !ex.skipped && ex.reps?.some((r: string) => parseInt(r, 10) > 0)
      );
    })
    .reverse()
    .slice(0, 12);

  // Récords Personales (PRs) guardados aparte por el usuario
  const customPRsMap: Record<string, CustomPRItem> = userData?.customPRs || {};
  const customPRsList = Object.values(customPRsMap).sort((a, b) => b.weight - a.weight);

  const getExerciseNameById = (exId: string) => {
    const fromRoutine = routineExercises.find((e) => e.id === exId);
    if (fromRoutine) return fromRoutine.name;
    const fromCatalog = catalog.find((c) => c.id === exId);
    return fromCatalog ? fromCatalog.name : exId;
  };

  return (
    <SafeAreaView style={kStyles.container}>
      <KineticHeader
        userData={userData}
        fallbackName={auth.currentUser?.displayName}
        brandTitle="GoFit"
        onAvatarPress={() => navigation.navigate('Perfil')}
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <View style={kStyles.intelPill}>
            <View style={kStyles.intelDot} />
            <Text style={kStyles.intelPillText}>PERFORMANCE INTELLIGENCE</Text>
          </View>
          <Text style={kStyles.mainHeadline}>
            PROGRESO & <Text style={{ color: k.lime }}>SOBRECARGA</Text>
          </Text>
        </View>

        {/* 1. RACHA & CONSTANCIA SEMANAL */}
        <View style={kStyles.card}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerMuted}>🔥 RACHA DE CONSTANCIA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 40, fontWeight: '900', fontStyle: 'italic', color: k.lime }}>
                  {userData?.streak || 0}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }}>DÍAS SEGUIDOS</Text>
              </View>
            </View>
            <View style={[styles.activeDaysPill, { backgroundColor: k.surfaceLowest }]}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>
                {weeklyData.filter((d) => d.trained).length}/7 días esta sem.
              </Text>
            </View>
          </View>

          <View style={[kStyles.divider, { marginVertical: 12 }]} />

          <View style={kStyles.rowBetween}>
            {weeklyData.map((day, idx) => {
              const isToday = idx === 6;
              return (
                <View key={day.date} style={{ alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '800',
                      color: isToday ? k.cyan : k.textMuted,
                    }}
                  >
                    {day.shortLetter}
                  </Text>
                  <View
                    style={[
                      styles.matrixDot,
                      {
                        backgroundColor: day.trained ? k.limeBg : k.surfaceHighest,
                        borderWidth: isToday && !day.trained ? 1.5 : 0,
                        borderColor: k.cyan,
                      },
                    ]}
                  >
                    {day.trained && <Ionicons name="checkmark" size={13} color="#3a4a00" />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. SECCIÓN PRINCIPAL: SOBRECARGA PROGRESIVA (POR EJERCICIO / POR DÍA)      */}
        {/* ========================================================================= */}
        <View style={{ gap: 12 }}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerLime}>Tu avance día con día</Text>
              <Text style={{ fontSize: 19, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                SOBRECARGA PROGRESIVA
              </Text>
            </View>
          </View>

          {/* Selector de Vista: Por Ejercicio vs Por Día */}
          <View style={[styles.viewToggleContainer, { backgroundColor: k.surfaceHigh }]}>
            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                overloadViewMode === 'by_exercise' && { backgroundColor: k.limeBg },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setOverloadViewMode('by_exercise');
              }}
            >
              <Ionicons
                name="barbell-outline"
                size={15}
                color={overloadViewMode === 'by_exercise' ? '#3a4a00' : k.textMuted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '900',
                  color: overloadViewMode === 'by_exercise' ? '#3a4a00' : k.textMuted,
                }}
              >
                POR EJERCICIO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewToggleBtn,
                overloadViewMode === 'by_day' && { backgroundColor: k.cyan },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setOverloadViewMode('by_day');
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={overloadViewMode === 'by_day' ? '#00363a' : k.textMuted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '900',
                  color: overloadViewMode === 'by_day' ? '#00363a' : k.textMuted,
                }}
              >
                POR DÍA (SESIONES)
              </Text>
            </TouchableOpacity>
          </View>

          {overloadViewMode === 'by_exercise' ? (
            <>
              {/* Filtros por Músculo */}
              {muscleCategories.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {muscleCategories.map((m) => {
                    const active = selectedMuscleFilter === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.filterPill, { backgroundColor: active ? k.limeBg : k.surfaceHigh }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedMuscleFilter(m);
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#3a4a00' : k.textMuted }}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {filteredExercises.length === 0 ? (
                <View style={[kStyles.surfaceCard, { alignItems: 'center', paddingVertical: 24, gap: 8 }]}>
                  <Ionicons name="barbell-outline" size={32} color={k.textMuted} />
                  <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
                    Agrega ejercicios en tu pestaña "Rutina" para ver aquí tus pesos y repeticiones.
                  </Text>
                </View>
              ) : (
                filteredExercises.map((ex) => {
                  const comp = analyzeExerciseOverload(ex.id, allWorkoutLogs);

                  const badgeColor =
                    comp.status === 'up_weight'
                      ? k.lime
                      : comp.status === 'up_reps'
                      ? k.cyan
                      : comp.status === 'down'
                      ? k.danger
                      : k.textMuted;

                  return (
                    <TouchableOpacity
                      key={ex.id}
                      style={[kStyles.surfaceCard, { gap: 10 }]}
                      activeOpacity={0.88}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedExerciseId(ex.id);
                        setExerciseModalVisible(true);
                      }}
                    >
                      {/* Cabecera de la tarjeta del ejercicio */}
                      <View style={kStyles.rowBetween}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Image
                            source={imageMap[ex.id as keyof typeof imageMap]}
                            style={[styles.exThumb, { backgroundColor: k.surfaceHighest }]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={kStyles.kickerMuted}>{ex.muscle}</Text>
                            <Text
                              style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
                              numberOfLines={1}
                            >
                              {ex.name}
                            </Text>
                          </View>
                        </View>

                        {/* Insignia de estado de sobrecarga */}
                        <View
                          style={[
                            styles.overloadStatusPill,
                            { backgroundColor: k.surfaceLowest, borderColor: badgeColor },
                          ]}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '900', color: badgeColor }}>
                            {comp.badgeText}
                          </Text>
                        </View>
                      </View>

                      {/* Comparativa Directa: Sesión Anterior vs Última Sesión */}
                      {comp.latest ? (
                        <>
                          <View style={styles.comparisonBoxesRow}>
                            <View style={[styles.sessionCompareBox, { backgroundColor: k.surfaceLowest }]}>
                              <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted }}>
                                {comp.previous ? `ANTERIOR (${comp.previous.shortDate})` : 'SESIÓN PREVIA'}
                              </Text>
                              <Text style={{ fontSize: 15, fontWeight: '800', color: k.textMuted, marginTop: 2 }}>
                                {comp.previous
                                  ? `${comp.previous.maxWeight} kg × ${comp.previous.bestRepsAtMax} reps`
                                  : 'Sin previa'}
                              </Text>
                            </View>

                            <View style={styles.arrowCircle}>
                              <Ionicons name="arrow-forward" size={14} color={badgeColor} />
                            </View>

                            <View
                              style={[
                                styles.sessionCompareBox,
                                { backgroundColor: k.surfaceLowest, borderColor: badgeColor, borderWidth: 1 },
                              ]}
                            >
                              <Text style={{ fontSize: 9, fontWeight: '900', color: badgeColor }}>
                                ÚLTIMA ({comp.latest.shortDate})
                              </Text>
                              <Text style={{ fontSize: 16, fontWeight: '900', color: k.textMain, marginTop: 2 }}>
                                {comp.latest.maxWeight} kg × {comp.latest.bestRepsAtMax} reps
                              </Text>
                            </View>
                          </View>

                          {/* Píldoras con todas las series de la última sesión */}
                          <View style={[kStyles.rowBetween, { marginTop: 2 }]}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 }}>
                              {comp.latest.setsDetail.map((s) => (
                                <View
                                  key={s.setNumber}
                                  style={[styles.miniSetTag, { backgroundColor: k.surfaceHighest }]}
                                >
                                  <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>
                                    S{s.setNumber}: {s.weight}kg×{s.reps}
                                  </Text>
                                </View>
                              ))}
                            </View>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: k.cyan, marginLeft: 8 }}>
                              Historial →
                            </Text>
                          </View>
                        </>
                      ) : (
                        <Text style={kStyles.bodyMuted}>
                          Aún no has registrado series de este ejercicio.
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          ) : (
            /* VISTA 2: POR DÍA (ENTRENAMIENTOS ANTERIORES) */
            <View style={{ gap: 12 }}>
              {pastWorkoutDays.length === 0 ? (
                <View style={[kStyles.surfaceCard, { alignItems: 'center', paddingVertical: 24, gap: 8 }]}>
                  <Ionicons name="calendar-outline" size={32} color={k.textMuted} />
                  <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
                    Aquí aparecerán tus entrenamientos anteriores por fecha conforme vayas registrando tus días.
                  </Text>
                </View>
              ) : (
                pastWorkoutDays.map((dayLog) => {
                  const dObj = new Date(dayLog.date + 'T12:00:00Z');
                  const dayOfWeekName = DAYS_FROM_SUNDAY[dObj.getDay()];
                  const splitTitle = routineData?.[dayOfWeekName]?.title || 'Entrenamiento';
                  const exIds = Object.keys(dayLog.exercises || {}).filter(
                    (id) =>
                      !dayLog.exercises[id].skipped &&
                      dayLog.exercises[id].reps?.some((r: string) => parseInt(r, 10) > 0)
                  );

                  return (
                    <View key={dayLog.date} style={[kStyles.surfaceCard, { gap: 10 }]}>
                      <View style={kStyles.leftNotch} />
                      <View style={[kStyles.rowBetween, { paddingLeft: 6 }]}>
                        <View>
                          <Text style={kStyles.kickerCyan}>
                            {dayOfWeekName.toUpperCase()} • {formatReadableDate(dayLog.date).toUpperCase()}
                          </Text>
                          <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                            {splitTitle.toUpperCase()}
                          </Text>
                        </View>
                        <View style={[styles.activeDaysPill, { backgroundColor: k.surfaceLowest }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
                            {exIds.length} ejercicios
                          </Text>
                        </View>
                      </View>

                      <View style={{ gap: 8, paddingLeft: 6 }}>
                        {exIds.map((exId) => {
                          const exLog = dayLog.exercises[exId];
                          const setsCount = exLog.sets || exLog.reps?.length || 0;

                          return (
                            <TouchableOpacity
                              key={exId}
                              style={[styles.dayExItemBox, { backgroundColor: k.surfaceLowest }]}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setSelectedExerciseId(exId);
                                setExerciseModalVisible(true);
                              }}
                            >
                              <View style={[kStyles.rowBetween, { marginBottom: 6 }]}>
                                <Text
                                  style={{ fontSize: 12, fontWeight: '900', color: k.textMain, textTransform: 'uppercase', flex: 1 }}
                                  numberOfLines={1}
                                >
                                  {getExerciseNameById(exId)}
                                </Text>
                                <Ionicons name="stats-chart" size={13} color={k.cyan} />
                              </View>

                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                                {Array.from({ length: setsCount }).map((_, sIdx) => {
                                  const r = parseInt(exLog.reps?.[sIdx], 10) || 0;
                                  const w = parseFloat(exLog.weights?.[sIdx]) || 0;
                                  if (r <= 0) return null;
                                  return (
                                    <View
                                      key={sIdx}
                                      style={[styles.miniSetTag, { backgroundColor: k.surfaceHigh }]}
                                    >
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>
                                        S{sIdx + 1}: <Text style={{ color: k.lime }}>{w}kg</Text> × {r}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 3. SECCIÓN APARTE: MIS RÉCORDS PERSONALES (PRs MANUALES)                  */}
        {/* ========================================================================= */}
        <View style={[kStyles.card, { gap: 12 }]}>
          <View style={kStyles.rowBetween}>
            <View style={kStyles.rowAlign}>
              <View style={[styles.trophyIconBox, { backgroundColor: 'rgba(245, 206, 83, 0.16)' }]}>
                <Ionicons name="trophy" size={18} color={k.gold} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                  MIS RÉCORDS PERSONALES (PRs)
                </Text>
                <Text style={{ fontSize: 10, color: k.textMuted }}>
                  Tus cargas máximas registradas aparte
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addPrBtn, { backgroundColor: k.limeBg }]}
              onPress={() => {
                Haptics.selectionAsync();
                setPrInitialExercise(null);
                setPRModalVisible(true);
              }}
            >
              <Ionicons name="add" size={15} color="#3a4a00" />
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#3a4a00' }}>NUEVO</Text>
            </TouchableOpacity>
          </View>

          {customPRsList.length === 0 ? (
            <View style={[styles.emptyPrBox, { backgroundColor: k.surfaceLowest }]}>
              <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
                ¿Lograste un récord personal en Press de Banca, Sentadilla o tu ejercicio favorito? Regístralo aquí para llevar tu muro de trofeos.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {customPRsList.map((prItem) => (
                <TouchableOpacity
                  key={prItem.exerciseId}
                  style={[styles.prRowCard, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPrInitialExercise({
                      id: prItem.exerciseId,
                      name: prItem.exerciseName,
                      muscle: prItem.muscle,
                      image: '',
                    });
                    setPRModalVisible(true);
                  }}
                >
                  <Image
                    source={imageMap[prItem.exerciseId as keyof typeof imageMap]}
                    style={[styles.prImg, { backgroundColor: k.surfaceHighest }]}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
                      numberOfLines={1}
                    >
                      {prItem.exerciseName}
                    </Text>
                    <Text style={{ fontSize: 10, color: k.textMuted }}>
                      {prItem.muscle} • {formatReadableDate(prItem.date)}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '900', fontStyle: 'italic', color: k.gold }}>
                      {prItem.weight} KG
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: k.lime }}>
                      × {prItem.reps} {prItem.reps === 1 ? 'REP (1RM)' : 'REPS'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ========================================================================= */}
        {/* 4. EVOLUCIÓN REAL DE PESO CORPORAL                                        */}
        {/* ========================================================================= */}
        <View style={kStyles.surfaceCard}>
          <View style={kStyles.rowBetween}>
            <View>
              <Text style={kStyles.kickerMuted}>HISTORIAL BIOMÉTRICO </Text>
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
                    {targetWeightVal ? `Meta final: ${targetWeightVal.toFixed(1)} kg` : 'Modo: Mantenimiento'}
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
      </ScrollView>

      <ExerciseStatsModal
        visible={isExerciseModalVisible}
        routineExercises={routineExercises}
        selectedExerciseId={selectedExerciseId}
        exerciseHistory={selectedExHistory}
        onClose={() => setExerciseModalVisible(false)}
        onSelectExercise={setSelectedExerciseId}
      />

      <PRLogModal
        visible={isPRModalVisible}
        existingPRs={customPRsMap}
        initialExercise={prInitialExercise}
        onClose={() => setPRModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeDaysPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  matrixDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  viewToggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 6,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  exThumb: { width: 42, height: 42, borderRadius: 10 },
  overloadStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  comparisonBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionCompareBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSetTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dayExItemBox: {
    padding: 10,
    borderRadius: 12,
  },
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  emptyPrBox: {
    padding: 14,
    borderRadius: 12,
  },
  prRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  prImg: { width: 42, height: 42, borderRadius: 8 },
  tfRow: { flexDirection: 'row', padding: 3, borderRadius: 18, gap: 2 },
  tfBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
});