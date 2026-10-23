import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Image, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { imageMap } from '../../assets/imgs/imageMap';

const { width } = Dimensions.get('window');

interface ExerciseStatsModalProps {
  visible: boolean;
  routineExercises: any[];
  selectedExerciseId: string | null;
  exerciseHistory: { shortDate: string; maxWeight: number }[];
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
  const exerciseMaxWeight =
    exerciseHistory.length > 0 ? Math.max(...exerciseHistory.map((h) => h.maxWeight)) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={kStyles.modalOverlay}>
        <View style={kStyles.sheetContent}>
          <View style={kStyles.dragHandle} />

          <View style={[kStyles.rowBetween, { marginBottom: 14 }]}>
            <View>
              <Text style={kStyles.kickerLime}>HISTORIAL DETALLADO</Text>
              <Text style={kStyles.sheetTitle}>ANÁLISIS POR EJERCICIO</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={k.textMuted} />
            </TouchableOpacity>
          </View>

          {activeExerciseObj && (
            <View style={[styles.graphCard, { backgroundColor: k.surfaceLowest }]}>
              <View style={kStyles.rowBetween}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Image
                    source={imageMap[activeExerciseObj.id as keyof typeof imageMap]}
                    style={[styles.activeImg, { backgroundColor: k.surfaceHighest }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }} numberOfLines={1}>
                      {activeExerciseObj.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: k.textMuted, fontWeight: '600' }}>
                      {activeExerciseObj.muscle}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={kStyles.kickerMuted}>RÉCORD PR</Text>
                  <Text style={{ fontSize: 18, fontWeight: '900', fontStyle: 'italic', color: k.lime }}>
                    {exerciseMaxWeight} kg 🏆
                  </Text>
                </View>
              </View>

              {exerciseHistory.length > 0 ? (
                <View style={{ marginTop: 12, alignItems: 'center' }}>
                  <BarChart
                    data={{
                      labels: exerciseHistory.map((h) => h.shortDate),
                      datasets: [{ data: exerciseHistory.map((h) => h.maxWeight) }],
                    }}
                    width={width - 84}
                    height={160}
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
                  Aún no hay series con peso registradas para este ejercicio.
                </Text>
              )}
            </View>
          )}

          <Text style={[kStyles.kickerMuted, { marginBottom: 8, marginTop: 6 }]}>
            CAMBIAR EJERCICIO ({routineExercises.length})
          </Text>

          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {routineExercises.map((ex) => {
              const isActive = selectedExerciseId === ex.id;
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.optionRow,
                    { backgroundColor: isActive ? k.surface : k.surfaceLowest },
                    isActive && { borderColor: k.limeBg, borderWidth: 1 },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectExercise(ex.id);
                  }}
                >
                  <Image
                    source={imageMap[ex.id as keyof typeof imageMap]}
                    style={[styles.optionImg, { backgroundColor: k.surfaceHighest }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? '900' : '700',
                        color: isActive ? k.lime : k.textMain,
                      }}
                    >
                      {ex.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: k.textMuted }}>{ex.muscle}</Text>
                  </View>
                  {isActive && <Ionicons name="checkmark-circle" size={22} color={k.lime} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  graphCard: { borderRadius: 16, padding: 14, marginBottom: 12 },
  activeImg: { width: 42, height: 42, borderRadius: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, marginBottom: 8 },
  optionImg: { width: 38, height: 38, borderRadius: 8, marginRight: 12 },
});