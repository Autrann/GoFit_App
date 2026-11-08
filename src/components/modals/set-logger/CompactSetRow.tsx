import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';

interface CompactSetRowProps {
  setIndex: number;
  isCompleted: boolean;
  prevWeightLabel: string;
  prevRepsLabel: string;
  displayWeight: string;
  repValue: string;
  rpeValue: string;
  onSelect: () => void;
}

export default function CompactSetRow({
  setIndex,
  isCompleted,
  prevWeightLabel,
  prevRepsLabel,
  displayWeight,
  repValue,
  rpeValue,
  onSelect,
}: CompactSetRowProps) {
  const { colors: k } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.compactSetRow, { backgroundColor: k.surface }, !isCompleted && { opacity: 0.65 }]}
      onPress={() => {
        Haptics.selectionAsync();
        onSelect();
      }}
    >
      <View style={{ flex: 1.5 }}>
        <View style={[styles.setNumBox, { backgroundColor: k.surfaceHighest }]}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>{setIndex + 1}</Text>
        </View>
      </View>
      <Text style={{ flex: 2.5, fontSize: 12, fontWeight: '600', color: k.textMuted }}>
        {prevWeightLabel} × {prevRepsLabel}
      </Text>
      <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 14, fontWeight: '800', color: k.textMain }}>
        {displayWeight}
      </Text>
      <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 14, fontWeight: '800', color: k.textMain }}>
        {isCompleted ? repValue : '--'}
      </Text>
      <Text style={{ flex: 1.2, textAlign: 'center', fontSize: 12, color: k.textMuted }}>
        {rpeValue}
      </Text>
      <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
        {isCompleted ? (
          <View style={styles.checkDoneBox}>
            <Ionicons name="checkmark" size={16} color={k.lime} />
          </View>
        ) : (
          <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted }}>PENDIENTE</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  compactSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  setNumBox: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  checkDoneBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(202, 253, 0, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
