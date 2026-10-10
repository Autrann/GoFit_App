import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { imageMap } from '../assets/imgs/imageMap';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  
  const [userData, setUserData] = useState<any>(null);
  const [routine, setRoutine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Fechas y Días
  const today = new Date();
  const todayIndex = today.getDay();
  const todayName = DAYS[todayIndex];
  const tomorrowName = DAYS[(todayIndex + 1) % 7];
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Obtener fecha de hace 7 días
  const lastWeekDate = new Date(today);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekString = lastWeekDate.toISOString().split('T')[0];

  // Estados de Registro
  const [isLogging, setIsLogging] = useState(false);
  const [workoutLog, setWorkoutLog] = useState<any>({ finished: false, exercises: {} });
  const [lastWeekLog, setLastWeekLog] = useState<any>(null);
  
  // Estados para Perfil y Peso
  const [isProfileModalVisible, setProfileModalVisible] = useState(false);
  const [tempWeight, setTempWeight] = useState('70');
  const [savingSettings, setSavingSettings] = useState(false);

  // Estados para Modal de Ejercicio
  const [activeExercise, setActiveExercise] = useState<any>(null);
  const [tempSetsCount, setTempSetsCount] = useState('3');
  const [tempReps, setTempReps] = useState<string[]>([]);
  const [tempWeights, setTempWeights] = useState<string[]>([]);
  const [savingExercise, setSavingExercise] = useState(false);

  // 1. Cargar datos en Tiempo Real (onSnapshot)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listener para datos de usuario
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (data.weight) setTempWeight(data.weight);
      }
    });

    // Listener para la rutina
    const unsubRoutine = onSnapshot(doc(db, 'users', user.uid, 'data', 'routine'), (docSnap) => {
      if (docSnap.exists()) {
        setRoutine(docSnap.data());
      }
    });

    // Listener para el registro del día
    const unsubLog = onSnapshot(doc(db, 'users', user.uid, 'workout_logs', dateString), (docSnap) => {
      if (docSnap.exists()) {
        const logData = docSnap.data();
        setWorkoutLog(logData);
        if (logData.finished) setIsLogging(false);
      } else {
        setWorkoutLog({ finished: false, exercises: {} });
      }
    });

    // Fetch del registro de la semana pasada
    const fetchLastWeek = async () => {
      const lwRef = doc(db, 'users', user.uid, 'workout_logs', lastWeekString);
      const lwSnap = await getDoc(lwRef);
      if (lwSnap.exists()) {
        setLastWeekLog(lwSnap.data());
      }
      setLoading(false);
    };
    fetchLastWeek();

    return () => {
      unsubUser();
      unsubRoutine();
      unsubLog();
    };
  }, []);

  const handleUpdateWeight = async () => {
    setSavingSettings(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const timestamp = new Date().toISOString();
        await updateDoc(doc(db, 'users', user.uid), { weight: tempWeight, lastWeightUpdate: timestamp });
        Alert.alert("¡Éxito!", "Tu peso ha sido actualizado correctamente.");
      }
    } catch (error) {
      console.error("Error guardando peso:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    setProfileModalVisible(false);
    auth.signOut();
  };

  // --- LÓGICA DE REGISTRO DE ENTRENAMIENTO ---

  const openExerciseModal = (exercise: any) => {
    setActiveExercise(exercise);
    const existingData = workoutLog.exercises[exercise.id];
    
    if (existingData && !existingData.skipped) {
      setTempSetsCount(existingData.sets.toString());
      setTempReps(existingData.reps || []);
      setTempWeights(existingData.weights || []);
    } else {
      setTempSetsCount('3');
      setTempReps(['', '', '']);
      setTempWeights(['', '', '']);
    }
  };

  const handleSetsCountChange = (val: string) => {
    setTempSetsCount(val);
    const count = parseInt(val) || 0;
    const newReps = [...tempReps];
    const newWeights = [...tempWeights];
    
    if (count > newReps.length) {
      while (newReps.length < count) {
        newReps.push('');
        newWeights.push('');
      }
    } else if (count < newReps.length) {
      newReps.length = count;
      newWeights.length = count;
    }
    setTempReps(newReps);
    setTempWeights(newWeights);
  };

  const updateRepValue = (index: number, val: string) => {
    const newReps = [...tempReps];
    newReps[index] = val;
    setTempReps(newReps);
  };

  const updateWeightValue = (index: number, val: string) => {
    const newWeights = [...tempWeights];
    newWeights[index] = val;
    setTempWeights(newWeights);
  };

  const saveExerciseLog = async (skipped = false) => {
    if (!activeExercise) return;
    setSavingExercise(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        const exerciseData = skipped ? { skipped: true } : {
          skipped: false,
          sets: parseInt(tempSetsCount),
          reps: tempReps,
          weights: tempWeights
        };

        const updatedLog = {
          ...workoutLog,
          exercises: {
            ...workoutLog.exercises,
            [activeExercise.id]: exerciseData
          }
        };

        await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), updatedLog, { merge: true });
        setActiveExercise(null);
      }
    } catch (error) {
      console.error("Error guardando ejercicio:", error);
    } finally {
      setSavingExercise(false);
    }
  };

  const getExerciseStatus = (exerciseId: string) => {
    const logData = workoutLog.exercises[exerciseId];
    if (!logData) return { status: 'pending', text: 'Toca para registrar', color: '#8E8E93' };
    if (logData.skipped) return { status: 'skipped', text: 'Omitido hoy', color: '#FF3B30' };
    
    const hasEmptyReps = logData.reps.some((r: string) => r.trim() === '' || r.trim() === '0');
    
    if (hasEmptyReps) {
      return { status: 'incomplete', text: 'Faltó registrar repeticiones', color: '#FF9500' };
    }
    return { status: 'complete', text: `✓ ${logData.sets} series registradas`, color: '#34C759' };
  };

  const finishWorkout = () => {
    const todayPlan = routine[todayName];
    if (!todayPlan) return;

    const warnings: string[] = [];
    todayPlan.exercises.forEach((ex: any) => {
      const statusInfo = getExerciseStatus(ex.id);
      if (statusInfo.status === 'pending') warnings.push(`• ${ex.name} (Sin registrar)`);
      else if (statusInfo.status === 'incomplete') warnings.push(`• ${ex.name} (Incompleto)`);
    });

    let alertTitle = "¿Terminar registro?";
    let alertMessage = "Ya no podrás editar tus series ni repeticiones de hoy.";

    if (warnings.length > 0) {
      alertTitle = "¡Atención! Entrenamiento incompleto";
      alertMessage = `Te faltó registrar los siguientes ejercicios:\n\n${warnings.join('\n')}\n\n¿Estás seguro de que quieres terminar el día?`;
    }

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, terminar", 
          style: "default",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                let newStreak = userData?.streak || 0;
                const yesterdayDate = new Date(today);
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

                if (userData?.lastWorkoutDate === yesterdayStr) {
                  newStreak += 1;
                } else if (userData?.lastWorkoutDate !== dateString) {
                  newStreak = 1;
                }

                await setDoc(doc(db, 'users', user.uid, 'workout_logs', dateString), { finished: true }, { merge: true });
                await updateDoc(doc(db, 'users', user.uid), { streak: newStreak, lastWorkoutDate: dateString });
              }
            } catch (error) {
              console.error("Error finalizando rutina:", error);
            }
          }
        }
      ]
    );
  };

  // --- LÓGICA DE ESTADÍSTICAS ---
  const calculateVolume = (exerciseLog: any) => {
    if (!exerciseLog || exerciseLog.skipped) return 0;
    let volume = 0;
    for (let i = 0; i < exerciseLog.sets; i++) {
      const r = parseInt(exerciseLog.reps[i]) || 0;
      const w = parseFloat(exerciseLog.weights?.[i]) || 1; 
      volume += (r * w);
    }
    return volume;
  };

  const generateSummary = () => {
    if (!lastWeekLog || !lastWeekLog.finished) {
      return { 
        title: "¡Primer registro de este día!", 
        subtitle: "La próxima semana compararemos tu rendimiento para ver tus avances.",
        improved: [], decreased: [], percentChange: 0 
      };
    }

    let currentTotalVolume = 0;
    let pastTotalVolume = 0;
    const improved: string[] = [];
    const decreased: string[] = [];

    if(routine && routine[todayName]){
      routine[todayName].exercises.forEach((ex: any) => {
        const currVol = calculateVolume(workoutLog.exercises[ex.id]);
        const pastVol = calculateVolume(lastWeekLog.exercises?.[ex.id]);

        currentTotalVolume += currVol;
        pastTotalVolume += pastVol;

        if (pastVol > 0 && currVol > 0) {
          if (currVol > pastVol) improved.push(ex.name);
          else if (currVol < pastVol) decreased.push(ex.name);
        }
      });
    }

    let percentChange = 0;
    if (pastTotalVolume > 0) {
      percentChange = ((currentTotalVolume - pastTotalVolume) / pastTotalVolume) * 100;
    }

    return {
      title: percentChange >= 0 ? "¡Subiste tu rendimiento! 📈" : "Bajaste un poco el ritmo 📉",
      subtitle: `Tu volumen total de entrenamiento fue ${Math.abs(percentChange).toFixed(1)}% ${percentChange >= 0 ? 'mayor' : 'menor'} que la semana pasada.`,
      improved,
      decreased,
      percentChange
    };
  };

  // --- RENDERIZADO ---

  const getFirstName = (fullName: string) => fullName ? fullName.split(' ')[0] : 'Usuario';

  if (loading) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;

  const todayPlan = routine ? routine[todayName] : null;
  const tomorrowPlan = routine ? routine[tomorrowName] : null;
  const weightOptions = Array.from({ length: 111 }, (_, i) => (i + 40).toString());
  const streakCount = userData?.streak || 0;
  const hasWorkedOutToday = workoutLog.finished;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.greeting}>Hola, {getFirstName(userData?.name || auth.currentUser?.displayName)}</Text>
            {/* Animación/Icono de Racha */}
            <View style={[styles.streakBadge, hasWorkedOutToday && styles.streakBadgeActive]}>
              <Ionicons name="flame" size={16} color={hasWorkedOutToday ? "#FF9500" : "#AEAEB2"} />
              <Text style={[styles.streakText, hasWorkedOutToday && { color: '#FF9500' }]}>{streakCount}</Text>
            </View>
          </View>
          <Text style={styles.dateHeader}>{todayName}, {today.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => setProfileModalVisible(true)}>
          <Text style={styles.avatarText}>{getFirstName(userData?.name || auth.currentUser?.displayName).charAt(0).toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* TARJETA DEL DÍA DE HOY */}
        {!todayPlan ? (
          <Text style={styles.emptyText}>Aún no has configurado tu rutina en la pestaña "Rutina".</Text>
        ) : workoutLog.finished ? (
          <>
            {/* VISTA CUANDO EL ENTRENAMIENTO ESTÁ TERMINADO */}
            <View style={styles.finishedCard}>
              <Ionicons name="trophy" size={60} color="#FFD60A" />
              <Text style={styles.finishedTitle}>¡Entrenamiento completado!</Text>
              <Text style={styles.finishedSubtitle}>Lo hiciste excelente hoy.</Text>
              
              <View style={styles.tomorrowPreview}>
                <Text style={styles.tomorrowLabel}>¿Qué toca mañana?</Text>
                {tomorrowPlan?.isRest ? (
                  <Text style={styles.tomorrowText}>Te ganaste tu descanso, ¡recupera energías! 🛏️</Text>
                ) : (
                  <Text style={styles.tomorrowText}>Día de {tomorrowPlan?.title || 'Entrenamiento'} 🔥</Text>
                )}
              </View>
            </View>

            {/* VISTA DEL RESUMEN DE RENDIMIENTO */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>Análisis del Día</Text>
              
              <View style={styles.summaryContent}>
                {(() => {
                  const summary = generateSummary();
                  return (
                    <>
                      <Text style={styles.summaryTitle}>{summary.title}</Text>
                      <Text style={styles.summarySubtitle}>{summary.subtitle}</Text>
                      
                      {summary.improved.length > 0 && (
                        <View style={styles.summaryRow}>
                          <Ionicons name="arrow-up-circle" size={20} color="#34C759" />
                          <Text style={styles.summaryDetailText}>Mejoraste en: <Text style={{fontWeight: '700'}}>{summary.improved.join(', ')}</Text></Text>
                        </View>
                      )}
                      
                      {summary.decreased.length > 0 && (
                        <View style={styles.summaryRow}>
                          <Ionicons name="arrow-down-circle" size={20} color="#FF3B30" />
                          <Text style={styles.summaryDetailText}>Redujiste en: <Text style={{fontWeight: '700'}}>{summary.decreased.join(', ')}</Text></Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>

              <TouchableOpacity style={styles.statsButton} onPress={() => navigation.navigate('Estadísticas')}>
                <Ionicons name="stats-chart" size={18} color="#007AFF" />
                <Text style={styles.statsButtonText}>Ver estadísticas completas</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : todayPlan.isRest ? (
          // VISTA SI HOY ES DESCANSO
          <View style={styles.restCard}>
            <Ionicons name="bed-outline" size={60} color="#AEAEB2" />
            <Text style={styles.restTitle}>Hoy es día de descanso</Text>
            <Text style={styles.restSubtitle}>Toca recargar energías para mañana.</Text>
          </View>
        ) : (
          // VISTA DE ENTRENAMIENTO ACTIVO
          <View style={styles.workoutCard}>
            <Text style={styles.routineDayText}>Día de {todayPlan.title}</Text>
            <Text style={styles.musclesText}>Músculos: {todayPlan.muscles.join(', ')}</Text>
            
            {!isLogging ? (
              <TouchableOpacity style={styles.startWorkoutBtn} onPress={() => setIsLogging(true)}>
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.startWorkoutText}>Registrar entrenamiento</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeWorkoutContainer}>
                <Text style={styles.sectionTitle}>Ejercicios de hoy</Text>
                
                {todayPlan.exercises.map((ex: any, index: number) => {
                  const statusInfo = getExerciseStatus(ex.id);
                  const isLogged = statusInfo.status === 'complete';
                  const isIncomplete = statusInfo.status === 'incomplete';
                  const isSkipped = statusInfo.status === 'skipped';

                  return (
                    <TouchableOpacity 
                      key={`${ex.id}-${index}`} 
                      style={[
                        styles.exerciseListItem, 
                        isLogged && styles.exerciseListComplete,
                        isIncomplete && styles.exerciseListIncomplete,
                        isSkipped && styles.exerciseListSkipped
                      ]} 
                      onPress={() => openExerciseModal(ex)}
                    >
                      <Image source={imageMap[ex.id as keyof typeof imageMap]} style={styles.exerciseListImg} />
                      <View style={styles.exerciseListInfo}>
                        <Text style={styles.exerciseListName}>{ex.name}</Text>
                        <Text style={[styles.exerciseStatusText, { color: statusInfo.color }]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.finishWorkoutBtn} onPress={finishWorkout}>
                  <Text style={styles.finishWorkoutText}>Terminar registro</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TARJETA DE CONTROL DE PESO */}
        <View style={styles.weightCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="scale" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}> Control de Peso</Text>
          </View>
          
          <Text style={styles.weightSubtitle}>
            Tu peso actual es de <Text style={{fontWeight: '800', color: '#1C1C1E'}}>{userData?.weight || '--'} kg</Text>.
          </Text>
          <Text style={styles.weightSubtitle2}>¿Han habido cambios? ¡Registrémoslo!</Text>
          
          <View style={styles.pickerContainer}>
            <Picker selectedValue={tempWeight} onValueChange={setTempWeight}>
              {weightOptions.map(w => <Picker.Item key={w} label={`${w} kg`} value={w} />)}
            </Picker>
          </View>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleUpdateWeight} disabled={savingSettings}>
            {savingSettings ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Actualizar Peso</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL 1: REGISTRO DE EJERCICIO */}
      <Modal visible={!!activeExercise} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>{activeExercise?.name}</Text>
              <TouchableOpacity onPress={() => setActiveExercise(null)}>
                <Ionicons name="close-circle" size={28} color="#AEAEB2" />
              </TouchableOpacity>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.label}>Cantidad de series:</Text>
              <TextInput 
                style={styles.setsInput}
                keyboardType="numeric"
                value={tempSetsCount}
                onChangeText={handleSetsCountChange}
                maxLength={2}
              />
            </View>
            <Text style={styles.hintText}>Registra el peso y repeticiones de cada serie:</Text>

            <ScrollView style={{ maxHeight: 300, width: '100%', marginTop: 10 }}>
              {tempReps.map((rep, idx) => (
                <View key={idx} style={styles.repRow}>
                  <Text style={styles.repLabel}>Serie {idx + 1}</Text>
                  
                  <View style={styles.inputGroupContainer}>
                    {/* Input de Peso */}
                    <View style={styles.repInputContainer}>
                      <TextInput 
                        style={styles.repInput}
                        keyboardType="numeric"
                        value={tempWeights[idx]}
                        onChangeText={(val) => updateWeightValue(idx, val)}
                        placeholder="0"
                      />
                      <Text style={styles.repSufix}>kg</Text>
                    </View>
                    
                    <Text style={{color: '#C7C7CC', marginHorizontal: 8}}>×</Text>

                    {/* Input de Reps */}
                    <View style={styles.repInputContainer}>
                      <TextInput 
                        style={styles.repInput}
                        keyboardType="numeric"
                        value={rep}
                        onChangeText={(val) => updateRepValue(idx, val)}
                        placeholder="0"
                      />
                      <Text style={styles.repSufix}>reps</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.primaryButton} onPress={() => saveExerciseLog(false)} disabled={savingExercise}>
              {savingExercise ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Guardar Serie(s)</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={() => saveExerciseLog(true)} disabled={savingExercise}>
              <Text style={styles.skipButtonText}>Este no lo hice hoy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: AJUSTES DE PERFIL (Solo Cerrar Sesión) */}
      <Modal visible={isProfileModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Opciones</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#AEAEB2" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  
  // Header & Streak
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  dateHeader: { fontSize: 15, color: '#8E8E93', marginTop: 4, textTransform: 'capitalize' },
  
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 10 },
  streakBadgeActive: { backgroundColor: '#FFF0D9' },
  streakText: { fontWeight: '700', fontSize: 14, color: '#8E8E93', marginLeft: 4 },
  
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 16 },

  // Tarjeta de Descanso
  restCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 40, alignItems: 'center', marginTop: 20 },
  restTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginTop: 16 },
  restSubtitle: { fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center' },

  // Tarjeta de Entrenamiento Terminado
  finishedCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, alignItems: 'center', marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  finishedTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginTop: 16 },
  finishedSubtitle: { fontSize: 16, color: '#8E8E93', marginTop: 4 },
  tomorrowPreview: { backgroundColor: '#F8F9FA', width: '100%', padding: 16, borderRadius: 16, marginTop: 24, alignItems: 'center' },
  tomorrowLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 1 },
  tomorrowText: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginTop: 6, textAlign: 'center' },

  // Tarjeta de Resumen (Summary Card)
  summaryCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  summaryContent: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 16, marginTop: 12 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  summarySubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4, marginBottom: 12, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  summaryDetailText: { fontSize: 14, color: '#3A3A3C', marginLeft: 8, flex: 1 },
  
  statsButton: { flexDirection: 'row', backgroundColor: '#E5F1FF', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  statsButtonText: { color: '#007AFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },

  // Tarjeta de Entrenamiento Activo
  workoutCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  routineDayText: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  musclesText: { fontSize: 15, color: '#8E8E93', marginTop: 4, marginBottom: 20 },
  
  startWorkoutBtn: { backgroundColor: '#007AFF', flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  startWorkoutText: { color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },

  activeWorkoutContainer: { marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  
  exerciseListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: 'transparent' },
  exerciseListComplete: { borderColor: '#34C759', backgroundColor: '#F0FFF4' },
  exerciseListIncomplete: { borderColor: '#FF9500', backgroundColor: '#FFF9F0' },
  exerciseListSkipped: { borderColor: '#FF3B30', backgroundColor: '#FFF0F0' },
  
  exerciseListImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#FFF' },
  exerciseListInfo: { flex: 1, marginLeft: 12 },
  exerciseListName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  exerciseStatusText: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  
  finishWorkoutBtn: { backgroundColor: '#1C1C1E', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  finishWorkoutText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Tarjeta de Control de Peso
  weightCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  weightSubtitle: { fontSize: 16, color: '#3A3A3C', marginTop: 4 },
  weightSubtitle2: { fontSize: 14, color: '#8E8E93', marginTop: 4, marginBottom: 16 },
  pickerContainer: { backgroundColor: '#F2F2F7', borderRadius: 12, overflow: 'hidden', marginBottom: 16 },

  // Modales
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHeaderBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', flex: 1 },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 16, borderRadius: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  setsInput: { backgroundColor: '#FFF', width: 60, height: 40, borderRadius: 8, textAlign: 'center', fontSize: 18, fontWeight: '700', borderWidth: 1, borderColor: '#E5E5EA' },
  hintText: { fontSize: 14, color: '#8E8E93', marginTop: 16, marginBottom: 8 },

  repRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingVertical: 12 },
  repLabel: { fontSize: 16, fontWeight: '500', color: '#3A3A3C' },
  inputGroupContainer: { flexDirection: 'row', alignItems: 'center' },
  repInputContainer: { flexDirection: 'row', alignItems: 'center' },
  repInput: { backgroundColor: '#F2F2F7', width: 50, height: 40, borderRadius: 8, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  repSufix: { fontSize: 13, color: '#8E8E93', marginLeft: 4 },

  primaryButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 16, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  skipButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  skipButtonText: { color: '#FF3B30', fontSize: 15, fontWeight: '600' },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: '#FFE5E5' },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});