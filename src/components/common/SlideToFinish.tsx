import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

interface SlideToFinishProps {
  onComplete: () => void;
  isGlowing?: boolean;
  loading?: boolean;
  label?: string;
}

const THUMB_SIZE = 48;
const PADDING = 4;

export default function SlideToFinish({
  onComplete,
  isGlowing = false,
  loading = false,
  label = 'DESLIZA PARA CERRAR REGISTRO',
}: SlideToFinishProps) {
  const { colors: k } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const maxSlideRef = useRef(0);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    maxSlideRef.current = Math.max(0, width - THUMB_SIZE - PADDING * 2);
  };

  // Animación de pulso brillante cuando el usuario completó todas sus series
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isGlowing) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 850,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
    } else {
      glowAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isGlowing]);

  // Reiniciar posición si el modal se vuelve a abrir
  useEffect(() => {
    if (!loading) {
      translateX.setValue(0);
    }
  }, [loading]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !loading,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !loading && Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 4,
      onPanResponderGrant: () => {
        Haptics.selectionAsync();
      },
      onPanResponderMove: (_, gesture) => {
        const max = maxSlideRef.current;
        if (max <= 0) return;
        const clampedX = Math.max(0, Math.min(gesture.dx, max));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gesture) => {
        const max = maxSlideRef.current;
        if (max <= 0) return;

        // Si deslizó más del 75% del recorrido, confirmamos el cierre
        if (gesture.dx >= max * 0.75) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.spring(translateX, {
            toValue: max,
            useNativeDriver: false,
            bounciness: 0,
          }).start(() => {
            onComplete();
          });
        } else {
          // Regresa suavemente al inicio si lo soltó antes
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            damping: 18,
            stiffness: 220,
          }).start();
        }
      },
    })
  ).current;

  const animatedBorderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isGlowing ? 'rgba(202, 253, 0, 0.35)' : k.outline,
      'rgba(202, 253, 0, 1)',
    ],
  });

  const animatedBgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      k.surfaceLowest,
      isGlowing ? 'rgba(202, 253, 0, 0.16)' : k.surfaceLowest,
    ],
  });

  const textOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, (trackWidth - THUMB_SIZE) * 0.6)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const progressWidth = Animated.add(translateX, THUMB_SIZE + PADDING);

  return (
    <Animated.View
      onLayout={onTrackLayout}
      style={[
        styles.track,
        {
          backgroundColor: animatedBgColor,
          borderColor: animatedBorderColor,
          shadowColor: isGlowing ? '#cafd00' : 'transparent',
          shadowOpacity: isGlowing ? 0.45 : 0,
        },
      ]}
    >
      {/* Relleno que acompaña al dedo al deslizar */}
      <Animated.View
        style={[
          styles.fillTrack,
          {
            width: progressWidth,
            backgroundColor: isGlowing ? 'rgba(202, 253, 0, 0.28)' : 'rgba(0, 244, 254, 0.18)',
          },
        ]}
      />

      {/* Texto central estilo "Deslizar para desbloquear" */}
      <Animated.View style={[styles.labelContainer, { opacity: textOpacity }]} pointerEvents="none">
        <Text
          style={[
            styles.labelText,
            { color: isGlowing ? k.lime : k.textMuted },
          ]}
          numberOfLines={1}
        >
          {isGlowing ? `✨ ${label} ✨` : `${label}  ›››`}
        </Text>
      </Animated.View>

      {/* Botón deslizable (Thumb) */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.thumbWrapper,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={isGlowing ? ['#cafd00', '#f3ffca'] : [k.cyan, '#00b8c4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.thumbGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#3a4a00" />
          ) : (
            <Ionicons
              name={isGlowing ? 'checkmark-done' : 'chevron-forward'}
              size={22}
              color="#002b2e"
            />
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: THUMB_SIZE + PADDING * 2,
    borderRadius: (THUMB_SIZE + PADDING * 2) / 2,
    borderWidth: 1.5,
    padding: PADDING,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 4,
  },
  fillTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: (THUMB_SIZE + PADDING * 2) / 2,
  },
  labelContainer: {
    position: 'absolute',
    left: THUMB_SIZE + 8,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    overflow: 'hidden',
    elevation: 5,
  },
  thumbGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});