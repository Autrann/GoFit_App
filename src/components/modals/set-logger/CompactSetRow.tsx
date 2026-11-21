import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';

interface CompactSetRowProps {
  setIndex: number;
  isCompleted: boolean;
  prevWeightLabel: string;
  prevRepsLabel: string;
  weightValue: string;
  repValue: string;
  onFocusRow: () => void;
  onWeightChange: (val: string) => void;
  onRepChange: (val: string) => void;
  onApplyPrevious: () => void;
  onToggleComplete: () => void;
}

export default function CompactSetRow({
  setIndex,
  isCompleted,
  prevWeightLabel,
  prevRepsLabel,
  weightValue,
  repValue,
  onFocusRow,
  onWeightChange,
  onRepChange,
  onApplyPrevious,
  onToggleComplete,
}: CompactSetRowProps) {
  const { colors: k } = useTheme();
  const hasPrev = prevWeightLabel !== '--' || prevRepsLabel !== '--';
  const placeholderRep = prevRepsLabel !== '--' ? prevRepsLabel : '10';
  const placeholderWeight = prevWeightLabel !== '--' ? prevWeightLabel : '0';

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: isCompleted ? 'rgba(202, 253, 0, 0.07)' : k.surface,
          borderColor: isCompleted ? 'rgba(202, 253, 0, 0.35)' : 'transparent',
        },
      ]}
    >
      {/* 1. Número de Serie */}
      <TouchableOpacity
        style={styles.colSerie}
        onPress={() => {
          Haptics.selectionAsync();
          onFocusRow();
        }}
      >
        <View
          style={[
            styles.setBadge,
            {
              backgroundColor: isCompleted ? k.limeBg : k.surfaceHighest,
            },
          ]}
        >
          <Text
            style={[
              styles.setBadgeText,
              { color: isCompleted ? '#3a4a00' : k.textMain },
            ]}
          >
            {setIndex + 1}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 2. Marca Anterior (Tocar para autocompletar) */}
      <TouchableOpacity
        style={styles.colPrev}
        disabled={!hasPrev}
        onPress={() => {
          Haptics.selectionAsync();
          onApplyPrevious();
        }}
      >
        <Text style={[styles.prevText, { color: k.textMuted }]} numberOfLines={1}>
          {hasPrev ? `${prevWeightLabel} × ${prevRepsLabel}` : '—'}
        </Text>
      </TouchableOpacity>

      {/* 3. Input directo de Peso */}
      <View style={styles.colInput}>
        <TextInput
          style={[
            styles.inputBox,
            {
              backgroundColor: k.surfaceLowest,
              color: k.textMain,
              borderColor: isCompleted ? 'rgba(202, 253, 0, 0.3)' : k.outline,
            },
          ]}
          keyboardType="decimal-pad"
          value={weightValue}
          onFocus={onFocusRow}
          onChangeText={onWeightChange}
          placeholder={placeholderWeight}
          placeholderTextColor={k.textMuted}
          selectTextOnFocus
        />
      </View>

      {/* 4. Input directo de Reps */}
      <View style={styles.colInput}>
        <TextInput
          style={[
            styles.inputBox,
            {
              backgroundColor: k.surfaceLowest,
              color: k.textMain,
              borderColor: isCompleted ? 'rgba(202, 253, 0, 0.3)' : k.outline,
            },
          ]}
          keyboardType="numeric"
          value={repValue}
          onFocus={onFocusRow}
          onChangeText={(val) => onRepChange(val.replace(/[^0-9]/g, ''))}
          placeholder={placeholderRep}
          placeholderTextColor={k.textMuted}
          selectTextOnFocus
        />
      </View>

      {/* 5. Botón Check de 1 toque */}
      <View style={styles.colCheck}>
        <TouchableOpacity
          style={[
            styles.checkBtn,
            {
              backgroundColor: isCompleted ? k.limeBg : k.surfaceHighest,
              borderColor: isCompleted ? k.limeBg : k.outline,
            },
          ]}
          onPress={onToggleComplete}
          activeOpacity={0.75}
        >
          <Ionicons
            name="checkmark"
            size={18}
            color={isCompleted ? '#3a4a00' : k.textMuted}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  colSerie: {
    width: 38,
    alignItems: 'flex-start',
  },
  setBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  colPrev: {
    flex: 1.1,
    paddingRight: 6,
  },
  prevText: {
    fontSize: 12,
    fontWeight: '600',
  },
  colInput: {
    flex: 1.15,
    paddingHorizontal: 4,
  },
  inputBox: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  colCheck: {
    width: 44,
    alignItems: 'flex-end',
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
