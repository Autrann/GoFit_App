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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { auth, db } from '../../config/firebase';
import { useTheme } from '../../context/ThemeContext';
import { Exercise, MUSCLE_GROUPS, muscleToImageKey } from '../../constants/appConstants';
import { matchesSmartSearch } from '../../utils/searchUtils';
import catalog from '../../assets/data/catalogo_app.json';
import { imageMap } from '../../assets/imgs/imageMap';
import GoFitBottomSheet from '../common/GoFitBottomSheet';
import KineticButton from '../common/KineticButton';

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

  // 'new' = Crear ejercicio para su cuenta/rutina + opción de sugerir a devs
  // 'rename' = Sugerir otro nombre a un ejercicio existente
  const [mode, setMode] = useState<'new' | 'rename'>('new');

  // Estados para sugerir otro nombre
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para crear / renombrar
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

  const filteredCatalog = catalog.filter((ex) =>
    matchesSmartSearch(`${ex.name} ${ex.muscle}`, searchQuery)
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
          // 1. Guardamos el ejercicio en la cuenta del usuario para que persista entre actualizaciones de la app
          const updatedCustomList = [...existingCustomExercises, customExercise];
          await updateDoc(doc(db, 'users', user.uid), {
            customExercises: updatedCustomList,
          });

          // 2. Si el usuario marcó que falta en la app, lo enviamos también a sugerencias para los desarrolladores
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

        // 3. Lo agregamos inmediatamente a la rutina del día activo
        await onAddCustomExerciseToDay(customExercise);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '¡Agregado a tu rutina! 💪',
          sendToDevs
            ? `"${cleanName}" se guardó en tu cuenta para ${activeDay} y fue enviado como sugerencia a los desarrolladores.`
            : `"${cleanName}" se guardó en tu cuenta y ya está en tu rutina de ${activeDay}.`
        );
        onClose();
      } catch (error) {
        console.error('Error creando ejercicio personalizado:', error);
        Alert.alert('Error', 'No se pudo guardar el ejercicio. Verifica tu conexión.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // MODO: SUGERIR OTRO NOMBRE PARA UN EJERCICIO EXISTENTE
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
      } catch (error) {
        console.error('Error guardando sugerencia de nombre:', error);
        Alert.alert('Error', 'No se pudo enviar la sugerencia.');
      } finally {
        setSubmitting(false);
      }
    }
  };

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
        /* PESTAÑA 1: CREAR EJERCICIO EN LA CUENTA DEL USUARIO + SUGERIR A DEVS */
        <View style={{ gap: 12 }}>
          <Text style={kStyles.bodyMuted}>
            Crea tu ejercicio para usarlo hoy en tu rutina de <Text style={{ color: k.lime, fontWeight: '800' }}>{activeDay}</Text>. Se guardará en tu cuenta para que puedas seguir usandolo.
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

          {/* Pregunta si desea enviarlo como sugerencia a los desarrolladores */}
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
        /* PESTAÑA 2: SUGERIR OTRO NOMBRE A UN EJERCICIO DEL CATÁLOGO */
        <View style={{ gap: 12 }}>
          <Text style={kStyles.bodyMuted}>
            ¿Un ejercicio del catálogo tiene un nombre extraño o poco común? Selecciónalo y dinos cómo debería llamarse.
          </Text>

          <View>
            <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. EJERCICIO ACTUAL EN CATÁLOGO</Text>
            <TouchableOpacity
              style={[
                styles.selectorTrigger,
                { backgroundColor: k.surfaceLowest, borderColor: selectedExercise ? k.cyan : k.outline },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setIsPickerOpen(!isPickerOpen);
              }}
            >
              {selectedExercise ? (
                <View style={[kStyles.rowAlign, { flex: 1 }]}>
                  {imageMap[selectedExercise.id as keyof typeof imageMap] && (
                    <Image
                      source={imageMap[selectedExercise.id as keyof typeof imageMap]}
                      style={[styles.miniImg, { backgroundColor: k.surfaceHighest }]}
                    />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain }} numberOfLines={1}>
                      {selectedExercise.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: k.textMuted }}>{selectedExercise.muscle}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMuted }}>
                  Toca para buscar y elegir el ejercicio...
                </Text>
              )}
              <Ionicons
                name={isPickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={k.cyan}
              />
            </TouchableOpacity>
          </View>

          {isPickerOpen && (
            <View style={[styles.pickerDropdownBox, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
              <View style={[styles.miniSearchBox, { backgroundColor: k.surfaceHigh }]}>
                <Ionicons name="search" size={16} color={k.cyan} />
                <TextInput
                  style={{ flex: 1, marginLeft: 8, color: k.textMain, fontSize: 13, fontWeight: '600' }}
                  placeholder="Buscar ejercicio..."
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
                      setSelectedExercise(item as Exercise);
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
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  miniImg: { width: 38, height: 38, borderRadius: 8, marginRight: 10 },
  pickerDropdownBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  miniSearchBox: {
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