import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GoFitBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  height?: DimensionValue;
  maxHeight?: DimensionValue;
  backgroundColor?: string;
  noPadding?: boolean;
}

export default function GoFitBottomSheet({
  visible,
  onClose,
  children,
  height,
  maxHeight = '92%',
  backgroundColor,
  noPadding = false,
}: GoFitBottomSheetProps) {
  const { colors: k } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 220,
      }).start();
    }
  }, [visible]);

  const animateClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Gestor táctil en la barra superior para arrastrar hacia abajo y cerrar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 90 || gestureState.vy > 0.65) {
          animateClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={animateClose} // <-- Cierra con el botón/gesto "Atrás" del dispositivo
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Presionar fuera del modal lo cierra */}
        <TouchableWithoutFeedback onPress={animateClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: backgroundColor || k.surfaceHigh,
              maxHeight,
              ...(height ? { height } : {}),
              paddingHorizontal: noPadding ? 0 : 20,
              paddingBottom: noPadding ? 0 : 34,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Zona de agarre superior para deslizar hacia abajo */}
          <View {...panResponder.panHandlers} style={styles.dragZone}>
            <View style={[styles.dragHandle, { backgroundColor: k.outline }]} />
          </View>

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    width: '100%',
  },
  dragZone: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
});