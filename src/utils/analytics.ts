import { ThemeColors } from '../theme/colors';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export type WeightEntry = {
  date: string;
  weight: number;
  updatedAt?: string;
};

export type SetEntry = {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: string;
};

export type ExerciseSessionEntry = {
  date: string;
  shortDate: string;
  fullDateLabel: string;
  maxWeight: number;
  bestRepsAtMax: number;
  setsDetail: SetEntry[];
};

export type OverloadComparison = {
  status: 'up_weight' | 'up_reps' | 'same' | 'down' | 'first' | 'none';
  badgeText: string;
  deltaWeight: number;
  deltaReps: number;
  latest?: ExerciseSessionEntry;
  previous?: ExerciseSessionEntry;
  prWeight: number;
  prReps: number;
};

export const formatReadableDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const dayNum = parseInt(parts[2], 10);
  return `${dayNum} ${MONTHS_SHORT[monthIdx] || ''}`;
};

// 1. Analítica visual de la etapa física (Déficit, Volumen o Mantenimiento)
export const calculateWeightStageAnalytics = (
  userData: any,
  weightLogs: WeightEntry[],
  k: ThemeColors
) => {
  const currW = userData?.weight ? parseFloat(userData.weight) : null;
  const targW = userData?.targetWeight ? parseFloat(userData.targetWeight) : null;
  const firstLogW = weightLogs.length > 0 ? weightLogs[0].weight : currW;
  const startW = userData?.startWeight ? parseFloat(userData.startWeight) : firstLogW;

  if (!currW) {
    return {
      stageTitle: 'SIN CALIBRAR',
      stageBadgeColor: k.textMuted,
      icon: 'help-circle-outline' as const,
      leftLabel: 'Sin peso inicial',
      rightLabel: '0%',
      remainingText: 'Presiona "+ Actualizar" para registrar tu peso y tu meta.',
      progressPct: 0,
    };
  }

  if (!targW || userData?.weightGoalType === 'maintain') {
    const baseW = startW || currW;
    const diffFromBase = Math.abs(currW - baseW);
    const isStable = diffFromBase <= 1.5;

    return {
      stageTitle: 'ETAPA: MANTENIMIENTO / RECOMPOSICIÓN',
      stageBadgeColor: k.cyan,
      icon: 'shield-checkmark-outline' as const,
      leftLabel: `Rango Base: ${(baseW - 1.0).toFixed(1)} - ${(baseW + 1.0).toFixed(1)} kg`,
      rightLabel: isStable ? '100% ESTABLE' : `±${diffFromBase.toFixed(1)} kg`,
      remainingText: isStable
        ? 'Te mantienes firme en tu zona de recomposición corporal.'
        : `Variación de ${diffFromBase.toFixed(1)} kg respecto a tu peso base (${baseW} kg).`,
      progressPct: isStable ? 100 : Math.max(40, 100 - diffFromBase * 15),
    };
  }

  const isCutting = targW < (startW && startW !== targW ? startW : currW);

  if (isCutting) {
    const effectiveStart = startW && startW > targW ? startW : Math.max(currW, targW + 0.1);
    const totalToLose = effectiveStart - targW;
    const lostSoFar = effectiveStart - currW;
    const rawPct = totalToLose > 0 ? (lostSoFar / totalToLose) * 100 : 0;
    const clampedPct = Math.min(100, Math.max(5, Math.round(rawPct)));
    const remaining = parseFloat((currW - targW).toFixed(1));

    return {
      stageTitle: 'ETAPA: DÉFICIT / DEFINICIÓN',
      stageBadgeColor: k.lime,
      icon: 'trending-down' as const,
      leftLabel: `Meta Objetivo: ${targW.toFixed(1)} kg`,
      rightLabel: remaining <= 0 ? '¡META LOGRADA! 🏆' : `${clampedPct}% Completado`,
      remainingText:
        remaining <= 0
          ? `¡Alcanzaste tu meta de ${targW.toFixed(1)} kg! Puedes fijar un nuevo objetivo o mantenerte.`
          : `Te faltan ${remaining} kg para alcanzar tu meta (Inicio: ${effectiveStart.toFixed(1)} kg).`,
      progressPct: remaining <= 0 ? 100 : clampedPct,
    };
  } else {
    const effectiveStart = startW && startW < targW ? startW : Math.min(currW, targW - 0.1);
    const totalToGain = targW - effectiveStart;
    const gainedSoFar = currW - effectiveStart;
    const rawPct = totalToGain > 0 ? (gainedSoFar / totalToGain) * 100 : 0;
    const clampedPct = Math.min(100, Math.max(5, Math.round(rawPct)));
    const remaining = parseFloat((targW - currW).toFixed(1));

    return {
      stageTitle: 'ETAPA: VOLUMEN / HIPERTROFIA',
      stageBadgeColor: k.cyan,
      icon: 'trending-up' as const,
      leftLabel: `Meta Objetivo: ${targW.toFixed(1)} kg`,
      rightLabel: remaining <= 0 ? '¡META LOGRADA! 🏆' : `${clampedPct}% Completado`,
      remainingText:
        remaining <= 0
          ? `¡Superaste tu meta de volumen de ${targW.toFixed(1)} kg!`
          : `Te faltan +${remaining} kg para tu objetivo de volumen (Inicio: ${effectiveStart.toFixed(1)} kg).`,
      progressPct: remaining <= 0 ? 100 : clampedPct,
    };
  }
};

// 2. Construcción de datos reales para la gráfica de peso corporal
export const buildRealWeightChartData = (
  weightHistory: WeightEntry[],
  userData: any,
  timeframe: '1S' | '1M' | '3M' | '1A'
) => {
  const currentWeight = userData?.weight ? parseFloat(userData.weight) : null;

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

  const daysMap = { '1S': 7, '1M': 30, '3M': 90, '1A': 365 };
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysMap[timeframe]);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  let filtered = sourceLogs.filter((entry) => entry.date >= cutoffStr);
  if (filtered.length === 0) {
    filtered = sourceLogs.slice(-6);
  }

  const firstWeight = filtered[0].weight;
  const latestWeight = filtered[filtered.length - 1].weight;
  const diffValue = parseFloat((latestWeight - firstWeight).toFixed(1));

  let chartEntries = filtered;
  if (filtered.length > 6) {
    const step = (filtered.length - 1) / 5;
    chartEntries = [0, 1, 2, 3, 4, 5].map((i) => filtered[Math.round(i * step)]);
  }

  if (chartEntries.length === 1) {
    const single = chartEntries[0];
    return {
      hasData: true,
      labels: ['Inicio', formatReadableDate(single.date)],
      data: [single.weight, single.weight],
      diffValue: 0,
      count: sourceLogs.length,
    };
  }

  return {
    hasData: true,
    labels: chartEntries.map((e) => formatReadableDate(e.date)),
    data: chartEntries.map((e) => e.weight),
    diffValue,
    count: filtered.length,
  };
};

// 3. Extrae el historial detallado (serie por serie) de un ejercicio
export const extractExerciseHistory = (exId: string, allWorkoutLogs: any[]): ExerciseSessionEntry[] => {
  const history: ExerciseSessionEntry[] = [];

  allWorkoutLogs.forEach((log) => {
    const exData = log.exercises?.[exId];
    if (exData && !exData.skipped) {
      let maxW = 0;
      let bestRepsAtMax = 0;
      const setsDetail: SetEntry[] = [];

      const setsCount = exData.sets || exData.reps?.length || 0;
      for (let i = 0; i < setsCount; i++) {
        const w = parseFloat(exData.weights?.[i]) || 0;
        const r = parseInt(exData.reps?.[i]) || 0;
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

      if (setsDetail.length > 0) {
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

// 4. Analiza la sobrecarga progresiva entre las últimas sesiones (enfoque en Peso y Reps)
export const analyzeExerciseOverload = (exId: string, allWorkoutLogs: any[]): OverloadComparison => {
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

// 5. Utilidad para el resumen del día en ProfileScreen
export const calculateExerciseVolume = (exLog: any) => {
  if (!exLog || exLog.skipped) return 0;
  let vol = 0;
  for (let i = 0; i < exLog.sets; i++) {
    vol += (parseInt(exLog.reps[i]) || 0) * (parseFloat(exLog.weights?.[i]) || 1);
  }
  return vol;
};