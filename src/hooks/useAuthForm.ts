import { useState } from 'react';
import { Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ThemeColors } from '../theme/colors';
import { WeightGoalType } from '../types';

export interface DetectedGoalInfo {
  type: WeightGoalType;
  badge: string;
  desc: string;
  color: string;
}

const getFriendlyErrorMessage = (errorCode?: string): string => {
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

export function useAuthForm(k: ThemeColors) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [wantsToMaintain, setWantsToMaintain] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  const getDetectedGoalInfo = (): DetectedGoalInfo => {
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

        const hasTarget =
          !wantsToMaintain &&
          targetWeight.trim() !== '' &&
          !isNaN(numericTarget) &&
          numericTarget !== numericWeight;

        const goalType: WeightGoalType = !hasTarget
          ? 'maintain'
          : numericTarget < numericWeight
          ? 'lose'
          : 'gain';

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

        await setDoc(doc(db, 'users', user.uid, 'weight_logs', todayDateStr), {
          weight: numericWeight,
          date: todayDateStr,
          updatedAt: nowISO,
        });

        Alert.alert(
          '¡BIENVENIDO A GOFIT! 🚀',
          'Hemos configurado tu perfil biométrico y tu etapa actual. Ve a la pestaña "Rutina" para armar tu plan semanal.',
          [{ text: '¡A ROMPER LÍMITES!' }]
        );
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      Alert.alert(
        isLogin ? 'Error al iniciar sesión' : 'Error en el registro',
        getFriendlyErrorMessage(firebaseError?.code)
      );
      if (!isLogin && firebaseError?.code === 'auth/email-already-in-use') setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    weight,
    setWeight,
    targetWeight,
    setTargetWeight,
    wantsToMaintain,
    setWantsToMaintain,
    isLogin,
    setIsLogin,
    step,
    setStep,
    loading,
    goalInfo: getDetectedGoalInfo(),
    handleNextStep,
    handleAuthentication,
  };
}
