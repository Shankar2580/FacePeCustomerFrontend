import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    console.log('Index - Auth status:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  // Show loading screen while checking auth status
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* The AuthContext will handle checking credentials */}
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
}); 