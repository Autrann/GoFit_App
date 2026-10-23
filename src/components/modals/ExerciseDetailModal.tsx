import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../constants/appConstants';
import { imageMap } from '../../assets/imgs/imageMap';
import KineticButton from '../common/KineticButton';
import GoFitBottomSheet from '../common/GoFitBottomSheet';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  activeDay: string;
  isInRoutine: boolean;
  onClose: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

export default function ExerciseDetailModal({
  exercise,
  activeDay,
  isInRoutine,
  onClose,
  onAdd,
  onRemove,
}: ExerciseDetailModalProps) {
  const { colors: k, kStyles } = useTheme();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <GoFitBottomSheet visible={!!exercise} onClose={onClose}>
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Ionicons name="close-circle" size={30} color={k.textMuted} />
      </TouchableOpacity>

      {exercise && imageMap[exercise.id as keyof typeof imageMap] ? (
        <Image
          source={imageMap[exercise.id as keyof typeof imageMap]}
          style={styles.previewImg}
          resizeMode="contain"
        />
      ) : (
        <View style={[styles.previewImg, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: k.textMuted }}>Sin imagen disponible</Text>
        </View>
      )}

      <View style={[kStyles.rowBetween, { marginBottom: 6 }]}>
        <View style={kStyles.intelPill}>
          <View style={kStyles.intelDot} />
          <Text style={kStyles.intelPillText}>ENFOQUE: {exercise?.muscle?.toUpperCase()}</Text>
        </View>

        {exercise?.muscleImage && imageMap[exercise.muscleImage as keyof typeof imageMap] && (
          <Image
            source={imageMap[exercise.muscleImage as keyof typeof imageMap]}
            style={[styles.anatomyIcon, { backgroundColor: k.surfaceLowest }]}
            resizeMode="contain"
          />
        )}
      </View>

      <Text style={[kStyles.cardTitleItalic, { marginBottom: 12 }]}>{exercise?.name}</Text>

      <TouchableOpacity
        style={[styles.guideBtn, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowGuide(!showGuide);
        }}
      >
        <Ionicons name={showGuide ? 'book' : 'book-outline'} size={18} color={k.cyan} />
        <Text style={{ fontSize: 11, fontWeight: '900', color: k.cyan, letterSpacing: 0.6 }}>
          {showGuide ? 'OCULTAR TÉCNICA DE EJECUCIÓN' : 'VER GUÍA DE EJECUCIÓN PASO A PASO'}
        </Text>
        <Ionicons name={showGuide ? 'chevron-up' : 'chevron-down'} size={16} color={k.cyan} />
      </TouchableOpacity>

      {showGuide && (
        <ScrollView style={{ maxHeight: 180, marginTop: 12 }} showsVerticalScrollIndicator={false}>
          {exercise?.instructions && exercise.instructions.length > 0 ? (
            exercise.instructions.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepBadge, { backgroundColor: k.limeBg }]}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: '#3a4a00' }}>{index + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: k.textMain, lineHeight: 20 }}>{step}</Text>
              </View>
            ))
          ) : (
            <Text style={kStyles.bodyMuted}>No hay guía técnica disponible para este ejercicio.</Text>
          )}
        </ScrollView>
      )}

      <View style={{ marginTop: 18 }}>
        {!isInRoutine ? (
          <KineticButton
            title={`AGREGAR A ${activeDay.toUpperCase()}`}
            icon="add-circle"
            onPress={onAdd}
          />
        ) : (
          <KineticButton
            variant="danger"
            title={`ELIMINAR DE ${activeDay.toUpperCase()}`}
            icon="trash-outline"
            onPress={() => {
              if (exercise) onRemove(exercise.id);
              onClose();
            }}
          />
        )}
      </View>
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  closeBtn: { position: 'absolute', top: 6, right: 20, zIndex: 10 },
  previewImg: { width: '100%', height: 190, borderRadius: 18, backgroundColor: '#FFFFFF', marginBottom: 14 },
  anatomyIcon: { width: 42, height: 42, borderRadius: 10 },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  stepBadge: { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
});