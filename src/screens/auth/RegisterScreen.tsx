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
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { API_CONFIG, BACKEND_ENDPOINTS } from '@/constants/api';

export default function RegisterScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { register, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useStyledAlert();

  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [mobileVerificationCode, setMobileVerificationCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [mobileCodeSent, setMobileCodeSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [mobileCountdown, setMobileCountdown] = useState(0);

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

  // Mobile countdown timer
  const startMobileCountdown = () => {
    setMobileCountdown(60);
    const timer = setInterval(() => {
      setMobileCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send email verification code
  const handleSendEmailCode = async () => {
    if (!formData.email) {
      showAlert('Error', 'Please enter your email address', [{ text: 'OK' }], 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert('Error', 'Please enter a valid email address', [{ text: 'OK' }], 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${BACKEND_ENDPOINTS.VERIFICATION.SEND_EMAIL_CODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setEmailCodeSent(true);
        startEmailCountdown();
        showAlert('Success', 'Verification code sent to your email', [{ text: 'OK' }], 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', errorData.detail || 'Failed to send email verification code', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to send verification code. Please try again.', [{ text: 'OK' }], 'error');
    }
  };

  // Send mobile verification code
  const handleSendMobileCode = async () => {
    if (!phoneNumber) {
      showAlert('Error', 'Phone number is required', [{ text: 'OK' }], 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BACKEND_URL}${BACKEND_ENDPOINTS.VERIFICATION.SEND_MOBILE_CODE}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: phoneNumber }),
      });

      if (response.ok) {
        setMobileCodeSent(true);
        startMobileCountdown();
        showAlert('Success', 'Verification code sent to your mobile', [{ text: 'OK' }], 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', errorData.detail || 'Failed to send mobile verification code', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to send verification code. Please try again.', [{ text: 'OK' }], 'error');
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
    if (!validateForm()) return;

    // Validate verification codes
    if (!emailVerificationCode || emailVerificationCode.length < 4) {
      showAlert('Validation Error', 'Please enter the email verification code', [{ text: 'OK' }], 'warning');
      return;
    }

    if (!mobileVerificationCode || mobileVerificationCode.length < 4) {
      showAlert('Validation Error', 'Please enter the mobile verification code', [{ text: 'OK' }], 'warning');
      return;
    }

    try {
      const registrationSuccess = await register({
        email: formData.email,
        password: formData.password,
        business_name: formData.businessName,
        mobile_number: phoneNumber || '',
        email_verification_code: emailVerificationCode,
        mobile_verification_code: mobileVerificationCode,
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

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Enter your business details to get started
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your business name"
                  placeholderTextColor={Colors.text.light}
                  value={formData.businessName}
                  onChangeText={(text) => handleInputChange('businessName', text)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor={Colors.text.light}
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              {/* Send Email Code Button */}
              <TouchableOpacity
                style={[styles.sendCodeButton, (!formData.email || emailCountdown > 0) && styles.sendCodeButtonDisabled]}
                onPress={handleSendEmailCode}
                disabled={!formData.email || emailCountdown > 0}
              >
                <Text style={styles.sendCodeButtonText}>
                  {emailCodeSent 
                    ? (emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend Email Code')
                    : 'Send Email Code'
                  }
                </Text>
              </TouchableOpacity>
              
              {/* Email Verification Code Input */}
              {emailCodeSent && (
                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email verification code"
                    placeholderTextColor={Colors.text.light}
                    value={emailVerificationCode}
                    onChangeText={setEmailVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={Colors.text.light}
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
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

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.text.light}
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleInputChange('confirmPassword', text)}
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

            {/* Phone Number Display */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Ionicons name="phone-portrait" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <Text style={styles.disabledText}>{phoneNumber}</Text>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              </View>
              
              {/* Send Mobile Code Button */}
              <TouchableOpacity
                style={[styles.sendCodeButton, mobileCountdown > 0 && styles.sendCodeButtonDisabled]}
                onPress={handleSendMobileCode}
                disabled={mobileCountdown > 0}
              >
                <Text style={styles.sendCodeButtonText}>
                  {mobileCodeSent 
                    ? (mobileCountdown > 0 ? `Resend in ${mobileCountdown}s` : 'Resend Mobile Code')
                    : 'Send Mobile Code'
                  }
                </Text>
              </TouchableOpacity>
              
              {/* Mobile Verification Code Input */}
              {mobileCodeSent && (
                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile verification code"
                    placeholderTextColor={Colors.text.light}
                    value={mobileVerificationCode}
                    onChangeText={setMobileVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Register Button */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.registerButton, isFormValid && styles.registerButtonActive]}
              onPress={handleRegister}
              disabled={!isFormValid || isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
              {!isLoading && (
                <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
              )}
            </TouchableOpacity>
          </View>
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
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
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
  disabledInput: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.border.medium,
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
  disabledText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.medium,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  registerButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sendCodeButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendCodeButtonDisabled: {
    backgroundColor: Colors.border.medium,
    opacity: 0.6,
  },
  sendCodeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.white,
  },
}); 