import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getFirstName } from '../../constants/appConstants';

interface ProfileGreetingHeaderProps {
  todayName: string;
  today: Date;
  streak: number;
  displayName?: string | null;
}

export default function ProfileGreetingHeader({
  todayName,
  today,
  streak,
  displayName,
}: ProfileGreetingHeaderProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <View style={kStyles.rowBetween}>
        <View style={[styles.pill, { backgroundColor: k.surfaceHigh }]}>
          <Ionicons name="calendar-outline" size={13} color={k.cyan} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: k.textMuted, textTransform: 'capitalize' }}>
            {todayName}, {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: k.surfaceHighest }]}>
          <Text style={{ fontSize: 12 }}>🔥</Text>
          <Text style={{ fontSize: 11, fontWeight: '900', color: k.lime }}>
            {streak} DÍAS RACHA
          </Text>
        </View>
      </View>

      <Text style={kStyles.mainHeadline}>
        ¡HOLA, {getFirstName(displayName)}!
      </Text>
      <Text style={kStyles.bodyMuted}>Preparate para romper limites hoy.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
});
