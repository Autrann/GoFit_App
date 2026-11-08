import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { UserData, WeightStageAnalytics } from '../../types';
import KineticButton from '../common/KineticButton';

interface WeightControlCardProps {
  userData: UserData | null;
  prevWeightDiff: string | null;
  stageAnalytics: WeightStageAnalytics;
  isWeightInputOpen: boolean;
  tempWeight: string;
  tempTargetWeight: string;
  tempMaintainMode: boolean;
  savingSettings: boolean;
  onToggleInputOpen: () => void;
  onChangeTempWeight: (val: string) => void;
  onChangeTempTargetWeight: (val: string) => void;
  onToggleMaintainMode: (val: boolean) => void;
  onSaveWeightAndGoal: () => void;
}

export default function WeightControlCard({
  userData,
  prevWeightDiff,
  stageAnalytics,
  isWeightInputOpen,
  tempWeight,
  tempTargetWeight,
  tempMaintainMode,
  savingSettings,
  onToggleInputOpen,
  onChangeTempWeight,
  onChangeTempTargetWeight,
  onToggleMaintainMode,
  onSaveWeightAndGoal,
}: WeightControlCardProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={[kStyles.card, { gap: 12 }]}>
      <View style={kStyles.rowBetween}>
        <View style={kStyles.rowAlign}>
          <View style={[styles.iconBox, { backgroundColor: k.surfaceHighest }]}>
            <Ionicons name="scale-outline" size={18} color={k.cyan} />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '900', fontStyle: 'italic', color: k.textMain }}>
              CONTROL DE PESO CORPORAL
            </Text>
            <Text style={{ fontSize: 10, color: k.textMuted }}>
              {userData?.lastWeightUpdate
                ? `Último registro: ${new Date(userData.lastWeightUpdate).toLocaleDateString('es-ES')}`
                : 'Mantén tus métricas al día'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.pill, { backgroundColor: k.surfaceHighest }]}
          onPress={() => {
            Haptics.selectionAsync();
            onToggleInputOpen();
          }}
        >
          <Ionicons name={isWeightInputOpen ? 'close' : 'add'} size={14} color={k.lime} />
          <Text style={{ fontSize: 10, fontWeight: '900', color: k.lime }}>
            {isWeightInputOpen ? 'CERRAR' : 'ACTUALIZA'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.stageBanner, { backgroundColor: k.surfaceLowest, borderColor: stageAnalytics.stageBadgeColor }]}>
        <Ionicons name={stageAnalytics.icon} size={15} color={stageAnalytics.stageBadgeColor} />
        <Text style={{ fontSize: 10, fontWeight: '900', color: stageAnalytics.stageBadgeColor, letterSpacing: 0.8 }}>
          {stageAnalytics.stageTitle}
        </Text>
      </View>

      <View style={[kStyles.rowBetween, styles.innerBox, { backgroundColor: k.surfaceLowest }]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={{ fontSize: 34, fontWeight: '900', fontStyle: 'italic', color: k.textMain, letterSpacing: -1 }}>
            {userData?.weight || '--'}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: k.textMuted }}>KG</Text>
        </View>

        <View style={[styles.trendChip, { backgroundColor: k.surfaceHigh }]}>
          <Ionicons
            name={
              prevWeightDiff && parseFloat(prevWeightDiff) < 0
                ? 'trending-down'
                : prevWeightDiff && parseFloat(prevWeightDiff) > 0
                ? 'trending-up'
                : 'analytics'
            }
            size={14}
            color={k.lime}
          />
          <Text style={{ fontSize: 11, fontWeight: '800', color: k.lime }}>
            {prevWeightDiff !== null
              ? `${parseFloat(prevWeightDiff) > 0 ? '+' : ''}${prevWeightDiff} kg vs ant.`
              : 'Punto de control'}
          </Text>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 11, color: k.textMuted, lineHeight: 16 }}>
          {stageAnalytics.remainingText}
        </Text>

        <View style={[kStyles.rowBetween, { marginTop: 2 }]}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: k.textMuted, textTransform: 'uppercase' }}>
            {stageAnalytics.leftLabel}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '900', color: k.cyan }}>
            {stageAnalytics.rightLabel}
          </Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: k.surfaceLowest }]}>
          <LinearGradient
            colors={[k.cyan, k.limeBg]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${stageAnalytics.progressPct}%` }]}
          />
        </View>
      </View>

      {isWeightInputOpen && (
        <View style={[styles.editorContainer, { backgroundColor: k.surfaceLowest, borderColor: k.outline }]}>
          <Text style={kStyles.kickerLime}>ACTUALIZAR BIOMETRÍA Y OBJETIVO</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={kStyles.kickerMuted}>PESO DE HOY (KG)</Text>
              <TextInput
                style={kStyles.kineticInput}
                keyboardType="decimal-pad"
                placeholder="Ej. 78.4"
                placeholderTextColor={k.textMuted}
                value={tempWeight}
                onChangeText={(val) => onChangeTempWeight(val.replace(/[^0-9.,]/g, ''))}
                maxLength={6}
              />
            </View>

            {!tempMaintainMode && (
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={kStyles.kickerMuted}>META OBJETIVO (KG)</Text>
                <TextInput
                  style={[kStyles.kineticInput, { borderColor: k.lime }]}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 75.0"
                  placeholderTextColor={k.textMuted}
                  value={tempTargetWeight}
                  onChangeText={(val) => onChangeTempTargetWeight(val.replace(/[^0-9.,]/g, ''))}
                  maxLength={6}
                />
              </View>
            )}
          </View>

          <View style={[kStyles.rowBetween, { marginTop: 4 }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: k.textMain }}>
              Solo quiero mantener mi peso actual
            </Text>
            <Switch
              value={tempMaintainMode}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                onToggleMaintainMode(val);
                if (val) onChangeTempTargetWeight('');
              }}
              trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
              thumbColor={tempMaintainMode ? '#3a4a00' : '#f4f3f4'}
            />
          </View>

          <KineticButton
            title="GUARDAR PESO Y META"
            icon="checkmark-circle"
            loading={savingSettings}
            onPress={onSaveWeightAndGoal}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  innerBox: { padding: 14, borderRadius: 14 },
  stageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  trendChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  progressTrack: { width: '100%', height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%', borderRadius: 4 },
  editorContainer: { padding: 14, borderRadius: 16, borderWidth: 1, gap: 12, marginTop: 4 },
});
