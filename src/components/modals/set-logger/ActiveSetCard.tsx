import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { RPE_OPTIONS } from '../../../constants/appConstants';
import { WeightUnit } from '../../../types';

interface ActiveSetCardProps {
  setIndex: number;
  isCompleted: boolean;
  repValue: string;
  rpeValue: string;
  weightValue: string;
  weightUnit: WeightUnit;
  prevWeightLabel: string;
  prevRepsLabel: string;
  mainStepDelta: number;
  showRpePicker: boolean;
  onToggleRpePicker: () => void;
  onStepWeight: (delta: number) => void;
  onWeightTextChange: (text: string) => void;
  onStepReps: (delta: number) => void;
  onRepTextChange: (text: string) => void;
  onSelectRpe: (rpeVal: string) => void;
  onApplyPrevious: () => void;
  onCommitSet: () => void;
}

export default function ActiveSetCard({
  setIndex,
  isCompleted,
  repValue,
  rpeValue,
  weightValue,
  weightUnit,
  prevWeightLabel,
  prevRepsLabel,
  mainStepDelta,
  showRpePicker,
  onToggleRpePicker,
  onStepWeight,
  onWeightTextChange,
  onStepReps,
  onRepTextChange,
  onSelectRpe,
  onApplyPrevious,
  onCommitSet,
}: ActiveSetCardProps) {
  const { colors: k } = useTheme();
  const hasPrev = prevWeightLabel !== '--' || prevRepsLabel !== '--';
  const placeholderRep = prevRepsLabel !== '--' ? prevRepsLabel : '10';
  const placeholderWeight = prevWeightLabel !== '--' ? prevWeightLabel : '0';

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: k.surfaceHigh,
          borderColor: isCompleted ? k.limeBg : k.cyan,
        },
      ]}
    >
      {/* Fila Principal: Misma alineación de 5 columnas que las demás series */}
      <View style={styles.mainRow}>
        {/* 1. Serie */}
        <View style={styles.colSerie}>
          <View
            style={[
              styles.setBadge,
              { backgroundColor: isCompleted ? k.limeBg : k.cyan },
            ]}
          >
            <Text style={styles.setBadgeText}>{setIndex + 1}</Text>
          </View>
        </View>

        {/* 2. Anterior (Tocar para autocompletar) */}
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

        {/* 3. Input de Peso */}
        <View style={styles.colInput}>
          <TextInput
            style={[
              styles.inputBox,
              {
                backgroundColor: k.surfaceLowest,
                color: k.textMain,
                borderColor: k.cyan,
              },
            ]}
            keyboardType="decimal-pad"
            value={weightValue}
            onChangeText={onWeightTextChange}
            placeholder={placeholderWeight}
            placeholderTextColor={k.textMuted}
            selectTextOnFocus
          />
        </View>

        {/* 4. Input de Reps */}
        <View style={styles.colInput}>
          <TextInput
            style={[
              styles.inputBox,
              {
                backgroundColor: k.surfaceLowest,
                color: k.textMain,
                borderColor: k.cyan,
              },
            ]}
            keyboardType="numeric"
            value={repValue}
            onChangeText={(val) => onRepTextChange(val.replace(/[^0-9]/g, ''))}
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
                backgroundColor: isCompleted ? k.limeBg : k.cyan,
              },
            ]}
            onPress={onCommitSet}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color="#002b2e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra compacta de ajuste rápido (+ / -) y RPE opcional */}
      <View style={[styles.quickStrip, { borderTopColor: 'rgba(128,128,128,0.15)' }]}>
        <View style={styles.stepperGroup}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: k.surface }]}
            onPress={() => onStepWeight(-mainStepDelta)}
          >
            <Text style={[styles.quickBtnText, { color: k.textMain }]}>
              -{mainStepDelta} {weightUnit}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: k.surface }]}
            onPress={() => onStepWeight(mainStepDelta)}
          >
            <Text style={[styles.quickBtnText, { color: k.cyan }]}>
              +{mainStepDelta} {weightUnit}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stepperGroup}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: k.surface }]}
            onPress={() => onStepReps(-1)}
          >
            <Text style={[styles.quickBtnText, { color: k.textMain }]}>-1 rep</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: k.surface }]}
            onPress={() => onStepReps(1)}
          >
            <Text style={[styles.quickBtnText, { color: k.lime }]}>+1 rep</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.rpeToggleChip,
            {
              backgroundColor: showRpePicker ? k.cyan : k.surface,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            onToggleRpePicker();
          }}
        >
          <Text
            style={[
              styles.rpeToggleText,
              { color: showRpePicker ? '#002b2e' : k.textMuted },
            ]}
          >
            RPE {rpeValue}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selector de RPE desplegable sólo si el usuario lo toca */}
      {showRpePicker && (
        <View style={styles.rpeRow}>
          {RPE_OPTIONS.map((opt) => {
            const selected = rpeValue === opt.val;
            return (
              <TouchableOpacity
                key={opt.val}
                style={[
                  styles.rpeOptionPill,
                  { backgroundColor: selected ? k.cyan : k.surface },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectRpe(opt.val);
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: selected ? '800' : '600',
                    color: selected ? '#002b2e' : k.textMuted,
                  }}
                >
                  {opt.val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '900',
    color: '#002b2e',
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
    borderWidth: 1.2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 6,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rpeToggleChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rpeToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rpeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 8,
  },
  rpeOptionPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
});
