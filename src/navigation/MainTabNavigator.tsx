import React, { useContext } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- IMPORTAMOS LOS INSETS

import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoutineScreen from '../screens/RoutineScreen';

import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

const Tab = createMaterialTopTabNavigator();

export default function MainTabNavigator() {
  const { isDark } = useContext(ThemeContext);
  const colors = isDark ? darkColors : lightColors;
  
  // Obtenemos los márgenes seguros del dispositivo
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
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Rutina') iconName = focused ? 'barbell' : 'barbell-outline';

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'none',
          marginTop: 2,
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 4,
          // Sumamos el margen inferior de Android/iOS para que no se superponga
          height: 60 + insets.bottom, 
          paddingBottom: Math.max(insets.bottom, 5), // Garantiza al menos 5px de espacio
        },
      })}
    >
      <Tab.Screen name="Estadísticas" component={StatsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Rutina" component={RoutineScreen} />
    </Tab.Navigator>
  );
}