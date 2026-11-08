import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { DAYS_FROM_MONDAY } from '../../constants/appConstants';
import { Routine } from '../../types';

interface RoutineDayTabsProps {
  routine: Routine;
  activeDay: string;
  onSelectDay: (day: string) => void;
}

export default function RoutineDayTabs({
  routine,
  activeDay,
  onSelectDay,
}: RoutineDayTabsProps) {
  const { colors: k } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {DAYS_FROM_MONDAY.map((day) => {
        const isSelected = activeDay === day;
        const dPlan = routine[day];
        const hasEx = !dPlan?.isRest && (dPlan?.exercises?.length || 0) > 0;
        return (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayTab,
              { backgroundColor: isSelected ? k.limeBg : k.surfaceHigh, borderColor: k.outline },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onSelectDay(day);
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '900', color: isSelected ? '#3a4a00' : k.textMuted }}>
              {day.slice(0, 3).toUpperCase()}
            </Text>
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: isSelected ? '#3a4a00' : hasEx ? k.limeBg : 'transparent',
              }}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dayTab: {
    minWidth: 56,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
});
