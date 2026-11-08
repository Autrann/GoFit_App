import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types';
import { useRoutinePlanner } from '../hooks/useRoutinePlanner';
import KineticHeader from '../components/common/KineticHeader';
import KineticButton from '../components/common/KineticButton';
import CatalogModal from '../components/modals/CatalogModal';
import ExerciseDetailModal from '../components/modals/ExerciseDetailModal';
import ExerciseSuggestionModal from '../components/modals/ExerciseSuggestionModal';
import RoutineDayTabs from '../components/routine/RoutineDayTabs';
import RoutineDayEditor, { MuscleChipIcon } from '../components/routine/RoutineDayEditor';
import EmptyDayCloneBox from '../components/routine/EmptyDayCloneBox';
import RoutineExerciseList from '../components/routine/RoutineExerciseList';

export default function RoutineScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const {
    userData,
    routine,
    activeDay,
    setActiveDay,
    loading,
    saving,
    isEditing,
    setIsEditing,
    isCatalogVisible,
    setCatalogVisible,
    previewExercise,
    setPreviewExercise,
    isSuggestionVisible,
    setSuggestionVisible,
    currentPlan,
    activeDaysCount,
    daysWithInfo,
    isCurrentDayEmpty,
    userCustomExercises,
    handleSaveRoutine,
    handleCopyFromDay,
    updateActiveDay,
    toggleMuscle,
    handleAddExercise,
    handleAddCustomExerciseToDay,
    handleRemoveExercise,
  } = useRoutinePlanner();

  if (loading) {
    return (
      <View style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={k.lime} />
      </View>
    );
  }

  return (
    <SafeAreaView style={kStyles.container}>
      <KineticHeader
        userData={userData}
        fallbackName={auth.currentUser?.displayName}
        brandTitle="GoFit"
        onAvatarPress={() => navigation.navigate('Perfil')}
        rightContent={
          <TouchableOpacity
            style={[styles.savePill, { borderColor: k.lime, backgroundColor: isEditing ? k.limeBg : k.surfaceHigh }]}
            onPress={handleSaveRoutine}
            disabled={saving}
          >
            <Text style={{ fontSize: 11, fontWeight: '900', color: isEditing ? '#3a4a00' : k.lime }}>
              {saving ? '...' : 'GUARDAR'}
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <View style={kStyles.rowBetween}>
            <View style={kStyles.intelPill}>
              <View style={kStyles.intelDot} />
              <Text style={kStyles.intelPillText}>TRAINING ARCHITECTURE</Text>
            </View>
            <Text style={kStyles.kickerMuted}>{activeDaysCount} DÍAS ACTIVOS / SEM</Text>
          </View>
          <Text style={kStyles.mainHeadline}>
            PLANIFICADOR <Text style={{ color: k.lime }}>SEMANAL</Text>
          </Text>
        </View>

        <RoutineDayTabs
          routine={routine}
          activeDay={activeDay}
          onSelectDay={(day) => {
            setActiveDay(day);
            setIsEditing(false);
          }}
        />

        <View style={kStyles.card}>
          <View style={[kStyles.leftNotch, { backgroundColor: currentPlan.isRest ? k.textMuted : k.cyan }]} />

          <View style={[kStyles.rowBetween, { paddingLeft: 6, marginBottom: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={kStyles.kickerLime}>{activeDay.toUpperCase()}</Text>
              <Text style={kStyles.cardTitleItalic} numberOfLines={1}>
                {currentPlan.isRest ? 'DÍA DE DESCANSO 🛏️' : currentPlan.title || 'SESIÓN SIN TÍTULO'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: isEditing ? k.limeBg : k.surfaceHighest }]}
              onPress={() => (isEditing ? handleSaveRoutine() : setIsEditing(true))}
            >
              <Ionicons
                name={isEditing ? 'checkmark-circle' : 'options-outline'}
                size={16}
                color={isEditing ? '#3a4a00' : k.cyan}
              />
              <Text style={{ fontSize: 10, fontWeight: '900', color: isEditing ? '#3a4a00' : k.cyan }}>
                {isEditing ? 'LISTO' : 'EDITAR'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <RoutineDayEditor
              currentPlan={currentPlan}
              onUpdatePlan={updateActiveDay}
              onToggleMuscle={toggleMuscle}
            />
          )}

          {currentPlan.isRest ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
              <Ionicons name="battery-charging" size={40} color={k.lime} />
              <Text style={kStyles.bodyMuted}>Día libre de cargas para supercompensación muscular.</Text>
            </View>
          ) : (
            <View style={{ paddingLeft: 6 }}>
              {!isEditing && currentPlan.muscles?.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {currentPlan.muscles.map((m) => (
                    <View key={m} style={[styles.chip, { backgroundColor: k.surfaceLowest, borderColor: 'transparent' }]}>
                      <MuscleChipIcon muscleName={m} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={kStyles.divider} />

              <View style={[kStyles.rowBetween, { marginBottom: 10 }]}>
                <Text style={kStyles.kickerMuted}>
                  DOSSIER DE EJERCICIOS ({currentPlan.exercises?.length || 0})
                </Text>
              </View>

              {isCurrentDayEmpty && (
                <EmptyDayCloneBox
                  activeDay={activeDay}
                  daysWithInfo={daysWithInfo}
                  routine={routine}
                  onCopyFromDay={handleCopyFromDay}
                />
              )}

              <RoutineExerciseList
                exercises={currentPlan.exercises || []}
                isEditing={isEditing}
                onPreviewExercise={setPreviewExercise}
                onRemoveExercise={handleRemoveExercise}
                onOpenCatalog={() => {
                  if (!isEditing) setIsEditing(true);
                  setCatalogVisible(true);
                }}
              />
            </View>
          )}
        </View>

        {isEditing && (
          <KineticButton
            title={`GUARDAR CAMBIOS DE ${activeDay.toUpperCase()}`}
            icon="checkmark-done-circle"
            loading={saving}
            onPress={handleSaveRoutine}
          />
        )}
      </ScrollView>

      <CatalogModal
        visible={isCatalogVisible}
        currentDayExercises={currentPlan.exercises || []}
        userCustomExercises={userCustomExercises}
        onClose={() => setCatalogVisible(false)}
        onSelectExercise={setPreviewExercise}
        onOpenMissingExerciseModal={() => {
          setCatalogVisible(false);
          setTimeout(() => setSuggestionVisible(true), 250);
        }}
      />

      <ExerciseDetailModal
        exercise={previewExercise}
        activeDay={activeDay}
        isInRoutine={!!currentPlan.exercises?.some((e) => e.id === previewExercise?.id)}
        onClose={() => setPreviewExercise(null)}
        onAdd={handleAddExercise}
        onRemove={handleRemoveExercise}
      />

      <ExerciseSuggestionModal
        visible={isSuggestionVisible}
        activeDay={activeDay}
        existingCustomExercises={userCustomExercises}
        onClose={() => setSuggestionVisible(false)}
        onAddCustomExerciseToDay={handleAddCustomExerciseToDay}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  savePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
});
