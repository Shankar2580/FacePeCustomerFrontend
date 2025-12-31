import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { authAPI } from '@/services/api/apiService';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { getUserFriendlyErrorMessage } from '@/utils/errorHandler';
import { OTPInput } from '@/components/ui/OTPInput';
import { scale, fontScale } from '@/utils/responsive';

export default function ForgotPasswordScreen() {
  const { showAlert, AlertComponent } = useStyledAlert();

  // Step management - 4-step wizard
  const [step, setStep] = useState<'mobile' | 'smsVerify' | 'emailVerify' | 'password'>('mobile');
  const [showEmailInfoModal, setShowEmailInfoModal] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Form data
  const [mobileNumber, setMobileNumber] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState(''); // Masked email from backend for display
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for SMS
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Countdown timer for email
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (emailCountdown > 0) {
      interval = setInterval(() => {
        setEmailCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailCountdown]);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
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
    if (password.length < 8) errors.push('at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('at least one lowercase letter');
    if (!/\d/.test(password)) errors.push('at least one number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('at least one special character');
    return errors;
  };

  // Step 1: Send SMS verification code only
  const handleSendVerification = async () => {
    if (!mobileNumber.trim() || mobileNumber.length < 14) {
      showAlert('Validation Error', 'Please enter a valid mobile number', [{ text: 'OK' }], 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;

      // Validate merchant exists and get masked email
      const response = await authAPI.forgotPassword({ mobile_number: e164Number });
      
      // Extract masked email from response message (e.g., "Email: jo***@gmail.com")
      const emailMatch = response.data?.message?.match(/Email:\s*([^\s]+)/);
      if (emailMatch && emailMatch[1]) {
        setMaskedEmail(emailMatch[1]);
      }

      // Send mobile verification code
      await import('@/services/api/apiService').then(({ verificationAPI }) =>
        verificationAPI.sendMobileCode(e164Number)
      );

      // Move to SMS verify step
      setStep('smsVerify');
      setCountdown(60);
      showAlert('Success', 'Verification code sent to your phone.', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      showAlert('Error', getUserFriendlyErrorMessage(error, 'Failed to send verification code'), [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify SMS code and show email popup
  const handleVerifySmsCode = () => {
    if (!verificationCode || verificationCode.length < 6) {
      showAlert('Validation Error', 'Please enter the complete mobile verification code', [{ text: 'OK' }], 'warning');
      return;
    }
    setShowEmailInfoModal(true);
  };

  // Send email code and proceed to email verification
  const handleSendEmailCode = async () => {
    setShowEmailInfoModal(false);
    if (!merchantEmail) {
      showAlert('Error', 'Please enter your registered email', [{ text: 'OK' }], 'warning');
      return;
    }
    
    setIsLoading(true);
    try {
      await import('@/services/api/apiService').then(({ verificationAPI }) =>
        verificationAPI.sendEmailCode(merchantEmail)
      );
      setEmailCountdown(60);
      setStep('emailVerify');
    } catch (error: any) {
      showAlert('Error', getUserFriendlyErrorMessage(error, 'Failed to send email code'), [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify email code and proceed to password
  const handleVerifyEmailCode = () => {
    if (!emailVerificationCode || emailVerificationCode.length < 6) {
      showAlert('Validation Error', 'Please enter the complete email verification code', [{ text: 'OK' }], 'warning');
      return;
    }
    setStep('password');
  };


  // Step 3: Reset password
  const handleResetPassword = async () => {
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
      showAlert('Error', getUserFriendlyErrorMessage(error, 'Failed to reset password'), [{ text: 'OK' }], 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend SMS code
  const handleResendSmsCode = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      const e164Number = `+1${cleanNumber}`;

      await import('@/services/api/apiService').then(({ verificationAPI }) =>
        verificationAPI.sendMobileCode(e164Number)
      );

      setCountdown(60);
      showAlert('Success', 'SMS code resent successfully', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      showAlert('Error', getUserFriendlyErrorMessage(error, 'Failed to resend code'), [{ text: 'OK' }], 'error');
    } finally {
      setIsResending(false);
    }
  };

  // Resend email code
  const handleResendEmailCode = async () => {
    if (emailCountdown > 0 || isResending) return;

    setIsResending(true);
    try {
      await import('@/services/api/apiService').then(({ verificationAPI }) =>
        verificationAPI.sendEmailCode(merchantEmail)
      );

      setEmailCountdown(60);
      showAlert('Success', 'Email code resent successfully', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      showAlert('Error', getUserFriendlyErrorMessage(error, 'Failed to resend code'), [{ text: 'OK' }], 'error');
    } finally {
      setIsResending(false);
    }
  };

  // Dynamic content based on step
  const getStepIcon = () => {
    switch (step) {
      case 'mobile': return 'key';
      case 'smsVerify': return 'chatbox';
      case 'emailVerify': return 'mail';
      case 'password': return 'lock-closed';
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'mobile': return 'Reset Password';
      case 'smsVerify': return 'Verify Mobile';
      case 'emailVerify': return 'Verify Email';
      case 'password': return 'New Password';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'mobile': return 'Enter your mobile number to receive verification code';
      case 'smsVerify': return `Enter the code sent to ${mobileNumber}`;
      case 'emailVerify': return `Enter the code sent to ${merchantEmail}`;
      case 'password': return 'Create a strong password for your account';
    }
  };

  const getProgressStepIndex = () => {
    switch (step) {
      case 'mobile': return 0;
      case 'smsVerify': return 1;
      case 'emailVerify': return 2;
      case 'password': return 3;
      default: return 0;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={Colors.gradients.primary}
                  style={styles.iconGradient}
                >
                  <Ionicons name={getStepIcon()} size={scale(32)} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>{getStepTitle()}</Text>
              <Text style={styles.subtitle}>{getStepSubtitle()}</Text>

              {/* Progress Indicator - 4 steps */}
              <View style={styles.progressContainer}>
                <View style={[styles.progressDot, getProgressStepIndex() >= 0 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 1 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 1 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 2 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 2 && styles.progressDotActive]} />
                <View style={[styles.progressLine, getProgressStepIndex() >= 3 && styles.progressLineActive]} />
                <View style={[styles.progressDot, getProgressStepIndex() >= 3 && styles.progressDotActive]} />
              </View>
            </View>

            {/* Step 1: Mobile Number */}
            {step === 'mobile' && (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="call" size={20} color={Colors.text.light} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your mobile number"
                      placeholderTextColor={Colors.text.light}
                      value={mobileNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                      maxLength={14}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, (isLoading || mobileNumber.length < 14) && styles.primaryButtonDisabled]}
                  onPress={handleSendVerification}
                  disabled={isLoading || mobileNumber.length < 14}
                >
                  <LinearGradient
                    colors={Colors.gradients.primary}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Sending...' : 'Send Verification Code'}
                    </Text>
                    {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: SMS Verification */}
            {step === 'smsVerify' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="chatbox" size={scale(20)} color={Colors.primary} />
                    <Text style={styles.otpLabel}>SMS Code</Text>
                  </View>
                  <OTPInput
                    code={verificationCode}
                    setCode={setVerificationCode}
                    variant="grouped"
                    length={6}
                    autoFocus={true}
                  />
                </View>

                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in {countdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendSmsCode}
                    disabled={isResending}
                    style={[isResending && { opacity: 0.5 }]}
                  >
                    <Text style={styles.resendText}>
                      {isResending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, (!verificationCode || verificationCode.length < 6) && styles.primaryButtonDisabled]}
                  onPress={handleVerifySmsCode}
                  disabled={!verificationCode || verificationCode.length < 6}
                >
                  <LinearGradient
                    colors={Colors.gradients.primary}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={() => setStep('mobile')}
                >
                  <Text style={styles.changeButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Email Verification */}
            {step === 'emailVerify' && (
              <View style={styles.form}>
                <View style={styles.otpSection}>
                  <View style={styles.otpLabelRow}>
                    <Ionicons name="mail" size={scale(20)} color={Colors.primary} />
                    <Text style={styles.otpLabel}>Email Code</Text>
                  </View>
                  <OTPInput
                    code={emailVerificationCode}
                    setCode={setEmailVerificationCode}
                    variant="grouped"
                    length={6}
                    autoFocus={true}
                  />
                </View>

                {emailCountdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in {emailCountdown}s
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendEmailCode}
                    disabled={isResending}
                    style={[isResending && { opacity: 0.5 }]}
                  >
                    <Text style={styles.resendText}>
                      {isResending ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.primaryButton, (!emailVerificationCode || emailVerificationCode.length < 6) && styles.primaryButtonDisabled]}
                  onPress={handleVerifyEmailCode}
                  disabled={!emailVerificationCode || emailVerificationCode.length < 6}
                >
                  <LinearGradient
                    colors={Colors.gradients.primary}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <View style={styles.form}>
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
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={Colors.text.light}
                      />
                    </TouchableOpacity>
                  </View>
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
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={Colors.text.light}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.passwordHint}>
                  <Ionicons name="information-circle" size={16} color={Colors.primary} />
                  <Text style={styles.passwordHintText}>
                    Must contain uppercase, lowercase, number, and special character
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, (isLoading || !newPassword || !confirmPassword) && styles.primaryButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  <LinearGradient
                    colors={Colors.gradients.primary}
                    style={styles.primaryButtonGradient}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Text>
                    {!isLoading && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.primary} />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* Email Info Modal */}
      <Modal
        visible={showEmailInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.modalIconGradient}
              >
                <Ionicons name="mail" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>Email Verification</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered email to receive verification code:
            </Text>
            {maskedEmail ? (
              <Text style={styles.maskedEmailHint}>
                Your email: {maskedEmail}
              </Text>
            ) : null}
            <View style={styles.modalInputContainer}>
              <Ionicons name="mail" size={20} color={Colors.text.light} style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your email"
                placeholderTextColor={Colors.text.light}
                value={merchantEmail}
                onChangeText={setMerchantEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={[styles.modalButton, !merchantEmail && styles.modalButtonDisabled]}
              onPress={handleSendEmailCode}
              disabled={!merchantEmail}
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>Send Email Code</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowEmailInfoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(24),
    paddingBottom: scale(24),
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  iconContainer: {
    marginBottom: scale(24),
  },
  iconGradient: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: fontScale(32),
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(16),
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: scale(24),
    paddingHorizontal: scale(16),
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  form: {
    marginBottom: scale(32),
  },
  inputGroup: {
    marginBottom: scale(16),
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
    borderRadius: 12,
    paddingHorizontal: scale(16),
    height: scale(56),
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16),
    color: Colors.text.primary,
  },
  eyeButton: {
    padding: scale(8),
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: scale(8),
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    paddingVertical: scale(18),
    paddingHorizontal: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  primaryButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: Colors.text.white,
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
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: scale(12),
    marginBottom: scale(16),
    gap: scale(8),
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  passwordHintText: {
    flex: 1,
    fontSize: fontScale(12),
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: scale(24),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    minHeight: 44,
  },
  backButtonText: {
    fontSize: fontScale(14),
    color: Colors.primary,
    fontWeight: '600',
  },
  changeButton: {
    alignItems: 'center',
    marginTop: scale(16),
    paddingVertical: scale(8),
  },
  changeButtonText: {
    fontSize: fontScale(14),
    color: Colors.text.secondary,
    fontWeight: '500',
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
    marginBottom: scale(16),
    lineHeight: 22,
  },
  maskedEmailHint: {
    fontSize: fontScale(14),
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    paddingHorizontal: scale(16),
    height: scale(56),
    width: '100%',
    marginBottom: scale(16),
  },
  modalInput: {
    flex: 1,
    fontSize: fontScale(16),
    color: Colors.text.primary,
  },
  modalButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: scale(12),
  },
  modalButtonDisabled: {
    opacity: 0.6,
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