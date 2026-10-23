import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, FlatList, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../constants/appConstants';
import catalog from '../../assets/data/catalogo_app.json';
import { imageMap } from '../../assets/imgs/imageMap';

interface CatalogModalProps {
  visible: boolean;
  currentDayExercises: Exercise[];
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

const catalogMusclesList = ['Todos', ...Array.from(new Set(catalog.map((c) => c.muscle)))];

export default function CatalogModal({
  visible,
  currentDayExercises,
  onClose,
  onSelectExercise,
}: CatalogModalProps) {
  const { colors: k, kStyles } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');

  const filteredCatalog = catalog.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = muscleFilter === 'Todos' || ex.muscle.toLowerCase() === muscleFilter.toLowerCase();
    return matchesSearch && matchesMuscle;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={kStyles.modalOverlay}>
        <View style={[kStyles.sheetContent, { height: '88%' }]}>
          <View style={kStyles.dragHandle} />

          <View style={[kStyles.rowBetween, { marginBottom: 14 }]}>
            <View>
              <Text style={kStyles.kickerLime}>ARSENAL DE EJERCICIOS</Text>
              <Text style={kStyles.sheetTitle}>CATÁLOGO ({filteredCatalog.length})</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={k.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBox, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
            <Ionicons name="search" size={18} color={k.cyan} />
            <TextInput
              style={[styles.searchInput, { color: k.textMain }]}
              placeholder="Buscar ejercicio o músculo..."
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
                    style={[
                      styles.filterPill,
                      { backgroundColor: active ? k.limeBg : k.surfaceLowest },
                    ]}
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
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const alreadyAdded = currentDayExercises?.some((e) => e.id === item.id);
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
                    <View style={[styles.catalogImg, { backgroundColor: k.surfaceHighest, justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="barbell-outline" size={24} color={k.textMuted} />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }} numberOfLines={1}>
                      {item.name}
                    </Text>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  catalogImg: { width: 56, height: 56, borderRadius: 12 },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});