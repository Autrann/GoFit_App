import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { TimeframeOption, WeightChartData, WeightEntry } from '../../types';

const { width } = Dimensions.get('window');

interface BodyWeightChartCardProps {
  timeframe: TimeframeOption;
  realWeightStats: WeightChartData;
  latestWeightVal: number | null;
  targetWeightVal: number | null;
  weightHistory: WeightEntry[];
  onChangeTimeframe: (tf: TimeframeOption) => void;
}

export default function BodyWeightChartCard({
  timeframe,
  realWeightStats,
  latestWeightVal,
  targetWeightVal,
  weightHistory,
  onChangeTimeframe,
}: BodyWeightChartCardProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={kStyles.surfaceCard}>
      <View style={kStyles.rowBetween}>
        <View>
          <Text style={kStyles.kickerMuted}>HISTORIAL BIOMÉTRICO </Text>
          <Text style={{ fontSize: 15, fontWeight: '900', color: k.textMain }}>PESO CORPORAL</Text>
        </View>
        <View style={[styles.tfRow, { backgroundColor: k.surfaceLowest }]}>
          {(['1S', '1M', '3M', '1A'] as const).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tfBtn, timeframe === tf && { backgroundColor: k.limeBg }]}
              onPress={() => {
                Haptics.selectionAsync();
                onChangeTimeframe(tf);
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  color: timeframe === tf ? '#3a4a00' : k.textMuted,
                }}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {realWeightStats.hasData && latestWeightVal !== null ? (
        <>
          <View style={[kStyles.rowBetween, { marginTop: 14, alignItems: 'flex-end' }]}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
                  {latestWeightVal.toFixed(1)}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: k.textMuted }}>KG</Text>
              </View>
              <Text style={{ fontSize: 11, color: k.textMuted }}>
                {weightHistory.length > 0
                  ? `Último registro: ${weightHistory[weightHistory.length - 1].date}`
                  : 'Peso inicial registrado'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.deltaBadge, { backgroundColor: 'rgba(202, 253, 0, 0.14)' }]}>
                <Ionicons
                  name={
                    realWeightStats.diffValue > 0
                      ? 'trending-up'
                      : realWeightStats.diffValue < 0
                      ? 'trending-down'
                      : 'remove'
                  }
                  size={13}
                  color={k.lime}
                />
                <Text style={{ fontSize: 11, fontWeight: '800', color: k.lime }}>
                  {realWeightStats.diffValue > 0 ? `+${realWeightStats.diffValue}` : realWeightStats.diffValue} kg ({timeframe})
                </Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: '700', color: k.cyan, marginTop: 4 }}>
                {targetWeightVal ? `Meta final: ${targetWeightVal.toFixed(1)} kg` : 'Modo: Mantenimiento'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <LineChart
              data={{
                labels: realWeightStats.labels,
                datasets: [{ data: realWeightStats.data }],
              }}
              width={width - 64}
              height={170}
              yAxisSuffix="k"
              withOuterLines={false}
              chartConfig={{
                backgroundColor: k.surface,
                backgroundGradientFrom: k.surface,
                backgroundGradientTo: k.surface,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 244, 254, ${opacity})`,
                labelColor: () => k.textMuted,
                propsForDots: { r: '4.5', strokeWidth: '2', stroke: k.limeBg },
                propsForBackgroundLines: {
                  strokeWidth: 0.6,
                  stroke: k.outline,
                  strokeDasharray: '4',
                },
              }}
              bezier
              style={{ borderRadius: 12, marginLeft: -16 }}
            />
          </View>
        </>
      ) : (
        <Text style={[kStyles.bodyMuted, { marginTop: 12 }]}>
          Registra tu peso en la pestaña Entrenar para empezar a trazar tu curva histórica.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tfRow: { flexDirection: 'row', padding: 3, borderRadius: 18, gap: 2 },
  tfBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
