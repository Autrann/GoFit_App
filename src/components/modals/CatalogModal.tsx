import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, FlatList, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../constants/appConstants';
import { matchesSmartSearch, normalizeSearchText } from '../../utils/searchUtils';
import catalog from '../../assets/data/catalogo_app.json';
import { imageMap } from '../../assets/imgs/imageMap';
import GoFitBottomSheet from '../common/GoFitBottomSheet';

interface CatalogModalProps {
  visible: boolean;
  currentDayExercises: Exercise[];
  userCustomExercises?: Exercise[];
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  onOpenMissingExerciseModal: () => void;
}

const catalogMusclesList = ['Todos', ...Array.from(new Set(catalog.map((c) => c.muscle)))];

export default function CatalogModal({
  visible,
  currentDayExercises,
  userCustomExercises = [],
  onClose,
  onSelectExercise,
  onOpenMissingExerciseModal,
}: CatalogModalProps) {
  const { colors: k, kStyles } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');

  // Combinamos los ejercicios personalizados de la cuenta del usuario con el catálogo base
  const fullCatalog = useMemo(() => {
    return [...userCustomExercises, ...(catalog as Exercise[])];
  }, [userCustomExercises]);

  const filteredCatalog = fullCatalog.filter((ex) => {
    const matchesSearch = matchesSmartSearch(`${ex.name} ${ex.muscle}`, searchQuery);
    const matchesMuscle =
      muscleFilter === 'Todos' ||
      normalizeSearchText(ex.muscle) === normalizeSearchText(muscleFilter);
    return matchesSearch && matchesMuscle;
  });

  return (
    <GoFitBottomSheet visible={visible} onClose={onClose} height="88%">
      <View style={[kStyles.rowBetween, { marginBottom: 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={kStyles.kickerLime}>ARSENAL DE EJERCICIOS GOFIT</Text>
          <Text style={kStyles.sheetTitle}>CATÁLOGO ({filteredCatalog.length})</Text>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={28} color={k.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Botón único de "¿No encuentras tu ejercicio?" */}
      <TouchableOpacity
        style={[
          styles.missingExerciseBanner,
          { backgroundColor: 'rgba(245, 206, 83, 0.14)', borderColor: k.gold },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onOpenMissingExerciseModal();
        }}
      >
        <View style={kStyles.rowAlign}>
          <Ionicons name="help-circle" size={18} color={k.gold} />
          <Text style={{ fontSize: 12, fontWeight: '900', color: k.gold }}>
            ¿No encuentras tu ejercicio?
          </Text>
        </View>
        <View style={kStyles.rowAlign}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMain }}>
            Crear o sugerir
          </Text>
          <Ionicons name="chevron-forward" size={14} color={k.gold} />
        </View>
      </TouchableOpacity>

      <View style={[styles.searchBox, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
        <Ionicons name="search" size={18} color={k.cyan} />
        <TextInput
          style={[styles.searchInput, { color: k.textMain }]}
          placeholder="Ej. militar, press mancuerna, jalon..."
          placeholderTextColor={k.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={k.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {catalogMusclesList.map((m) => {
            const active = muscleFilter === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.filterPill, { backgroundColor: active ? k.limeBg : k.surfaceLowest }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMuscleFilter(m);
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? '900' : '700',
                    color: active ? '#3a4a00' : k.textMuted,
                  }}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCatalog}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptySearchBox}>
            <Ionicons name="barbell-outline" size={34} color={k.textMuted} />
            <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
              No encontramos "{searchQuery}" en el catálogo.
            </Text>
            <TouchableOpacity
              style={[styles.emptySuggestBtn, { borderColor: k.gold }]}
              onPress={onOpenMissingExerciseModal}
            >
              <Text style={{ fontSize: 11, fontWeight: '900', color: k.gold }}>
                + AGREGAR "{searchQuery.toUpperCase()}" A MI CUENTA
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const alreadyAdded = currentDayExercises?.some((e) => e.id === item.id);
          const isCustom = item.id.startsWith('custom_');

          return (
            <TouchableOpacity
              style={[
                styles.catalogCard,
                { backgroundColor: k.surfaceLowest },
                alreadyAdded && { borderColor: k.limeBg, borderWidth: 1 },
              ]}
              onPress={() => onSelectExercise(item as Exercise)}
            >
              {imageMap[item.id as keyof typeof imageMap] ? (
                <Image
                  source={imageMap[item.id as keyof typeof imageMap]}
                  style={[styles.catalogImg, { backgroundColor: k.surfaceHighest }]}
                />
              ) : (
                <View
                  style={[
                    styles.catalogImg,
                    { backgroundColor: k.surfaceHighest, justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <Ionicons name="barbell" size={22} color={isCustom ? k.cyan : k.textMuted} />
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase', flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {isCustom && (
                    <View style={[styles.customTag, { backgroundColor: 'rgba(0, 244, 254, 0.16)' }]}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: k.cyan }}>PERSONAL</Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: k.textMuted, marginTop: 3 }}>
                  {item.muscle}
                </Text>
              </View>

              {alreadyAdded ? (
                <View style={[styles.addedBadge, { backgroundColor: k.limeBg }]}>
                  <Ionicons name="checkmark" size={14} color="#3a4a00" />
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#3a4a00' }}>EN RUTINA</Text>
                </View>
              ) : (
                <Ionicons name="add-circle" size={28} color={k.cyan} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </GoFitBottomSheet>
  );
}

const styles = StyleSheet.create({
  missingExerciseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 46,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  catalogCard: { flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 10, borderRadius: 16 },
  catalogImg: { width: 52, height: 52, borderRadius: 12 },
  customTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  emptySearchBox: { alignItems: 'center', paddingVertical: 30, gap: 10, paddingHorizontal: 20 },
  emptySuggestBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, marginTop: 4 },
});