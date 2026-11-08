import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Exercise, WorkoutExerciseLog } from '../../types';
import { useSetLoggerModal } from '../../hooks/useSetLoggerModal';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import SlideToFinish from '../common/SlideToFinish';
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
  const {
    restSeconds,
    timerRunning,
    showRpeHelp,
    setShowRpeHelp,
    weightUnit,
    localWeightInput,
    completedSetsCount,
    allSetsCompleted,
    quickIncrements,
    mainStepDelta,
    formatDisplayWeight,
    toggleWeightUnit,
    adjustTimer,
    resetTimer,
    toggleTimer,
    stepWeightInActiveUnit,
    handleWeightTextChange,
    stepReps,
    handleCommitSet,
  } = useSetLoggerModal({
    visible,
    activeExercise,
    tempReps,
    tempWeights,
    activeSetIndex,
    onUpdateRep,
    onUpdateWeight,
    onCommitActiveSet,
  });

  return (
    <GoFitBottomSheet
      visible={visible}
      onClose={() => onSaveExercise(false)}
      backgroundColor={k.surfaceLow}
      noPadding={true}
    >
      <RestTimerBar
        restSeconds={restSeconds}
        timerRunning={timerRunning}
        onAdjust={adjustTimer}
        onReset={resetTimer}
        onToggleRunning={toggleTimer}
      />

      <SetLoggerHeader
        activeExercise={activeExercise}
        activeExIndex={activeExIndex}
        totalExercisesCount={totalExercisesCount}
        routineTitle={routineTitle}
        prevExData={prevExData}
        weightUnit={weightUnit}
        formatDisplayWeight={formatDisplayWeight}
        onSkipToday={() => onSaveExercise(true)}
      />

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
          const prevW = rawPrevW ? formatDisplayWeight(rawPrevW) : '--';
          const prevR = prevExData?.reps?.[idx] || prevExData?.reps?.[0] || '--';

          if (isFocused) {
            return (
              <ActiveSetCard
                key={`set-${idx}`}
                setIndex={idx}
                repValue={rep}
                rpeValue={tempRpes[idx] || '8.5'}
                localWeightInput={localWeightInput}
                weightUnit={weightUnit}
                prevWeightLabel={prevW}
                prevRepsLabel={prevR}
                mainStepDelta={mainStepDelta}
                quickIncrements={quickIncrements}
                showRpeHelp={showRpeHelp}
                onToggleRpeHelp={() => setShowRpeHelp(!showRpeHelp)}
                onToggleWeightUnit={toggleWeightUnit}
                onStepWeight={stepWeightInActiveUnit}
                onWeightTextChange={handleWeightTextChange}
                onStepReps={stepReps}
                onRepTextChange={(val) => onUpdateRep(idx, val)}
                onSelectRpe={(val) => onUpdateRpe(idx, val)}
                onCommitSet={handleCommitSet}
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
              displayWeight={tempWeights[idx] ? formatDisplayWeight(tempWeights[idx]) : '--'}
              repValue={rep}
              rpeValue={tempRpes[idx] || '8.5'}
              onSelect={() => onSelectSetIndex(idx)}
            />
          );
        })}

        {/* Modificadores de Series (Añadir / Quitar) */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 16 }}>
          <TouchableOpacity style={[styles.modBtn, { backgroundColor: k.surface }]} onPress={onAddExtraSet}>
            <Ionicons name="add" size={16} color={k.lime} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>AÑADIR SERIE</Text>
          </TouchableOpacity>

          {parseInt(tempSetsCount, 10) > 1 && (
            <TouchableOpacity style={[styles.modBtn, { backgroundColor: k.surface }]} onPress={onRemoveLastSet}>
              <Ionicons name="remove" size={16} color={k.textMuted} />
              <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMuted }}>QUITAR SERIE</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer Único con Slider Deslizable */}
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
  tableHeadRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  thText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
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
