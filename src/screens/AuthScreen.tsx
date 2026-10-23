import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { useTheme } from '../context/ThemeContext';
import KineticButton from '../components/common/KineticButton';

export default function AuthScreen() {
  const { colors: k, kStyles } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const getFriendlyErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado. Intenta iniciar sesión.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Correo o contraseña incorrectos.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revisa tu internet e inténtalo de nuevo.';
      default:
        return 'Ocurrió un error inesperado. Por favor, inténtalo más tarde.';
    }
  };

  const handleNextStep = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim() || !email || !password) {
      Alert.alert('Datos incompletos', 'Por favor ingresa tu nombre, correo y contraseña.');
      return;
    }
    if (!emailRegex.test(email)) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setStep(2);
  };

  const handleAuthentication = async () => {
    if (!isLogin && step === 2) {
      const numericWeight = parseFloat(weight.replace(',', '.'));
      if (!weight || isNaN(numericWeight) || numericWeight <= 0) {
        Alert.alert('Peso inválido', 'Ingresa tu peso actual para llevar tu progreso (ej. 70.5).');
        return;
      }
    } else if (isLogin && (!email || !password)) {
      Alert.alert('Datos incompletos', 'Por favor ingresa correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        const numericWeight = parseFloat(weight.replace(',', '.'));

        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          weight: numericWeight.toString(),
          streak: 0,
          createdAt: new Date().toISOString(),
        });

        Alert.alert(
          '¡BIENVENIDO A GoFit! ',
          'Hemos guardado tu peso inicial. Para empezar con el pie derecho, ve a la pestaña "Rutina" y configura tus ejercicios de la semana.',
          [{ text: '¡A ROMPER LÍMITES!' }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        isLogin ? 'Error al iniciar sesión' : 'Error en el registro',
        getFriendlyErrorMessage(error.code)
      );
      if (!isLogin && error.code === 'auth/email-already-in-use') setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={kStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Branding Header */}
        <View style={styles.brandBox}>
          <View style={kStyles.intelPill}>
            <View style={kStyles.intelDot} />
            <Text style={kStyles.intelPillText}>PERFORMANCE INTELLIGENCE</Text>
          </View>
          <Text style={[styles.brandLogo, { color: k.lime }]}>KINETIC</Text>
          <Text style={kStyles.bodyMuted}>
            Sistema de sobrecarga progresiva y biometría de entrenamiento.
          </Text>
        </View>

        <View style={kStyles.card}>
          <View style={kStyles.leftNotch} />

          {isLogin ? (
            <View style={{ gap: 14, paddingLeft: 4 }}>
              <Text style={kStyles.kickerLime}>ACCESO DE ATLETA</Text>
              <Text style={kStyles.cardTitleItalic}>INICIAR SESIÓN</Text>

              <TextInput
                style={kStyles.kineticInput}
                placeholder="Correo electrónico"
                placeholderTextColor={k.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={kStyles.kineticInput}
                placeholder="Contraseña"
                placeholderTextColor={k.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <KineticButton
                title="ENTRAR AL SISTEMA"
                icon="flash"
                loading={loading}
                onPress={handleAuthentication}
              />

              <TouchableOpacity
                onPress={() => {
                  setIsLogin(false);
                  setStep(1);
                }}
                style={styles.switchBtn}
              >
                <Text style={{ color: k.cyan, fontSize: 13, fontWeight: '800' }}>
                  ¿NO TIENES CUENTA? REGÍSTRATE AQUÍ
                </Text>
              </TouchableOpacity>
            </View>
          ) : step === 1 ? (
            <View style={{ gap: 14, paddingLeft: 4 }}>
              <Text style={kStyles.kickerLime}>PASO 01 DE 02</Text>
              <Text style={kStyles.cardTitleItalic}>CREAR PERFIL</Text>

              <TextInput
                style={kStyles.kineticInput}
                placeholder="Tu Nombre (Ej. Luis)"
                placeholderTextColor={k.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <TextInput
                style={kStyles.kineticInput}
                placeholder="Correo electrónico"
                placeholderTextColor={k.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={kStyles.kineticInput}
                placeholder="Contraseña (mín. 6 caracteres)"
                placeholderTextColor={k.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <KineticButton
                title="SIGUIENTE: BIOMETRÍA"
                icon="arrow-forward"
                iconPosition="right"
                onPress={handleNextStep}
              />

              <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.switchBtn}>
                <Text style={{ color: k.cyan, fontSize: 13, fontWeight: '800' }}>
                  ¿YA TIENES CUENTA? INICIA SESIÓN
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16, paddingLeft: 4 }}>
              <View style={kStyles.rowBetween}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={[styles.backBtn, { backgroundColor: k.surfaceLowest }]}
                >
                  <Ionicons name="arrow-back" size={20} color={k.textMain} />
                </TouchableOpacity>
                <Text style={kStyles.kickerLime}>PASO 02 DE 02 • PUNTO DE PARTIDA</Text>
              </View>

              <Text style={kStyles.cardTitleItalic}>¡HOLA, {name.split(' ')[0]}! 👋</Text>
              <Text style={kStyles.bodyMuted}>
                Ingresa tu peso corporal actual en kilogramos para calibrar tus métricas de composición.
              </Text>

              <View style={[styles.weightBox, { backgroundColor: k.surfaceLowest, borderColor: k.cyan }]}>
                <TextInput
                  style={[styles.weightBigInput, { color: k.textMain }]}
                  placeholder="75.0"
                  placeholderTextColor={k.textMuted}
                  value={weight}
                  onChangeText={(val) => setWeight(val.replace(/[^0-9.,]/g, ''))}
                  keyboardType="decimal-pad"
                  maxLength={6}
                  autoFocus
                />
                <Text style={{ fontSize: 20, fontWeight: '900', color: k.cyan }}>KG</Text>
              </View>

              <KineticButton
                title="FINALIZAR & COMENZAR"
                icon="checkmark-circle"
                loading={loading}
                onPress={handleAuthentication}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 },
  brandBox: { gap: 8 },
  brandLogo: { fontSize: 44, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.5 },
  switchBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
  backBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  weightBigInput: { fontSize: 38, fontWeight: '900', fontStyle: 'italic', paddingVertical: 18, textAlign: 'center', minWidth: 110 },
});