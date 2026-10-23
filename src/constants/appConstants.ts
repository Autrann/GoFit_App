import { imageMap } from '../assets/imgs/imageMap';

export const DAYS_FROM_SUNDAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAYS_FROM_MONDAY = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAYS_LETTER = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

export const MUSCLE_GROUPS = ['Pecho', 'Espalda', 'Hombro', 'Tríceps', 'Bíceps', 'Antebrazo', 'Pierna', 'Glúteo', 'Abdomen'];

export const muscleToImageKey: Record<string, keyof typeof imageMap> = {
  'Pecho': 'pectoralis-major.webp',
  'Espalda': 'trapezius.webp',
  'Hombro': 'lateral-deltoid.webp',
  'Tríceps': 'triceps-brachii.webp',
  'Bíceps': 'biceps-brachii.webp',
  'Antebrazo': 'forearm-flexors.webp',
  'Pierna': 'quadriceps.webp',
  'Glúteo': 'gluteus-maximus.webp',
  'Abdomen': 'rectus-abdominis.webp'
};

export const profileAvatars: Record<string, any> = {
  'avatar1': require('../assets/profiles/lion.avif'),
  'avatar2': require('../assets/profiles/zebra.avif'),
};

export const RPE_OPTIONS = [
  { val: '7', label: '7.0 • 3 en reserva' },
  { val: '7.5', label: '7.5 • 2-3 en reserva' },
  { val: '8', label: '8.0 • 2 en reserva' },
  { val: '8.5', label: '8.5 • 1.5 en reserva' },
  { val: '9', label: '9.0 • 1 en reserva' },
  { val: '9.5', label: '9.5 • Tal vez 1' },
  { val: '10', label: '10 • Fallo muscular' },
];

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  image: string;
  instructions?: string[];
  muscleImage?: string;
};

export type DayPlan = {
  isRest: boolean;
  title: string;
  muscles: string[];
  cardio: boolean;
  exercises: Exercise[];
};

export type Routine = { [key: string]: DayPlan };

export const defaultDayPlan: DayPlan = {
  isRest: false,
  title: '',
  muscles: [],
  cardio: false,
  exercises: [],
};

export const initialRoutine: Routine = DAYS_FROM_MONDAY.reduce(
  (acc, day) => ({ ...acc, [day]: { ...defaultDayPlan } }),
  {} as Routine
);

export const getFirstName = (fullName?: string | null) =>
  fullName ? fullName.split(' ')[0] : 'Atleta';