import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../types';
import { imageMap } from '../../assets/imgs/imageMap';
import catalog from '../../assets/data/catalogo_app.json';

interface RoutineExerciseListProps {
  exercises: Exercise[];
  isEditing: boolean;
  onPreviewExercise: (exercise: Exercise) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onOpenCatalog: () => void;
}

export default function RoutineExerciseList({
  exercises,
  isEditing,
  onPreviewExercise,
  onRemoveExercise,
  onOpenCatalog,
}: RoutineExerciseListProps) {
  const { colors: k } = useTheme();

  return (
    <>
      <View style={{ gap: 10 }}>
        {exercises.map((ex, idx) => (
          <View key={`${ex.id}-${idx}`} style={[styles.exRow, { backgroundColor: k.surfaceLowest }]}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                const full = (catalog as Exercise[]).find((item) => item.id === ex.id) || ex;
                onPreviewExercise(full);
              }}
            >
              <View style={[styles.orderBadge, { backgroundColor: k.surfaceHighest }]}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
                  {(idx + 1).toString().padStart(2, '0')}
                </Text>
              </View>

              {imageMap[ex.id as keyof typeof imageMap] ? (
                <Image
                  source={imageMap[ex.id as keyof typeof imageMap]}
                  style={[styles.exImg, { backgroundColor: k.surfaceHighest }]}
                />
              ) : (
                <View
                  style={[
                    styles.exImg,
                    { backgroundColor: k.surfaceHighest, justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Ionicons name="barbell" size={20} color={k.cyan} />
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
                  numberOfLines={1}
                >
                  {ex.name}
                </Text>
                <Text style={{ fontSize: 11, color: k.textMuted }}>{ex.muscle}</Text>
              </View>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity
                onPress={() => onRemoveExercise(ex.id)}
                style={[styles.deleteBtnBox, { backgroundColor: 'rgba(255, 115, 81, 0.14)' }]}
              >
                <Ionicons name="trash-outline" size={18} color={k.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: k.surfaceLowest, borderColor: k.cyan }]}
        onPress={onOpenCatalog}
      >
        <Ionicons name="add-circle" size={20} color={k.cyan} />
        <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan }}>
          EXPLORAR CATÁLOGO & AÑADIR EJERCICIO
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  exRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14 },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  exImg: { width: 48, height: 48, borderRadius: 10 },
  deleteBtnBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
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
