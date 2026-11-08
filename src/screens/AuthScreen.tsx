import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthForm } from '../hooks/useAuthForm';
import AuthLoginForm from '../components/auth/AuthLoginForm';
import AuthRegisterStepOne from '../components/auth/AuthRegisterStepOne';
import AuthRegisterStepTwo from '../components/auth/AuthRegisterStepTwo';

export default function AuthScreen() {
  const { colors: k, kStyles } = useTheme();
  const {
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
    goalInfo,
    handleNextStep,
    handleAuthentication,
  } = useAuthForm(k);

  return (
    <SafeAreaView style={kStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Branding Header */}
        <View style={styles.brandBox}>
          <View style={kStyles.intelPill}>
            <View style={kStyles.intelDot} />
            <Text style={kStyles.intelPillText}>PERFORMANCE INTELLIGENCE</Text>
          </View>
          <Text style={[styles.brandLogo, { color: k.lime }]}>GoFit</Text>
          <Text style={kStyles.bodyMuted}>
            Sistema inteligente de sobrecarga progresiva y biometría.
          </Text>
        </View>

        <View style={kStyles.card}>
          <View style={kStyles.leftNotch} />

          {isLogin ? (
            <AuthLoginForm
              email={email}
              password={password}
              loading={loading}
              onChangeEmail={setEmail}
              onChangePassword={setPassword}
              onSubmit={handleAuthentication}
              onSwitchToRegister={() => {
                setIsLogin(false);
                setStep(1);
              }}
            />
          ) : step === 1 ? (
            <AuthRegisterStepOne
              name={name}
              email={email}
              password={password}
              onChangeName={setName}
              onChangeEmail={setEmail}
              onChangePassword={setPassword}
              onNextStep={handleNextStep}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          ) : (
            <AuthRegisterStepTwo
              name={name}
              weight={weight}
              targetWeight={targetWeight}
              wantsToMaintain={wantsToMaintain}
              loading={loading}
              goalInfo={goalInfo}
              onBack={() => setStep(1)}
              onChangeWeight={setWeight}
              onChangeTargetWeight={setTargetWeight}
              onToggleMaintain={setWantsToMaintain}
              onSubmit={handleAuthentication}
            />
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
});
