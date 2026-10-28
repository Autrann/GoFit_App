import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../constants/appConstants';
import { matchesSmartSearch } from '../../utils/searchUtils';
import catalog from '../../assets/data/catalogo_app.json';
import { imageMap } from '../../assets/imgs/imageMap';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import KineticButton from '../common/KineticButton';

export type CustomPRItem = {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  weight: number;
  reps: number;
  date: string;
};

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

  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialExercise) {
        setSelectedEx(initialExercise);
        const currentPR = existingPRs[initialExercise.id];
        setWeight(currentPR ? currentPR.weight.toString() : '');
        setReps(currentPR ? currentPR.reps.toString() : '1');
        setIsPickerOpen(false);
      } else {
        setSelectedEx(null);
        setWeight('');
        setReps('1');
      }
      setSearchQuery('');
    }
  }, [visible, initialExercise]);

  const filteredCatalog = catalog.filter((ex) =>
    matchesSmartSearch(`${ex.name} ${ex.muscle}`, searchQuery)
  );

  const handleSavePR = async () => {
    if (!selectedEx) {
      Alert.alert('Falta el ejercicio', 'Selecciona de qué ejercicio es este récord personal.');
      return;
    }

    const numWeight = parseFloat(weight.replace(',', '.'));
    const numReps = parseInt(reps, 10) || 1;

    if (isNaN(numWeight) || numWeight <= 0) {
      Alert.alert('Peso inválido', 'Ingresa un peso válido en kilogramos.');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const todayStr = new Date().toISOString().split('T')[0];
        const updatedPRs = {
          ...existingPRs,
          [selectedEx.id]: {
            exerciseId: selectedEx.id,
            exerciseName: selectedEx.name,
            muscle: selectedEx.muscle,
            weight: numWeight,
            reps: numReps,
            date: todayStr,
          },
        };

        await updateDoc(doc(db, 'users', user.uid), {
          customPRs: updatedPRs,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } catch (error) {
      console.error('Error guardando PR:', error);
      Alert.alert('Error', 'No se pudo guardar tu récord personal.');
    } finally {
      setSaving(false);
    }
  };

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
        <TouchableOpacity
          style={[
            styles.selectorTrigger,
            { backgroundColor: k.surfaceLowest, borderColor: selectedEx ? k.gold : k.outline },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setIsPickerOpen(!isPickerOpen);
          }}
        >
          {selectedEx ? (
            <View style={[kStyles.rowAlign, { flex: 1 }]}>
              {imageMap[selectedEx.id as keyof typeof imageMap] && (
                <Image
                  source={imageMap[selectedEx.id as keyof typeof imageMap]}
                  style={[styles.miniImg, { backgroundColor: k.surfaceHighest }]}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }} numberOfLines={1}>
                  {selectedEx.name}
                </Text>
                <Text style={{ fontSize: 11, color: k.gold, fontWeight: '700' }}>{selectedEx.muscle}</Text>
              </View>
            </View>
          ) : (
            <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMuted }}>
              Toca para buscar un ejercicio...
            </Text>
          )}
          <Ionicons name={isPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={k.gold} />
        </TouchableOpacity>
      </View>

      {isPickerOpen && (
        <View style={[styles.pickerDropdown, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
          <View style={[styles.searchRow, { backgroundColor: k.surfaceHigh }]}>
            <Ionicons name="search" size={16} color={k.cyan} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: k.textMain, fontSize: 13, fontWeight: '600' }}
              placeholder="Ej. banca, sentadilla, peso muerto..."
              placeholderTextColor={k.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredCatalog.slice(0, 30)}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 165 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: k.surfaceHigh }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedEx(item as Exercise);
                  const existing = existingPRs[item.id];
                  if (existing) {
                    setWeight(existing.weight.toString());
                    setReps(existing.reps.toString());
                  }
                  setIsPickerOpen(false);
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '800', color: k.textMain }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 10, color: k.cyan, fontWeight: '700' }}>{item.muscle}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

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

const styles = StyleSheet.create({
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  miniImg: { width: 38, height: 38, borderRadius: 8, marginRight: 10 },
  pickerDropdown: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
  },
});