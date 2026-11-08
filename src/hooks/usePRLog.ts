import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../config/firebase';
import { Exercise, CustomPRItem } from '../types';
import { matchesSmartSearch } from '../utils/searchUtils';
import catalog from '../assets/data/catalogo_app.json';

interface UsePRLogParams {
  visible: boolean;
  existingPRs: Record<string, CustomPRItem>;
  initialExercise: Exercise | null;
  onClose: () => void;
}

export function usePRLog({
  visible,
  existingPRs,
  initialExercise,
  onClose,
}: UsePRLogParams) {
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
  }, [visible, initialExercise, existingPRs]);

  const filteredCatalog = useMemo(
    () =>
      (catalog as Exercise[]).filter((ex) =>
        matchesSmartSearch(`${ex.name} ${ex.muscle}`, searchQuery)
      ),
    [searchQuery]
  );

  const handleSelectExercise = (item: Exercise) => {
    setSelectedEx(item);
    const existing = existingPRs[item.id];
    if (existing) {
      setWeight(existing.weight.toString());
      setReps(existing.reps.toString());
    }
    setIsPickerOpen(false);
  };

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
        const updatedPRs: Record<string, CustomPRItem> = {
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
    } catch {
      Alert.alert('Error', 'No se pudo guardar tu récord personal.');
    } finally {
      setSaving(false);
    }
  };

  return {
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
  };
}
