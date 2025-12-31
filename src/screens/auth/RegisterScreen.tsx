import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { API_CONFIG, BACKEND_ENDPOINTS } from '@/constants/api';
import { OTPInput } from '@/components/ui/OTPInput';
import { scale, fontScale } from '@/utils/responsive';

export default function RegisterScreen() {
  const { phoneNumber, verifiedMobileOtp } = useLocalSearchParams<{ phoneNumber: string; verifiedMobileOtp: string }>();
  const { register, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useStyledAlert();

  // Step management - 3-step wizard (mobile already verified in OtpVerificationScreen)
  const [step, setStep] = useState<'details' | 'emailVerify' | 'complete'>('details');

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Email countdown timer
  const startEmailCountdown = () => {
    setEmailCountdown(60);
    const timer = setInterval(() => {
      setEmailCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  // Step 1: Validate details and send email code
  const handleProceedToEmailVerification = async () => {
    if (!validateForm()) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${BACKEND_ENDPOINTS.VERIFICATION.SEND_EMAIL_CODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        startEmailCountdown();
        setStep('emailVerify');
        showAlert('Success', 'Verification code sent to your email', [{ text: 'OK' }], 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', errorData.detail || 'Failed to send email verification code', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to send verification code. Please try again.', [{ text: 'OK' }], 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify email code and proceed to registration (mobile already verified)
  const handleVerifyEmailCode = () => {
    if (!emailVerificationCode || emailVerificationCode.length < 6) {
      showAlert('Error', 'Please enter the complete email verification code', [{ text: 'OK' }], 'warning');
      return;
    }
    // Mobile already verified in OtpVerificationScreen, proceed directly to registration
    handleRegister();
  };


  // Resend email code
  const handleResendEmailCode = async () => {
    if (emailCountdown > 0 || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${BACKEND_ENDPOINTS.VERIFICATION.SEND_EMAIL_CODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        startEmailCountdown();
        showAlert('Success', 'Email code resent successfully', [{ text: 'OK' }], 'success');
      } else {
        showAlert('Error', 'Failed to resend code', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to resend code', [{ text: 'OK' }], 'error');
    } finally {
      setIsSending(false);
    }
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

  const validateForm = () => {
    // Business name validation
    if (!formData.businessName.trim()) {
      showAlert('Validation Error', 'Business name is required', [{ text: 'OK' }], 'warning');
      return false;
    }

    // Email validation
    if (!formData.email.trim()) {
      showAlert('Validation Error', 'Email address is required', [{ text: 'OK' }], 'warning');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Validation Error', 'Please enter a valid email address', [{ text: 'OK' }], 'warning');
      return false;
    }

    // Password validation
    if (!formData.password.trim()) {
      showAlert('Validation Error', 'Password is required', [{ text: 'OK' }], 'warning');
      return false;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      showAlert(
        'Password Requirements Not Met',
        `Your password must contain:\n\n• ${passwordErrors.join('\n• ')}\n\nPlease update your password to meet these requirements.`,
        [{ text: 'OK' }],
        'warning'
      );
      return false;
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      showAlert('Validation Error', 'Please confirm your password', [{ text: 'OK' }], 'warning');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showAlert(
        'Password Mismatch',
        'Password and Confirm Password do not match. Please make sure both passwords are identical.',
        [{ text: 'OK' }],
        'warning'
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    try {
      const registrationSuccess = await register({
        email: formData.email,
        password: formData.password,
        business_name: formData.businessName,
        mobile_number: phoneNumber || '',
        email_verification_code: emailVerificationCode,
        mobile_verification_code: verifiedMobileOtp || '',  // Use the OTP verified in OtpVerificationScreen
      });

      if (registrationSuccess) {
        // Registration successful, user is now logged in
        showAlert(
          'Registration Successful!',
          'Your account has been created successfully.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to tabs and clear the auth stack
                router.dismissAll();
                router.replace('/(tabs)');
              },
            }
          ],
          'success'
        );
      } else {
        showAlert(
          'Registration Failed',
          'Unable to create your account. Please check your information and try again.',
          [{ text: 'OK' }],
          'error'
        );
      }
    } catch (error) {
      showAlert(
        'Registration Error',
        'An error occurred during registration. Please try again later.',
        [{ text: 'OK' }],
        'error'
      );
    }
  };

  const isFormValid =
    formData.businessName.trim() &&
    formData.email.trim() &&
    validatePassword(formData.password).length === 0 &&
    formData.password === formData.confirmPassword;

  const getStepTitle = () => {
    switch (step) {
      case 'details': return 'Create Account';
      case 'emailVerify': return 'Verify Email';
      default: return 'Create Account';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'details': return 'Enter your business details to get started';
      case 'emailVerify': return `Enter the code sent to ${formData.email}`;
      default: return '';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'details': return 0;
      case 'emailVerify': return 1;
      default: return 0;
    }
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
              onPress={() => step === 'details' ? router.back() : setStep('details')}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

            {/* Progress Indicator - 2 steps: Details → Email Verify (Mobile already verified) */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressDot, getProgressStepIndex() >= 0 && styles.progressDotActive]} />
              <View style={[styles.progressLine, getProgressStepIndex() >= 1 && styles.progressLineActive]} />
              <View style={[styles.progressDot, getProgressStepIndex() >= 1 && styles.progressDotActive]} />
            </View>
          </View>

          {/* Step 1: Details Form */}
          {step === 'details' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business name"
                    placeholderTextColor={Colors.text.light}
                    value={formData.businessName}
                    onChangeText={(text: string) => handleInputChange('businessName', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor={Colors.text.light}
                    value={formData.email}
                    onChangeText={(text: string) => handleInputChange('email', text.toLowerCase())}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors.text.light}
                    value={formData.password}
                    onChangeText={(text: string) => handleInputChange('password', text)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>Must contain: uppercase, lowercase, number, and special character</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors.text.light}
                    value={formData.confirmPassword}
                    onChangeText={(text: string) => handleInputChange('confirmPassword', text)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={Colors.text.light} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={[styles.inputContainer, styles.disabledInput]}>
                  <Ionicons name="phone-portrait" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <Text style={styles.disabledText}>{phoneNumber}</Text>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                </View>
              </View>

              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={[styles.registerButton, isFormValid && styles.registerButtonActive]}
                  onPress={handleProceedToEmailVerification}
                  disabled={!isFormValid || isSending}
                >
                  <Text style={styles.registerButtonText}>{isSending ? 'Sending...' : 'Continue'}</Text>
                  {!isSending && <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Email Verification */}
          {step === 'emailVerify' && (
            <View style={styles.form}>
              <View style={styles.otpSection}>
                <View style={styles.otpLabelRow}>
                  <Ionicons name="mail" size={scale(20)} color={Colors.primary} />
                  <Text style={styles.otpLabel}>Email Code</Text>
                </View>
                <OTPInput code={emailVerificationCode} setCode={setEmailVerificationCode} variant="grouped" length={6} autoFocus={true} />
              </View>

              {emailCountdown > 0 ? (
                <Text style={styles.countdownText}>Resend code in {emailCountdown}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResendEmailCode} disabled={isSending} style={[isSending && { opacity: 0.5 }]}>
                  <Text style={styles.resendText}>{isSending ? 'Sending...' : 'Resend Code'}</Text>
                </TouchableOpacity>
              )}

              <View style={styles.buttonSection}>
                <TouchableOpacity
                  style={[styles.registerButton, emailVerificationCode.length >= 6 && styles.registerButtonActive]}
                  onPress={handleVerifyEmailCode}
                  disabled={emailVerificationCode.length < 6}
                >
                  <Text style={styles.registerButtonText}>{isLoading ? 'Creating Account...' : 'Create Account'}</Text>
                  {!isLoading && <Ionicons name="checkmark-circle" size={20} color={Colors.text.white} />}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: scale(24),
    paddingTop: scale(20),
    paddingBottom: scale(30),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(20),
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 3,
  },
  title: {
    fontSize: fontScale(28),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: fontScale(16),
    color: Colors.text.secondary,
    lineHeight: fontScale(24),
  },
  form: {
    flex: 1,
    paddingHorizontal: scale(24),
  },
  inputGroup: {
    marginBottom: scale(24),
  },
  label: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: scale(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: Colors.border.light,
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
  },
  disabledInput: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.border.medium,
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16),
    color: Colors.text.primary,
    fontWeight: '500',
  },
  disabledText: {
    flex: 1,
    fontSize: fontScale(16),
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: scale(4),
  },
  buttonSection: {
    paddingHorizontal: scale(24),
    paddingBottom: scale(40),
    paddingTop: scale(20),
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.medium,
    borderRadius: scale(16),
    paddingVertical: scale(18),
    paddingHorizontal: scale(24),
  },
  registerButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 4,
  },
  registerButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: scale(8),
  },
  passwordHint: {
    fontSize: fontScale(12),
    color: Colors.text.light,
    marginTop: scale(4),
    paddingHorizontal: scale(2),
  },
  sendCodeButton: {
    marginTop: scale(12),
    backgroundColor: Colors.primary,
    borderRadius: scale(8),
    paddingVertical: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButtonDisabled: {
    backgroundColor: Colors.border.medium,
    opacity: 0.6,
  },
  sendCodeButtonText: {
    fontSize: fontScale(14),
    fontWeight: '600',
    color: Colors.text.white,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(20),
  },
  progressDot: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: Colors.border.medium,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.3 }],
  },
  progressLine: {
    width: scale(40),
    height: 2,
    backgroundColor: Colors.border.medium,
    marginHorizontal: scale(4),
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  otpSection: {
    marginBottom: scale(24),
  },
  otpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
    gap: scale(8),
  },
  otpLabel: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: Colors.text.primary,
  },
  resendText: {
    fontSize: fontScale(14),
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: scale(16),
    textDecorationLine: 'underline',
  },
  countdownText: {
    fontSize: fontScale(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    marginVertical: scale(16),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(24),
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: scale(32),
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: scale(20),
  },
  modalIconGradient: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: scale(12),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontScale(14),
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: scale(8),
    lineHeight: 22,
  },
  modalEmail: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: scale(24),
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  modalButtonGradient: {
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCancelButton: {
    paddingVertical: scale(12),
  },
  modalCancelText: {
    fontSize: fontScale(14),
    color: Colors.text.secondary,
    fontWeight: '500',
  },
}); 