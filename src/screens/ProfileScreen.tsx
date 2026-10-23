import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { imageMap } from '../assets/imgs/imageMap';
import { useTheme } from '../context/ThemeContext';
import { DAYS_FROM_SUNDAY, getFirstName } from '../constants/appConstants';
import KineticHeader from '../components/common/KineticHeader';
import KineticButton from '../components/common/KineticButton';
import SetLoggerModal from '../components/modals/SetLoggerModal';
import ProfileOptionsModal from '../components/modals/ProfileOptionsModal';

export default function ProfileScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<any>();

  const [userData, setUserData] = useState<any>(null);
  const [routine, setRoutine] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<{ date: string; weight: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayIndex = today.getDay();
  const todayName = DAYS_FROM_SUNDAY[todayIndex];
  const tomorrowName = DAYS_FROM_SUNDAY[(todayIndex + 1) % 7];
  const dateString = today.toISOString().split('T')[0];

  const lastWeekDate = new Date(today);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekString = lastWeekDate.toISOString().split('T')[0];

  const [isLogging, setIsLogging] = useState(false);
  const [workoutLog, setWorkoutLog] = useState<any>({ finished: false, exercises: {} });
  const [lastWeekLog, setLastWeekLog] = useState<any>(null);

  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [isWeightInputOpen, setIsWeightInputOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [waterIntake, setWaterIntake] = useState(1.8);

  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [tempSetsCount, setTempSetsCount] = useState('3');
  const [tempReps, setTempReps] = useState<string[]>([]);
  const [tempWeights, setTempWeights] = useState<string[]>([]);
  const [tempRpes, setTempRpes] = useState<string[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [savingExercise, setSavingExercise] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.weight && !tempWeight) setTempWeight(data.weight.toString());
      }
    });

    const unsubRoutine = onSnapshot(doc(db, 'users', user.uid, 'data', 'routine'), (docSnap) => {
      if (docSnap.exists()) setRoutine(docSnap.data());
    });

    const unsubLog = onSnapshot(doc(db, 'users', user.uid, 'workout_logs', dateString), (docSnap) => {
      if (docSnap.exists()) {
        const logData = docSnap.data();
        setWorkoutLog(logData);
        if (logData.finished) setIsLogging(false);
      } else {
        setWorkoutLog({ finished: false, exercises: {} });
      }
    });

    // Escuchar historial de peso en tiempo real para mostrar comparativa reciente
    const unsubWeightLogs = onSnapshot(collection(db, 'users', user.uid, 'weight_logs'), (snap) => {
      const logs = snap.docs
        .map((d) => ({
          date: d.id,
          weight: parseFloat(d.data().weight) || 0,
        }))
        .filter((item) => item.weight > 0)
        .sort((a, b) => a.date.localeCompare(b.date));
      setWeightLogs(logs);
    });

    const fetchLastWeek = async () => {
      const lwSnap = await getDoc(doc(db, 'users', user.uid, 'workout_logs', lastWeekString));
      if (lwSnap.exists()) setLastWeekLog(lwSnap.data());
      setLoading(false);
    };
    fetchLastWeek();

    return () => {
      unsubUser();
      unsubRoutine();
      unsubLog();
      unsubWeightLogs();
    };
  }, []);

  const handleSelectAvatar = async (avatarKey: string) => {
    setSavingSettings(true);
    try {
      const user = auth.currentUser;
      if (user) await updateDoc(doc(db, 'users', user.uid), { avatarId: avatarKey });
      setProfileModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el avatar.');
    } finally {
      setSavingSettings(false);
    }
  };

  // --- GUARDAR PESO ACTUAL + REGISTRO EN EL HISTORIAL DE FIRESTORE ---
  const handleUpdateWeight = async () => {
    const numericWeight = parseFloat(tempWeight.replace(',', '.'));
    if (isNaN(numericWeight) || numericWeight <= 0) {
      Alert.alert('Error', 'Por favor ingresa un peso válido (ej. 70.5).');
      return;
    }
    setSavingSettings(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const timestamp = new Date().toISOString();

        // 1. Actualizar el peso actual en el perfil del usuario
        await updateDoc(doc(db, 'users', user.uid), {
          weight: numericWeight.toString(),
          lastWeightUpdate: timestamp,
        });

        // 2. Guardar o actualizar la entrada del día en la subcolección weight_logs
        await setDoc(
          doc(db, 'users', user.uid, 'weight_logs', dateString),
          {
            weight: numericWeight,
            date: dateString,
            updatedAt: timestamp,
          },
          { merge: true }
        );

        setIsWeightInputOpen(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error guardando peso:', error);
      Alert.alert('Error', 'No se pudo guardar el registro de peso.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openExerciseModal = (exercise: any) => {
    Haptics.selectionAsync();
    setActiveExercise(exercise);
    const existingData = workoutLog.exercises[exercise.id];
    const lastWeekEx = lastWeekLog?.exercises?.[exercise.id];

    if (existingData && !existingData.skipped) {
      const count = existingData.sets || 3;
      setTempSetsCount(count.toString());
      setTempReps(existingData.reps || Array(count).fill(''));
      setTempWeights(existingData.weights || Array(count).fill(''));
      setTempRpes(existingData.rpes || Array(count).fill('8.5'));
      const firstIncomplete = (existingData.reps || []).findIndex((r: string) => !r || r.trim() === '' || r === '0');
      setActiveSetIndex(firstIncomplete !== -1 ? firstIncomplete : 0);
    } else {
      const defaultWeights = [
        lastWeekEx?.weights?.[0] || '40',
        lastWeekEx?.weights?.[1] || '40',
        lastWeekEx?.weights?.[2] || '40',
      ];
      setTempSetsCount('3');
      setTempReps(['', '', '']);
      setTempWeights(defaultWeights);
      setTempRpes(['8', '8.5', '8.5']);
      setActiveSetIndex(0);
    }
  };

  const handleSetsCountChange = (count: number) => {
    setTempSetsCount(count.toString());
    const newReps = [...tempReps];
    const newWeights = [...tempWeights];
    const newRpes = [...tempRpes];

    if (count > newReps.length) {
      while (newReps.length < count) {
        newReps.push('');
        newWeights.push(newWeights[newWeights.length - 1] || '40');
        newRpes.push('8.5');
      }
    } else {
      newReps.length = count;
      newWeights.length = count;
      newRpes.length = count;
    }
    setTempReps(newReps);
    setTempWeights(newWeights);
    setTempRpes(newRpes);
    if (activeSetIndex >= count) setActiveSetIndex(Math.max(0, count - 1));
  };

  const commitActiveSet = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newReps = [...tempReps];
    const newWeights = [...tempWeights];
    if (!newReps[activeSetIndex] || newReps[activeSetIndex] === '0') newReps[activeSetIndex] = '10';
    if (!newWeights[activeSetIndex]) newWeights[activeSetIndex] = '40';
    setTempReps(newReps);
    setTempWeights(newWeights);

    const user = auth.currentUser;
    if (user && activeExercise) {
      const updatedLog = {
        ...workoutLog,
        exercises: {
          ...workoutLog.exercises,
          [activeExercise.id]: {
            skipped: false,
            sets: parseInt(tempSetsCount) || newReps.length,
            reps: newReps,
            weights: newWeights,
            rpes: tempRpes,
          },
        },
      };
      await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), updatedLog, { merge: true });
    }

    const totalSets = parseInt(tempSetsCount) || newReps.length;
    if (activeSetIndex < totalSets - 1) setActiveSetIndex(activeSetIndex + 1);
  };

  const saveExerciseLog = async (skipped = false, nextExerciseToOpen: any = null) => {
    if (!activeExercise) return;
    setSavingExercise(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const exerciseData = skipped
          ? { skipped: true }
          : {
              skipped: false,
              sets: parseInt(tempSetsCount),
              reps: tempReps,
              weights: tempWeights,
              rpes: tempRpes,
            };
        const updatedLog = {
          ...workoutLog,
          exercises: { ...workoutLog.exercises, [activeExercise.id]: exerciseData },
        };
        await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), updatedLog, { merge: true });
        if (nextExerciseToOpen) openExerciseModal(nextExerciseToOpen);
        else setActiveExercise(null);
      }
    } finally {
      setSavingExercise(false);
    }
  };

  const getExerciseStatus = (exerciseId: string) => {
    const logData = workoutLog.exercises[exerciseId];
    if (!logData) return { status: 'pending', text: 'Toca para registrar', color: k.textMuted };
    if (logData.skipped) return { status: 'skipped', text: 'Omitido hoy', color: k.danger };
    const hasEmptyReps = logData.reps.some((r: string) => r.trim() === '' || r.trim() === '0');
    if (hasEmptyReps) return { status: 'incomplete', text: 'Faltó registrar repeticiones', color: k.warning };
    return { status: 'complete', text: `✓ ${logData.sets} series registradas`, color: k.lime };
  };

  const finishWorkout = () => {
    const todayPlan = routine[todayName];
    if (!todayPlan) return;
    const warnings: string[] = [];
    todayPlan.exercises.forEach((ex: any) => {
      const statusInfo = getExerciseStatus(ex.id);
      if (statusInfo.status === 'pending') warnings.push(`• ${ex.name} (Sin registrar)`);
      else if (statusInfo.status === 'incomplete') warnings.push(`• ${ex.name} (Incompleto)`);
    });

    Alert.alert(
      warnings.length > 0 ? '¡Atención! Entrenamiento incompleto' : '¿Terminar registro?',
      warnings.length > 0
        ? `Te faltó registrar:\n\n${warnings.join('\n')}\n\n¿Seguro que quieres terminar?`
        : 'Ya no podrás editar tus series de hoy.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, terminar',
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) return;
            let newStreak = userData?.streak || 0;
            const yDate = new Date(today);
            yDate.setDate(yDate.getDate() - 1);
            const yesterdayStr = yDate.toISOString().split('T')[0];

            if (userData?.lastWorkoutDate === yesterdayStr) newStreak += 1;
            else if (userData?.lastWorkoutDate !== dateString) newStreak = 1;

            await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), { finished: true }, { merge: true });
            await updateDoc(doc(db, 'users', user.uid), { streak: newStreak, lastWorkoutDate: dateString });
          },
        },
      ]
    );
  };

  const calculateVolume = (exLog: any) => {
    if (!exLog || exLog.skipped) return 0;
    let vol = 0;
    for (let i = 0; i < exLog.sets; i++) {
      vol += (parseInt(exLog.reps[i]) || 0) * (parseFloat(exLog.weights?.[i]) || 1);
    }
    return vol;
  };

  const generateSummary = () => {
    if (!lastWeekLog || !lastWeekLog.finished) {
      return {
        title: '¡PRIMER REGISTRO DE ESTE DÍA!',
        subtitle: 'La próxima semana compararemos tu sobrecarga progresiva.',
        improved: [],
        decreased: [],
      };
    }
    let currTotal = 0;
    let pastTotal = 0;
    const improved: string[] = [];
    const decreased: string[] = [];

    routine?.[todayName]?.exercises?.forEach((ex: any) => {
      const cV = calculateVolume(workoutLog.exercises[ex.id]);
      const pV = calculateVolume(lastWeekLog.exercises?.[ex.id]);
      currTotal += cV;
      pastTotal += pV;
      if (pV > 0 && cV > 0) {
        if (cV > pV) improved.push(ex.name);
        else if (cV < pV) decreased.push(ex.name);
      }
    });

    const pct = pastTotal > 0 ? ((currTotal - pastTotal) / pastTotal) * 100 : 0;
    return {
      title: pct >= 0 ? '¡SUBISTE TU RENDIMIENTO! 📈' : 'BAJASTE UN POCO EL RITMO 📉',
      subtitle: `Tu volumen total fue ${Math.abs(pct).toFixed(1)}% ${pct >= 0 ? 'mayor' : 'menor'} que la semana pasada.`,
      improved,
      decreased,
    };
  };

  if (loading) {
    return (
      <View style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={k.lime} />
      </View>
    );
  }

  const todayPlan = routine ? routine[todayName] : null;
  const tomorrowPlan = routine ? routine[tomorrowName] : null;
  const totalExercisesCount = todayPlan?.exercises?.length || 0;
  const activeExIndex = todayPlan?.exercises?.findIndex((e: any) => e.id === activeExercise?.id) ?? 0;
  const nextExercise =
    todayPlan?.exercises && activeExIndex >= 0 && activeExIndex < totalExercisesCount - 1
      ? todayPlan.exercises[activeExIndex + 1]
      : null;

  // Cálculo de cambio respecto al pesaje inmediato anterior
  const prevWeightDiff =
    weightLogs.length >= 2
      ? (weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight).toFixed(1)
      : null;

  return (
    <SafeAreaView style={kStyles.container}>
      <KineticHeader
        userData={userData}
        fallbackName={auth.currentUser?.displayName}
        brandTitle="GoFit"
        onAvatarPress={() => setProfileModalVisible(true)}
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Saludo & Racha */}
        <View style={{ gap: 8 }}>
          <View style={kStyles.rowBetween}>
            <View style={[styles.pill, { backgroundColor: k.surfaceHigh }]}>
              <Ionicons name="calendar-outline" size={13} color={k.cyan} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: k.textMuted, textTransform: 'capitalize' }}>
                {todayName}, {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: k.surfaceHighest }]}>
              <Text style={{ fontSize: 12 }}>🔥</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: k.lime }}>
                {userData?.streak || 0} DÍAS RACHA
              </Text>
            </View>
          </View>

          <Text style={kStyles.mainHeadline}>
            ¡HOLA, {getFirstName(userData?.name || auth.currentUser?.displayName)}!
          </Text>
          <Text style={kStyles.bodyMuted}>Preparado para romper límites hoy. La sobrecarga no perdona.</Text>
        </View>

        {/* HERO CARD: RUTINA DE HOY */}
        {!todayPlan ? (
          <View style={[kStyles.card, { gap: 12 }]}>
            <View style={[kStyles.leftNotch, { backgroundColor: k.warning }]} />
            <Text style={kStyles.kickerLime}>SIN CONFIGURAR</Text>
            <Text style={kStyles.cardTitleItalic}>AÚN NO TIENES RUTINA HOY</Text>
            <Text style={kStyles.bodyMuted}>Configura tus días en la pestaña "Rutina" para comenzar.</Text>
            <KineticButton title="IR A CONFIGURAR RUTINA" icon="barbell" onPress={() => navigation.navigate('Rutina')} />
          </View>
        ) : workoutLog.finished ? (
          <>
            <View style={[kStyles.card, { gap: 12 }]}>
              <View style={[kStyles.leftNotch, { backgroundColor: k.limeBg }]} />
              <Text style={kStyles.kickerLime}>SESIÓN COMPLETADA 🏆</Text>
              <Text style={kStyles.cardTitleItalic}>¡ENTRENAMIENTO FINALIZADO!</Text>
              <Text style={kStyles.bodyMuted}>Descansa y aliméntate bien para superarte en la siguiente sesión.</Text>
              <View style={[styles.innerBox, { backgroundColor: k.surfaceLowest }]}>
                <Text style={kStyles.kickerMuted}>¿QUÉ TOCA MAÑANA ({tomorrowName.toUpperCase()})?</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: k.textMain, marginTop: 4 }}>
                  {tomorrowPlan?.isRest ? 'Día de Descanso Total 🛏️' : `Día de ${tomorrowPlan?.title || 'Entrenamiento'} 🔥`}
                </Text>
              </View>
            </View>

            <View style={[kStyles.card, { gap: 12 }]}>
              <Text style={kStyles.kickerLime}>REPORTE DE SOBRECARGA</Text>
              {(() => {
                const summary = generateSummary();
                return (
                  <View style={[styles.innerBox, { backgroundColor: k.surfaceLowest, gap: 6 }]}>
                    <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                      {summary.title}
                    </Text>
                    <Text style={kStyles.bodyMuted}>{summary.subtitle}</Text>
                    {summary.improved.length > 0 && (
                      <Text style={{ fontSize: 12, color: k.lime, fontWeight: '800' }}>
                        ↑ Mejoraste en: {summary.improved.join(', ')}
                      </Text>
                    )}
                    {summary.decreased.length > 0 && (
                      <Text style={{ fontSize: 12, color: k.danger, fontWeight: '800' }}>
                        ↓ Menor volumen en: {summary.decreased.join(', ')}
                      </Text>
                    )}
                  </View>
                );
              })()}
              <KineticButton
                title="VER MÉTRICAS COMPLETAS"
                icon="stats-chart"
                onPress={() => navigation.navigate('Estadísticas')}
              />
            </View>
          </>
        ) : todayPlan.isRest ? (
          <View style={[kStyles.card, { gap: 10 }]}>
            <View style={[kStyles.leftNotch, { backgroundColor: k.textMuted }]} />
            <Text style={kStyles.kickerMuted}>RECUPERACIÓN ACTIVA</Text>
            <Text style={kStyles.cardTitleItalic}>HOY ES DÍA DE DESCANSO 🛏️</Text>
            <Text style={kStyles.bodyMuted}>El músculo crece cuando descansas. Mantén tu hidratación al día.</Text>
          </View>
        ) : (
          <View style={[kStyles.card, { gap: 14 }]}>
            <View style={kStyles.leftNotch} />
            <View style={[kStyles.rowBetween, { paddingLeft: 4 }]}>
              <Text style={kStyles.kickerCyan}>{isLogging ? '● SESIÓN EN CURSO' : '● SESIÓN NO INICIADA'}</Text>
              <Text style={[styles.phaseBadge, { backgroundColor: k.surfaceHighest, color: k.textMuted }]}>
                {todayPlan.muscles?.slice(0, 2).join(' • ') || 'HIPERTROFIA'}
              </Text>
            </View>

            <View style={{ paddingLeft: 4 }}>
              <Text style={kStyles.kickerLime}>RUTINA DE HOY</Text>
              <Text style={kStyles.cardTitleItalic}>{todayPlan.title || 'ENTRENAMIENTO DEL DÍA'}</Text>
              <Text style={kStyles.bodyMuted}>
                Registra tus series, peso y repeticiones para calcular tu sobrecarga progresiva.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, paddingLeft: 4 }}>
              <View style={[styles.metricChip, { backgroundColor: k.surfaceLowest }]}>
                <Ionicons name="locate" size={18} color={k.lime} />
                <View>
                  <Text style={kStyles.kickerMuted}>OBJETIVO</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>
                    {totalExercisesCount * 3} Series
                  </Text>
                </View>
              </View>
              <View style={[styles.metricChip, { backgroundColor: k.surfaceLowest }]}>
                <Ionicons name="timer-outline" size={18} color={k.cyan} />
                <View>
                  <Text style={kStyles.kickerMuted}>DURACIÓN</Text>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>45 - 60 Min</Text>
                </View>
              </View>
            </View>

            <View style={{ paddingLeft: 4 }}>
              <View style={[kStyles.rowBetween, { marginBottom: 8 }]}>
                <Text style={kStyles.kickerMuted}>{totalExercisesCount} EJERCICIOS PROGRAMADOS</Text>
                <TouchableOpacity onPress={() => setIsLogging(!isLogging)}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: k.cyan }}>
                    {isLogging ? 'Ocultar lista' : 'Ver desglose'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!isLogging ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {todayPlan.exercises.map((ex: any, i: number) => (
                    <TouchableOpacity
                      key={`${ex.id}-${i}`}
                      style={[styles.previewPill, { backgroundColor: k.surfaceHighest }]}
                      onPress={() => {
                        setIsLogging(true);
                        openExerciseModal(ex);
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: k.textMain }}>{ex.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {todayPlan.exercises.map((ex: any, idx: number) => {
                    const st = getExerciseStatus(ex.id);
                    return (
                      <TouchableOpacity
                        key={`${ex.id}-${idx}`}
                        style={[
                          styles.exRow,
                          { backgroundColor: k.surfaceLowest },
                          st.status === 'complete' && { borderColor: k.limeBg, borderWidth: 1 },
                        ]}
                        onPress={() => openExerciseModal(ex)}
                      >
                        <Image
                          source={imageMap[ex.id as keyof typeof imageMap]}
                          style={[styles.exImg, { backgroundColor: k.surfaceHighest }]}
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}>
                            {ex.name}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: st.color, marginTop: 2 }}>
                            {st.text}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={k.textMain} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {!isLogging ? (
              <KineticButton
                title="INICIAR & REGISTRAR SERIES"
                icon="play"
                onPress={() => setIsLogging(true)}
              />
            ) : (
              <KineticButton
                variant="danger"
                title="TERMINAR REGISTRO DE HOY"
                icon="flag"
                onPress={finishWorkout}
              />
            )}
          </View>
        )}

        {/* CONTROL DE PESO */}
        <View style={[kStyles.card, { gap: 12 }]}>
          <View style={kStyles.rowBetween}>
            <View style={kStyles.rowAlign}>
              <Ionicons name="scale-outline" size={20} color={k.cyan} />
              <View>
                <Text style={{ fontSize: 14, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                  CONTROL DE PESO CORPORAL
                </Text>
                <Text style={{ fontSize: 10, color: k.textMuted }}>
                  {weightLogs.length} registros guardados en el historial
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: k.surfaceHighest }]}
              onPress={() => setIsWeightInputOpen(!isWeightInputOpen)}
            >
              <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
                {isWeightInputOpen ? 'CERRAR' : '+ ACTUALIZAR'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[kStyles.rowBetween, styles.innerBox, { backgroundColor: k.surfaceLowest }]}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                {userData?.weight || '--'}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: k.textMuted }}>KG</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: k.lime }}>
              {prevWeightDiff !== null
                ? `${parseFloat(prevWeightDiff) > 0 ? '+' : ''}${prevWeightDiff} kg vs pesaje ant.`
                : 'Biometría activa'}
            </Text>
          </View>

          {isWeightInputOpen && (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[kStyles.kineticInput, { flex: 1 }]}
                keyboardType="decimal-pad"
                placeholder="Ej. 78.4"
                placeholderTextColor={k.textMuted}
                value={tempWeight}
                onChangeText={(val) => setTempWeight(val.replace(/[^0-9.,]/g, ''))}
              />
              <KineticButton title="GUARDAR" loading={savingSettings} onPress={handleUpdateWeight} />
            </View>
          )}
        </View>

        {/* BENTO DE HIDRATACIÓN & PROGRESO */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[kStyles.card, { flex: 1, padding: 14, gap: 8 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWaterIntake((prev) => parseFloat((prev >= 3.5 ? 0.5 : prev + 0.25).toFixed(2)));
            }}
          >
            <View style={kStyles.rowBetween}>
              <Text style={kStyles.kickerMuted}>HIDRATACIÓN (+)</Text>
              <Ionicons name="water" size={16} color={k.cyan} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
              {waterIntake} <Text style={{ fontSize: 11, color: k.textMuted }}>/ 3.0 L</Text>
            </Text>
          </TouchableOpacity>

          <View style={[kStyles.card, { flex: 1, padding: 14, gap: 8 }]}>
            <View style={kStyles.rowBetween}>
              <Text style={kStyles.kickerMuted}>PROGRESO HOY</Text>
              <Ionicons name="flash" size={16} color={k.lime} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
              {Object.keys(workoutLog.exercises || {}).length}/{totalExercisesCount}
            </Text>
          </View>
        </View>
      </ScrollView>

      <SetLoggerModal
        visible={!!activeExercise}
        activeExercise={activeExercise}
        activeExIndex={activeExIndex}
        totalExercisesCount={totalExercisesCount}
        routineTitle={todayPlan?.title}
        nextExercise={nextExercise}
        prevExData={activeExercise ? lastWeekLog?.exercises?.[activeExercise.id] : null}
        tempSetsCount={tempSetsCount}
        tempReps={tempReps}
        tempWeights={tempWeights}
        tempRpes={tempRpes}
        activeSetIndex={activeSetIndex}
        savingExercise={savingExercise}
        onSelectSetIndex={setActiveSetIndex}
        onUpdateRep={(idx, val) => {
          const r = [...tempReps];
          r[idx] = val;
          setTempReps(r);
        }}
        onUpdateWeight={(idx, val) => {
          const w = [...tempWeights];
          w[idx] = val;
          setTempWeights(w);
        }}
        onUpdateRpe={(idx, val) => {
          const rp = [...tempRpes];
          rp[idx] = val;
          setTempRpes(rp);
        }}
        onAddExtraSet={() => {
          const next = (parseInt(tempSetsCount) || 0) + 1;
          handleSetsCountChange(next);
          setActiveSetIndex(next - 1);
        }}
        onRemoveLastSet={() => handleSetsCountChange(Math.max(1, (parseInt(tempSetsCount) || 1) - 1))}
        onCommitActiveSet={commitActiveSet}
        onSaveExercise={saveExerciseLog}
      />

      <ProfileOptionsModal
        visible={isProfileModalVisible}
        currentAvatarId={userData?.avatarId}
        saving={savingSettings}
        onClose={() => setProfileModalVisible(false)}
        onSelectAvatar={handleSelectAvatar}
        onLogout={() => {
          setProfileModalVisible(false);
          auth.signOut();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  innerBox: { padding: 14, borderRadius: 14 },
  phaseBadge: { fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, textTransform: 'uppercase' },
  metricChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14 },
  previewPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14 },
  exImg: { width: 46, height: 46, borderRadius: 10 },
});