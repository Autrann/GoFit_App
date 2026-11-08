import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { DetectedGoalInfo } from '../../hooks/useAuthForm';
import KineticButton from '../common/KineticButton';

interface AuthRegisterStepTwoProps {
  name: string;
  weight: string;
  targetWeight: string;
  wantsToMaintain: boolean;
  loading: boolean;
  goalInfo: DetectedGoalInfo;
  onBack: () => void;
  onChangeWeight: (val: string) => void;
  onChangeTargetWeight: (val: string) => void;
  onToggleMaintain: (val: boolean) => void;
  onSubmit: () => void;
}

export default function AuthRegisterStepTwo({
  name,
  weight,
  targetWeight,
  wantsToMaintain,
  loading,
  goalInfo,
  onBack,
  onChangeWeight,
  onChangeTargetWeight,
  onToggleMaintain,
  onSubmit,
}: AuthRegisterStepTwoProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={styles.formContainer}>
      <View style={kStyles.rowBetween}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: k.surfaceLowest }]}
        >
          <Ionicons name="arrow-back" size={20} color={k.textMain} />
        </TouchableOpacity>
        <Text style={kStyles.kickerLime}>PASO 02 DE 02 • COMPOSICIÓN</Text>
      </View>

      <Text style={kStyles.cardTitleItalic}>¡HOLA, {name.split(' ')[0]}! 👋</Text>
      <Text style={kStyles.bodyMuted}>
        Configura tu peso actual y tu meta para adaptar el seguimiento de tu etapa física.
      </Text>

      <View>
        <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. TU PESO ACTUAL (PUNTO DE PARTIDA)</Text>
        <View style={[styles.weightBox, { backgroundColor: k.surfaceLowest, borderColor: k.cyan }]}>
          <TextInput
            style={[styles.weightBigInput, { color: k.textMain }]}
            placeholder="75.0"
            placeholderTextColor={k.textMuted}
            value={weight}
            onChangeText={(val) => onChangeWeight(val.replace(/[^0-9.,]/g, ''))}
            keyboardType="decimal-pad"
            maxLength={6}
          />
          <Text style={{ fontSize: 18, fontWeight: '900', color: k.cyan }}>KG</Text>
        </View>
      </View>

      <View style={[styles.maintainSwitchRow, { backgroundColor: k.surfaceLowest }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: k.textMain }}>
            Solo quiero mantener mi peso
          </Text>
          <Text style={{ fontSize: 11, color: k.textMuted, marginTop: 2 }}>
            Sin meta de peso específico (Recomposición)
          </Text>
        </View>
        <Switch
          value={wantsToMaintain}
          onValueChange={(val) => {
            Haptics.selectionAsync();
            onToggleMaintain(val);
            if (val) onChangeTargetWeight('');
          }}
          trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
          thumbColor={wantsToMaintain ? '#3a4a00' : '#f4f3f4'}
        />
      </View>

      {!wantsToMaintain && (
        <View>
          <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>
            2. ¿CUÁL ES TU PESO OBJETIVO? (OPCIONAL)
          </Text>
          <View style={[styles.weightBox, { backgroundColor: k.surfaceLowest, borderColor: k.lime }]}>
            <TextInput
              style={[styles.weightBigInput, { color: k.textMain, fontSize: 30, paddingVertical: 12 }]}
              placeholder="Ej. 70.0 o 82.0"
              placeholderTextColor={k.textMuted}
              value={targetWeight}
              onChangeText={(val) => onChangeTargetWeight(val.replace(/[^0-9.,]/g, ''))}
              keyboardType="decimal-pad"
              maxLength={6}
            />
            <Text style={{ fontSize: 16, fontWeight: '900', color: k.lime }}>KG META</Text>
          </View>
        </View>
      )}

      {weight.trim() !== '' && (
        <View style={[styles.stagePreviewBox, { backgroundColor: k.surfaceLowest, borderColor: goalInfo.color }]}>
          <View style={kStyles.rowAlign}>
            <Ionicons name="sparkles" size={15} color={goalInfo.color} />
            <Text style={{ fontSize: 11, fontWeight: '900', color: goalInfo.color }}>
              {goalInfo.badge}
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: k.textMuted, marginTop: 4, lineHeight: 16 }}>
            {goalInfo.desc}
          </Text>
        </View>
      )}

      <KineticButton
        title="FINALIZAR & COMENZAR"
        icon="checkmark-circle"
        loading={loading}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 14, paddingLeft: 4 },
  backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  weightBigInput: {
    fontSize: 34,
    fontWeight: '900',
    fontStyle: 'italic',
    paddingVertical: 14,
    textAlign: 'center',
    minWidth: 110,
  },
  maintainSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
  },
  stagePreviewBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
});
