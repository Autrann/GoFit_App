import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types';
import { useStatsData } from '../hooks/useStatsData';
import KineticHeader from '../components/common/KineticHeader';
import ExerciseStatsModal from '../components/modals/ExerciseStatsModal';
import PRLogModal from '../components/modals/PRLogModal';
import StreakConsistencyCard from '../components/stats/StreakConsistencyCard';
import OverloadSection from '../components/stats/OverloadSection';
import PersonalRecordsCard from '../components/stats/PersonalRecordsCard';
import BodyWeightChartCard from '../components/stats/BodyWeightChartCard';

export default function StatsScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const {
    loading,
    userData,
    routineData,
    weightHistory,
    weeklyData,
    timeframe,
    setTimeframe,
    overloadViewMode,
    setOverloadViewMode,
    selectedMuscleFilter,
    setSelectedMuscleFilter,
    routineExercises,
    selectedExerciseId,
    setSelectedExerciseId,
    isExerciseModalVisible,
    setExerciseModalVisible,
    allWorkoutLogs,
    isPRModalVisible,
    setPRModalVisible,
    prInitialExercise,
    setPrInitialExercise,
    realWeightStats,
    latestWeightVal,
    targetWeightVal,
    muscleCategories,
    filteredExercises,
    selectedExHistory,
    pastWorkoutDays,
    customPRsMap,
    customPRsList,
    getExerciseNameById,
  } = useStatsData();

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
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 6 }}>
          <View style={kStyles.intelPill}>
            <View style={kStyles.intelDot} />
            <Text style={kStyles.intelPillText}>PERFORMANCE INTELLIGENCE</Text>
          </View>
          <Text style={kStyles.mainHeadline}>
            PROGRESO & <Text style={{ color: k.lime }}>SOBRECARGA</Text>
          </Text>
        </View>

        <StreakConsistencyCard
          streak={userData?.streak || 0}
          weeklyData={weeklyData}
        />

        <OverloadSection
          overloadViewMode={overloadViewMode}
          selectedMuscleFilter={selectedMuscleFilter}
          muscleCategories={muscleCategories}
          filteredExercises={filteredExercises}
          allWorkoutLogs={allWorkoutLogs}
          pastWorkoutDays={pastWorkoutDays}
          routineData={routineData}
          getExerciseNameById={getExerciseNameById}
          onChangeViewMode={setOverloadViewMode}
          onSelectMuscleFilter={setSelectedMuscleFilter}
          onOpenExerciseStats={(exId) => {
            setSelectedExerciseId(exId);
            setExerciseModalVisible(true);
          }}
        />

        <PersonalRecordsCard
          customPRsList={customPRsList}
          onOpenNewPR={() => {
            setPrInitialExercise(null);
            setPRModalVisible(true);
          }}
          onEditPR={(exercise) => {
            setPrInitialExercise(exercise);
            setPRModalVisible(true);
          }}
        />

        <BodyWeightChartCard
          timeframe={timeframe}
          realWeightStats={realWeightStats}
          latestWeightVal={latestWeightVal}
          targetWeightVal={targetWeightVal}
          weightHistory={weightHistory}
          onChangeTimeframe={setTimeframe}
        />
      </ScrollView>

      <ExerciseStatsModal
        visible={isExerciseModalVisible}
        routineExercises={routineExercises}
        selectedExerciseId={selectedExerciseId}
        exerciseHistory={selectedExHistory}
        onClose={() => setExerciseModalVisible(false)}
        onSelectExercise={setSelectedExerciseId}
      />

      <PRLogModal
        visible={isPRModalVisible}
        existingPRs={customPRsMap}
        initialExercise={prInitialExercise}
        onClose={() => setPRModalVisible(false)}
      />
    </SafeAreaView>
  );
}
