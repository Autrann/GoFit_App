import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { doc, getDoc, updateDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../config/firebase';
import { ThemeColors } from '../theme/colors';
import { DAYS_FROM_SUNDAY } from '../constants/appConstants';
import { calculateWeightStageAnalytics, calculateExerciseVolume } from '../utils/analytics';
import {
  UserData,
  Routine,
  WeightEntry,
  WorkoutDayLog,
  ExerciseStatusInfo,
  WorkoutSummary,
  WeightGoalType,
} from '../types';
import { useSetLoggingSession } from './useSetLoggingSession';

export function useProfileWorkout(k: ThemeColors) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
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
  const [workoutLog, setWorkoutLog] = useState<WorkoutDayLog>({
    finished: false,
    exercises: {},
    waterLiters: 0,
  });
  const [lastWeekLog, setLastWeekLog] = useState<WorkoutDayLog | null>(null);

  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempTargetWeight, setTempTargetWeight] = useState('');
  const [tempMaintainMode, setTempMaintainMode] = useState(false);
  const [isWeightInputOpen, setIsWeightInputOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const setLoggingSession = useSetLoggingSession({
    dateString,
    workoutLog,
    lastWeekLog,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        setUserData(data);
        if (data.weight) setTempWeight(data.weight.toString());
        if (data.targetWeight) {
          setTempTargetWeight(data.targetWeight.toString());
          setTempMaintainMode(false);
        } else {
          setTempTargetWeight('');
          setTempMaintainMode(data.weightGoalType === 'maintain');
        }
      }
    });

    const unsubRoutine = onSnapshot(doc(db, 'users', user.uid, 'data', 'routine'), (docSnap) => {
      if (docSnap.exists()) setRoutine(docSnap.data() as Routine);
    });

    const unsubLog = onSnapshot(doc(db, 'users', user.uid, 'workout_logs', dateString), (docSnap) => {
      if (docSnap.exists()) {
        const logData = docSnap.data() as WorkoutDayLog;
        setWorkoutLog({ finished: false, exercises: {}, waterLiters: 0, ...logData });
        if (logData.finished) setIsLogging(false);
      } else {
        setWorkoutLog({ finished: false, exercises: {}, waterLiters: 0 });
      }
    });

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
      if (lwSnap.exists()) setLastWeekLog(lwSnap.data() as WorkoutDayLog);
      setLoading(false);
    };
    fetchLastWeek();

    return () => {
      unsubUser();
      unsubRoutine();
      unsubLog();
      unsubWeightLogs();
    };
  }, [dateString, lastWeekString]);

  const handleSelectAvatar = async (avatarKey: string) => {
    setSavingSettings(true);
    try {
      const user = auth.currentUser;
      if (user) await updateDoc(doc(db, 'users', user.uid), { avatarId: avatarKey });
      setProfileModalVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el avatar.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdateWaterLiters = async (newLiters: number) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'workout_logs', dateString),
        { waterLiters: newLiters },
        { merge: true }
      );
    } catch {
      // Ignorar fallo transitorio de red
    }
  };

  const handleUpdateWeightAndGoal = async () => {
    const numericWeight = parseFloat(tempWeight.replace(',', '.'));
    if (isNaN(numericWeight) || numericWeight <= 0) {
      Alert.alert('Error', 'Por favor ingresa un peso actual válido (ej. 75.5).');
      return;
    }

    const numericTarget = parseFloat(tempTargetWeight.replace(',', '.'));
    if (!tempMaintainMode && tempTargetWeight.trim() !== '' && (isNaN(numericTarget) || numericTarget <= 0)) {
      Alert.alert('Error', 'Ingresa un peso objetivo válido o activa "Mantener mi peso".');
      return;
    }

    setSavingSettings(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const timestamp = new Date().toISOString();
        const hasValidTarget =
          !tempMaintainMode &&
          tempTargetWeight.trim() !== '' &&
          !isNaN(numericTarget) &&
          numericTarget !== numericWeight;

        const newGoalType: WeightGoalType = !hasValidTarget
          ? 'maintain'
          : numericTarget < numericWeight
          ? 'lose'
          : 'gain';

        const prevTarget = userData?.targetWeight ? parseFloat(userData.targetWeight) : null;
        const targetChanged = hasValidTarget && prevTarget !== numericTarget;
        const startWeightToSave =
          targetChanged || !userData?.startWeight
            ? (userData?.weight || numericWeight).toString()
            : userData.startWeight;

        await updateDoc(doc(db, 'users', user.uid), {
          weight: numericWeight.toString(),
          startWeight: startWeightToSave,
          targetWeight: hasValidTarget ? numericTarget.toString() : null,
          weightGoalType: newGoalType,
          lastWeightUpdate: timestamp,
        });

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
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la información de peso.');
    } finally {
      setSavingSettings(false);
    }
  };

  const getExerciseStatus = (exerciseId: string): ExerciseStatusInfo => {
    const logData = workoutLog.exercises?.[exerciseId];
    if (!logData) return { status: 'pending', text: 'Toca para registrar', color: k.textMuted };
    if (logData.skipped) return { status: 'skipped', text: 'Omitido hoy', color: k.danger };
    const hasEmptyReps = (logData.reps || []).some((r: string) => r.trim() === '' || r.trim() === '0');
    if (hasEmptyReps) return { status: 'incomplete', text: 'Faltó registrar repeticiones', color: k.warning };
    return { status: 'complete', text: `✓ ${logData.sets} series registradas`, color: k.lime };
  };

  const finishWorkout = () => {
    const todayPlan = routine?.[todayName];
    if (!todayPlan) return;
    const warnings: string[] = [];
    todayPlan.exercises.forEach((ex) => {
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

  const generateSummary = (): WorkoutSummary => {
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

    routine?.[todayName]?.exercises?.forEach((ex) => {
      const cV = calculateExerciseVolume(workoutLog.exercises?.[ex.id]);
      const pV = calculateExerciseVolume(lastWeekLog.exercises?.[ex.id]);
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

  const todayPlan = routine ? routine[todayName] : null;
  const tomorrowPlan = routine ? routine[tomorrowName] : null;
  const totalExercisesCount = todayPlan?.exercises?.length || 0;
  const activeExIndex = todayPlan?.exercises?.findIndex((e) => e.id === setLoggingSession.activeExercise?.id) ?? 0;

  const prevWeightDiff =
    weightLogs.length >= 2
      ? (weightLogs[weightLogs.length - 1].weight - weightLogs[weightLogs.length - 2].weight).toFixed(1)
      : null;

  const stageAnalytics = calculateWeightStageAnalytics(userData, weightLogs, k);

  return {
    today,
    todayName,
    tomorrowName,
    userData,
    loading,
    isLogging,
    setIsLogging,
    workoutLog,
    lastWeekLog,
    isProfileModalVisible,
    setProfileModalVisible,
    tempWeight,
    setTempWeight,
    tempTargetWeight,
    setTempTargetWeight,
    tempMaintainMode,
    setTempMaintainMode,
    isWeightInputOpen,
    setIsWeightInputOpen,
    savingSettings,
    todayPlan,
    tomorrowPlan,
    totalExercisesCount,
    activeExIndex,
    prevWeightDiff,
    stageAnalytics,
    handleSelectAvatar,
    handleUpdateWaterLiters,
    handleUpdateWeightAndGoal,
    getExerciseStatus,
    finishWorkout,
    generateSummary,
    ...setLoggingSession,
  };
}
