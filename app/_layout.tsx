import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar 
              style="dark" 
              backgroundColor={Colors.background.primary}
              translucent={false}
            />
            <Stack 
              screenOptions={{
                headerShown: false,
                contentStyle: { 
                  backgroundColor: Colors.background.primary 
                },
                animation: 'slide_from_right',
              }}
            >
              {/* Main Entry Point */}
              <Stack.Screen name="index" />
              
              {/* Main App */}
              <Stack.Screen name="(tabs)" />
              
              {/* Onboarding */}
              <Stack.Screen name="onboarding-complete" />
              
              {/* Other screens */}
              <Stack.Screen name="+not-found" />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
    </SafeAreaProvider>
  );
}
