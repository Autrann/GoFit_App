import React from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { MUSCLE_GROUPS, muscleToImageKey } from '../../constants/appConstants';
import { imageMap } from '../../assets/imgs/imageMap';
import { DayPlan } from '../../types';

interface RoutineDayEditorProps {
  currentPlan: DayPlan;
  onUpdatePlan: (updates: Partial<DayPlan>) => void;
  onToggleMuscle: (muscle: string) => void;
}

export const MuscleChipIcon = ({ muscleName, size = 18 }: { muscleName: string; size?: number }) => {
  const { colors: k } = useTheme();
  const src = imageMap[muscleToImageKey[muscleName]];
  return src ? (
    <Image source={src} style={{ width: size, height: size, borderRadius: size / 2 }} />
  ) : (
    <Ionicons name="body-outline" size={size} color={k.textMuted} />
  );
};

export default function RoutineDayEditor({
  currentPlan,
  onUpdatePlan,
  onToggleMuscle,
}: RoutineDayEditorProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={[styles.editBox, { backgroundColor: k.surfaceLowest }]}>
      <View style={kStyles.rowBetween}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMain }}>¿Es Día de Descanso?</Text>
        <Switch
          value={currentPlan.isRest}
          onValueChange={(val) => onUpdatePlan({ isRest: val })}
          trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
        />
      </View>

      {!currentPlan.isRest && (
        <>
          <Text style={[kStyles.kickerMuted, { marginTop: 12, marginBottom: 6 }]}>TÍTULO DE LA SESIÓN</Text>
          <TextInput
            style={kStyles.kineticInput}
            placeholder="Ej. Push, Pull..."
            placeholderTextColor={k.textMuted}
            value={currentPlan.title}
            onChangeText={(val) => onUpdatePlan({ title: val })}
          />

          <Text style={[kStyles.kickerMuted, { marginTop: 12, marginBottom: 8 }]}>MÚSCULOS A TRABAJAR</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {MUSCLE_GROUPS.map((m) => {
              const active = currentPlan.muscles?.includes(m);
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? 'rgba(202,253,0,0.16)' : k.surfaceHigh,
                      borderColor: active ? k.limeBg : k.outline,
                    },
                  ]}
                  onPress={() => onToggleMuscle(m)}
                >
                  <MuscleChipIcon muscleName={m} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: active ? k.lime : k.textMuted }}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[kStyles.rowBetween, { marginTop: 14 }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: k.textMain }}>¿Incluir Cardio?</Text>
            <Switch
              value={currentPlan.cardio}
              onValueChange={(val) => onUpdatePlan({ cardio: val })}
              trackColor={{ false: k.surfaceHighest, true: k.warning }}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  editBox: { padding: 14, borderRadius: 16, marginBottom: 14, marginLeft: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
});
