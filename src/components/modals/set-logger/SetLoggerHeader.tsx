import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { Exercise, WorkoutExerciseLog, WeightUnit } from '../../../types';

interface SetLoggerHeaderProps {
  activeExercise: Exercise | null;
  activeExIndex: number;
  totalExercisesCount: number;
  routineTitle?: string;
  prevExData?: WorkoutExerciseLog | null;
  weightUnit: WeightUnit;
  formatDisplayWeight: (kgStr?: string) => string;
  onToggleWeightUnit: () => void;
  onClose: () => void;
}

export default function SetLoggerHeader({
  activeExercise,
  activeExIndex,
  totalExercisesCount,
  routineTitle,
  prevExData,
  weightUnit,
  formatDisplayWeight,
  onToggleWeightUnit,
  onClose,
}: SetLoggerHeaderProps) {
  const { colors: k } = useTheme();
  const hasPrev = Boolean(prevExData?.weights?.[0]);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.metaRow}>
          <View style={[styles.counterPill, { backgroundColor: k.surfaceHighest }]}>
            <Text style={[styles.counterText, { color: k.cyan }]}>
              {activeExIndex + 1} / {totalExercisesCount || 1}
            </Text>
          </View>
          <Text style={[styles.muscleText, { color: k.textMuted }]}>
            {activeExercise?.muscle || routineTitle}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.unitToggleBtn,
              {
                backgroundColor: k.surfaceHighest,
                borderColor: weightUnit === 'lbs' ? k.cyan : k.outline,
              },
            ]}
            onPress={onToggleWeightUnit}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-horizontal" size={13} color={k.cyan} />
            <Text style={[styles.unitToggleText, { color: k.textMain }]}>
              {weightUnit.toUpperCase()}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: k.surfaceHighest }]}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={k.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.title, { color: k.textMain }]} numberOfLines={2}>
        {activeExercise?.name}
      </Text>

      {hasPrev && (
        <View style={styles.prevRow}>
          <Ionicons name="time-outline" size={13} color={k.textMuted} />
          <Text style={[styles.prevText, { color: k.textMuted }]}>
            Última vez:{' '}
            <Text style={{ fontWeight: '700', color: k.textMain }}>
              {formatDisplayWeight(prevExData?.weights?.[0])} {weightUnit} × {prevExData?.reps?.[0] || 10} reps
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
  },
  muscleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  prevRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  prevText: {
    fontSize: 12,
  },
});
