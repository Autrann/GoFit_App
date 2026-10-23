import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../context/ThemeContext';
import KineticButton from '../components/common/KineticButton';

export default function AuthScreen() {
  const { colors: k, kStyles } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [wantsToMaintain, setWantsToMaintain] = useState(false);

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

  // Detecta en vivo qué etapa eligió el usuario en el Paso 2
  const getDetectedGoalInfo = () => {
    const currW = parseFloat(weight.replace(',', '.'));
    const targW = parseFloat(targetWeight.replace(',', '.'));

    if (wantsToMaintain || !targetWeight.trim()) {
      return {
        type: 'maintain',
        badge: 'ETAPA: MANTENIMIENTO / RECOMPOSICIÓN',
        desc: 'Enfoque en recomposición corporal y ganancia de fuerza manteniendo tu peso actual.',
        color: k.cyan,
      };
    }
    if (!isNaN(currW) && !isNaN(targW)) {
      if (targW < currW) {
        return {
          type: 'lose',
          badge: `ETAPA: DÉFICIT / DEFINICIÓN (-${(currW - targW).toFixed(1)} KG)`,
          desc: 'Reducirás porcentaje graso mientras proteges tu masa muscular con sobrecarga.',
          color: k.lime,
        };
      }
      if (targW > currW) {
        return {
          type: 'gain',
          badge: `ETAPA: VOLUMEN / HIPERTROFIA (+${(targW - currW).toFixed(1)} KG)`,
          desc: 'Superávit enfocado en maximizar la creación de tejido muscular y récords de fuerza.',
          color: k.cyan,
        };
      }
    }
    return {
      type: 'maintain',
      badge: 'ETAPA: MANTENIMIENTO / RECOMPOSICIÓN',
      desc: 'Tu peso objetivo es igual a tu peso actual.',
      color: k.cyan,
    };
  };

  const handleAuthentication = async () => {
    const numericWeight = parseFloat(weight.replace(',', '.'));
    const numericTarget = parseFloat(targetWeight.replace(',', '.'));

    if (!isLogin && step === 2) {
      if (!weight || isNaN(numericWeight) || numericWeight <= 0) {
        Alert.alert('Peso inválido', 'Ingresa tu peso actual para llevar tu progreso (ej. 75.0).');
        return;
      }
      if (!wantsToMaintain && targetWeight.trim() !== '' && (isNaN(numericTarget) || numericTarget <= 0)) {
        Alert.alert('Meta inválida', 'Ingresa un peso objetivo válido o activa la opción de mantener tu peso.');
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

        const nowISO = new Date().toISOString();
        const todayDateStr = nowISO.split('T')[0];

        const hasTarget = !wantsToMaintain && targetWeight.trim() !== '' && !isNaN(numericTarget) && numericTarget !== numericWeight;
        const goalType = !hasTarget
          ? 'maintain'
          : numericTarget < numericWeight
          ? 'lose'
          : 'gain';

        // 1. Documento principal del usuario con su meta y punto de partida
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          weight: numericWeight.toString(),
          startWeight: numericWeight.toString(),
          targetWeight: hasTarget ? numericTarget.toString() : null,
          weightGoalType: goalType,
          lastWeightUpdate: nowISO,
          streak: 0,
          createdAt: nowISO,
        });

        // 2. Primer punto en el historial real de peso (weight_logs)
        await setDoc(doc(db, 'users', user.uid, 'weight_logs', todayDateStr), {
          weight: numericWeight,
          date: todayDateStr,
          updatedAt: nowISO,
        });

        Alert.alert(
          '¡BIENVENIDO A KINETIC! 🚀',
          'Hemos configurado tu perfil biométrico y tu etapa actual. Ve a la pestaña "Rutina" para armar tu plan semanal.',
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

  const goalInfo = getDetectedGoalInfo();

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
                title="SIGUIENTE: BIOMETRÍA & META"
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
            <View style={{ gap: 14, paddingLeft: 4 }}>
              <View style={kStyles.rowBetween}>
                <TouchableOpacity
                  onPress={() => setStep(1)}
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

              {/* 1. Peso Actual */}
              <View>
                <Text style={[kStyles.kickerMuted, { marginBottom: 6 }]}>1. TU PESO ACTUAL (PUNTO DE PARTIDA)</Text>
                <View style={[styles.weightBox, { backgroundColor: k.surfaceLowest, borderColor: k.cyan }]}>
                  <TextInput
                    style={[styles.weightBigInput, { color: k.textMain }]}
                    placeholder="75.0"
                    placeholderTextColor={k.textMuted}
                    value={weight}
                    onChangeText={(val) => setWeight(val.replace(/[^0-9.,]/g, ''))}
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                  <Text style={{ fontSize: 18, fontWeight: '900', color: k.cyan }}>KG</Text>
                </View>
              </View>

              {/* 2. Switch de Mantenimiento */}
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
                    setWantsToMaintain(val);
                    if (val) setTargetWeight('');
                  }}
                  trackColor={{ false: k.surfaceHighest, true: k.limeBg }}
                  thumbColor={wantsToMaintain ? '#3a4a00' : '#f4f3f4'}
                />
              </View>

              {/* 3. Peso Objetivo (si no eligió mantenerse) */}
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
                      onChangeText={(val) => setTargetWeight(val.replace(/[^0-9.,]/g, ''))}
                      keyboardType="decimal-pad"
                      maxLength={6}
                    />
                    <Text style={{ fontSize: 16, fontWeight: '900', color: k.lime }}>KG META</Text>
                  </View>
                </View>
              )}

              {/* Vista previa dinámica de la Etapa Detectada */}
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
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 20 },
  brandBox: { gap: 6 },
  brandLogo: { fontSize: 42, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.5 },
  switchBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
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