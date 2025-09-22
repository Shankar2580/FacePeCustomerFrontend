import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function OnboardingCompleteScreen() {
  const { merchant_id } = useLocalSearchParams<{ merchant_id: string }>();
  const { refreshUserProfile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleOnboardingComplete = async () => {
      try {
        // Wait a moment for Stripe webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh user profile to get updated stripe status
        await refreshUserProfile();
        setSuccess(true);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    handleOnboardingComplete();
  }, []);

  const handleContinue = () => {
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.primary}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {loading ? (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="hourglass" size={64} color={Colors.text.white} />
              </View>
              <Text style={styles.title}>Processing...</Text>
              <Text style={styles.subtitle}>
                We're setting up your payment account. This may take a moment.
              </Text>
            </>
          ) : success ? (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.title}>Setup Complete!</Text>
              <Text style={styles.subtitle}>
                Your Stripe account has been successfully configured. You can now start accepting payments.
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={64} color={Colors.warning} />
              </View>
              <Text style={styles.title}>Setup In Progress</Text>
              <Text style={styles.subtitle}>
                Your account setup is being processed. You may need to complete additional steps in Stripe.
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: 8,
  },
}); 