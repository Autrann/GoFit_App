import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { imageMap } from '../../assets/imgs/imageMap';
import { formatReadableDate } from '../../utils/analytics';
import { CustomPRItem, Exercise } from '../../types';

interface PersonalRecordsCardProps {
  customPRsList: CustomPRItem[];
  onOpenNewPR: () => void;
  onEditPR: (exercise: Exercise) => void;
}

export default function PersonalRecordsCard({
  customPRsList,
  onOpenNewPR,
  onEditPR,
}: PersonalRecordsCardProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={[kStyles.card, { gap: 12 }]}>
      <View style={kStyles.rowBetween}>
        <View style={kStyles.rowAlign}>
          <View style={[styles.trophyIconBox, { backgroundColor: 'rgba(245, 206, 83, 0.16)' }]}>
            <Ionicons name="trophy" size={18} color={k.gold} />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
              MIS RÉCORDS PERSONALES (PRs)
            </Text>
            <Text style={{ fontSize: 10, color: k.textMuted }}>
              Tus cargas máximas registradas aparte
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addPrBtn, { backgroundColor: k.limeBg }]}
          onPress={() => {
            Haptics.selectionAsync();
            onOpenNewPR();
          }}
        >
          <Ionicons name="add" size={15} color="#3a4a00" />
          <Text style={{ fontSize: 10, fontWeight: '900', color: '#3a4a00' }}>NUEVO</Text>
        </TouchableOpacity>
      </View>

      {customPRsList.length === 0 ? (
        <View style={[styles.emptyPrBox, { backgroundColor: k.surfaceLowest }]}>
          <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
            ¿Lograste un récord personal en Press de Banca, Sentadilla o tu ejercicio favorito? Regístralo aquí para llevar tu muro de trofeos.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {customPRsList.map((prItem) => (
            <TouchableOpacity
              key={prItem.exerciseId}
              style={[styles.prRowCard, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}
              onPress={() => {
                Haptics.selectionAsync();
                onEditPR({
                  id: prItem.exerciseId,
                  name: prItem.exerciseName,
                  muscle: prItem.muscle,
                  image: '',
                });
              }}
            >
              <Image
                source={imageMap[prItem.exerciseId as keyof typeof imageMap]}
                style={[styles.prImg, { backgroundColor: k.surfaceHighest }]}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textTransform: 'uppercase' }}
                  numberOfLines={1}
                >
                  {prItem.exerciseName}
                </Text>
                <Text style={{ fontSize: 10, color: k.textMuted }}>
                  {prItem.muscle} • {formatReadableDate(prItem.date)}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', fontStyle: 'italic', color: k.gold }}>
                  {prItem.weight} KG
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '800', color: k.lime }}>
                  × {prItem.reps} {prItem.reps === 1 ? 'REP (1RM)' : 'REPS'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trophyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  emptyPrBox: {
    padding: 14,
    borderRadius: 12,
  },
  prRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  prImg: { width: 42, height: 42, borderRadius: 8 },
});
