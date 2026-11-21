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
  const { colors: k } = useTheme();

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: timerRunning ? 'rgba(0, 244, 254, 0.1)' : k.surface,
            borderColor: timerRunning ? k.cyan : k.outline,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.leftTouch}
          onPress={onToggleRunning}
          activeOpacity={0.75}
        >
          <Ionicons
            name={timerRunning ? 'timer' : 'timer-outline'}
            size={16}
            color={timerRunning ? k.cyan : k.textMuted}
          />
          <Text style={[styles.label, { color: timerRunning ? k.cyan : k.textMuted }]}>
            {timerRunning ? 'Descansando' : 'Descanso'}
          </Text>
          <Text style={[styles.timeText, { color: k.textMain }]}>
            {formatSecondsToMMSS(restSeconds)}
          </Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.stepPill, { backgroundColor: k.surfaceHighest }]}
            onPress={() => onAdjust(-15)}
          >
            <Text style={[styles.stepText, { color: k.textMuted }]}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepPill, { backgroundColor: k.surfaceHighest }]}
            onPress={() => onAdjust(15)}
          >
            <Text style={[styles.stepText, { color: k.textMuted }]}>+15s</Text>
          </TouchableOpacity>

          {timerRunning ? (
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: k.surfaceHighest }]}
              onPress={onReset}
            >
              <Text style={[styles.actionText, { color: k.cyan }]}>Saltar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionPill, { backgroundColor: k.surfaceHighest }]}
              onPress={onToggleRunning}
            >
              <Ionicons name="play" size={12} color={k.cyan} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  leftTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
