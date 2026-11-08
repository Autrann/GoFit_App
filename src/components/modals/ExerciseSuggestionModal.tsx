import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../types';
import { MUSCLE_GROUPS } from '../../constants/appConstants';
import { useExerciseSuggestion } from '../../hooks/useExerciseSuggestion';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import KineticButton from '../common/KineticButton';
import ExercisePickerDropdown from '../common/ExercisePickerDropdown';

interface ExerciseSuggestionModalProps {
  visible: boolean;
  activeDay: string;
  existingCustomExercises?: Exercise[];
  onClose: () => void;
  onAddCustomExerciseToDay: (newExercise: Exercise) => Promise<void> | void;
}

export default function ExerciseSuggestionModal({
  visible,
  activeDay,
  existingCustomExercises = [],
  onClose,
  onAddCustomExerciseToDay,
}: ExerciseSuggestionModalProps) {
  const { colors: k, kStyles } = useTheme();
  const {
    mode,
    setMode,
    selectedExercise,
    setSelectedExercise,
    isPickerOpen,
    setIsPickerOpen,
    searchQuery,
    setSearchQuery,
    proposedName,
    setProposedName,
    selectedMuscle,
    setSelectedMuscle,
    sendToDevs,
    setSendToDevs,
    submitting,
    filteredCatalog,
    handleSubmit,
  } = useExerciseSuggestion({
    visible,
    activeDay,
    existingCustomExercises,
    onClose,
    onAddCustomExerciseToDay,
  });

  return (
    <GoFitBottomSheet visible={visible} onClose={onClose} maxHeight="92%">
      <View style={[kStyles.rowBetween, { marginBottom: 12 }]}>
        <View>
          <Text style={kStyles.kickerLime}>PERSONALIZACIÓN</Text>
          <Text style={kStyles.sheetTitle}>¿NO ENCUENTRAS TU EJERCICIO?</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={28} color={k.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Selector de Pestañas */}
      <View style={[styles.modeTabsRow, { backgroundColor: k.surfaceLowest }]}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'new' && { backgroundColor: k.limeBg }]}
          onPress={() => {
            Haptics.selectionAsync();
            setMode('new');
            setIsPickerOpen(false);
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={15}
            color={mode === 'new' ? '#3a4a00' : k.textMuted}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '900',
              color: mode === 'new' ? '#3a4a00' : k.textMuted,
            }}
          >
            CREAR Y AGREGAR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, mode === 'rename' && { backgroundColor: k.cyan }]}
          onPress={() => {
            Haptics.selectionAsync();
            setMode('rename');
          }}
        >
          <Ionicons
            name="create-outline"
            size={15}
            color={mode === 'rename' ? '#00363a' : k.textMuted}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '900',
              color: mode === 'rename' ? '#00363a' : k.textMuted,
            }}
          >
            SUGERIR OTRO NOMBRE
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'new' ? (
        <View style={{ gap: 12 }}>
          <Text style={kStyles.bodyMuted}>
            Crea tu ejercicio para usarlo hoy en tu rutina de{' '}
            <Text style={{ color: k.lime, fontWeight: '800' }}>{activeDay}</Text>. Se guardará en tu
            cuenta para que puedas seguir usandolo.
          </Text>

          <View>
            <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. NOMBRE DEL EJERCICIO</Text>
            <TextInput
              style={kStyles.kineticInput}
              placeholder="Ej. Pendulum Squat / Press Vikingo"
              placeholderTextColor={k.textMuted}
              value={proposedName}
              onChangeText={setProposedName}
            />
          </View>

          <View>
            <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>2. GRUPO MUSCULAR</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {MUSCLE_GROUPS.map((m) => {
                const active = selectedMuscle === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.musclePill,
                      { backgroundColor: active ? k.cyan : k.surfaceLowest },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedMuscle(m);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: active ? '900' : '700',
                        color: active ? '#00363a' : k.textMuted,
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.devSuggestBox, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: k.textMain }}>
                ¿Consideras que hace falta en GoFit?
              </Text>
              <Text style={{ fontSize: 11, color: k.textMuted, marginTop: 2, lineHeight: 15 }}>
                Enviar como sugerencia a los desarrolladores para incluirlo oficialmente.
              </Text>
            </View>
            <Switch
              value={sendToDevs}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setSendToDevs(val);
              }}
              trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
              thumbColor={sendToDevs ? '#3a4a00' : '#f4f3f4'}
            />
          </View>

          <View style={{ marginTop: 4 }}>
            <KineticButton
              title={`GUARDAR Y AGREGAR A ${activeDay.toUpperCase()}`}
              icon="add-circle"
              loading={submitting}
              onPress={handleSubmit}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={kStyles.bodyMuted}>
            ¿Un ejercicio del catálogo tiene un nombre extraño o poco común? Selecciónalo y dinos cómo debería llamarse.
          </Text>

          <View>
            <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. EJERCICIO ACTUAL EN CATÁLOGO</Text>
            <ExercisePickerDropdown
              selectedExercise={selectedExercise}
              isOpen={isPickerOpen}
              searchQuery={searchQuery}
              filteredExercises={filteredCatalog}
              accentColor={k.cyan}
              placeholderText="Toca para buscar y elegir el ejercicio..."
              searchPlaceholder="Buscar ejercicio..."
              onToggleOpen={() => setIsPickerOpen(!isPickerOpen)}
              onChangeSearch={setSearchQuery}
              onSelectExercise={(item) => {
                setSelectedExercise(item);
                setIsPickerOpen(false);
              }}
            />
          </View>

          <View>
            <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>2. ¿CÓMO DEBERÍA LLAMARSE?</Text>
            <TextInput
              style={kStyles.kineticInput}
              placeholder="Ej. Press Militar con Barra / Elevaciones Laterales"
              placeholderTextColor={k.textMuted}
              value={proposedName}
              onChangeText={setProposedName}
            />
          </View>

          <View style={{ marginTop: 4 }}>
            <KineticButton
              title="ENVIAR SUGERENCIA DE NOMBRE"
              icon="paper-plane"
              loading={submitting}
              onPress={handleSubmit}
            />
          </View>
        </View>
      )}
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  modeTabsRow: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 14,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  musclePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  devSuggestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
