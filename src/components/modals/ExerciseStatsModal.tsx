import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { ExerciseSessionEntry } from '../../utils/analytics';
import { imageMap } from '../../assets/imgs/imageMap';
import GoFitBottomSheet from '../common/GoFitBottomSheet';

const { width } = Dimensions.get('window');

interface ExerciseStatsModalProps {
  visible: boolean;
  routineExercises: any[];
  selectedExerciseId: string | null;
  exerciseHistory: ExerciseSessionEntry[];
  onClose: () => void;
  onSelectExercise: (id: string) => void;
}

export default function ExerciseStatsModal({
  visible,
  routineExercises,
  selectedExerciseId,
  exerciseHistory,
  onClose,
  onSelectExercise,
}: ExerciseStatsModalProps) {
  const { isDark, colors: k, kStyles } = useTheme();
  const activeExerciseObj = routineExercises.find((ex) => ex.id === selectedExerciseId);

  let bestWeight = 0;
  let bestReps = 0;
  exerciseHistory.forEach((h) => {
    if (h.maxWeight > bestWeight || (h.maxWeight === bestWeight && h.bestRepsAtMax > bestReps)) {
      bestWeight = h.maxWeight;
      bestReps = h.bestRepsAtMax;
    }
  });

  const reversedSessions = [...exerciseHistory].reverse();

  return (
    <GoFitBottomSheet visible={visible} onClose={onClose} maxHeight="92%">
      <View style={[kStyles.rowBetween, { marginBottom: 12 }]}>
        <View>
          <Text style={kStyles.kickerLime}>SOBRECARGA PROGRESIVA</Text>
          <Text style={kStyles.sheetTitle}>HISTORIAL DEL EJERCICIO</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={28} color={k.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Selector horizontal rápido de ejercicios de la rutina */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {routineExercises.map((ex) => {
            const isActive = selectedExerciseId === ex.id;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[
                  styles.exChip,
                  { backgroundColor: isActive ? k.limeBg : k.surfaceLowest },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectExercise(ex.id);
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? '900' : '700',
                    color: isActive ? '#3a4a00' : k.textMuted,
                  }}
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {activeExerciseObj && (
          <View style={[styles.graphCard, { backgroundColor: k.surfaceLowest }]}>
            <View style={kStyles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Image
                  source={imageMap[activeExerciseObj.id as keyof typeof imageMap]}
                  style={[styles.activeImg, { backgroundColor: k.surfaceHighest }]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
                    numberOfLines={1}
                  >
                    {activeExerciseObj.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: k.textMuted, fontWeight: '600' }}>
                    {activeExerciseObj.muscle} • {exerciseHistory.length} sesiones
                  </Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={kStyles.kickerMuted}>MEJOR SERIE</Text>
                <Text style={{ fontSize: 17, fontWeight: '900', fontStyle: 'italic', color: k.lime }}>
                  {bestWeight > 0 ? `${bestWeight} kg × ${bestReps}` : '--'} 🏆
                </Text>
              </View>
            </View>

            {exerciseHistory.length > 0 ? (
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <BarChart
                  data={{
                    labels: exerciseHistory.slice(-7).map((h) => h.shortDate),
                    datasets: [{ data: exerciseHistory.slice(-7).map((h) => h.maxWeight) }],
                  }}
                  width={width - 84}
                  height={150}
                  yAxisLabel=""
                  yAxisSuffix="k"
                  fromZero={true}
                  showValuesOnTopOfBars={true}
                  chartConfig={{
                    backgroundColor: k.surfaceLowest,
                    backgroundGradientFrom: k.surfaceLowest,
                    backgroundGradientTo: k.surfaceLowest,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(202, 253, 0, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(142, 142, 147, ${opacity})`,
                    barPercentage: 0.55,
                    propsForBackgroundLines: { strokeWidth: 0.5, stroke: k.outline },
                  }}
                  style={{ borderRadius: 12, marginLeft: -16 }}
                />
              </View>
            ) : (
              <Text style={[kStyles.bodyMuted, { textAlign: 'center', marginTop: 14 }]}>
                Aún no hay series registradas para este ejercicio.
              </Text>
            )}
          </View>
        )}

        {/* Desglose Serie por Serie de cada entrenamiento anterior */}
        {reversedSessions.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={[kStyles.kickerMuted, { marginBottom: 4 }]}>
              BITÁCORA SERIE POR SERIE (MÁS RECIENTE PRIMERO)
            </Text>

            {reversedSessions.map((session, sIdx) => {
              const prevSession = reversedSessions[sIdx + 1];
              const diffW = prevSession ? parseFloat((session.maxWeight - prevSession.maxWeight).toFixed(1)) : 0;
              const diffR = prevSession ? session.bestRepsAtMax - prevSession.bestRepsAtMax : 0;

              return (
                <View
                  key={session.date}
                  style={[styles.sessionCard, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}
                >
                  <View style={[kStyles.rowBetween, { marginBottom: 8 }]}>
                    <View style={kStyles.rowAlign}>
                      <Ionicons name="calendar-outline" size={14} color={k.cyan} />
                      <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>
                        {session.fullDateLabel.toUpperCase()}
                      </Text>
                    </View>

                    {prevSession && (
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '900',
                          color: diffW > 0 ? k.lime : diffW === 0 && diffR > 0 ? k.cyan : k.textMuted,
                        }}
                      >
                        {diffW > 0
                          ? `↑ +${diffW} kg`
                          : diffW === 0 && diffR > 0
                          ? `↑ +${diffR} reps`
                          : diffW === 0 && diffR === 0
                          ? '═ Misma marca'
                          : ''}
                      </Text>
                    )}
                  </View>

                  <View style={styles.setsWrap}>
                    {session.setsDetail.map((s) => (
                      <View
                        key={s.setNumber}
                        style={[styles.setPill, { backgroundColor: k.surfaceHigh }]}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '900', color: k.cyan }}>
                          S{s.setNumber}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>
                          {s.weight} kg × {s.reps}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  exChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, maxWidth: 160 },
  graphCard: { borderRadius: 16, padding: 14, marginBottom: 14 },
  activeImg: { width: 42, height: 42, borderRadius: 8 },
  sessionCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  setsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
});