import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Para el botón de "Volver"
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Tema global
import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

export default function AuthScreen() {
  const { isDark } = useContext(ThemeContext);
  const colors = isDark ? darkColors : lightColors;
  const styles = getStyles(colors);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // Controla en qué paso del registro estamos
  const [loading, setLoading] = useState(false);

  // Diccionario para traducir errores de Firebase a español amigable
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
    
    // Si todo está bien, pasamos al paso 2 para pedir el peso
    setStep(2);
  };

  const handleAuthentication = async () => {
    // Si es registro y estamos en el paso 2, validamos el peso
    if (!isLogin && step === 2) {
      const numericWeight = parseFloat(weight.replace(',', '.'));
      if (!weight || isNaN(numericWeight) || numericWeight <= 0) {
        Alert.alert('Peso inválido', 'Por favor ingresa tu peso actual para poder llevar tu progreso (ej. 70.5).');
        return;
      }
    } else if (isLogin) {
      // Validaciones básicas para login
      if (!email || !password) {
        Alert.alert('Datos incompletos', 'Por favor ingresa correo y contraseña.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Ejecutamos la creación del usuario en Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const numericWeight = parseFloat(weight.replace(',', '.'));

        // Creamos el documento inicial incluyendo el peso
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          weight: numericWeight.toString(),
          streak: 0,
          createdAt: new Date().toISOString(),
        });

        // Mostramos el mensaje de bienvenida invitando a hacer la rutina
        Alert.alert(
          '¡Bienvenido a bordo! 🚀',
          'Hemos guardado tu peso inicial. Para empezar con el pie derecho, ve a la pestaña "Rutina" y configura tus ejercicios de la semana.',
          [{ text: '¡A darle!' }]
        );
      }
    } catch (error: any) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      Alert.alert(isLogin ? 'Error al iniciar sesión' : 'Error en el registro', friendlyMessage);
      
      // Si el correo ya estaba en uso, lo regresamos al paso 1
      if (!isLogin && error.code === 'auth/email-already-in-use') {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* --- VISTA DE INICIO DE SESIÓN --- */}
        {isLogin ? (
          <>
            <Text style={styles.title}>Iniciar Sesión</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor={colors.textSecondary} 
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAuthentication} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsLogin(false); setStep(1); }} style={styles.switchButton}>
              <Text style={styles.switchText}>¿No tienes cuenta? Regístrate aquí</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* --- VISTA DE REGISTRO --- */
          <>
            {step === 1 ? (
              /* PASO 1: CREAR CREDENCIALES */
              <>
                <Text style={styles.title}>Crear Cuenta</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu Nombre (Ej. Luis)"
                  placeholderTextColor={colors.textSecondary} 
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colors.textSecondary} 
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity style={styles.button} onPress={handleNextStep}>
                  <Text style={styles.buttonText}>Siguiente</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(true)} style={styles.switchButton}>
                  <Text style={styles.switchText}>¿Ya tienes cuenta? Inicia sesión</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* PASO 2: BIENVENIDA Y PESO */
              <View style={styles.step2Container}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <View style={styles.welcomeHeader}>
                  <Text style={styles.welcomeTitle}>¡Hola, {name.split(' ')[0]}! 👋</Text>
                  <Text style={styles.welcomeSubtitle}>Para poder medir tu progreso, necesitamos saber tu punto de partida.</Text>
                </View>

                <Text style={styles.label}>¿Cuál es tu peso actual?</Text>
                <View style={styles.weightInputWrapper}>
                  <TextInput
                    style={styles.weightInput}
                    placeholder="Ej. 70.5"
                    placeholderTextColor={colors.textSecondary}
                    value={weight}
                    onChangeText={(val) => setWeight(val.replace(/[^0-9.,]/g, ''))}
                    keyboardType="decimal-pad"
                    maxLength={6}
                    autoFocus
                  />
                  <Text style={styles.weightSuffix}>kg</Text>
                </View>

                <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleAuthentication} disabled={loading}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Finalizar Registro</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 32, color: colors.text, textAlign: 'center' },
  
  input: { backgroundColor: colors.card, color: colors.text, padding: 18, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, fontSize: 16 },
  
  button: { backgroundColor: colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  buttonDisabled: { backgroundColor: colors.primaryDisabled, shadowOpacity: 0 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }, 
  
  switchButton: { marginTop: 32, alignItems: 'center', padding: 10 },
  switchText: { color: colors.primary, fontSize: 15, fontWeight: '600' },

  // Estilos del Paso 2 (Peso)
  step2Container: { flex: 1, justifyContent: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 20, padding: 8, backgroundColor: colors.card, borderRadius: 12 },
  welcomeHeader: { marginBottom: 32, alignItems: 'center' },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 12, textAlign: 'center' },
  welcomeSubtitle: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },
  
  label: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  weightInputWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 20, marginBottom: 32, borderWidth: 2, borderColor: colors.primaryLight },
  weightInput: { color: colors.text, fontSize: 36, fontWeight: '800', paddingVertical: 20, textAlign: 'center', minWidth: 120 },
  weightSuffix: { fontSize: 24, fontWeight: '700', color: colors.textSecondary, marginLeft: 8 },
});