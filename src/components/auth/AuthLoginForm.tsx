import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import KineticButton from '../common/KineticButton';

interface AuthLoginFormProps {
  email: string;
  password: string;
  loading: boolean;
  onChangeEmail: (val: string) => void;
  onChangePassword: (val: string) => void;
  onSubmit: () => void;
  onSwitchToRegister: () => void;
}

export default function AuthLoginForm({
  email,
  password,
  loading,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onSwitchToRegister,
}: AuthLoginFormProps) {
  const { colors: k, kStyles } = useTheme();

  return (
    <View style={styles.formContainer}>
      <Text style={kStyles.kickerLime}>ACCESO DE ATLETA</Text>
      <Text style={kStyles.cardTitleItalic}>INICIAR SESIÓN</Text>

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
        placeholder="Contraseña"
        placeholderTextColor={k.textMuted}
        value={password}
        onChangeText={onChangePassword}
        secureTextEntry
      />

      <KineticButton
        title="ENTRAR A GOFIT"
        icon="flash"
        loading={loading}
        onPress={onSubmit}
      />

      <TouchableOpacity onPress={onSwitchToRegister} style={styles.switchBtn}>
        <Text style={{ color: k.cyan, fontSize: 13, fontWeight: '800' }}>
          ¿NO TIENES CUENTA? REGÍSTRATE AQUÍ
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 14, paddingLeft: 4 },
  switchBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
});
