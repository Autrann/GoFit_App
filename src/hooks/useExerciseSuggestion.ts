import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../config/firebase';
import { Exercise } from '../types';
import { MUSCLE_GROUPS, muscleToImageKey } from '../constants/appConstants';
import { matchesSmartSearch } from '../utils/searchUtils';
import catalog from '../assets/data/catalogo_app.json';

interface UseExerciseSuggestionParams {
  visible: boolean;
  activeDay: string;
  existingCustomExercises: Exercise[];
  onClose: () => void;
  onAddCustomExerciseToDay: (newExercise: Exercise) => Promise<void> | void;
}

export function useExerciseSuggestion({
  visible,
  activeDay,
  existingCustomExercises,
  onClose,
  onAddCustomExerciseToDay,
}: UseExerciseSuggestionParams) {
  const [mode, setMode] = useState<'new' | 'rename'>('new');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [proposedName, setProposedName] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>(MUSCLE_GROUPS[0]);
  const [sendToDevs, setSendToDevs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('new');
      setSelectedExercise(null);
      setIsPickerOpen(false);
      setProposedName('');
      setSearchQuery('');
      setSendToDevs(true);
    }
  }, [visible]);

  const filteredCatalog = useMemo(
    () =>
      (catalog as Exercise[]).filter((ex) =>
        matchesSmartSearch(`${ex.name} ${ex.muscle}`, searchQuery)
      ),
    [searchQuery]
  );

  const handleSubmit = async () => {
    const cleanName = proposedName.trim();

    if (mode === 'new') {
      if (!cleanName) {
        Alert.alert('Falta el nombre', 'Escribe el nombre del ejercicio que deseas agregar a tu rutina.');
        return;
      }

      setSubmitting(true);
      try {
        const user = auth.currentUser;
        const customExercise: Exercise = {
          id: `custom_${Date.now()}`,
          name: cleanName,
          muscle: selectedMuscle,
          image: '',
          muscleImage: muscleToImageKey[selectedMuscle] || undefined,
          instructions: [
            'Ejercicio personalizado guardado en tu cuenta GoFit.',
            'Mantén el control de la técnica y registra tus series para medir tu sobrecarga progresiva.',
          ],
        };

        if (user) {
          const updatedCustomList = [...existingCustomExercises, customExercise];
          await updateDoc(doc(db, 'users', user.uid), {
            customExercises: updatedCustomList,
          });

          if (sendToDevs) {
            await addDoc(collection(db, 'sugerencias'), {
              type: 'nuevo_ejercicio',
              originalExerciseId: null,
              originalExerciseName: null,
              proposedName: cleanName,
              muscleGroup: selectedMuscle,
              userId: user.uid,
              userEmail: user.email || null,
              status: 'pendiente',
              createdAt: new Date().toISOString(),
            });
          }
        }

        await onAddCustomExerciseToDay(customExercise);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '¡Agregado a tu rutina! 💪',
          sendToDevs
            ? `"${cleanName}" se guardó en tu cuenta para ${activeDay} y fue enviado como sugerencia a los desarrolladores.`
            : `"${cleanName}" se guardó en tu cuenta y ya está en tu rutina de ${activeDay}.`
        );
        onClose();
      } catch {
        Alert.alert('Error', 'No se pudo guardar el ejercicio. Verifica tu conexión.');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!selectedExercise) {
        Alert.alert('Falta seleccionar', 'Elige de la lista cuál es el ejercicio que debería tener otro nombre.');
        return;
      }
      if (!cleanName) {
        Alert.alert('Falta el nombre', 'Escribe cómo debería llamarse este ejercicio.');
        return;
      }

      setSubmitting(true);
      try {
        const user = auth.currentUser;
        await addDoc(collection(db, 'sugerencias'), {
          type: 'cambio_nombre',
          originalExerciseId: selectedExercise.id,
          originalExerciseName: selectedExercise.name,
          proposedName: cleanName,
          muscleGroup: selectedExercise.muscle,
          userId: user?.uid || 'anonimo',
          userEmail: user?.email || null,
          status: 'pendiente',
          createdAt: new Date().toISOString(),
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '¡Sugerencia enviada! 🙌',
          'Gracias por ayudarnos a mejorar los nombres del catálogo de GoFit.'
        );
        onClose();
      } catch {
        Alert.alert('Error', 'No se pudo enviar la sugerencia.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return {
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
  };
}
