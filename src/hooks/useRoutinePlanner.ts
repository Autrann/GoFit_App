import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../config/firebase';
import {
  DAYS_FROM_MONDAY,
  defaultDayPlan,
  initialRoutine,
} from '../constants/appConstants';
import { Exercise, DayPlan, Routine, UserData } from '../types';

export function useRoutinePlanner() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [activeDay, setActiveDay] = useState<string>('Lunes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isCatalogVisible, setCatalogVisible] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [isSuggestionVisible, setSuggestionVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data() as UserData);
    });

    const fetchRoutine = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'data', 'routine'));
        if (docSnap.exists()) {
          setRoutine({ ...initialRoutine, ...(docSnap.data() as Routine) });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoutine();
    return () => unsubUser();
  }, []);

  const handleSaveRoutine = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) await setDoc(doc(db, 'users', user.uid, 'data', 'routine'), routine);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromDay = async (sourceDay: string) => {
    const sourcePlan = routine[sourceDay];
    if (!sourcePlan) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const clonedPlan: DayPlan = {
      isRest: false,
      title: sourcePlan.title || `Copia de ${sourceDay}`,
      muscles: [...(sourcePlan.muscles || [])],
      cardio: !!sourcePlan.cardio,
      exercises: [...(sourcePlan.exercises || [])],
    };

    const updatedRoutine: Routine = {
      ...routine,
      [activeDay]: clonedPlan,
    };

    setRoutine(updatedRoutine);

    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'data', 'routine'), updatedRoutine);
      }
    } catch {
      Alert.alert('Error', 'Se copió en pantalla pero hubo un problema al sincronizar.');
    }
  };

  const updateActiveDay = (updates: Partial<DayPlan>) => {
    setRoutine((prev) => ({ ...prev, [activeDay]: { ...prev[activeDay], ...updates } }));
  };

  const toggleMuscle = (muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = routine[activeDay].muscles || [];
    const next = current.includes(muscle) ? current.filter((m) => m !== muscle) : [...current, muscle];
    updateActiveDay({ muscles: next });
  };

  const handleAddExercise = () => {
    if (!previewExercise) return;
    const current = routine[activeDay].exercises || [];
    if (!current.find((e) => e.id === previewExercise.id)) {
      updateActiveDay({ exercises: [...current, previewExercise] });
    }
    setPreviewExercise(null);
    setCatalogVisible(false);
  };

  const handleAddCustomExerciseToDay = async (newExercise: Exercise) => {
    const currentExercises = routine[activeDay].exercises || [];
    const currentMuscles = routine[activeDay].muscles || [];

    const updatedMuscles = currentMuscles.includes(newExercise.muscle)
      ? currentMuscles
      : [...currentMuscles, newExercise.muscle];

    const updatedDayPlan: DayPlan = {
      ...routine[activeDay],
      isRest: false,
      muscles: updatedMuscles,
      exercises: [...currentExercises, newExercise],
    };

    const updatedRoutine: Routine = {
      ...routine,
      [activeDay]: updatedDayPlan,
    };

    setRoutine(updatedRoutine);

    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'data', 'routine'), updatedRoutine);
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const current = routine[activeDay].exercises || [];
    updateActiveDay({ exercises: current.filter((e) => e.id !== exerciseId) });
  };

  const currentPlan = routine[activeDay] || defaultDayPlan;
  const activeDaysCount = DAYS_FROM_MONDAY.filter(
    (d) => !routine[d]?.isRest && (routine[d]?.exercises?.length || 0) > 0
  ).length;

  const daysWithInfo = DAYS_FROM_MONDAY.filter(
    (d) =>
      d !== activeDay &&
      !routine[d]?.isRest &&
      ((routine[d]?.exercises?.length || 0) > 0 ||
        (routine[d]?.muscles?.length || 0) > 0 ||
        !!routine[d]?.title)
  );

  const isCurrentDayEmpty =
    !currentPlan.isRest && (!currentPlan.exercises || currentPlan.exercises.length === 0);

  const userCustomExercises: Exercise[] = userData?.customExercises || [];

  return {
    userData,
    routine,
    activeDay,
    setActiveDay,
    loading,
    saving,
    isEditing,
    setIsEditing,
    isCatalogVisible,
    setCatalogVisible,
    previewExercise,
    setPreviewExercise,
    isSuggestionVisible,
    setSuggestionVisible,
    currentPlan,
    activeDaysCount,
    daysWithInfo,
    isCurrentDayEmpty,
    userCustomExercises,
    handleSaveRoutine,
    handleCopyFromDay,
    updateActiveDay,
    toggleMuscle,
    handleAddExercise,
    handleAddCustomExerciseToDay,
    handleRemoveExercise,
  };
}
