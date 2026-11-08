import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { formatSecondsToMMSS } from '../../../utils/weightConversion';

interface RestTimerBarProps {
  restSeconds: number;
  timerRunning: boolean;
  onAdjust: (delta: number) => void;
  onReset: () => void;
  onToggleRunning: () => void;
}

export default function RestTimerBar({
  restSeconds,
  timerRunning,
  onAdjust,
  onReset,
  onToggleRunning,
}: RestTimerBarProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={styles.topArea}>
      <View style={[styles.restTimerBar, { backgroundColor: k.surfaceHighest }]}>
        <View style={kStyles.rowAlign}>
          <View style={styles.timerIconCircle}>
            <Ionicons name="timer-outline" size={18} color={k.cyan} />
          </View>
          <View>
            <Text style={kStyles.kickerMuted}>DESCANSO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={[styles.timerCountdown, { color: k.cyan }]}>
                {formatSecondsToMMSS(restSeconds)}
              </Text>
              <Text style={{ fontSize: 10, color: k.textMuted, fontWeight: '600' }}>/ 02:00</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: k.surfaceBright }]}
            onPress={() => onAdjust(-30)}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>-30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timerBtn, { backgroundColor: k.surfaceBright }]}
            onPress={() => onAdjust(30)}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>+30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.timerIconBtn, { backgroundColor: k.surfaceBright }]}
            onPress={onReset}
            accessibilityLabel="Reiniciar cronómetro"
          >
            <Ionicons name="refresh" size={15} color={k.cyan} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.timerIconBtn,
              { backgroundColor: timerRunning ? k.limeBg : k.surfaceBright },
            ]}
            onPress={onToggleRunning}
          >
            <Ionicons
              name={timerRunning ? 'pause' : 'play'}
              size={15}
              color={timerRunning ? '#3a4a00' : k.textMain}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topArea: { paddingHorizontal: 18, paddingBottom: 6, alignItems: 'center' },
  restTimerBar: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 244, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCountdown: { fontSize: 17, fontWeight: '900' },
  timerBtn: { height: 32, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  timerIconBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
