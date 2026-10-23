import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import catalog from '../assets/data/catalogo_app.json';
import { imageMap } from '../assets/imgs/imageMap';
import { useTheme } from '../context/ThemeContext';
import {
  DAYS_FROM_MONDAY,
  MUSCLE_GROUPS,
  muscleToImageKey,
  Exercise,
  DayPlan,
  Routine,
  defaultDayPlan,
  initialRoutine,
} from '../constants/appConstants';
import KineticHeader from '../components/common/KineticHeader';
import KineticButton from '../components/common/KineticButton';
import CatalogModal from '../components/modals/CatalogModal';
import ExerciseDetailModal from '../components/modals/ExerciseDetailModal';

export default function RoutineScreen() {
  const { colors: k, kStyles } = useTheme();
  const navigation = useNavigation<any>();

  const [userData, setUserData] = useState<any>(null);
  const [routine, setRoutine] = useState<Routine>(initialRoutine);
  const [activeDay, setActiveDay] = useState<string>('Lunes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isCatalogVisible, setCatalogVisible] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    const fetchRoutine = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid, 'data', 'routine'));
        if (docSnap.exists()) setRoutine({ ...initialRoutine, ...docSnap.data() });
      } finally {
        setLoading(false);
      }
    };
    fetchRoutine();
    return () => unsubUser();
  }, []);

  const handleSaveRoutine = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) await setDoc(doc(db, 'users', user.uid, 'data', 'routine'), routine);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const updateActiveDay = (updates: Partial<DayPlan>) => {
    setRoutine((prev) => ({ ...prev, [activeDay]: { ...prev[activeDay], ...updates } }));
  };

  const toggleMuscle = (muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = routine[activeDay].muscles || [];
    const next = current.includes(muscle) ? current.filter((m) => m !== muscle) : [...current, muscle];
    updateActiveDay({ muscles: next });
  };

  const handleAddExercise = () => {
    if (!previewExercise) return;
    const current = routine[activeDay].exercises || [];
    if (!current.find((e) => e.id === previewExercise.id)) {
      updateActiveDay({ exercises: [...current, previewExercise] });
    }
    setPreviewExercise(null);
    setCatalogVisible(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const current = routine[activeDay].exercises || [];
    updateActiveDay({ exercises: current.filter((e) => e.id !== exerciseId) });
  };

  const renderMuscleImage = (muscleName: string, size = 18) => {
    const src = imageMap[muscleToImageKey[muscleName]];
    return src ? (
      <Image source={src} style={{ width: size, height: size, borderRadius: size / 2 }} />
    ) : (
      <Ionicons name="body-outline" size={size} color={k.textMuted} />
    );
  };

  if (loading) {
    return (
      <View style={kStyles.centerContainer}>
        <ActivityIndicator size="large" color={k.lime} />
      </View>
    );
  }

  const currentPlan = routine[activeDay] || defaultDayPlan;
  const activeDaysCount = DAYS_FROM_MONDAY.filter(
    (d) => !routine[d]?.isRest && (routine[d]?.exercises?.length || 0) > 0
  ).length;

  return (
    <SafeAreaView style={kStyles.container}>
      <KineticHeader
        userData={userData}
        fallbackName={auth.currentUser?.displayName}
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

        {/* Selector de Días */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {DAYS_FROM_MONDAY.map((day) => {
            const isSelected = activeDay === day;
            const dPlan = routine[day];
            const hasEx = !dPlan?.isRest && (dPlan?.exercises?.length || 0) > 0;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayTab,
                  { backgroundColor: isSelected ? k.limeBg : k.surfaceHigh, borderColor: k.outline },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveDay(day);
                  setIsEditing(false);
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '900', color: isSelected ? '#3a4a00' : k.textMuted }}>
                  {day.slice(0, 3).toUpperCase()}
                </Text>
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: isSelected ? '#3a4a00' : hasEx ? k.limeBg : 'transparent',
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tarjeta del Día */}
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
            <View style={[styles.editBox, { backgroundColor: k.surfaceLowest }]}>
              <View style={kStyles.rowBetween}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMain }}>¿Es Día de Descanso?</Text>
                <Switch
                  value={currentPlan.isRest}
                  onValueChange={(val) => updateActiveDay({ isRest: val })}
                  trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
                />
              </View>

              {!currentPlan.isRest && (
                <>
                  <Text style={[kStyles.kickerMuted, { marginTop: 12, marginBottom: 6 }]}>TÍTULO DE LA SESIÓN</Text>
                  <TextInput
                    style={kStyles.kineticInput}
                    placeholder="Ej. Torso Pesado, Pierna..."
                    placeholderTextColor={k.textMuted}
                    value={currentPlan.title}
                    onChangeText={(val) => updateActiveDay({ title: val })}
                  />

                  <Text style={[kStyles.kickerMuted, { marginTop: 12, marginBottom: 8 }]}>MÚSCULOS A TRABAJAR</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {MUSCLE_GROUPS.map((m) => {
                      const active = currentPlan.muscles?.includes(m);
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.chip,
                            { backgroundColor: active ? 'rgba(202,253,0,0.16)' : k.surfaceHigh, borderColor: active ? k.limeBg : k.outline },
                          ]}
                          onPress={() => toggleMuscle(m)}
                        >
                          {renderMuscleImage(m)}
                          <Text style={{ fontSize: 12, fontWeight: '800', color: active ? k.lime : k.textMuted }}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={[kStyles.rowBetween, { marginTop: 14 }]}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMain }}>¿Incluir Cardio?</Text>
                    <Switch
                      value={currentPlan.cardio}
                      onValueChange={(val) => updateActiveDay({ cardio: val })}
                      trackColor={{ false: k.surfaceHighest, true: k.warning }}
                    />
                  </View>
                </>
              )}
            </View>
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
                      {renderMuscleImage(m)}
                      <Text style={{ fontSize: 11, fontWeight: '800', color: k.textMain }}>{m}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={kStyles.divider} />

              <Text style={[kStyles.kickerMuted, { marginBottom: 10 }]}>
                DOSSIER DE EJERCICIOS ({currentPlan.exercises?.length || 0})
              </Text>

              <View style={{ gap: 10 }}>
                {currentPlan.exercises?.map((ex, idx) => (
                  <View key={`${ex.id}-${idx}`} style={[styles.exRow, { backgroundColor: k.surfaceLowest }]}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => {
                        const full = catalog.find((item) => item.id === ex.id) || ex;
                        setPreviewExercise(full as Exercise);
                      }}
                    >
                      <View style={[styles.orderBadge, { backgroundColor: k.surfaceHighest }]}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
                          {(idx + 1).toString().padStart(2, '0')}
                        </Text>
                      </View>
                      <Image
                        source={imageMap[ex.id as keyof typeof imageMap]}
                        style={[styles.exImg, { backgroundColor: k.surfaceHighest }]}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }} numberOfLines={1}>
                          {ex.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: k.textMuted }}>{ex.muscle}</Text>
                      </View>
                    </TouchableOpacity>

                    {isEditing && (
                      <TouchableOpacity onPress={() => handleRemoveExercise(ex.id)} style={{ padding: 8 }}>
                        <Ionicons name="trash-outline" size={18} color={k.danger} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: k.surfaceLowest, borderColor: k.cyan }]}
                onPress={() => {
                  if (!isEditing) setIsEditing(true);
                  setCatalogVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={20} color={k.cyan} />
                <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>
                  EXPLORAR CATÁLOGO & AÑADIR EJERCICIO
                </Text>
              </TouchableOpacity>
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
        onClose={() => setCatalogVisible(false)}
        onSelectExercise={(ex) => setPreviewExercise(ex)}
      />

      <ExerciseDetailModal
        exercise={previewExercise}
        activeDay={activeDay}
        isInRoutine={!!currentPlan.exercises?.some((e) => e.id === previewExercise?.id)}
        onClose={() => setPreviewExercise(null)}
        onAdd={handleAddExercise}
        onRemove={handleRemoveExercise}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  savePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  dayTab: { minWidth: 56, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, alignItems: 'center', gap: 4, borderWidth: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  editBox: { padding: 14, borderRadius: 16, marginBottom: 14, marginLeft: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14 },
  orderBadge: { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  exImg: { width: 48, height: 48, borderRadius: 10 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});