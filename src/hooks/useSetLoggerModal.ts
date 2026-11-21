import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Exercise, WeightUnit } from '../types';
import { formatKgToUnit, convertUnitToKgString } from '../utils/weightConversion';

interface UseSetLoggerModalParams {
  visible: boolean;
  activeExercise: Exercise | null;
  tempReps: string[];
  tempWeights: string[];
  activeSetIndex: number;
  onSelectSetIndex: (index: number) => void;
  onUpdateRep: (index: number, val: string) => void;
  onUpdateWeight: (index: number, val: string) => void;
  onCommitActiveSet: (targetIndex?: number) => void;
}

export function useSetLoggerModal({
  visible,
  activeExercise,
  tempReps,
  tempWeights,
  activeSetIndex,
  onSelectSetIndex,
  onUpdateRep,
  onUpdateWeight,
  onCommitActiveSet,
}: UseSetLoggerModalParams) {
  const [restSeconds, setRestSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showRpePicker, setShowRpePicker] = useState(false);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [localWeights, setLocalWeights] = useState<string[]>([]);

  const formatDisplayWeight = useCallback(
    (kgStr?: string) => formatKgToUnit(kgStr, weightUnit),
    [weightUnit]
  );

  // Sincronizar los inputs locales cuando cambian las series, el ejercicio o la unidad (KG/LBS)
  useEffect(() => {
    setLocalWeights((prev) =>
      tempWeights.map((kgVal, idx) => {
        const formatted = formatDisplayWeight(kgVal);
        const currentLocal = prev[idx];
        // Preservar punto decimal mientras el usuario escribe en la serie activa
        if (
          currentLocal !== undefined &&
          currentLocal.endsWith('.') &&
          parseFloat(currentLocal) === parseFloat(formatted)
        ) {
          return currentLocal;
        }
        return formatted;
      })
    );
  }, [tempWeights, weightUnit, visible, formatDisplayWeight]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (visible && timerRunning && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds((prev) => prev - 1), 1000);
    } else if (restSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, timerRunning, restSeconds]);

  useEffect(() => {
    if (!visible) {
      setShowRpePicker(false);
      setTimerRunning(false);
    }
  }, [visible, activeExercise]);

  const toggleWeightUnit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeightUnit((prev) => (prev === 'kg' ? 'lbs' : 'kg'));
  };

  const adjustTimer = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestSeconds((prev) => Math.max(0, prev + delta));
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestSeconds(120);
    setTimerRunning(false);
  };

  const toggleTimer = () => {
    Haptics.selectionAsync();
    if (!timerRunning && restSeconds === 0) {
      setRestSeconds(120);
    }
    setTimerRunning((prev) => !prev);
  };

  const handleWeightTextChangeForSet = (setIdx: number, text: string) => {
    const cleaned = text.replace(',', '.').replace(/[^0-9.]/g, '');
    setLocalWeights((prev) => {
      const next = [...prev];
      next[setIdx] = cleaned;
      for (let i = setIdx + 1; i < next.length; i++) {
        if (!tempReps[i] || tempReps[i].trim() === '') {
          next[i] = cleaned;
        }
      }
      return next;
    });
    onUpdateWeight(setIdx, convertUnitToKgString(cleaned, weightUnit));
  };

  const stepWeightForSet = (setIdx: number, deltaInActiveUnit: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentDisplay = parseFloat(localWeights[setIdx] || '0') || 0;
    const nextDisplay = Math.max(0, parseFloat((currentDisplay + deltaInActiveUnit).toFixed(2)));
    const nextDisplayStr = nextDisplay.toString();
    handleWeightTextChangeForSet(setIdx, nextDisplayStr);
  };

  const stepRepsForSet = (setIdx: number, delta: number, fallbackRep = 10) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseInt(tempReps[setIdx], 10) || fallbackRep;
    const next = Math.max(1, current + delta);
    onUpdateRep(setIdx, next.toString());
  };

  const handleToggleOrCommitSet = (setIdx: number) => {
    const isAlreadyCompleted = Boolean(
      tempReps[setIdx] && tempReps[setIdx].trim() !== '' && tempReps[setIdx] !== '0'
    );

    if (isAlreadyCompleted && setIdx !== activeSetIndex) {
      // Desmarcar serie ya completada si la vuelve a tocar
      onCommitActiveSet(setIdx);
      return;
    }

    if (isAlreadyCompleted && setIdx === activeSetIndex) {
      // Si ya tenía reps escritas manualmente pero toca el check para confirmar y avanzar
      const nextIncomplete = tempReps.findIndex((r, i) => i !== setIdx && (!r || r.trim() === '' || r === '0'));
      setRestSeconds(120);
      setTimerRunning(true);
      if (nextIncomplete !== -1) {
        onSelectSetIndex(nextIncomplete);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    setRestSeconds(120);
    setTimerRunning(true);
    onCommitActiveSet(setIdx);
  };

  const completedSetsCount = tempReps.filter((r) => r && r.trim() !== '' && r.trim() !== '0').length;
  const allSetsCompleted = tempReps.length > 0 && completedSetsCount === tempReps.length;
  const mainStepDelta = weightUnit === 'kg' ? 2.5 : 5;

  return {
    restSeconds,
    timerRunning,
    showRpePicker,
    setShowRpePicker,
    weightUnit,
    localWeights,
    completedSetsCount,
    allSetsCompleted,
    mainStepDelta,
    formatDisplayWeight,
    toggleWeightUnit,
    adjustTimer,
    resetTimer,
    toggleTimer,
    handleWeightTextChangeForSet,
    stepWeightForSet,
    stepRepsForSet,
    handleToggleOrCommitSet,
  };
}
