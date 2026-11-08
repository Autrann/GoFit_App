import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { WeeklyDayStatus } from '../../types';

interface StreakConsistencyCardProps {
  streak: number;
  weeklyData: WeeklyDayStatus[];
}

export default function StreakConsistencyCard({
  streak,
  weeklyData,
}: StreakConsistencyCardProps) {
  const { colors: k, kStyles } = useTheme();
  const trainedCount = weeklyData.filter((d) => d.trained).length;

  return (
    <View style={kStyles.card}>
      <View style={kStyles.rowBetween}>
        <View>
          <Text style={kStyles.kickerMuted}>🔥 RACHA DE CONSTANCIA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={{ fontSize: 40, fontWeight: '900', fontStyle: 'italic', color: k.lime }}>
              {streak}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }}>DÍAS SEGUIDOS</Text>
          </View>
        </View>
        <View style={[styles.activeDaysPill, { backgroundColor: k.surfaceLowest }]}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>
            {trainedCount}/7 días esta sem.
          </Text>
        </View>
      </View>

      <View style={[kStyles.divider, { marginVertical: 12 }]} />

      <View style={kStyles.rowBetween}>
        {weeklyData.map((day, idx) => {
          const isToday = idx === 6;
          return (
            <View key={day.date} style={{ alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: isToday ? k.cyan : k.textMuted,
                }}
              >
                {day.shortLetter}
              </Text>
              <View
                style={[
                  styles.matrixDot,
                  {
                    backgroundColor: day.trained ? k.limeBg : k.surfaceHighest,
                    borderWidth: isToday && !day.trained ? 1.5 : 0,
                    borderColor: k.cyan,
                  },
                ]}
              >
                {day.trained && <Ionicons name="checkmark" size={13} color="#3a4a00" />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDaysPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  matrixDot: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
});
