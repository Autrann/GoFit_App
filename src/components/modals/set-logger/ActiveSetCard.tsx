import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../context/ThemeContext';
import { RPE_OPTIONS } from '../../../constants/appConstants';
import { WeightUnit } from '../../../types';
import KineticButton from '../../common/KineticButton';

interface ActiveSetCardProps {
  setIndex: number;
  repValue: string;
  rpeValue: string;
  localWeightInput: string;
  weightUnit: WeightUnit;
  prevWeightLabel: string;
  prevRepsLabel: string;
  mainStepDelta: number;
  quickIncrements: number[];
  showRpeHelp: boolean;
  onToggleRpeHelp: () => void;
  onToggleWeightUnit: () => void;
  onStepWeight: (delta: number) => void;
  onWeightTextChange: (text: string) => void;
  onStepReps: (delta: number) => void;
  onRepTextChange: (text: string) => void;
  onSelectRpe: (rpeVal: string) => void;
  onCommitSet: () => void;
}

export default function ActiveSetCard({
  setIndex,
  repValue,
  rpeValue,
  localWeightInput,
  weightUnit,
  prevWeightLabel,
  prevRepsLabel,
  mainStepDelta,
  quickIncrements,
  showRpeHelp,
  onToggleRpeHelp,
  onToggleWeightUnit,
  onStepWeight,
  onWeightTextChange,
  onStepReps,
  onRepTextChange,
  onSelectRpe,
  onCommitSet,
}: ActiveSetCardProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={[styles.activeMonolith, { backgroundColor: k.surfaceHighest }]}>
      <LinearGradient colors={[k.limeBg, k.cyan]} style={styles.monolithLeftBar} />

      <View style={[kStyles.rowBetween, { marginBottom: 12, paddingLeft: 4 }]}>
        <View style={kStyles.rowAlign}>
          <View style={[styles.activeSetBadge, { backgroundColor: k.limeBg }]}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: '#3a4a00' }}>SERIE {setIndex + 1}</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: k.cyan }}>EN CURSO • OBJETIVO</Text>
        </View>
        <Text style={{ fontSize: 10, color: k.textMuted, fontWeight: '600' }}>
          Ant: {prevWeightLabel} {weightUnit} × {prevRepsLabel}
        </Text>
      </View>

      <View style={styles.steppersGrid}>
        {/* Card de Peso con Botón Interactivo KG ⇄ LBS */}
        <View style={[styles.stepperBox, { backgroundColor: k.surface }]}>
          <View style={kStyles.rowBetween}>
            <Text style={[styles.stepperLabel, { color: k.textMuted }]}>
              PESO ({weightUnit.toUpperCase()})
            </Text>

            <TouchableOpacity
              style={[
                styles.unitSwitchPill,
                {
                  backgroundColor: weightUnit === 'lbs' ? k.cyan : k.surfaceHigh,
                  borderColor: k.cyan,
                },
              ]}
              onPress={onToggleWeightUnit}
            >
              <Ionicons
                name="swap-horizontal"
                size={11}
                color={weightUnit === 'lbs' ? '#002b2e' : k.cyan}
              />
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '900',
                  color: weightUnit === 'lbs' ? '#002b2e' : k.cyan,
                }}
              >
                {weightUnit.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[kStyles.rowBetween, { marginVertical: 4 }]}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
              onPress={() => onStepWeight(-mainStepDelta)}
            >
              <Text style={[styles.stepBtnText, { color: k.textMain }]}>-</Text>
            </TouchableOpacity>

            <TextInput
              style={[styles.stepperBigInput, { color: k.textMain }]}
              keyboardType="decimal-pad"
              value={localWeightInput}
              onChangeText={onWeightTextChange}
              placeholder="0"
              placeholderTextColor={k.textMuted}
            />

            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
              onPress={() => onStepWeight(mainStepDelta)}
            >
              <Text style={[styles.stepBtnText, { color: k.textMain }]}>+</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
            {quickIncrements.map((delta) => (
              <TouchableOpacity
                key={delta}
                style={[styles.quickIncChip, { backgroundColor: k.surfaceHigh }]}
                onPress={() => onStepWeight(delta)}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted }}>
                  +{delta}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card de Repeticiones */}
        <View style={[styles.stepperBox, { backgroundColor: k.surface }]}>
          <View style={kStyles.rowBetween}>
            <Text style={[styles.stepperLabel, { color: k.textMuted }]}>REPETICIONES</Text>
            <Ionicons name="repeat-outline" size={14} color={k.textMuted} />
          </View>
          <View style={[kStyles.rowBetween, { marginVertical: 4 }]}>
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
              onPress={() => onStepReps(-1)}
            >
              <Text style={[styles.stepBtnText, { color: k.textMain }]}>-</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperBigInput, { color: k.textMain }]}
              keyboardType="numeric"
              value={repValue}
              onChangeText={(val) => onRepTextChange(val.replace(/[^0-9]/g, ''))}
              placeholder="10"
              placeholderTextColor={k.textMuted}
            />
            <TouchableOpacity
              style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
              onPress={() => onStepReps(1)}
            >
              <Text style={[styles.stepBtnText, { color: k.textMain }]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={[kStyles.rowBetween, { marginTop: 8 }]}>
            <Text style={{ fontSize: 9, color: k.textMuted }}>Rango sug:</Text>
            <Text style={{ fontSize: 9, fontWeight: '800', color: k.lime }}>8 - 12 reps</Text>
          </View>
        </View>
      </View>

      {/* Selector de RPE con Botón "?" y Mensaje Flotante */}
      <View style={{ paddingLeft: 4, marginBottom: 12, gap: 6 }}>
        <View style={kStyles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.stepperLabel, { color: k.textMuted }]}>
              ESFUERZO PERCIBIDO (RPE)
            </Text>
            <TouchableOpacity
              style={[
                styles.rpeHelpIconBtn,
                {
                  backgroundColor: showRpeHelp ? k.cyan : 'rgba(0, 244, 254, 0.16)',
                  borderColor: k.cyan,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                onToggleRpeHelp();
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '900',
                  color: showRpeHelp ? '#000' : k.cyan,
                }}
              >
                ?
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 10, fontWeight: '800', color: k.cyan }}>
            {RPE_OPTIONS.find((o) => o.val === rpeValue)?.label}
          </Text>
        </View>

        {showRpeHelp && (
          <View
            style={[
              styles.rpeFloatingTooltip,
              { backgroundColor: k.surfaceLowest, borderColor: k.cyan },
            ]}
          >
            <View style={[kStyles.rowBetween, { marginBottom: 4 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="information-circle" size={15} color={k.cyan} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>
                  ¿QUÉ ES EL RPE (ESFUERZO PERCIBIDO)?
                </Text>
              </View>
              <TouchableOpacity onPress={onToggleRpeHelp}>
                <Ionicons name="close" size={16} color={k.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: k.textMain, lineHeight: 16 }}>
              Se basa en cuántas{' '}
              <Text style={{ fontWeight: '800', color: k.lime }}>
                repeticiones te quedaron en reserva (RIR)
              </Text>{' '}
              antes de llegar al fallo muscular en esta serie:
            </Text>
            <View style={{ marginTop: 4, gap: 2 }}>
              <Text style={{ fontSize: 10, color: k.textMuted }}>
                • <Text style={{ fontWeight: '800', color: k.textMain }}>RPE 10:</Text> Fallo total (0 reps en reserva).
              </Text>
              <Text style={{ fontSize: 10, color: k.textMuted }}>
                • <Text style={{ fontWeight: '800', color: k.textMain }}>RPE 9:</Text> Intenso, podías hacer 1 repetición más.
              </Text>
              <Text style={{ fontSize: 10, color: k.textMuted }}>
                • <Text style={{ fontWeight: '800', color: k.textMain }}>RPE 8:</Text> Óptimo, te quedaron 2 repeticiones en reserva.
              </Text>
              <Text style={{ fontSize: 10, color: k.textMuted }}>
                • <Text style={{ fontWeight: '800', color: k.textMain }}>RPE 7:</Text> Moderado, te quedaron 3 repeticiones en reserva.
              </Text>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {RPE_OPTIONS.map((opt) => {
            const selected = rpeValue === opt.val;
            return (
              <TouchableOpacity
                key={opt.val}
                style={[styles.rpePill, { backgroundColor: selected ? k.cyan : k.surface }]}
                onPress={() => onSelectRpe(opt.val)}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: selected ? '900' : '800',
                    color: selected ? '#000' : k.textMuted,
                  }}
                >
                  {opt.val}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KineticButton
        title={`COMPLETAR SERIE ${setIndex + 1}`}
        icon="checkmark-circle"
        onPress={onCommitSet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  activeMonolith: { borderRadius: 18, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' },
  monolithLeftBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  activeSetBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  steppersGrid: { flexDirection: 'row', gap: 10, marginBottom: 12, paddingLeft: 4 },
  stepperBox: { flex: 1, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  stepperLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  unitSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '900' },
  stepperBigInput: { fontSize: 22, fontWeight: '900', textAlign: 'center', minWidth: 55, paddingVertical: 0 },
  quickIncChip: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  rpeHelpIconBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpeFloatingTooltip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
  },
  rpePill: { minWidth: 40, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
});
