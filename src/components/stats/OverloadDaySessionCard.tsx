import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { DAYS_FROM_SUNDAY } from '../../constants/appConstants';
import { formatReadableDate } from '../../utils/analytics';
import { Routine, WorkoutDayLog } from '../../types';

interface OverloadDaySessionCardProps {
  dayLog: WorkoutDayLog;
  routineData: Routine | null;
  getExerciseNameById: (exId: string) => string;
  onSelectExercise: (exId: string) => void;
}

export default function OverloadDaySessionCard({
  dayLog,
  routineData,
  getExerciseNameById,
  onSelectExercise,
}: OverloadDaySessionCardProps) {
  const { colors: k, kStyles } = useTheme();

  const dateStr = dayLog.date || '';
  const dObj = new Date(dateStr + 'T12:00:00Z');
  const dayOfWeekName = DAYS_FROM_SUNDAY[dObj.getDay()];
  const splitTitle = routineData?.[dayOfWeekName]?.title || 'Entrenamiento';
  const exIds = Object.keys(dayLog.exercises || {}).filter(
    (id) =>
      !dayLog.exercises?.[id]?.skipped &&
      dayLog.exercises?.[id]?.reps?.some((r) => parseInt(r, 10) > 0)
  );

  return (
    <View style={[kStyles.surfaceCard, { gap: 10 }]}>
      <View style={kStyles.leftNotch} />
      <View style={[kStyles.rowBetween, { paddingLeft: 6 }]}>
        <View>
          <Text style={kStyles.kickerCyan}>
            {dayOfWeekName.toUpperCase()} • {formatReadableDate(dateStr).toUpperCase()}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
            {splitTitle.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.activeDaysPill, { backgroundColor: k.surfaceLowest }]}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
            {exIds.length} ejercicios
          </Text>
        </View>
      </View>

      <View style={{ gap: 8, paddingLeft: 6 }}>
        {exIds.map((exId) => {
          const exLog = dayLog.exercises?.[exId];
          const setsCount = exLog?.sets || exLog?.reps?.length || 0;

          return (
            <TouchableOpacity
              key={exId}
              style={[styles.dayExItemBox, { backgroundColor: k.surfaceLowest }]}
              onPress={() => {
                Haptics.selectionAsync();
                onSelectExercise(exId);
              }}
            >
              <View style={[kStyles.rowBetween, { marginBottom: 6 }]}>
                <Text
                  style={{ fontSize: 12, fontWeight: '900', color: k.textMain, textTransform: 'uppercase', flex: 1 }}
                  numberOfLines={1}
                >
                  {getExerciseNameById(exId)}
                </Text>
                <Ionicons name="stats-chart" size={13} color={k.cyan} />
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                {Array.from({ length: setsCount }).map((_, sIdx) => {
                  const r = parseInt(exLog?.reps?.[sIdx] || '0', 10) || 0;
                  const w = parseFloat(exLog?.weights?.[sIdx] || '0') || 0;
                  if (r <= 0) return null;
                  return (
                    <View
                      key={sIdx}
                      style={[styles.miniSetTag, { backgroundColor: k.surfaceHigh }]}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>
                        S{sIdx + 1}: <Text style={{ color: k.lime }}>{w}kg</Text> × {r}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDaysPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  dayExItemBox: {
    padding: 10,
    borderRadius: 12,
  },
  miniSetTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
