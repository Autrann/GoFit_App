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
  onUpdateRep: (index: number, val: string) => void;
  onUpdateWeight: (index: number, val: string) => void;
  onCommitActiveSet: () => void;
}

export function useSetLoggerModal({
  visible,
  activeExercise,
  tempReps,
  tempWeights,
  activeSetIndex,
  onUpdateRep,
  onUpdateWeight,
  onCommitActiveSet,
}: UseSetLoggerModalParams) {
  const [restSeconds, setRestSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showRpeHelp, setShowRpeHelp] = useState(false);

  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [localWeightInput, setLocalWeightInput] = useState('');

  const formatDisplayWeight = useCallback(
    (kgStr?: string) => formatKgToUnit(kgStr, weightUnit),
    [weightUnit]
  );

  // Sincronizar el input visible cada vez que cambia la serie activa o la unidad (KG/LBS)
  useEffect(() => {
    setLocalWeightInput(formatDisplayWeight(tempWeights[activeSetIndex]));
  }, [activeSetIndex, weightUnit, tempWeights[activeSetIndex], visible, formatDisplayWeight]);

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
    if (!visible) setShowRpeHelp(false);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRestSeconds(120);
    setTimerRunning(false);
  };

  const toggleTimer = () => {
    Haptics.selectionAsync();
    setTimerRunning((prev) => !prev);
  };

  const stepWeightInActiveUnit = (deltaInActiveUnit: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentDisplay = parseFloat(localWeightInput) || 0;
    const nextDisplay = Math.max(0, parseFloat((currentDisplay + deltaInActiveUnit).toFixed(2)));
    const nextDisplayStr = nextDisplay.toString();
    setLocalWeightInput(nextDisplayStr);
    onUpdateWeight(activeSetIndex, convertUnitToKgString(nextDisplayStr, weightUnit));
  };

  const handleWeightTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setLocalWeightInput(cleaned);
    onUpdateWeight(activeSetIndex, convertUnitToKgString(cleaned, weightUnit));
  };

  const stepReps = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseInt(tempReps[activeSetIndex], 10) || 10;
    const next = Math.max(1, current + delta);
    onUpdateRep(activeSetIndex, next.toString());
  };

  const handleCommitSet = () => {
    setRestSeconds(120);
    setTimerRunning(true);
    onCommitActiveSet();
  };

  const completedSetsCount = tempReps.filter((r) => r && r.trim() !== '' && r.trim() !== '0').length;
  const allSetsCompleted = tempReps.length > 0 && completedSetsCount === tempReps.length;
  const quickIncrements = weightUnit === 'kg' ? [1.25, 2.5, 5] : [2.5, 5, 10];
  const mainStepDelta = weightUnit === 'kg' ? 2.5 : 5;

  return {
    restSeconds,
    timerRunning,
    showRpeHelp,
    setShowRpeHelp,
    weightUnit,
    localWeightInput,
    completedSetsCount,
    allSetsCompleted,
    quickIncrements,
    mainStepDelta,
    formatDisplayWeight,
    toggleWeightUnit,
    adjustTimer,
    resetTimer,
    toggleTimer,
    stepWeightInActiveUnit,
    handleWeightTextChange,
    stepReps,
    handleCommitSet,
  };
}
