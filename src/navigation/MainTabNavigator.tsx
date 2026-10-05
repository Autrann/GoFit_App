import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Iconos nativos de Expo

import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoutineScreen from '../screens/RoutineScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false, // Ocultamos el header feo por defecto para hacer el nuestro
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
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