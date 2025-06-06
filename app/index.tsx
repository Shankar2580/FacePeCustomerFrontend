import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { clearAllData } from '@/services/storage';
import Colors from '@/constants/Colors';

export default function IndexScreen() {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // For development: Clear all stored data for fresh start
    // Uncomment the line below if you want to force logout on app restart
    // clearAllData();
    
    // Alternative: Check for a specific flag to clear data
    const shouldClearData = false; // Set to true to force logout
    if (shouldClearData) {
      clearAllData();
    }
    
    if (isLoading) return;

    // More explicit authentication check
    if (isAuthenticated && user && user.email) {
      // User is properly authenticated with complete data, go to main app
      console.log('Redirecting authenticated user to main app');
      router.replace('/(tabs)');
    } else {
      // User is not authenticated or has incomplete data, go to login
      console.log('Redirecting unauthenticated user to login');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, isAuthenticated]);

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.secondary,
  },
}); 