import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { Exercise } from '../../types';
import { imageMap } from '../../assets/imgs/imageMap';

interface ExercisePickerDropdownProps {
  selectedExercise: Exercise | null;
  isOpen: boolean;
  searchQuery: string;
  filteredExercises: Exercise[];
  accentColor: string;
  subtitleColor?: string;
  placeholderText: string;
  searchPlaceholder: string;
  onToggleOpen: () => void;
  onChangeSearch: (query: string) => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export default function ExercisePickerDropdown({
  selectedExercise,
  isOpen,
  searchQuery,
  filteredExercises,
  accentColor,
  subtitleColor,
  placeholderText,
  searchPlaceholder,
  onToggleOpen,
  onChangeSearch,
  onSelectExercise,
}: ExercisePickerDropdownProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selectorTrigger,
          { backgroundColor: k.surfaceLowest, borderColor: selectedExercise ? accentColor : k.outline },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          onToggleOpen();
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
              <Text style={{ fontSize: 11, color: subtitleColor || k.textMuted, fontWeight: subtitleColor ? '700' : '400' }}>
                {selectedExercise.muscle}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMuted }}>
            {placeholderText}
          </Text>
        )}
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={accentColor}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.pickerDropdownBox, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
          <View style={[styles.miniSearchBox, { backgroundColor: k.surfaceHigh }]}>
            <Ionicons name="search" size={16} color={k.cyan} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, color: k.textMain, fontSize: 13, fontWeight: '600' }}
              placeholder={searchPlaceholder}
              placeholderTextColor={k.textMuted}
              value={searchQuery}
              onChangeText={onChangeSearch}
            />
          </View>

          <FlatList
            data={filteredExercises.slice(0, 30)}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 165 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, { borderBottomColor: k.surfaceHigh }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  onSelectExercise(item);
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
    </>
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
  pickerDropdownBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginTop: 8,
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
});
