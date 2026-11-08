import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Routine } from '../../types';

interface EmptyDayCloneBoxProps {
  activeDay: string;
  daysWithInfo: string[];
  routine: Routine;
  onCopyFromDay: (sourceDay: string) => void;
}

export default function EmptyDayCloneBox({
  activeDay,
  daysWithInfo,
  routine,
  onCopyFromDay,
}: EmptyDayCloneBoxProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={[styles.emptyDayContainer, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
      <Ionicons name="copy-outline" size={26} color={k.cyan} />
      <Text style={{ fontSize: 13, fontWeight: '900', color: k.textMain, textAlign: 'center' }}>
        {activeDay.toUpperCase()} ESTÁ VACÍO
      </Text>

      {daysWithInfo.length > 0 ? (
        <>
          <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
            ¿Haces la misma rutina que otro día? Toca un día para clonar sus músculos y ejercicios al instante:
          </Text>
          <View style={styles.copyPillsWrap}>
            {daysWithInfo.map((sourceDay) => (
              <TouchableOpacity
                key={sourceDay}
                style={[styles.copyDayPill, { backgroundColor: k.surfaceHigh, borderColor: k.cyan }]}
                onPress={() => onCopyFromDay(sourceDay)}
              >
                <Ionicons name="duplicate-outline" size={14} color={k.cyan} />
                <View>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: k.textMain }}>
                    Copiar {sourceDay}
                  </Text>
                  <Text style={{ fontSize: 9, color: k.lime, fontWeight: '700' }} numberOfLines={1}>
                    {routine[sourceDay]?.title || `${routine[sourceDay]?.exercises?.length || 0} ejercicios`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <Text style={[kStyles.bodyMuted, { textAlign: 'center' }]}>
          Explora el catálogo abajo para agregar tus primeros ejercicios de la semana.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyDayContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  copyPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  copyDayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
