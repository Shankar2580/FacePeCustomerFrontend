import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import apiService from '@/services/api';

export default function PhoneVerificationScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }
    return text;
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleContinue = async () => {
    if (phoneNumber.length < 14) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert formatted number to E.164 format
      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;
      
      // Send OTP via Twilio (you'll need to implement this endpoint in your backend)
      await apiService.auth.sendOTP({ phone_number: e164Number });
      
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/otp-verification',
        params: { phoneNumber: e164Number }
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.iconContainer}
          >
            <Ionicons name="phone-portrait" size={32} color={Colors.text.white} />
          </LinearGradient>
          
          <Text style={styles.title}>Verify Your Phone</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to get started with your merchant account
          </Text>
        </View>

        {/* Phone Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇺🇸 +1</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.text.light}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              autoFocus
            />
          </View>
          
          <Text style={styles.inputHint}>
            We'll send you a verification code via SMS
          </Text>
        </View>

        {/* Continue Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.continueButton, phoneNumber.length >= 14 && styles.continueButtonActive]}
            onPress={handleContinue}
            disabled={phoneNumber.length < 14 || isLoading}
          >
            <LinearGradient
              colors={phoneNumber.length >= 14 ? Colors.gradients.primary : ['#CBD5E1', '#94A3B8']}
              style={styles.continueButtonGradient}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Please wait...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => router.push('/(auth)/login')}
            >
              Sign In
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputSection: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border.light,
    overflow: 'hidden',
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: Colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: Colors.border.light,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 14,
    color: Colors.text.light,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  buttonSection: {
    paddingBottom: 40,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonActive: {
    shadowColor: Colors.primary,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
}); 