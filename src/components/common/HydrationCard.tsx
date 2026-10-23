import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

interface HydrationCardProps {
  liters: number;
  goalLiters?: number;
  stepMl?: number;
  onChangeLiters: (newLiters: number) => void;
}

export default function HydrationCard({
  liters,
  goalLiters = 3.0,
  stepMl = 250,
  onChangeLiters,
}: HydrationCardProps) {
  const { colors: k, kStyles } = useTheme();
  const stepLiters = stepMl / 1000;
  const pct = Math.min(100, Math.round((liters / goalLiters) * 100));

  const handleAdjust = (deltaLiters: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextVal = Math.max(0, Math.min(6.0, parseFloat((liters + deltaLiters).toFixed(2))));
    onChangeLiters(nextVal);
  };

  return (
    <View style={[kStyles.card, styles.cardContainer]}>
      {/* Cabecera */}
      <View style={kStyles.rowBetween}>
        <View style={kStyles.rowAlign}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 244, 254, 0.14)' }]}>
            <Ionicons name="water" size={16} color={k.cyan} />
          </View>
          <View>
            <Text style={kStyles.kickerMuted}>HIDRATACIÓN DIARIA</Text>
            <Text style={{ fontSize: 10, color: k.cyan, fontWeight: '800' }}>
              {pct}% de tu meta ({goalLiters.toFixed(1)} L)
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
          <Text style={[styles.bigValue, { color: k.textMain }]}>{liters.toFixed(2)}</Text>
          <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMuted }}>L</Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={[styles.track, { backgroundColor: k.surfaceLowest }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: k.cyan }]} />
      </View>

      {/* Controles intuitivos de Disminuir / Aumentar con indicación explícita de ml */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[
            styles.stepButton,
            { backgroundColor: k.surfaceLowest, borderColor: k.outline },
            liters <= 0 && { opacity: 0.4 },
          ]}
          disabled={liters <= 0}
          onPress={() => handleAdjust(-stepLiters)}
        >
          <Ionicons name="remove-circle-outline" size={16} color={k.textMain} />
          <Text style={[styles.stepBtnText, { color: k.textMain }]}>-{stepMl} ml</Text>
        </TouchableOpacity>

        <View style={styles.stepHintBox}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted, textTransform: 'uppercase' }}>
            1 Vaso = {stepMl} ml
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.stepButton, { backgroundColor: 'rgba(0, 244, 254, 0.15)', borderColor: k.cyan }]}
          onPress={() => handleAdjust(stepLiters)}
        >
          <Ionicons name="add-circle" size={16} color={k.cyan} />
          <Text style={[styles.stepBtnText, { color: k.cyan }]}>+{stepMl} ml</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { padding: 15, gap: 10 },
  iconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  bigValue: { fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.5 },
  track: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  stepButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepBtnText: { fontSize: 12, fontWeight: '900' },
  stepHintBox: { paddingHorizontal: 4, alignItems: 'center' },
});