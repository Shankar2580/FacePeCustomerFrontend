import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 70 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: Colors.background.card,
            borderTopWidth: 0,
            shadowColor: Colors.shadow.medium,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          default: {
            height: 65 + insets.bottom,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: Colors.background.card,
            borderTopWidth: 0,
            elevation: 8,
          },
        }),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.light,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}>
      
      {/* Home Screen */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Face Scan Screen */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'camera' : 'camera-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Transaction History */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'time' : 'time-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      
      {/* Profile Screen */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
