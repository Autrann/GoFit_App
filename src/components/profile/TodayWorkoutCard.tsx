import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { imageMap } from '../../assets/imgs/imageMap';
import {
  DayPlan,
  Exercise,
  ExerciseStatusInfo,
  WorkoutSummary,
} from '../../types';
import KineticButton from '../common/KineticButton';

interface TodayWorkoutCardProps {
  todayPlan: DayPlan | null;
  tomorrowName: string;
  tomorrowPlan: DayPlan | null;
  isFinished: boolean;
  isLogging: boolean;
  totalExercisesCount: number;
  getExerciseStatus: (exerciseId: string) => ExerciseStatusInfo;
  generateSummary: () => WorkoutSummary;
  onToggleLogging: (val: boolean) => void;
  onOpenExerciseModal: (exercise: Exercise) => void;
  onFinishWorkout: () => void;
  onNavigateRoutine: () => void;
  onNavigateStats: () => void;
}

export default function TodayWorkoutCard({
  todayPlan,
  tomorrowName,
  tomorrowPlan,
  isFinished,
  isLogging,
  totalExercisesCount,
  getExerciseStatus,
  generateSummary,
  onToggleLogging,
  onOpenExerciseModal,
  onFinishWorkout,
  onNavigateRoutine,
  onNavigateStats,
}: TodayWorkoutCardProps) {
  const { colors: k, kStyles } = useTheme();

  if (!todayPlan) {
    return (
      <View style={[kStyles.card, { gap: 12 }]}>
        <View style={[kStyles.leftNotch, { backgroundColor: k.warning }]} />
        <Text style={kStyles.kickerLime}>SIN CONFIGURAR</Text>
        <Text style={kStyles.cardTitleItalic}>AÚN NO TIENES RUTINA HOY</Text>
        <Text style={kStyles.bodyMuted}>Configura tus días en la pestaña "Rutina" para comenzar.</Text>
        <KineticButton title="IR A CONFIGURAR RUTINA" icon="barbell" onPress={onNavigateRoutine} />
      </View>
    );
  }

  if (isFinished) {
    const summary = generateSummary();
    return (
      <>
        <View style={[kStyles.card, { gap: 12 }]}>
          <View style={[kStyles.leftNotch, { backgroundColor: k.limeBg }]} />
          <Text style={kStyles.kickerLime}>SESIÓN COMPLETADA 🏆</Text>
          <Text style={kStyles.cardTitleItalic}>¡ENTRENAMIENTO FINALIZADO!</Text>
          <Text style={kStyles.bodyMuted}>Descansa y aliméntate bien para superarte en la siguiente sesión.</Text>
          <View style={[styles.innerBox, { backgroundColor: k.surfaceLowest }]}>
            <Text style={kStyles.kickerMuted}>¿QUÉ TOCA MAÑANA ({tomorrowName.toUpperCase()})?</Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: k.textMain, marginTop: 4 }}>
              {tomorrowPlan?.isRest ? 'Día de Descanso Total 🛏️' : `Día de ${tomorrowPlan?.title || 'Entrenamiento'} 🔥`}
            </Text>
          </View>
        </View>

        <View style={[kStyles.card, { gap: 12 }]}>
          <Text style={kStyles.kickerLime}>REPORTE DE SOBRECARGA</Text>
          <View style={[styles.innerBox, { backgroundColor: k.surfaceLowest, gap: 6 }]}>
            <Text style={{ fontSize: 16, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
              {summary.title}
            </Text>
            <Text style={kStyles.bodyMuted}>{summary.subtitle}</Text>
            {summary.improved.length > 0 && (
              <Text style={{ fontSize: 12, color: k.lime, fontWeight: '800' }}>
                ↑ Mejoraste en: {summary.improved.join(', ')}
              </Text>
            )}
            {summary.decreased.length > 0 && (
              <Text style={{ fontSize: 12, color: k.danger, fontWeight: '800' }}>
                ↓ Menor volumen en: {summary.decreased.join(', ')}
              </Text>
            )}
          </View>
          <KineticButton
            title="VER MÉTRICAS COMPLETAS"
            icon="stats-chart"
            onPress={onNavigateStats}
          />
        </View>
      </>
    );
  }

  if (todayPlan.isRest) {
    return (
      <View style={[kStyles.card, { gap: 10 }]}>
        <View style={[kStyles.leftNotch, { backgroundColor: k.textMuted }]} />
        <Text style={kStyles.kickerMuted}>RECUPERACIÓN ACTIVA</Text>
        <Text style={kStyles.cardTitleItalic}>HOY ES DÍA DE DESCANSO 🛏️</Text>
        <Text style={kStyles.bodyMuted}>El músculo crece cuando descansas. Mantén tu hidratación al día.</Text>
      </View>
    );
  }

  return (
    <View style={[kStyles.card, { gap: 14 }]}>
      <View style={kStyles.leftNotch} />
      <View style={[kStyles.rowBetween, { paddingLeft: 4 }]}>
        <Text style={kStyles.kickerCyan}>{isLogging ? '● SESIÓN EN CURSO' : '● SESIÓN NO INICIADA'}</Text>
        <Text style={[styles.phaseBadge, { backgroundColor: k.surfaceHighest, color: k.textMuted }]}>
          {todayPlan.muscles?.slice(0, 2).join(' • ') || 'HIPERTROFIA'}
        </Text>
      </View>

      <View style={{ paddingLeft: 4 }}>
        <Text style={kStyles.kickerLime}>RUTINA DE HOY</Text>
        <Text style={kStyles.cardTitleItalic}>{todayPlan.title || 'ENTRENAMIENTO DEL DÍA'}</Text>
        <Text style={kStyles.bodyMuted}>
          Registra tus series, peso y repeticiones para calcular tu sobrecarga progresiva.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, paddingLeft: 4 }}>
        <View style={[styles.metricChip, { backgroundColor: k.surfaceLowest }]}>
          <Ionicons name="locate" size={18} color={k.lime} />
          <View>
            <Text style={kStyles.kickerMuted}>OBJETIVO</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>
              {totalExercisesCount * 3} Series
            </Text>
          </View>
        </View>
        <View style={[styles.metricChip, { backgroundColor: k.surfaceLowest }]}>
          <Ionicons name="timer-outline" size={18} color={k.cyan} />
          <View>
            <Text style={kStyles.kickerMuted}>DURACIÓN</Text>
            <Text style={{ fontSize: 12, fontWeight: '900', color: k.textMain }}>
              {totalExercisesCount * 15} - {totalExercisesCount * 15 + 15} Min
            </Text>
          </View>
        </View>
      </View>

      <View style={{ paddingLeft: 4 }}>
        <View style={[kStyles.rowBetween, { marginBottom: 8 }]}>
          <Text style={kStyles.kickerMuted}>{totalExercisesCount} EJERCICIOS PROGRAMADOS</Text>
          <TouchableOpacity onPress={() => onToggleLogging(!isLogging)}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: k.cyan }}>
              {isLogging ? 'Ocultar lista' : 'Ver desglose'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isLogging ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {todayPlan.exercises.map((ex, i) => (
              <TouchableOpacity
                key={`${ex.id}-${i}`}
                style={[styles.previewPill, { backgroundColor: k.surfaceHighest }]}
                onPress={() => {
                  onToggleLogging(true);
                  onOpenExerciseModal(ex);
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: k.textMain }}>{ex.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {todayPlan.exercises.map((ex, idx) => {
              const st = getExerciseStatus(ex.id);
              return (
                <TouchableOpacity
                  key={`${ex.id}-${idx}`}
                  style={[
                    styles.exRow,
                    { backgroundColor: k.surfaceLowest },
                    st.status === 'complete' && { borderColor: k.limeBg, borderWidth: 1 },
                  ]}
                  onPress={() => onOpenExerciseModal(ex)}
                >
                  {imageMap[ex.id as keyof typeof imageMap] ? (
                    <Image
                      source={imageMap[ex.id as keyof typeof imageMap]}
                      style={[styles.exImg, { backgroundColor: k.surfaceHighest }]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.exImg,
                        { backgroundColor: k.surfaceHighest, justifyContent: 'center', alignItems: 'center' },
                      ]}
                    >
                      <Ionicons name="barbell" size={20} color={k.cyan} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}>
                      {ex.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: st.color, marginTop: 2 }}>
                      {st.text}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={k.textMain} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {!isLogging ? (
        <KineticButton
          title="INICIAR & REGISTRAR SERIES"
          icon="play"
          onPress={() => onToggleLogging(true)}
        />
      ) : (
        <KineticButton
          variant="danger"
          title="TERMINAR REGISTRO DE HOY"
          icon="flag"
          onPress={onFinishWorkout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  innerBox: { padding: 14, borderRadius: 14 },
  phaseBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  metricChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14 },
  previewPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14 },
  exImg: { width: 46, height: 46, borderRadius: 10 },
});
