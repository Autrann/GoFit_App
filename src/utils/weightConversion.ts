import { KG_TO_LBS } from '../constants/appConstants';
import { WeightUnit } from '../types';

export const formatKgToUnit = (kgStr: string | undefined, weightUnit: WeightUnit): string => {
  if (!kgStr || kgStr.trim() === '') return '';
  const numKg = parseFloat(kgStr);
  if (isNaN(numKg)) return '';
  if (weightUnit === 'kg') return Number(numKg.toFixed(2)).toString();
  return (Math.round(numKg * KG_TO_LBS * 2) / 2).toString();
};

export const convertUnitToKgString = (valStr: string, unit: WeightUnit): string => {
  if (!valStr || valStr.trim() === '') return '';
  const num = parseFloat(valStr);
  if (isNaN(num)) return '';
  if (unit === 'kg') return valStr;
  return (num / KG_TO_LBS).toFixed(2);
};

export const formatSecondsToMMSS = (sec: number): string => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};
