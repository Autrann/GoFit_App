import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise, WorkoutExerciseLog } from '../../types';
import { useSetLoggerModal } from '../../hooks/useSetLoggerModal';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import KineticButton from '../common/KineticButton';
import RestTimerBar from './set-logger/RestTimerBar';
import SetLoggerHeader from './set-logger/SetLoggerHeader';
import ActiveSetCard from './set-logger/ActiveSetCard';
import CompactSetRow from './set-logger/CompactSetRow';

interface SetLoggerModalProps {
  visible: boolean;
  activeExercise: Exercise | null;
  activeExIndex: number;
  totalExercisesCount: number;
  routineTitle?: string;
  prevExData?: WorkoutExerciseLog | null;
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
  onCommitActiveSet: (targetIndex?: number) => void;
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
  const { colors: k } = useTheme();
  const {
    restSeconds,
    timerRunning,
    showRpePicker,
    setShowRpePicker,
    weightUnit,
    localWeights,
    completedSetsCount,
    allSetsCompleted,
    mainStepDelta,
    formatDisplayWeight,
    toggleWeightUnit,
    adjustTimer,
    resetTimer,
    toggleTimer,
    handleWeightTextChangeForSet,
    stepWeightForSet,
    stepRepsForSet,
    handleToggleOrCommitSet,
  } = useSetLoggerModal({
    visible,
    activeExercise,
    tempReps,
    tempWeights,
    activeSetIndex,
    onSelectSetIndex,
    onUpdateRep,
    onUpdateWeight,
    onCommitActiveSet,
  });

  const handleApplyPreviousToSet = (idx: number, prevW: string, prevR: string) => {
    if (prevW !== '--') {
      handleWeightTextChangeForSet(idx, prevW);
    }
    if (prevR !== '--') {
      onUpdateRep(idx, prevR);
    }
  };

  return (
    <GoFitBottomSheet
      visible={visible}
      onClose={() => onSaveExercise(false)}
      backgroundColor={k.surfaceLow}
      noPadding={true}
    >
      <SetLoggerHeader
        activeExercise={activeExercise}
        activeExIndex={activeExIndex}
        totalExercisesCount={totalExercisesCount}
        routineTitle={routineTitle}
        prevExData={prevExData}
        weightUnit={weightUnit}
        formatDisplayWeight={formatDisplayWeight}
        onToggleWeightUnit={toggleWeightUnit}
        onClose={() => onSaveExercise(false)}
      />

      <RestTimerBar
        restSeconds={restSeconds}
        timerRunning={timerRunning}
        onAdjust={adjustTimer}
        onReset={resetTimer}
        onToggleRunning={toggleTimer}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Encabezado limpio de 5 columnas */}
        <View style={styles.tableHeadRow}>
          <Text style={[styles.thText, styles.colSerie, { color: k.textMuted }]}>SERIE</Text>
          <Text style={[styles.thText, styles.colPrev, { color: k.textMuted }]}>ANTERIOR</Text>
          <Text style={[styles.thText, styles.colInput, { color: k.textMuted }]}>
            PESO ({weightUnit.toUpperCase()})
          </Text>
          <Text style={[styles.thText, styles.colInput, { color: k.textMuted }]}>REPS</Text>
          <Text style={[styles.thText, styles.colCheck, { color: k.textMuted }]}>LISTO</Text>
        </View>

        {tempReps.map((rep, idx) => {
          const isFocused = idx === activeSetIndex;
          const isCompleted = rep.trim() !== '' && rep.trim() !== '0';
          const rawPrevW = prevExData?.weights?.[idx] || prevExData?.weights?.[0];
          const prevW = rawPrevW ? formatDisplayWeight(rawPrevW) : '--';
          const prevR = prevExData?.reps?.[idx] || prevExData?.reps?.[0] || '--';
          const fallbackRepNum = parseInt(prevR, 10) || 10;

          if (isFocused) {
            return (
              <ActiveSetCard
                key={`set-${idx}`}
                setIndex={idx}
                isCompleted={isCompleted}
                repValue={rep}
                rpeValue={tempRpes[idx] || '8.5'}
                weightValue={localWeights[idx] ?? ''}
                weightUnit={weightUnit}
                prevWeightLabel={prevW}
                prevRepsLabel={prevR}
                mainStepDelta={mainStepDelta}
                showRpePicker={showRpePicker}
                onToggleRpePicker={() => setShowRpePicker(!showRpePicker)}
                onStepWeight={(delta) => stepWeightForSet(idx, delta)}
                onWeightTextChange={(text) => handleWeightTextChangeForSet(idx, text)}
                onStepReps={(delta) => stepRepsForSet(idx, delta, fallbackRepNum)}
                onRepTextChange={(val) => onUpdateRep(idx, val)}
                onSelectRpe={(val) => onUpdateRpe(idx, val)}
                onApplyPrevious={() => handleApplyPreviousToSet(idx, prevW, prevR)}
                onCommitSet={() => handleToggleOrCommitSet(idx)}
              />
            );
          }

          return (
            <CompactSetRow
              key={`set-${idx}`}
              setIndex={idx}
              isCompleted={isCompleted}
              prevWeightLabel={prevW}
              prevRepsLabel={prevR}
              weightValue={localWeights[idx] ?? ''}
              repValue={rep}
              onFocusRow={() => onSelectSetIndex(idx)}
              onWeightChange={(text) => handleWeightTextChangeForSet(idx, text)}
              onRepChange={(val) => onUpdateRep(idx, val)}
              onApplyPrevious={() => handleApplyPreviousToSet(idx, prevW, prevR)}
              onToggleComplete={() => handleToggleOrCommitSet(idx)}
            />
          );
        })}

        {/* Controles ligeros para Añadir / Quitar serie */}
        <View style={styles.setModRow}>
          <TouchableOpacity
            style={[styles.modBtn, { backgroundColor: k.surface }]}
            onPress={() => {
              Haptics.selectionAsync();
              onAddExtraSet();
            }}
          >
            <Ionicons name="add" size={16} color={k.cyan} />
            <Text style={[styles.modBtnText, { color: k.textMain }]}>Añadir serie</Text>
          </TouchableOpacity>

          {parseInt(tempSetsCount, 10) > 1 && (
            <TouchableOpacity
              style={[styles.modBtn, { backgroundColor: k.surface }]}
              onPress={() => {
                Haptics.selectionAsync();
                onRemoveLastSet();
              }}
            >
              <Ionicons name="remove" size={16} color={k.textMuted} />
              <Text style={[styles.modBtnText, { color: k.textMuted }]}>Quitar serie</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer limpio con botón directo de 1 toque y opción discreta de omitir */}
      <View style={[styles.footer, { backgroundColor: k.surface, borderTopColor: k.outline }]}>
        <KineticButton
          title={
            allSetsCompleted
              ? `GUARDAR EJERCICIO (${completedSetsCount}/${tempReps.length}) ✓`
              : completedSetsCount > 0
              ? `GUARDAR PROGRESO (${completedSetsCount}/${tempReps.length})`
              : 'LISTO'
          }
          icon="checkmark-circle"
          loading={savingExercise}
          onPress={() => onSaveExercise(false)}
        />

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSaveExercise(true);
          }}
        >
          <Text style={[styles.skipLinkText, { color: k.textMuted }]}>
            Omitir este ejercicio hoy
          </Text>
        </TouchableOpacity>
      </View>
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    paddingHorizontal: 18,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 6,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  colSerie: {
    width: 38,
  },
  colPrev: {
    flex: 1.1,
  },
  colInput: {
    flex: 1.15,
    textAlign: 'center',
  },
  colCheck: {
    width: 44,
    textAlign: 'right',
  },
  setModRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  modBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
    borderTopWidth: 1,
  },
  skipLink: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  skipLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
