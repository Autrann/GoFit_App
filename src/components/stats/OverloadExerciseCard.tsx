import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { imageMap } from '../../assets/imgs/imageMap';
import { analyzeExerciseOverload } from '../../utils/analytics';
import { Exercise, WorkoutDayLog } from '../../types';

interface OverloadExerciseCardProps {
  exercise: Exercise;
  allWorkoutLogs: WorkoutDayLog[];
  onPress: () => void;
}

export default function OverloadExerciseCard({
  exercise: ex,
  allWorkoutLogs,
  onPress,
}: OverloadExerciseCardProps) {
  const { colors: k, kStyles } = useTheme();
  const comp = analyzeExerciseOverload(ex.id, allWorkoutLogs);

  const badgeColor =
    comp.status === 'up_weight'
      ? k.lime
      : comp.status === 'up_reps'
      ? k.cyan
      : comp.status === 'down'
      ? k.danger
      : k.textMuted;

  return (
    <TouchableOpacity
      style={[kStyles.surfaceCard, { gap: 10 }]}
      activeOpacity={0.88}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <View style={kStyles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <Image
            source={imageMap[ex.id as keyof typeof imageMap]}
            style={[styles.exThumb, { backgroundColor: k.surfaceHighest }]}
          />
          <View style={{ flex: 1 }}>
            <Text style={kStyles.kickerMuted}>{ex.muscle}</Text>
            <Text
              style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
              numberOfLines={1}
            >
              {ex.name}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.overloadStatusPill,
            { backgroundColor: k.surfaceLowest, borderColor: badgeColor },
          ]}
        >
          <Text style={{ fontSize: 9, fontWeight: '900', color: badgeColor }}>
            {comp.badgeText}
          </Text>
        </View>
      </View>

      {comp.latest ? (
        <>
          <View style={styles.comparisonBoxesRow}>
            <View style={[styles.sessionCompareBox, { backgroundColor: k.surfaceLowest }]}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted }}>
                {comp.previous ? `ANTERIOR (${comp.previous.shortDate})` : 'SESIÓN PREVIA'}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: k.textMuted, marginTop: 2 }}>
                {comp.previous
                  ? `${comp.previous.maxWeight} kg × ${comp.previous.bestRepsAtMax} reps`
                  : 'Sin previa'}
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={14} color={badgeColor} />
            </View>

            <View
              style={[
                styles.sessionCompareBox,
                { backgroundColor: k.surfaceLowest, borderColor: badgeColor, borderWidth: 1 },
              ]}
            >
              <Text style={{ fontSize: 9, fontWeight: '900', color: badgeColor }}>
                ÚLTIMA ({comp.latest.shortDate})
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: k.textMain, marginTop: 2 }}>
                {comp.latest.maxWeight} kg × {comp.latest.bestRepsAtMax} reps
              </Text>
            </View>
          </View>

          <View style={[kStyles.rowBetween, { marginTop: 2 }]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, flex: 1 }}>
              {comp.latest.setsDetail.map((s) => (
                <View
                  key={s.setNumber}
                  style={[styles.miniSetTag, { backgroundColor: k.surfaceHighest }]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>
                    S{s.setNumber}: {s.weight}kg×{s.reps}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 10, fontWeight: '800', color: k.cyan, marginLeft: 8 }}>
              Historial →
            </Text>
          </View>
        </>
      ) : (
        <Text style={kStyles.bodyMuted}>
          Aún no has registrado series de este ejercicio.
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exThumb: { width: 42, height: 42, borderRadius: 10 },
  overloadStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  comparisonBoxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionCompareBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniSetTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
