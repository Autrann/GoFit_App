import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { RPE_OPTIONS } from '../../constants/appConstants';
import KineticButton from '../common/KineticButton';

interface SetLoggerModalProps {
  visible: boolean;
  activeExercise: any;
  activeExIndex: number;
  totalExercisesCount: number;
  routineTitle?: string;
  nextExercise: any;
  prevExData: any;
  tempSetsCount: string;
  tempReps: string[];
  tempWeights: string[];
  tempRpes: string[];
  activeSetIndex: number;
  savingExercise: boolean;
  onSelectSetIndex: (index: number) => void;
  onUpdateRep: (index: number, val: string) => void;
  onUpdateWeight: (index: number, val: string) => void;
  onUpdateRpe: (index: number, val: string) => void;
  onAddExtraSet: () => void;
  onRemoveLastSet: () => void;
  onCommitActiveSet: () => void;
  onSaveExercise: (skipped?: boolean, nextEx?: any) => void;
}

export default function SetLoggerModal({
  visible,
  activeExercise,
  activeExIndex,
  totalExercisesCount,
  routineTitle,
  nextExercise,
  prevExData,
  tempSetsCount,
  tempReps,
  tempWeights,
  tempRpes,
  activeSetIndex,
  savingExercise,
  onSelectSetIndex,
  onUpdateRep,
  onUpdateWeight,
  onUpdateRpe,
  onAddExtraSet,
  onRemoveLastSet,
  onCommitActiveSet,
  onSaveExercise,
}: SetLoggerModalProps) {
  const { colors: k, kStyles } = useTheme();
  const [restSeconds, setRestSeconds] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (visible && timerRunning && restSeconds > 0) {
      interval = setInterval(() => setRestSeconds((prev) => prev - 1), 1000);
    } else if (restSeconds === 0 && timerRunning) {
      setTimerRunning(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    return () => clearInterval(interval);
  }, [visible, timerRunning, restSeconds]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stepWeight = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseFloat(tempWeights[activeSetIndex]) || 0;
    const next = Math.max(0, parseFloat((current + delta).toFixed(2)));
    onUpdateWeight(activeSetIndex, next.toString());
  };

  const stepReps = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = parseInt(tempReps[activeSetIndex]) || 10;
    const next = Math.max(1, current + delta);
    onUpdateRep(activeSetIndex, next.toString());
  };

  const handleCommitSet = () => {
    setRestSeconds(120);
    setTimerRunning(true);
    onCommitActiveSet();
  };

  const currentModalVolume = tempReps.reduce((acc, r, i) => {
    const repVal = parseInt(r) || 0;
    const weightVal = parseFloat(tempWeights[i]) || 1;
    return acc + repVal * weightVal;
  }, 0);

  const prevVolume =
    prevExData && !prevExData.skipped
      ? (prevExData.reps || []).reduce(
          (acc: number, r: string, i: number) =>
            acc + (parseInt(r) || 0) * (parseFloat(prevExData.weights?.[i]) || 1),
          0
        )
      : 0;

  const modalVolDiff =
    prevVolume > 0 ? (((currentModalVolume - prevVolume) / prevVolume) * 100).toFixed(1) : null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={kStyles.modalOverlay}>
        <View style={[styles.monolithSheet, { backgroundColor: k.surfaceLow }]}>
          {/* Drag Handle & Rest Timer Bar */}
          <View style={styles.topArea}>
            <View style={kStyles.dragHandle} />
            <View style={[styles.restTimerBar, { backgroundColor: k.surfaceHighest }]}>
              <View style={kStyles.rowAlign}>
                <View style={styles.timerIconCircle}>
                  <Ionicons name="timer-outline" size={18} color={k.cyan} />
                </View>
                <View>
                  <Text style={kStyles.kickerMuted}>DESCANSO ACTIVO</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={[styles.timerCountdown, { color: k.cyan }]}>{formatTime(restSeconds)}</Text>
                    <Text style={{ fontSize: 10, color: k.textMuted, fontWeight: '600' }}>/ 02:00</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: k.surfaceBright }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRestSeconds((s) => s + 30);
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>+30s</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timerBtn, { backgroundColor: k.surfaceBright, paddingHorizontal: 10 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTimerRunning(!timerRunning);
                  }}
                >
                  <Ionicons name={timerRunning ? 'pause' : 'play'} size={16} color={k.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Dossier Header */}
          <View style={styles.dossierHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={[styles.exOrderBadge, { backgroundColor: k.surfaceHighest }]}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: k.lime }}>
                    EJERCICIO {activeExIndex + 1} DE {totalExercisesCount || 1}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: k.textMuted }}>
                  {activeExercise?.muscle || routineTitle}
                </Text>
              </View>

              <Text style={[styles.dossierTitle, { color: k.textMain }]} numberOfLines={1}>
                {activeExercise?.name}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                <Ionicons name="time-outline" size={14} color={k.gold} />
                <Text style={{ fontSize: 11, color: k.textMuted }}>
                  Registro previo:{' '}
                  <Text style={{ fontWeight: '800', color: k.textMain }}>
                    {prevExData?.weights?.[0]
                      ? `${prevExData.weights[0]} kg × ${prevExData.reps?.[0] || 10} reps`
                      : 'Sin registro previo'}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                style={[styles.utilityBtn, { backgroundColor: k.surface }]}
                onPress={() => onSaveExercise(true)}
              >
                <Ionicons name="ban-outline" size={18} color={k.danger} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.utilityBtn, { backgroundColor: k.surface }]}
                onPress={() => onSaveExercise(false)}
              >
                <Ionicons name="chevron-down" size={20} color={k.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Interactive Sets Table */}
          <ScrollView style={{ paddingHorizontal: 18 }} showsVerticalScrollIndicator={false}>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.thText, { flex: 1.5, color: k.textMuted }]}>SERIE</Text>
              <Text style={[styles.thText, { flex: 2.5, color: k.textMuted }]}>ANTERIOR</Text>
              <Text style={[styles.thText, { flex: 1.5, textAlign: 'center', color: k.textMuted }]}>KG</Text>
              <Text style={[styles.thText, { flex: 1.5, textAlign: 'center', color: k.textMuted }]}>REPS</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'center', color: k.textMuted }]}>RPE</Text>
              <Text style={[styles.thText, { flex: 1.5, textAlign: 'right', color: k.textMuted }]}>ESTADO</Text>
            </View>

            {tempReps.map((rep, idx) => {
              const isFocused = idx === activeSetIndex;
              const isCompleted = rep.trim() !== '' && rep.trim() !== '0';
              const prevW = prevExData?.weights?.[idx] || prevExData?.weights?.[0] || '--';
              const prevR = prevExData?.reps?.[idx] || prevExData?.reps?.[0] || '--';

              if (isFocused) {
                return (
                  <View key={`set-${idx}`} style={[styles.activeMonolith, { backgroundColor: k.surfaceHighest }]}>
                    <LinearGradient colors={[k.limeBg, k.cyan]} style={styles.monolithLeftBar} />

                    <View style={[kStyles.rowBetween, { marginBottom: 12, paddingLeft: 4 }]}>
                      <View style={kStyles.rowAlign}>
                        <View style={[styles.activeSetBadge, { backgroundColor: k.limeBg }]}>
                          <Text style={{ fontSize: 10, fontWeight: '900', color: '#3a4a00' }}>SERIE {idx + 1}</Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: k.cyan }}>EN CURSO • OBJETIVO</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: k.textMuted, fontWeight: '600' }}>
                        Ant: {prevW} kg × {prevR}
                      </Text>
                    </View>

                    {/* Steppers Grid */}
                    <View style={styles.steppersGrid}>
                      {/* Peso */}
                      <View style={[styles.stepperBox, { backgroundColor: k.surface }]}>
                        <View style={kStyles.rowBetween}>
                          <Text style={[styles.stepperLabel, { color: k.textMuted }]}>PESO (KG)</Text>
                          <Ionicons name="barbell-outline" size={14} color={k.textMuted} />
                        </View>
                        <View style={[kStyles.rowBetween, { marginVertical: 4 }]}>
                          <TouchableOpacity
                            style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
                            onPress={() => stepWeight(-2.5)}
                          >
                            <Text style={[styles.stepBtnText, { color: k.textMain }]}>-</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.stepperBigInput, { color: k.textMain }]}
                            keyboardType="decimal-pad"
                            value={tempWeights[idx]}
                            onChangeText={(val) => onUpdateWeight(idx, val.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            placeholderTextColor={k.textMuted}
                          />
                          <TouchableOpacity
                            style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
                            onPress={() => stepWeight(2.5)}
                          >
                            <Text style={[styles.stepBtnText, { color: k.textMain }]}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                          {[1.25, 2.5, 5].map((delta) => (
                            <TouchableOpacity
                              key={delta}
                              style={[styles.quickIncChip, { backgroundColor: k.surfaceHigh }]}
                              onPress={() => stepWeight(delta)}
                            >
                              <Text style={{ fontSize: 9, fontWeight: '800', color: k.textMuted }}>+{delta}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Reps */}
                      <View style={[styles.stepperBox, { backgroundColor: k.surface }]}>
                        <View style={kStyles.rowBetween}>
                          <Text style={[styles.stepperLabel, { color: k.textMuted }]}>REPETICIONES</Text>
                          <Ionicons name="repeat-outline" size={14} color={k.textMuted} />
                        </View>
                        <View style={[kStyles.rowBetween, { marginVertical: 4 }]}>
                          <TouchableOpacity
                            style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
                            onPress={() => stepReps(-1)}
                          >
                            <Text style={[styles.stepBtnText, { color: k.textMain }]}>-</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.stepperBigInput, { color: k.textMain }]}
                            keyboardType="numeric"
                            value={rep}
                            onChangeText={(val) => onUpdateRep(idx, val.replace(/[^0-9]/g, ''))}
                            placeholder="10"
                            placeholderTextColor={k.textMuted}
                          />
                          <TouchableOpacity
                            style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
                            onPress={() => stepReps(1)}
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

                    {/* RPE Selector */}
                    <View style={{ paddingLeft: 4, marginBottom: 12, gap: 6 }}>
                      <View style={kStyles.rowBetween}>
                        <Text style={[styles.stepperLabel, { color: k.textMuted }]}>ESFUERZO PERCIBIDO (RPE)</Text>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: k.cyan }}>
                          {RPE_OPTIONS.find((o) => o.val === (tempRpes[idx] || '8.5'))?.label}
                        </Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {RPE_OPTIONS.map((opt) => {
                          const selected = (tempRpes[idx] || '8.5') === opt.val;
                          return (
                            <TouchableOpacity
                              key={opt.val}
                              style={[
                                styles.rpePill,
                                { backgroundColor: selected ? k.cyan : k.surface },
                              ]}
                              onPress={() => onUpdateRpe(idx, opt.val)}
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
                      title={`COMPLETAR SERIE ${idx + 1}`}
                      icon="checkmark-circle"
                      onPress={handleCommitSet}
                    />
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={`set-${idx}`}
                  style={[styles.compactSetRow, { backgroundColor: k.surface }, !isCompleted && { opacity: 0.65 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectSetIndex(idx);
                  }}
                >
                  <View style={{ flex: 1.5 }}>
                    <View style={[styles.setNumBox, { backgroundColor: k.surfaceHighest }]}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>{idx + 1}</Text>
                    </View>
                  </View>
                  <Text style={{ flex: 2.5, fontSize: 12, fontWeight: '600', color: k.textMuted }}>
                    {prevW} × {prevR}
                  </Text>
                  <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 14, fontWeight: '800', color: k.textMain }}>
                    {tempWeights[idx] || '--'}
                  </Text>
                  <Text style={{ flex: 1.5, textAlign: 'center', fontSize: 14, fontWeight: '800', color: k.textMain }}>
                    {isCompleted ? rep : '--'}
                  </Text>
                  <Text style={{ flex: 1.2, textAlign: 'center', fontSize: 12, color: k.textMuted }}>
                    {tempRpes[idx] || '8.5'}
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
            })}

            {/* Modifiers Row */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 16 }}>
              <TouchableOpacity style={[styles.modBtn, { backgroundColor: k.surface }]} onPress={onAddExtraSet}>
                <Ionicons name="add" size={16} color={k.lime} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>AÑADIR SERIE</Text>
              </TouchableOpacity>

              {parseInt(tempSetsCount) > 1 && (
                <TouchableOpacity style={[styles.modBtn, { backgroundColor: k.surface }]} onPress={onRemoveLastSet}>
                  <Ionicons name="remove" size={16} color={k.textMuted} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMuted }}>QUITAR SERIE</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modBtn, { backgroundColor: k.surface }]}
                onPress={() => onSaveExercise(true)}
              >
                <Ionicons name="close-circle-outline" size={16} color={k.danger} />
                <Text style={{ fontSize: 10, fontWeight: '800', color: k.danger }}>OMITIR HOY</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: k.surface, borderTopColor: k.outline }]}>
            <View style={kStyles.rowBetween}>
              <View style={kStyles.rowAlign}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: k.cyan }} />
                <Text style={{ fontSize: 11, color: k.textMuted, fontWeight: '600' }}>Volumen acumulado:</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: k.textMain }}>
                  {currentModalVolume.toLocaleString()} kg
                </Text>
                {modalVolDiff && (
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: parseFloat(modalVolDiff) >= 0 ? k.lime : k.danger,
                    }}
                  >
                    {parseFloat(modalVolDiff) >= 0 ? `+${modalVolDiff}%` : `${modalVolDiff}%`} vs prev.
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <KineticButton
                style={{ flex: 1 }}
                title={nextExercise ? `SIGUIENTE: ${nextExercise.name}` : 'GUARDAR & VOLVER'}
                icon="arrow-forward"
                iconPosition="right"
                loading={savingExercise}
                onPress={() => onSaveExercise(false, nextExercise)}
              />
              <TouchableOpacity
                style={[styles.doneSquareBtn, { backgroundColor: k.surfaceHighest }]}
                onPress={() => onSaveExercise(false)}
              >
                <Ionicons name="checkmark-done" size={20} color={k.textMain} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  monolithSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', overflow: 'hidden' },
  topArea: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6, alignItems: 'center' },
  restTimerBar: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 244, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCountdown: { fontSize: 18, fontWeight: '900' },
  timerBtn: { height: 32, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  dossierHeader: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  exOrderBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  dossierTitle: { fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
  utilityBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tableHeadRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  thText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
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
  activeMonolith: { borderRadius: 18, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' },
  monolithLeftBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  activeSetBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  steppersGrid: { flexDirection: 'row', gap: 10, marginBottom: 12, paddingLeft: 4 },
  stepperBox: { flex: 1, borderRadius: 14, padding: 10, justifyContent: 'space-between' },
  stepperLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stepBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '900' },
  stepperBigInput: { fontSize: 22, fontWeight: '900', textAlign: 'center', minWidth: 55, paddingVertical: 0 },
  quickIncChip: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  rpePill: { minWidth: 40, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  modBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
  },
  footer: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28, gap: 10, borderTopWidth: 1 },
  doneSquareBtn: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
});