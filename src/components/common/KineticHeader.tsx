import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { profileAvatars, getFirstName } from '../../constants/appConstants';

interface KineticHeaderProps {
  userData?: any;
  fallbackName?: string | null;
  brandTitle?: string;
  onAvatarPress?: () => void;
  onSettingsPress?: () => void;
  rightContent?: ReactNode;
}

export default function KineticHeader({
  userData,
  fallbackName,
  brandTitle = 'KINETIC',
  onAvatarPress,
  onSettingsPress,
  rightContent,
}: KineticHeaderProps) {
  const { colors, isDark } = useTheme();
  const initial = getFirstName(userData?.name || fallbackName).charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.topAppBar,
        {
          backgroundColor: colors.bg,
          borderBottomColor: isDark ? 'rgba(72,72,71,0.2)' : colors.outline,
        },
      ]}
    >
      <View style={styles.brandRow}>
        <TouchableOpacity
          style={[styles.avatarCircle, { backgroundColor: colors.surfaceHighest, borderColor: colors.cyan }]}
          onPress={onAvatarPress}
        >
          {userData?.avatarId && profileAvatars[userData.avatarId] ? (
            <Image source={profileAvatars[userData.avatarId]} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.textMain }]}>{initial}</Text>
          )}
        </TouchableOpacity>
        <Text style={[styles.brandLogo, { color: isDark ? '#CCFF00' : '#3a4a00' }]}>{brandTitle}</Text>
      </View>

      {rightContent ? (
        rightContent
      ) : (
        <TouchableOpacity style={styles.settingsBtn} onPress={onSettingsPress || onAvatarPress}>
          <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topAppBar: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 16, fontWeight: '900' },
  avatarImage: { width: '100%', height: '100%' },
  brandLogo: { fontSize: 23, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1 },
  settingsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});