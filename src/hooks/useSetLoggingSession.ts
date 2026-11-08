import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../config/firebase';
import { Exercise, WorkoutDayLog } from '../types';

interface UseSetLoggingSessionParams {
  dateString: string;
  workoutLog: WorkoutDayLog;
  lastWeekLog: WorkoutDayLog | null;
}

export function useSetLoggingSession({
  dateString,
  workoutLog,
  lastWeekLog,
}: UseSetLoggingSessionParams) {
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [tempSetsCount, setTempSetsCount] = useState('3');
  const [tempReps, setTempReps] = useState<string[]>([]);
  const [tempWeights, setTempWeights] = useState<string[]>([]);
  const [tempRpes, setTempRpes] = useState<string[]>([]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [savingExercise, setSavingExercise] = useState(false);

  const openExerciseModal = (exercise: Exercise) => {
    Haptics.selectionAsync();
    setActiveExercise(exercise);
    const existingData = workoutLog.exercises?.[exercise.id];
    const lastWeekEx = lastWeekLog?.exercises?.[exercise.id];

    if (existingData && !existingData.skipped) {
      const count = existingData.sets || 3;
      const savedReps = existingData.reps || Array(count).fill('');
      const savedWeights = existingData.weights || Array(count).fill('');
      setTempSetsCount(count.toString());
      setTempReps(savedReps);
      setTempWeights(savedWeights);
      setTempRpes(existingData.rpes || Array(count).fill('8.5'));

      const firstIncomplete = savedReps.findIndex((r: string) => !r || r.trim() === '' || r === '0');
      const targetIdx = firstIncomplete !== -1 ? firstIncomplete : 0;

      if (targetIdx > 0 && (!savedWeights[targetIdx] || savedWeights[targetIdx] === '')) {
        const inheritedWeights = [...savedWeights];
        inheritedWeights[targetIdx] = savedWeights[targetIdx - 1] || '';
        setTempWeights(inheritedWeights);
      }

      setActiveSetIndex(targetIdx);
    } else {
      const firstWeight = lastWeekEx?.weights?.[0] || '';
      setTempSetsCount('3');
      setTempReps(['', '', '']);
      setTempWeights([firstWeight, firstWeight, firstWeight]);
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
      const lastUsedWeight = newWeights[newWeights.length - 1] || '';
      while (newReps.length < count) {
        newReps.push('');
        newWeights.push(lastUsedWeight);
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

  const handleUpdateWeightWithCarryOver = (idx: number, val: string) => {
    const newWeights = [...tempWeights];
    newWeights[idx] = val;

    for (let nextIdx = idx + 1; nextIdx < newWeights.length; nextIdx++) {
      if (!tempReps[nextIdx] || tempReps[nextIdx].trim() === '') {
        newWeights[nextIdx] = val;
      }
    }
    setTempWeights(newWeights);
  };

  const selectSetIndexWithCarryOver = (targetIdx: number) => {
    if (targetIdx > 0 && (!tempWeights[targetIdx] || tempWeights[targetIdx] === '')) {
      const w = [...tempWeights];
      w[targetIdx] = tempWeights[targetIdx - 1] || '';
      setTempWeights(w);
    }
    setActiveSetIndex(targetIdx);
  };

  const commitActiveSet = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newReps = [...tempReps];
    const newWeights = [...tempWeights];

    if (!newReps[activeSetIndex] || newReps[activeSetIndex].trim() === '' || newReps[activeSetIndex] === '0') {
      newReps[activeSetIndex] = '10';
    }
    const currentWeightUsed = newWeights[activeSetIndex] || '0';
    newWeights[activeSetIndex] = currentWeightUsed;

    const totalSets = parseInt(tempSetsCount, 10) || newReps.length;
    const nextIdx = activeSetIndex + 1;

    if (nextIdx < totalSets) {
      if (!newReps[nextIdx] || newReps[nextIdx].trim() === '') {
        newWeights[nextIdx] = currentWeightUsed;
        newReps[nextIdx] = '';
      }
    }

    setTempReps(newReps);
    setTempWeights(newWeights);

    const user = auth.currentUser;
    if (user && activeExercise) {
      const updatedLog: WorkoutDayLog = {
        ...workoutLog,
        exercises: {
          ...workoutLog.exercises,
          [activeExercise.id]: {
            skipped: false,
            sets: totalSets,
            reps: newReps,
            weights: newWeights,
            rpes: tempRpes,
          },
        },
      };
      await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), updatedLog, { merge: true });
    }

    if (nextIdx < totalSets) {
      setActiveSetIndex(nextIdx);
    }
  };

  const saveExerciseLog = async (skipped = false) => {
    if (!activeExercise) return;
    setSavingExercise(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const finalReps = [...tempReps];
        const finalWeights = [...tempWeights];

        if (!skipped) {
          const allPreviousCompleted = finalReps
            .slice(0, activeSetIndex)
            .every((r) => r && r.trim() !== '' && r.trim() !== '0');

          if (
            allPreviousCompleted &&
            (!finalReps[activeSetIndex] || finalReps[activeSetIndex].trim() === '' || finalReps[activeSetIndex] === '0')
          ) {
            finalReps[activeSetIndex] = '10';
            if (!finalWeights[activeSetIndex] || finalWeights[activeSetIndex].trim() === '') {
              finalWeights[activeSetIndex] = finalWeights[activeSetIndex - 1] || '40';
            }
          }
        }

        const exerciseData = skipped
          ? { skipped: true }
          : {
              skipped: false,
              sets: parseInt(tempSetsCount, 10) || finalReps.length,
              reps: finalReps,
              weights: finalWeights,
              rpes: tempRpes,
            };

        const updatedLog: WorkoutDayLog = {
          ...workoutLog,
          exercises: { ...workoutLog.exercises, [activeExercise.id]: exerciseData },
        };

        await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), updatedLog, { merge: true });
        setActiveExercise(null);
      }
    } finally {
      setSavingExercise(false);
    }
  };

  return {
    activeExercise,
    tempSetsCount,
    tempReps,
    setTempReps,
    tempWeights,
    tempRpes,
    setTempRpes,
    activeSetIndex,
    setActiveSetIndex,
    savingExercise,
    openExerciseModal,
    handleSetsCountChange,
    handleUpdateWeightWithCarryOver,
    selectSetIndexWithCarryOver,
    commitActiveSet,
    saveExerciseLog,
  };
}
