import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise, OverloadViewMode, Routine, WorkoutDayLog } from '../../types';
import OverloadExerciseCard from './OverloadExerciseCard';
import OverloadDaySessionCard from './OverloadDaySessionCard';

interface OverloadSectionProps {
  overloadViewMode: OverloadViewMode;
  selectedMuscleFilter: string;
  muscleCategories: string[];
  filteredExercises: Exercise[];
  allWorkoutLogs: WorkoutDayLog[];
  pastWorkoutDays: WorkoutDayLog[];
  routineData: Routine | null;
  getExerciseNameById: (exId: string) => string;
  onChangeViewMode: (mode: OverloadViewMode) => void;
  onSelectMuscleFilter: (muscle: string) => void;
  onOpenExerciseStats: (exerciseId: string) => void;
}

export default function OverloadSection({
  overloadViewMode,
  selectedMuscleFilter,
  muscleCategories,
  filteredExercises,
  allWorkoutLogs,
  pastWorkoutDays,
  routineData,
  getExerciseNameById,
  onChangeViewMode,
  onSelectMuscleFilter,
  onOpenExerciseStats,
}: OverloadSectionProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <View style={kStyles.rowBetween}>
        <View>
          <Text style={kStyles.kickerLime}>Tu avance día con día</Text>
          <Text style={{ fontSize: 19, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
            SOBRECARGA PROGRESIVA
          </Text>
        </View>
      </View>

      {/* Selector de Vista: Por Ejercicio vs Por Día */}
      <View style={[styles.viewToggleContainer, { backgroundColor: k.surfaceHigh }]}>
        <TouchableOpacity
          style={[
            styles.viewToggleBtn,
            overloadViewMode === 'by_exercise' && { backgroundColor: k.limeBg },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeViewMode('by_exercise');
          }}
        >
          <Ionicons
            name="barbell-outline"
            size={15}
            color={overloadViewMode === 'by_exercise' ? '#3a4a00' : k.textMuted}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '900',
              color: overloadViewMode === 'by_exercise' ? '#3a4a00' : k.textMuted,
            }}
          >
            POR EJERCICIO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewToggleBtn,
            overloadViewMode === 'by_day' && { backgroundColor: k.cyan },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onChangeViewMode('by_day');
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={overloadViewMode === 'by_day' ? '#00363a' : k.textMuted}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '900',
              color: overloadViewMode === 'by_day' ? '#00363a' : k.textMuted,
            }}
          >
            POR DÍA (SESIONES)
          </Text>
        </TouchableOpacity>
      </View>

      {overloadViewMode === 'by_exercise' ? (
        <>
          {muscleCategories.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {muscleCategories.map((m) => {
                const active = selectedMuscleFilter === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.filterPill, { backgroundColor: active ? k.limeBg : k.surfaceHigh }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onSelectMuscleFilter(m);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#3a4a00' : k.textMuted }}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {filteredExercises.length === 0 ? (
            <View style={[kStyles.surfaceCard, { alignItems: 'center', paddingVertical: 24, gap: 8 }]}>
              <Ionicons name="barbell-outline" size={32} color={k.textMuted} />
              <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
                Agrega ejercicios en tu pestaña "Rutina" para ver aquí tus pesos y repeticiones.
              </Text>
            </View>
          ) : (
            filteredExercises.map((ex) => (
              <OverloadExerciseCard
                key={ex.id}
                exercise={ex}
                allWorkoutLogs={allWorkoutLogs}
                onPress={() => onOpenExerciseStats(ex.id)}
              />
            ))
          )}
        </>
      ) : (
        <View style={{ gap: 12 }}>
          {pastWorkoutDays.length === 0 ? (
            <View style={[kStyles.surfaceCard, { alignItems: 'center', paddingVertical: 24, gap: 8 }]}>
              <Ionicons name="calendar-outline" size={32} color={k.textMuted} />
              <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
                Aquí aparecerán tus entrenamientos anteriores por fecha conforme vayas registrando tus días.
              </Text>
            </View>
          ) : (
            pastWorkoutDays.map((dayLog) => (
              <OverloadDaySessionCard
                key={dayLog.date}
                dayLog={dayLog}
                routineData={routineData}
                getExerciseNameById={getExerciseNameById}
                onSelectExercise={onOpenExerciseStats}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  viewToggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    gap: 6,
  },
  viewToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
});
