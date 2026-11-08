import { useEffect, useState } from 'react';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import catalog from '../assets/data/catalogo_app.json';
import { DAYS_FROM_SUNDAY, DAYS_SHORT, DAYS_LETTER } from '../constants/appConstants';
import {
  buildRealWeightChartData,
  extractExerciseHistory,
} from '../utils/analytics';
import {
  UserData,
  Routine,
  WeightEntry,
  WeeklyDayStatus,
  TimeframeOption,
  OverloadViewMode,
  Exercise,
  WorkoutDayLog,
  CustomPRItem,
} from '../types';

export function useStatsData() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [routineData, setRoutineData] = useState<Routine | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const [weeklyData, setWeeklyData] = useState<WeeklyDayStatus[]>([]);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('3M');

  const [overloadViewMode, setOverloadViewMode] = useState<OverloadViewMode>('by_exercise');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('Todos');

  const [routineExercises, setRoutineExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [isExerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<WorkoutDayLog[]>([]);

  const [isPRModalVisible, setPRModalVisible] = useState(false);
  const [prInitialExercise, setPrInitialExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data() as UserData);
    });

    const unsubWeight = onSnapshot(collection(db, 'users', user.uid, 'weight_logs'), (snap) => {
      const entries: WeightEntry[] = snap.docs
        .map((d) => {
          const data = d.data();
          return {
            date: d.id,
            weight: parseFloat(data.weight) || 0,
            updatedAt: data.updatedAt as string | undefined,
          };
        })
        .filter((e) => e.weight > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

      setWeightHistory(entries);
    });

    const unsubRoutine = onSnapshot(doc(db, 'users', user.uid, 'data', 'routine'), (routineSnap) => {
      const uniqueExercises = new Map<string, Exercise>();
      if (routineSnap.exists()) {
        const rData = routineSnap.data() as Routine;
        setRoutineData(rData);
        Object.values(rData).forEach((day) => {
          if (day.exercises && !day.isRest) {
            day.exercises.forEach((ex) => uniqueExercises.set(ex.id, ex));
          }
        });
      }
      const arr = Array.from(uniqueExercises.values());
      setRoutineExercises(arr);
      setSelectedExerciseId((prev) => prev || (arr.length > 0 ? arr[0].id : null));
    });

    const unsubLogs = onSnapshot(collection(db, 'users', user.uid, 'workout_logs'), (logsSnap) => {
      const logs: WorkoutDayLog[] = logsSnap.docs
        .map((d) => ({ date: d.id, ...(d.data() as Omit<WorkoutDayLog, 'date'>) }))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      setAllWorkoutLogs(logs);

      const today = new Date();
      const tempWeekly: WeeklyDayStatus[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const log = logs.find((l) => l.date === dateStr);

        let hasTrained = false;
        if (log?.exercises) {
          Object.values(log.exercises).forEach((ex) => {
            if (!ex.skipped && ex.reps?.some((r) => parseInt(r, 10) > 0)) {
              hasTrained = true;
            }
          });
        }

        tempWeekly.push({
          date: dateStr,
          dayName: i === 0 ? 'Hoy' : DAYS_SHORT[d.getDay()],
          fullDayName: DAYS_FROM_SUNDAY[d.getDay()],
          shortLetter: DAYS_LETTER[d.getDay()],
          trained: Boolean(log?.finished || hasTrained),
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

  const realWeightStats = buildRealWeightChartData(weightHistory, userData, timeframe);
  const latestWeightVal =
    weightHistory.length > 0
      ? weightHistory[weightHistory.length - 1].weight
      : userData?.weight
      ? parseFloat(userData.weight)
      : null;

  const targetWeightVal = userData?.targetWeight ? parseFloat(userData.targetWeight) : null;
  const muscleCategories = [
    'Todos',
    ...Array.from(new Set(routineExercises.map((e) => e.muscle).filter(Boolean))),
  ];
  const filteredExercises =
    selectedMuscleFilter === 'Todos'
      ? routineExercises
      : routineExercises.filter((e) => e.muscle === selectedMuscleFilter);

  const selectedExHistory = selectedExerciseId
    ? extractExerciseHistory(selectedExerciseId, allWorkoutLogs)
    : [];

  const pastWorkoutDays = [...allWorkoutLogs]
    .filter((log) => {
      if (!log.exercises) return false;
      return Object.values(log.exercises).some(
        (ex) => !ex.skipped && ex.reps?.some((r) => parseInt(r, 10) > 0)
      );
    })
    .reverse()
    .slice(0, 12);

  const customPRsMap: Record<string, CustomPRItem> = userData?.customPRs || {};
  const customPRsList = Object.values(customPRsMap).sort((a, b) => b.weight - a.weight);

  const getExerciseNameById = (exId: string): string => {
    const fromRoutine = routineExercises.find((e) => e.id === exId);
    if (fromRoutine) return fromRoutine.name;
    const fromCatalog = (catalog as Exercise[]).find((c) => c.id === exId);
    return fromCatalog ? fromCatalog.name : exId;
  };

  return {
    loading,
    userData,
    routineData,
    weightHistory,
    weeklyData,
    timeframe,
    setTimeframe,
    overloadViewMode,
    setOverloadViewMode,
    selectedMuscleFilter,
    setSelectedMuscleFilter,
    routineExercises,
    selectedExerciseId,
    setSelectedExerciseId,
    isExerciseModalVisible,
    setExerciseModalVisible,
    allWorkoutLogs,
    isPRModalVisible,
    setPRModalVisible,
    prInitialExercise,
    setPrInitialExercise,
    realWeightStats,
    latestWeightVal,
    targetWeightVal,
    muscleCategories,
    filteredExercises,
    selectedExHistory,
    pastWorkoutDays,
    customPRsMap,
    customPRsList,
    getExerciseNameById,
  };
}
