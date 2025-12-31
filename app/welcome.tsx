import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations sequence
    Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text animation
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Buttons animation
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      
      <View style={styles.gradient}>
        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Logo with Animation */}
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* App Name with Animation */}
          <Animated.View
            style={[
              styles.textContainer,
              { opacity: textOpacity },
            ]}
          >
            <Text style={styles.appName} adjustsFontSizeToFit numberOfLines={1}>Merchant App</Text>
          </Animated.View>
        </View>

        {/* Buttons Section with Animation */}
        <Animated.View 
          style={[
            styles.buttonsSection,
            { opacity: buttonsOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signInButtonGradient}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => router.replace('/(auth)/phone-verification')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signUpButtonGradient}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: Math.min(52, width * 0.13),
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  buttonsSection: {
    paddingBottom: 48,
    gap: 16,
  },
  signInButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInButtonGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
