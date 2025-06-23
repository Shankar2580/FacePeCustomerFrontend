import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import apiService from '@/services/api';

export default function OTPVerificationScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    
    try {
      await apiService.auth.verifyOTP({
        phone_number: phoneNumber || '',
        verification_code: otpCode
      });
      
      // Navigate to registration screen with verified phone number
      router.push({
        pathname: '/(auth)/register',
        params: { phoneNumber: phoneNumber }
      });
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Verification Failed', 'Invalid verification code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      await apiService.auth.sendOTP({ phone_number: phoneNumber || '' });
      setResendTimer(60);
      setCanResend(false);
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone');
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^1?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.iconContainer}
          >
            <Ionicons name="chatbubble-ellipses" size={32} color={Colors.text.white} />
          </LinearGradient>
          
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.phoneText}>{formatPhoneNumber(phoneNumber || '')}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpSection}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
                             <TextInput
                 key={index}
                 ref={(ref) => { inputRefs.current[index] = ref; }}
                 style={[
                   styles.otpInput,
                   digit && styles.otpInputFilled
                 ]}
                 value={digit}
                 onChangeText={(value) => handleOtpChange(value, index)}
                 onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                 keyboardType="number-pad"
                 maxLength={1}
                 textAlign="center"
                 selectTextOnFocus
               />
            ))}
          </View>
        </View>

        {/* Verify Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.verifyButton, otp.join('').length === 6 && styles.verifyButtonActive]}
            onPress={handleVerifyOTP}
            disabled={otp.join('').length !== 6 || isLoading}
          >
            <LinearGradient
              colors={otp.join('').length === 6 ? Colors.gradients.primary : ['#CBD5E1', '#94A3B8']}
              style={styles.verifyButtonGradient}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Resend Section */}
        <View style={styles.resendSection}>
          <Text style={styles.resendText}>
            Didn't receive the code?{' '}
          </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend in {resendTimer}s
            </Text>
          )}
        </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 20,
    padding: 8,
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
  },
  phoneText: {
    fontWeight: '600',
    color: Colors.primary,
  },
  otpSection: {
    flex: 1,
    paddingTop: 40,
    marginBottom: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: Colors.border.light,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    backgroundColor: Colors.background.card,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background.card,
  },
  buttonSection: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonActive: {
    shadowColor: Colors.primary,
  },
  verifyButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.white,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  resendTimer: {
    fontSize: 14,
    color: Colors.text.muted,
  },
}); 