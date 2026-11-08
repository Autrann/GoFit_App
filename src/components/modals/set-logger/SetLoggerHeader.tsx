import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  onSkipToday: () => void;
}

export default function SetLoggerHeader({
  activeExercise,
  activeExIndex,
  totalExercisesCount,
  routineTitle,
  prevExData,
  weightUnit,
  formatDisplayWeight,
  onSkipToday,
}: SetLoggerHeaderProps) {
  const { colors: k } = useTheme();

  return (
    <View style={styles.dossierHeader}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={[styles.exOrderBadge, { backgroundColor: k.surfaceHighest }]}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: k.lime }}>
              EJERCICIO {activeExIndex + 1} DE {totalExercisesCount || 1}
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '600', color: k.textMuted }}>
            {activeExercise?.muscle || routineTitle}
          </Text>
        </View>

        <Text style={[styles.dossierTitle, { color: k.textMain }]} numberOfLines={1}>
          {activeExercise?.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <Ionicons name="time-outline" size={14} color={k.gold} />
          <Text style={{ fontSize: 11, color: k.textMuted }}>
            Registro previo:{' '}
            <Text style={{ fontWeight: '800', color: k.textMain }}>
              {prevExData?.weights?.[0]
                ? `${formatDisplayWeight(prevExData.weights[0])} ${weightUnit} × ${prevExData.reps?.[0] || 10} reps`
                : 'Sin registro previo'}
            </Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.skipExercisePill, { borderColor: 'rgba(255, 115, 81, 0.4)' }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onSkipToday();
        }}
      >
        <Ionicons name="ban-outline" size={14} color={k.danger} />
        <Text style={[styles.skipExercisePillText, { color: k.danger }]}>Omitir hoy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  dossierHeader: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  exOrderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dossierTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  skipExercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 115, 81, 0.14)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipExercisePillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
});
