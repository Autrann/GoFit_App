import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { RPE_OPTIONS } from '../../constants/appConstants';
import KineticButton from '../common/KineticButton';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import SlideToFinish from '../common/SlideToFinish';

const KG_TO_LBS = 2.20462;

interface SetLoggerModalProps {
  visible: boolean;
  activeExercise: any;
  activeExIndex: number;
  totalExercisesCount: number;
  routineTitle?: string;
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
  onSaveExercise: (skipped?: boolean) => void;
}

export default function SetLoggerModal({
  visible,
  activeExercise,
  activeExIndex,
  totalExercisesCount,
  routineTitle,
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
  const [showRpeHelp, setShowRpeHelp] = useState(false);

  // Unidad de peso seleccionada (KG o LBS)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [localWeightInput, setLocalWeightInput] = useState('');

  // Funciones de conversión entre KG (base de datos) y LBS (vista de usuario)
  const formatKgToUnit = (kgStr?: string) => {
    if (!kgStr || kgStr.trim() === '') return '';
    const numKg = parseFloat(kgStr);
    if (isNaN(numKg)) return '';
    if (weightUnit === 'kg') return Number(numKg.toFixed(2)).toString();
    return (Math.round(numKg * KG_TO_LBS * 2) / 2).toString();
  };

  const convertUnitToKgString = (valStr: string, unit: 'kg' | 'lbs') => {
    if (!valStr || valStr.trim() === '') return '';
    const num = parseFloat(valStr);
    if (isNaN(num)) return '';
    if (unit === 'kg') return valStr;
    return (num / KG_TO_LBS).toFixed(2);
  };

  // Sincronizar el input visible cada vez que cambia la serie activa o la unidad (KG/LBS)
  useEffect(() => {
    setLocalWeightInput(formatKgToUnit(tempWeights[activeSetIndex]));
  }, [activeSetIndex, weightUnit, tempWeights[activeSetIndex], visible]);

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

  useEffect(() => {
    if (!visible) setShowRpeHelp(false);
  }, [visible, activeExercise]);

  const toggleWeightUnit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeightUnit((prev) => (prev === 'kg' ? 'lbs' : 'kg'));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const adjustTimer = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRestSeconds((prev) => Math.max(0, prev + delta));
  };

  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRestSeconds(120);
    setTimerRunning(false);
  };

  // Ajustar peso respetando la unidad activa (KG o LBS)
  const stepWeightInActiveUnit = (deltaInActiveUnit: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentDisplay = parseFloat(localWeightInput) || 0;
    const nextDisplay = Math.max(0, parseFloat((currentDisplay + deltaInActiveUnit).toFixed(2)));
    const nextDisplayStr = nextDisplay.toString();
    setLocalWeightInput(nextDisplayStr);
    onUpdateWeight(activeSetIndex, convertUnitToKgString(nextDisplayStr, weightUnit));
  };

  const handleWeightTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setLocalWeightInput(cleaned);
    onUpdateWeight(activeSetIndex, convertUnitToKgString(cleaned, weightUnit));
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

  // Verificar si todas las series programadas ya fueron completadas para encender el brillo del Slider
  const completedSetsCount = tempReps.filter((r) => r && r.trim() !== '' && r.trim() !== '0').length;
  const allSetsCompleted = tempReps.length > 0 && completedSetsCount === tempReps.length;

  const quickIncrements = weightUnit === 'kg' ? [1.25, 2.5, 5] : [2.5, 5, 10];
  const mainStepDelta = weightUnit === 'kg' ? 2.5 : 5;

  return (
    <GoFitBottomSheet
      visible={visible}
      onClose={() => onSaveExercise(false)}
      backgroundColor={k.surfaceLow}
      noPadding={true}
    >
      {/* Barra de Cronómetro de Descanso */}
      <View style={styles.topArea}>
        <View style={[styles.restTimerBar, { backgroundColor: k.surfaceHighest }]}>
          <View style={kStyles.rowAlign}>
            <View style={styles.timerIconCircle}>
              <Ionicons name="timer-outline" size={18} color={k.cyan} />
            </View>
            <View>
              <Text style={kStyles.kickerMuted}>DESCANSO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[styles.timerCountdown, { color: k.cyan }]}>{formatTime(restSeconds)}</Text>
                <Text style={{ fontSize: 10, color: k.textMuted, fontWeight: '600' }}>/ 02:00</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <TouchableOpacity
              style={[styles.timerBtn, { backgroundColor: k.surfaceBright }]}
              onPress={() => adjustTimer(-30)}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>-30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timerBtn, { backgroundColor: k.surfaceBright }]}
              onPress={() => adjustTimer(30)}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>+30s</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.timerIconBtn, { backgroundColor: k.surfaceBright }]}
              onPress={resetTimer}
              accessibilityLabel="Reiniciar cronómetro"
            >
              <Ionicons name="refresh" size={15} color={k.cyan} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timerIconBtn,
                { backgroundColor: timerRunning ? k.limeBg : k.surfaceBright },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setTimerRunning(!timerRunning);
              }}
            >
              <Ionicons
                name={timerRunning ? 'pause' : 'play'}
                size={15}
                color={timerRunning ? '#3a4a00' : k.textMain}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Cabecera del Ejercicio */}
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
                  ? `${formatKgToUnit(prevExData.weights[0])} ${weightUnit} × ${prevExData.reps?.[0] || 10} reps`
                  : 'Sin registro previo'}
              </Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.skipExercisePill, { borderColor: 'rgba(255, 115, 81, 0.4)' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSaveExercise(true);
          }}
        >
          <Ionicons name="ban-outline" size={14} color={k.danger} />
          <Text style={[styles.skipExercisePillText, { color: k.danger }]}>Omitir hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Tabla Interactiva de Series */}
      <ScrollView style={{ paddingHorizontal: 18 }} showsVerticalScrollIndicator={false}>
        <View style={styles.tableHeadRow}>
          <Text style={[styles.thText, { flex: 1.5, color: k.textMuted }]}>SERIE</Text>
          <Text style={[styles.thText, { flex: 2.5, color: k.textMuted }]}>ANTERIOR</Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: 'center', color: k.textMuted }]}>
            {weightUnit.toUpperCase()}
          </Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: 'center', color: k.textMuted }]}>REPS</Text>
          <Text style={[styles.thText, { flex: 1.2, textAlign: 'center', color: k.textMuted }]}>RPE</Text>
          <Text style={[styles.thText, { flex: 1.5, textAlign: 'right', color: k.textMuted }]}>ESTADO</Text>
        </View>

        {tempReps.map((rep, idx) => {
          const isFocused = idx === activeSetIndex;
          const isCompleted = rep.trim() !== '' && rep.trim() !== '0';
          const rawPrevW = prevExData?.weights?.[idx] || prevExData?.weights?.[0];
          const prevW = rawPrevW ? formatKgToUnit(rawPrevW) : '--';
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
                    Ant: {prevW} {weightUnit} × {prevR}
                  </Text>
                </View>

                <View style={styles.steppersGrid}>
                  {/* Card de Peso con Botón Interactivo KG ⇄ LBS */}
                  <View style={[styles.stepperBox, { backgroundColor: k.surface }]}>
                    <View style={kStyles.rowBetween}>
                      <Text style={[styles.stepperLabel, { color: k.textMuted }]}>
                        PESO ({weightUnit.toUpperCase()})
                      </Text>

                      {/* Botón Sencillo para intercalar entre KG y LBS */}
                      <TouchableOpacity
                        style={[
                          styles.unitSwitchPill,
                          {
                            backgroundColor: weightUnit === 'lbs' ? k.cyan : k.surfaceHigh,
                            borderColor: k.cyan,
                          },
                        ]}
                        onPress={toggleWeightUnit}
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
                        onPress={() => stepWeightInActiveUnit(-mainStepDelta)}
                      >
                        <Text style={[styles.stepBtnText, { color: k.textMain }]}>-</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.stepperBigInput, { color: k.textMain }]}
                        keyboardType="decimal-pad"
                        value={localWeightInput}
                        onChangeText={handleWeightTextChange}
                        placeholder="0"
                        placeholderTextColor={k.textMuted}
                      />

                      <TouchableOpacity
                        style={[styles.stepBtn, { backgroundColor: k.surfaceHigh }]}
                        onPress={() => stepWeightInActiveUnit(mainStepDelta)}
                      >
                        <Text style={[styles.stepBtnText, { color: k.textMain }]}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                      {quickIncrements.map((delta) => (
                        <TouchableOpacity
                          key={delta}
                          style={[styles.quickIncChip, { backgroundColor: k.surfaceHigh }]}
                          onPress={() => stepWeightInActiveUnit(delta)}
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
                          setShowRpeHelp(!showRpeHelp);
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
                      {RPE_OPTIONS.find((o) => o.val === (tempRpes[idx] || '8.5'))?.label}
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
                        <TouchableOpacity onPress={() => setShowRpeHelp(false)}>
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
                      const selected = (tempRpes[idx] || '8.5') === opt.val;
                      return (
                        <TouchableOpacity
                          key={opt.val}
                          style={[styles.rpePill, { backgroundColor: selected ? k.cyan : k.surface }]}
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
                {tempWeights[idx] ? formatKgToUnit(tempWeights[idx]) : '--'}
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

        {/* Modificadores de Series (Añadir / Quitar) */}
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
        </View>
      </ScrollView>

      {/* Footer Único con Slider Deslizable (Sin botón de palomitas ni "Siguiente Ejercicio") */}
      <View style={[styles.footer, { backgroundColor: k.surface, borderTopColor: k.outline }]}>
        <View style={kStyles.rowBetween}>
          <View style={kStyles.rowAlign}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: allSetsCompleted ? k.lime : k.cyan,
              }}
            />
            <Text style={{ fontSize: 11, color: k.textMuted, fontWeight: '700' }}>
              Progreso de este ejercicio:
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '900',
              color: allSetsCompleted ? k.lime : k.textMain,
            }}
          >
            {completedSetsCount} de {tempReps.length} series listas
          </Text>
        </View>

        <SlideToFinish
          isGlowing={allSetsCompleted}
          loading={savingExercise}
          label={
            allSetsCompleted
              ? '¡SERIES LISTAS! DESLIZA PARA CERRAR'
              : 'DESLIZA PARA CERRAR REGISTRO'
          }
          onComplete={() => onSaveExercise(false)}
        />
      </View>
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  topArea: { paddingHorizontal: 18, paddingBottom: 6, alignItems: 'center' },
  restTimerBar: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 244, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCountdown: { fontSize: 17, fontWeight: '900' },
  timerBtn: { height: 32, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  timerIconBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
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
  skipExercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 115, 81, 0.14)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipExercisePillText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 },
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
});