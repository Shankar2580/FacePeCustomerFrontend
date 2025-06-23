import React, { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { authAPI } from '@/services/api';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'mobile' | 'verify'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('at least one special character');
    }
    
    return errors;
  };

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!mobileNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter your mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.forgotPassword({ mobile_number: mobileNumber });
      setStep('verify');
      setCountdown(60);
      Alert.alert('Success', 'Verification code sent to your mobile number');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Validation Error', 'Please enter the verification code');
      return;
    }
    
    if (!newPassword.trim()) {
      Alert.alert('Validation Error', 'Please enter your new password');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      Alert.alert('Password Requirements', `Password must contain:\n• ${passwordErrors.join('\n• ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword({
        mobile_number: mobileNumber,
        verification_code: verificationCode,
        new_password: newPassword,
      });
      
      Alert.alert('Success', 'Password reset successful! Please login with your new password.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      await authAPI.forgotPassword({ mobile_number: mobileNumber });
      setCountdown(60);
      Alert.alert('Success', 'Verification code sent again');
    } catch (error: any) {
      console.error('Resend code error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMobileStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="key" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your mobile number to receive a verification code
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="phone-portrait" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your mobile number"
              placeholderTextColor={Colors.text.light}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, mobileNumber.trim() && styles.primaryButtonActive]}
            onPress={handleSendCode}
            disabled={!mobileNumber.trim() || isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Sending Code...' : 'Send Verification Code'}
            </Text>
            {!isLoading && (
              <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remember your password?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => router.back()}
            >
              Back to Login
            </Text>
          </Text>
        </View>
      </View>
    </>
  );

  const renderVerifyStep = () => (
    <>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {mobileNumber}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Verification Code</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="keypad" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit code"
              placeholderTextColor={Colors.text.light}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              placeholderTextColor={Colors.text.light}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={Colors.text.light} 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.passwordHint}>
            Must contain: uppercase, lowercase, number, and special character
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={Colors.text.light}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={20} 
                color={Colors.text.light} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, (verificationCode.trim() && newPassword.trim() && confirmPassword.trim()) && styles.primaryButtonActive]}
            onPress={handleVerifyAndReset}
            disabled={!verificationCode.trim() || !newPassword.trim() || !confirmPassword.trim() || isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Text>
            {!isLoading && (
              <Ionicons name="checkmark" size={20} color={Colors.text.white} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, countdown > 0 && styles.secondaryButtonDisabled]}
            onPress={handleResendCode}
            disabled={countdown > 0 || isLoading}
          >
            <Text style={[styles.secondaryButtonText, countdown > 0 && styles.secondaryButtonTextDisabled]}>
              {countdown > 0 ? `Resend Code (${countdown}s)` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Want to try a different number?{' '}
            <Text 
              style={styles.footerLink}
              onPress={() => setStep('mobile')}
            >
              Change Number
            </Text>
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {step === 'mobile' ? renderMobileStep() : renderVerifyStep()}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  form: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  buttonSection: {
    paddingTop: 24,
    paddingBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.medium,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  primaryButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  secondaryButtonDisabled: {
    backgroundColor: Colors.border.light,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  secondaryButtonTextDisabled: {
    color: Colors.text.light,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 4,
    paddingHorizontal: 2,
  },
}); 