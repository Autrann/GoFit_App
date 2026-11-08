import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { Exercise, CustomPRItem } from '../../types';
import { usePRLog } from '../../hooks/usePRLog';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import KineticButton from '../common/KineticButton';
import ExercisePickerDropdown from '../common/ExercisePickerDropdown';

export type { CustomPRItem };

interface PRLogModalProps {
  visible: boolean;
  existingPRs: Record<string, CustomPRItem>;
  initialExercise?: Exercise | null;
  onClose: () => void;
}

export default function PRLogModal({
  visible,
  existingPRs,
  initialExercise = null,
  onClose,
}: PRLogModalProps) {
  const { colors: k, kStyles } = useTheme();
  const {
    selectedEx,
    isPickerOpen,
    setIsPickerOpen,
    searchQuery,
    setSearchQuery,
    weight,
    setWeight,
    reps,
    setReps,
    saving,
    filteredCatalog,
    handleSelectExercise,
    handleSavePR,
  } = usePRLog({
    visible,
    existingPRs,
    initialExercise,
    onClose,
  });

  return (
    <GoFitBottomSheet visible={visible} onClose={onClose}>
      <View style={[kStyles.rowBetween, { marginBottom: 14 }]}>
        <View>
          <Text style={kStyles.kickerLime}>MARCAS HISTÓRICAS GOFIT</Text>
          <Text style={kStyles.sheetTitle}>REGISTRAR RÉCORD (PR) 🏆</Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={28} color={k.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[kStyles.bodyMuted, { marginBottom: 12 }]}>
        Guarda tus mejores levantamientos (1RM o récords de repeticiones) de forma independiente a tu rutina diaria.
      </Text>

      {/* 1. Selector de Ejercicio */}
      <View style={{ marginBottom: 12 }}>
        <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. EJERCICIO</Text>
        <ExercisePickerDropdown
          selectedExercise={selectedEx}
          isOpen={isPickerOpen}
          searchQuery={searchQuery}
          filteredExercises={filteredCatalog}
          accentColor={k.gold}
          subtitleColor={k.gold}
          placeholderText="Toca para buscar un ejercicio..."
          searchPlaceholder="Ej. banca, sentadilla, peso muerto..."
          onToggleOpen={() => setIsPickerOpen(!isPickerOpen)}
          onChangeSearch={setSearchQuery}
          onSelectExercise={handleSelectExercise}
        />
      </View>

      {/* 2. Peso y Repeticiones del PR */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>2. PESO LOGRADO (KG)</Text>
          <TextInput
            style={[kStyles.kineticInput, { borderColor: k.gold, fontSize: 20, textAlign: 'center' }]}
            placeholder="Ej. 100"
            placeholderTextColor={k.textMuted}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={(val) => setWeight(val.replace(/[^0-9.,]/g, ''))}
            maxLength={6}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>3. REPETICIONES</Text>
          <TextInput
            style={[kStyles.kineticInput, { fontSize: 20, textAlign: 'center' }]}
            placeholder="1"
            placeholderTextColor={k.textMuted}
            keyboardType="numeric"
            value={reps}
            onChangeText={(val) => setReps(val.replace(/[^0-9]/g, ''))}
            maxLength={2}
          />
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <KineticButton
          title="GUARDAR RÉCORD PERSONAL"
          icon="trophy"
          loading={saving}
          onPress={handleSavePR}
        />
      </View>
    </GoFitBottomSheet>
  );
}
