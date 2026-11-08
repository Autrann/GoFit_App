import { Ionicons } from '@expo/vector-icons';

export type WeightGoalType = 'maintain' | 'lose' | 'gain';

export type TimeframeOption = '1S' | '1M' | '3M' | '1A';

export type OverloadViewMode = 'by_exercise' | 'by_day';

export type WeightUnit = 'kg' | 'lbs';

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  image: string;
  instructions?: string[];
  muscleImage?: string;
}

export interface DayPlan {
  isRest: boolean;
  title: string;
  muscles: string[];
  cardio: boolean;
  exercises: Exercise[];
}

export type Routine = Record<string, DayPlan>;

export interface CustomPRItem {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  weight: number;
  reps: number;
  date: string;
}

export interface UserData {
  name?: string;
  email?: string;
  weight?: string;
  startWeight?: string;
  targetWeight?: string | null;
  weightGoalType?: WeightGoalType;
  lastWeightUpdate?: string;
  streak?: number;
  lastWorkoutDate?: string;
  createdAt?: string;
  avatarId?: string;
  customExercises?: Exercise[];
  customPRs?: Record<string, CustomPRItem>;
}

export interface WorkoutExerciseLog {
  skipped?: boolean;
  sets?: number;
  reps?: string[];
  weights?: string[];
  rpes?: string[];
}

export interface WorkoutDayLog {
  date?: string;
  finished?: boolean;
  waterLiters?: number;
  exercises?: Record<string, WorkoutExerciseLog>;
}

export interface WeightEntry {
  date: string;
  weight: number;
  updatedAt?: string;
}

export interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: string;
}

export interface ExerciseSessionEntry {
  date: string;
  shortDate: string;
  fullDateLabel: string;
  maxWeight: number;
  bestRepsAtMax: number;
  setsDetail: SetEntry[];
}

export interface OverloadComparison {
  status: 'up_weight' | 'up_reps' | 'same' | 'down' | 'first' | 'none';
  badgeText: string;
  deltaWeight: number;
  deltaReps: number;
  latest?: ExerciseSessionEntry;
  previous?: ExerciseSessionEntry;
  prWeight: number;
  prReps: number;
}

export interface WeightStageAnalytics {
  stageTitle: string;
  stageBadgeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  leftLabel: string;
  rightLabel: string;
  remainingText: string;
  progressPct: number;
}

export interface WeightChartData {
  hasData: boolean;
  labels: string[];
  data: number[];
  diffValue: number;
  count: number;
}

export interface WeeklyDayStatus {
  date: string;
  dayName: string;
  fullDayName: string;
  shortLetter: string;
  trained: boolean;
}

export interface ExerciseStatusInfo {
  status: 'pending' | 'skipped' | 'incomplete' | 'complete';
  text: string;
  color: string;
}

export interface WorkoutSummary {
  title: string;
  subtitle: string;
  improved: string[];
  decreased: string[];
}

export type MainTabParamList = {
  Estadísticas: undefined;
  Perfil: undefined;
  Rutina: undefined;
};
