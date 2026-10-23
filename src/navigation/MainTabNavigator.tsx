import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoutineScreen from '../screens/RoutineScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createMaterialTopTabNavigator();

export default function MainTabNavigator() {
  const { isDark, colors: k } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Perfil"
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        swipeEnabled: true,
        animationEnabled: true,
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Estadísticas') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'flash' : 'flash-outline';
          else if (route.name === 'Rutina') iconName = focused ? 'barbell' : 'barbell-outline';

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: k.cyan,
        tabBarInactiveTintColor: k.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginTop: 2,
        },
        tabBarIndicatorStyle: {
          backgroundColor: k.limeBg,
          height: 3,
          borderRadius: 2,
          top: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          height: 62,
          borderRadius: 32,
          backgroundColor: isDark ? 'rgba(20, 20, 20, 0.94)' : 'rgba(255, 255, 255, 0.95)',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(72, 72, 71, 0.45)' : k.outline,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.55 : 0.15,
          shadowRadius: 20,
          overflow: 'hidden',
        },
      })}
    >
      <Tab.Screen name="Estadísticas" component={StatsScreen} options={{ tabBarLabel: 'Métricas' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ tabBarLabel: 'Entrenar' }} />
      <Tab.Screen name="Rutina" component={RoutineScreen} options={{ tabBarLabel: 'Rutina' }} />
    </Tab.Navigator>
  );
}