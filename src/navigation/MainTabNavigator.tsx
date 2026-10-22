import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoutineScreen from '../screens/RoutineScreen';

// Importamos el Contexto Global en lugar de useColorScheme
import { ThemeContext } from '../context/ThemeContext';
import { lightColors, darkColors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  // Ahora escuchamos a la variable global
  const { isDark } = useContext(ThemeContext);
  const colors = isDark ? darkColors : lightColors;

  return (
    <Tab.Navigator
      initialRouteName="Perfil"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';
          
          if (route.name === 'Estadísticas') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Rutina') iconName = focused ? 'barbell' : 'barbell-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.1, // Adaptamos la sombra a la variable global
          shadowRadius: 4,
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Estadísticas" component={StatsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Rutina" component={RoutineScreen} />
    </Tab.Navigator>
  );
}