import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { authAPI } from '@/services/api/apiService';
import { useStyledAlert } from '@/components/ui/StyledAlert';

export default function ForgotPasswordScreen() {
  const { showAlert, AlertComponent } = useStyledAlert();
  const [step, setStep] = useState<'mobile' | 'verify'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [merchantEmail, setMerchantEmail] = useState(''); // Store email from backend
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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
    setMobileNumber(formatted);
  };

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
    if (!mobileNumber.trim() || mobileNumber.length < 14) {
      showAlert('Validation Error', 'Please enter a valid mobile number', [{ text: 'OK' }], 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Convert formatted number to E.164 format
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;
      
      // Step 1: Validate merchant exists and get email
      const response = await authAPI.forgotPassword({ mobile_number: e164Number });
      const email = response.data?.email || response.email;
      
      if (!email) {
        throw new Error('Email not found for this merchant');
      }
      
      setMerchantEmail(email);
      
      // Step 2: Send mobile verification code
      await import('@/services/api/apiService').then(({ verificationAPI }) => 
        verificationAPI.sendMobileCode(e164Number)
      );
      
      // Step 3: Send email verification code
      await import('@/services/api/apiService').then(({ verificationAPI }) => 
        verificationAPI.sendEmailCode(email)
      );
      
      setStep('verify');
      setCountdown(60);
      showAlert('Success', 'Verification codes sent to your mobile and email', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || error.message || 'Failed to send verification codes', [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!verificationCode.trim()) {
      showAlert('Validation Error', 'Please enter the mobile verification code', [{ text: 'OK' }], 'warning');
      return;
    }
    
    if (!emailVerificationCode.trim()) {
      showAlert('Validation Error', 'Please enter the email verification code', [{ text: 'OK' }], 'warning');
      return;
    }
    
    if (!newPassword.trim()) {
      showAlert('Validation Error', 'Please enter your new password', [{ text: 'OK' }], 'warning');
      return;
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      showAlert('Password Requirements', `Password must contain:\n• ${passwordErrors.join('\n• ')}`, [{ text: 'OK' }], 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Validation Error', 'Passwords do not match', [{ text: 'OK' }], 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Convert formatted number to E.164 format
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;
      
      await authAPI.resetPassword({
        mobile_number: e164Number,
        verification_code: verificationCode,
        email_verification_code: emailVerificationCode,
        new_password: newPassword,
      });
      
      showAlert('Success', 'Password reset successful! Please login with your new password.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ], 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to reset password', [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      // Convert formatted number to E.164 format
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;
      
      // Resend both verification codes
      await import('@/services/api/apiService').then(({ verificationAPI }) => 
        verificationAPI.sendMobileCode(e164Number)
      );
      
      await import('@/services/api/apiService').then(({ verificationAPI }) => 
        verificationAPI.sendEmailCode(merchantEmail)
      );
      
      setCountdown(60);
      showAlert('Success', 'Verification codes sent again', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.detail || 'Failed to resend codes', [{ text: 'OK' }], 'error');
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
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇺🇸 +1</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="(555) 123-4567"
              placeholderTextColor={Colors.text.light}
              value={mobileNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, mobileNumber.length >= 14 && styles.primaryButtonActive]}
            onPress={handleSendCode}
            disabled={mobileNumber.length < 14 || isLoading}
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
          Enter the codes sent to your mobile and email
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Verification Code</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="phone-portrait" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter SMS code"
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
          <Text style={styles.label}>Email Verification Code</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={Colors.text.light} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter email code"
              placeholderTextColor={Colors.text.light}
              value={emailVerificationCode}
              onChangeText={setEmailVerificationCode}
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
            style={[styles.primaryButton, (verificationCode.trim() && emailVerificationCode.trim() && newPassword.trim() && confirmPassword.trim()) && styles.primaryButtonActive]}
            onPress={handleVerifyAndReset}
            disabled={!verificationCode.trim() || !emailVerificationCode.trim() || !newPassword.trim() || !confirmPassword.trim() || isLoading}
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
      
      {/* Styled Alert Component */}
      <AlertComponent />
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
    overflow: 'hidden',
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
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    backgroundColor: Colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: Colors.border.light,
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 8,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  phoneInput: {
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