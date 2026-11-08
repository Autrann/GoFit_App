import {
  SetEntry,
  ExerciseSessionEntry,
  OverloadComparison,
  WorkoutDayLog,
  WorkoutExerciseLog,
} from '../types';
import { formatReadableDate } from './weightAnalytics';

// Extrae el historial detallado (serie por serie) de un ejercicio
export const extractExerciseHistory = (
  exId: string,
  allWorkoutLogs: WorkoutDayLog[]
): ExerciseSessionEntry[] => {
  const history: ExerciseSessionEntry[] = [];

  allWorkoutLogs.forEach((log) => {
    const exData = log.exercises?.[exId];
    if (exData && !exData.skipped) {
      let maxW = 0;
      let bestRepsAtMax = 0;
      const setsDetail: SetEntry[] = [];

      const setsCount = exData.sets || exData.reps?.length || 0;
      for (let i = 0; i < setsCount; i++) {
        const w = parseFloat(exData.weights?.[i] || '0') || 0;
        const r = parseInt(exData.reps?.[i] || '0', 10) || 0;
        if (r > 0) {
          setsDetail.push({
            setNumber: i + 1,
            weight: w,
            reps: r,
            rpe: exData.rpes?.[i] || '8.5',
          });
          if (w > maxW || (w === maxW && r > bestRepsAtMax)) {
            maxW = w;
            bestRepsAtMax = r;
          }
        }
      }

      if (setsDetail.length > 0 && log.date) {
        const d = new Date(log.date + 'T12:00:00Z');
        history.push({
          date: log.date,
          shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
          fullDateLabel: formatReadableDate(log.date),
          maxWeight: maxW,
          bestRepsAtMax,
          setsDetail,
        });
      }
    }
  });

  return history;
};

// Analiza la sobrecarga progresiva entre las últimas sesiones (enfoque en Peso y Reps)
export const analyzeExerciseOverload = (
  exId: string,
  allWorkoutLogs: WorkoutDayLog[]
): OverloadComparison => {
  const history = extractExerciseHistory(exId, allWorkoutLogs);

  if (history.length === 0) {
    return {
      status: 'none',
      badgeText: 'SIN REGISTROS AÚN',
      deltaWeight: 0,
      deltaReps: 0,
      prWeight: 0,
      prReps: 0,
    };
  }

  let prWeight = 0;
  let prReps = 0;
  history.forEach((h) => {
    if (h.maxWeight > prWeight || (h.maxWeight === prWeight && h.bestRepsAtMax > prReps)) {
      prWeight = h.maxWeight;
      prReps = h.bestRepsAtMax;
    }
  });

  const latest = history[history.length - 1];

  if (history.length === 1) {
    return {
      status: 'first',
      badgeText: '1ª SESIÓN REGISTRADA',
      deltaWeight: 0,
      deltaReps: 0,
      latest,
      prWeight,
      prReps,
    };
  }

  const previous = history[history.length - 2];
  const deltaWeight = parseFloat((latest.maxWeight - previous.maxWeight).toFixed(1));
  const deltaReps = latest.bestRepsAtMax - previous.bestRepsAtMax;

  if (deltaWeight > 0) {
    return {
      status: 'up_weight',
      badgeText: `🔥 +${deltaWeight} KG VS ANTERIOR`,
      deltaWeight,
      deltaReps,
      latest,
      previous,
      prWeight,
      prReps,
    };
  }

  if (deltaWeight === 0 && deltaReps > 0) {
    return {
      status: 'up_reps',
      badgeText: `⚡ +${deltaReps} REPS CON ${latest.maxWeight} KG`,
      deltaWeight: 0,
      deltaReps,
      latest,
      previous,
      prWeight,
      prReps,
    };
  }

  if (deltaWeight === 0 && deltaReps === 0) {
    return {
      status: 'same',
      badgeText: '═ MANTUVISTE MARCA',
      deltaWeight: 0,
      deltaReps: 0,
      latest,
      previous,
      prWeight,
      prReps,
    };
  }

  return {
    status: 'down',
    badgeText:
      deltaWeight < 0
        ? `${deltaWeight} KG VS ANTERIOR`
        : `${deltaReps} REPS VS ANTERIOR`,
    deltaWeight,
    deltaReps,
    latest,
    previous,
    prWeight,
    prReps,
  };
};

// Utilidad para el resumen del día en ProfileScreen
export const calculateExerciseVolume = (exLog?: WorkoutExerciseLog | null): number => {
  if (!exLog || exLog.skipped) return 0;
  let vol = 0;
  const sets = exLog.sets || 0;
  for (let i = 0; i < sets; i++) {
    vol += (parseInt(exLog.reps?.[i] || '0', 10) || 0) * (parseFloat(exLog.weights?.[i] || '1') || 1);
  }
  return vol;
};
