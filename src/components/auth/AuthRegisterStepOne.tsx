import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import KineticButton from '../common/KineticButton';

interface AuthRegisterStepOneProps {
  name: string;
  email: string;
  password: string;
  onChangeName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onNextStep: () => void;
  onSwitchToLogin: () => void;
}

export default function AuthRegisterStepOne({
  name,
  email,
  password,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onNextStep,
  onSwitchToLogin,
}: AuthRegisterStepOneProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={styles.formContainer}>
      <Text style={kStyles.kickerLime}>PASO 01 DE 02</Text>
      <Text style={kStyles.cardTitleItalic}>CREAR PERFIL</Text>

      <TextInput
        style={kStyles.kineticInput}
        placeholder="Tu Nombre (Ej. Luis)"
        placeholderTextColor={k.textMuted}
        value={name}
        onChangeText={onChangeName}
        autoCapitalize="words"
      />
      <TextInput
        style={kStyles.kineticInput}
        placeholder="Correo electrónico"
        placeholderTextColor={k.textMuted}
        value={email}
        onChangeText={onChangeEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={kStyles.kineticInput}
        placeholder="Contraseña (mín. 6 caracteres)"
        placeholderTextColor={k.textMuted}
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
      />

      <KineticButton
        title="SIGUIENTE: BIOMETRÍA & META"
        icon="arrow-forward"
        iconPosition="right"
        onPress={onNextStep}
      />

      <TouchableOpacity onPress={onSwitchToLogin} style={styles.switchBtn}>
        <Text style={{ color: k.cyan, fontSize: 13, fontWeight: '800' }}>
          ¿YA TIENES CUENTA? INICIA SESIÓN
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 14, paddingLeft: 4 },
  switchBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
});
