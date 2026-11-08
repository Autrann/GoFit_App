import React from 'react';
import { View, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { auth } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';
import { MainTabParamList } from '../types';
import { useProfileWorkout } from '../hooks/useProfileWorkout';
import KineticHeader from '../components/common/KineticHeader';
import HydrationCard from '../components/common/HydrationCard';
import SetLoggerModal from '../components/modals/SetLoggerModal';
import ProfileOptionsModal from '../components/modals/ProfileOptionsModal';
import ProfileGreetingHeader from '../components/profile/ProfileGreetingHeader';
import TodayWorkoutCard from '../components/profile/TodayWorkoutCard';
import WeightControlCard from '../components/profile/WeightControlCard';

export default function ProfileScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const {
    today,
    todayName,
    tomorrowName,
    userData,
    loading,
    isLogging,
    setIsLogging,
    workoutLog,
    lastWeekLog,
    isProfileModalVisible,
    setProfileModalVisible,
    tempWeight,
    setTempWeight,
    tempTargetWeight,
    setTempTargetWeight,
    tempMaintainMode,
    setTempMaintainMode,
    isWeightInputOpen,
    setIsWeightInputOpen,
    savingSettings,
    activeExercise,
    tempSetsCount,
    tempReps,
    setTempReps,
    tempWeights,
    tempRpes,
    setTempRpes,
    activeSetIndex,
    setActiveSetIndex,
    savingExercise,
    todayPlan,
    tomorrowPlan,
    totalExercisesCount,
    activeExIndex,
    prevWeightDiff,
    stageAnalytics,
    handleSelectAvatar,
    handleUpdateWaterLiters,
    handleUpdateWeightAndGoal,
    openExerciseModal,
    handleSetsCountChange,
    handleUpdateWeightWithCarryOver,
    selectSetIndexWithCarryOver,
    commitActiveSet,
    saveExerciseLog,
    getExerciseStatus,
    finishWorkout,
    generateSummary,
  } = useProfileWorkout(k);

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
        onAvatarPress={() => setProfileModalVisible(true)}
      />

      <ScrollView contentContainerStyle={kStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <ProfileGreetingHeader
          todayName={todayName}
          today={today}
          streak={userData?.streak || 0}
          displayName={userData?.name || auth.currentUser?.displayName}
        />

        <TodayWorkoutCard
          todayPlan={todayPlan}
          tomorrowName={tomorrowName}
          tomorrowPlan={tomorrowPlan}
          isFinished={Boolean(workoutLog.finished)}
          isLogging={isLogging}
          totalExercisesCount={totalExercisesCount}
          getExerciseStatus={getExerciseStatus}
          generateSummary={generateSummary}
          onToggleLogging={setIsLogging}
          onOpenExerciseModal={openExerciseModal}
          onFinishWorkout={finishWorkout}
          onNavigateRoutine={() => navigation.navigate('Rutina')}
          onNavigateStats={() => navigation.navigate('Estadísticas')}
        />

        <WeightControlCard
          userData={userData}
          prevWeightDiff={prevWeightDiff}
          stageAnalytics={stageAnalytics}
          isWeightInputOpen={isWeightInputOpen}
          tempWeight={tempWeight}
          tempTargetWeight={tempTargetWeight}
          tempMaintainMode={tempMaintainMode}
          savingSettings={savingSettings}
          onToggleInputOpen={() => setIsWeightInputOpen(!isWeightInputOpen)}
          onChangeTempWeight={setTempWeight}
          onChangeTempTargetWeight={setTempTargetWeight}
          onToggleMaintainMode={setTempMaintainMode}
          onSaveWeightAndGoal={handleUpdateWeightAndGoal}
        />

        <HydrationCard
          liters={workoutLog.waterLiters || 0}
          goalLiters={3.0}
          stepMl={250}
          onChangeLiters={handleUpdateWaterLiters}
        />
      </ScrollView>

      <SetLoggerModal
        visible={!!activeExercise}
        activeExercise={activeExercise}
        activeExIndex={activeExIndex}
        totalExercisesCount={totalExercisesCount}
        routineTitle={todayPlan?.title}
        prevExData={activeExercise ? lastWeekLog?.exercises?.[activeExercise.id] : null}
        tempSetsCount={tempSetsCount}
        tempReps={tempReps}
        tempWeights={tempWeights}
        tempRpes={tempRpes}
        activeSetIndex={activeSetIndex}
        savingExercise={savingExercise}
        onSelectSetIndex={selectSetIndexWithCarryOver}
        onUpdateRep={(idx, val) => {
          const r = [...tempReps];
          r[idx] = val;
          setTempReps(r);
        }}
        onUpdateWeight={handleUpdateWeightWithCarryOver}
        onUpdateRpe={(idx, val) => {
          const rp = [...tempRpes];
          rp[idx] = val;
          setTempRpes(rp);
        }}
        onAddExtraSet={() => {
          const next = (parseInt(tempSetsCount, 10) || 0) + 1;
          handleSetsCountChange(next);
          setActiveSetIndex(next - 1);
        }}
        onRemoveLastSet={() => handleSetsCountChange(Math.max(1, (parseInt(tempSetsCount, 10) || 1) - 1))}
        onCommitActiveSet={commitActiveSet}
        onSaveExercise={saveExerciseLog}
      />

      <ProfileOptionsModal
        visible={isProfileModalVisible}
        currentAvatarId={userData?.avatarId}
        saving={savingSettings}
        onClose={() => setProfileModalVisible(false)}
        onSelectAvatar={handleSelectAvatar}
        onLogout={() => {
          setProfileModalVisible(false);
          auth.signOut();
        }}
      />
    </SafeAreaView>
  );
}
