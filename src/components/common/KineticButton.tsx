import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface KineticButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  variant?: 'lime' | 'danger' | 'cyanOutline';
  style?: ViewStyle;
}

export default function KineticButton({
  title,
  onPress,
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  variant = 'lime',
  style,
}: KineticButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  if (variant === 'danger') {
    return (
      <TouchableOpacity
        style={[styles.dangerBtn, disabled && { opacity: 0.5 }, style]}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <Ionicons name={icon} size={18} color="#FFF" />}
            <Text style={styles.dangerText}>{title}</Text>
            {icon && iconPosition === 'right' && <Ionicons name={icon} size={18} color="#FFF" />}
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.wrapper, disabled && { opacity: 0.5 }, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      <LinearGradient
        colors={['#cafd00', '#f3ffca']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBtn}
      >
        {loading ? (
          <ActivityIndicator color="#3a4a00" />
        ) : (
          <>
            {icon && iconPosition === 'left' && <Ionicons name={icon} size={19} color="#3a4a00" />}
            <Text style={styles.limeText} numberOfLines={1}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && <Ionicons name={icon} size={19} color="#3a4a00" />}
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 14, overflow: 'hidden' },
  gradientBtn: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  limeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#3a4a00',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dangerBtn: {
    backgroundColor: '#ff7351',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});