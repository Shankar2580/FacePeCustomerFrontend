import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/api';
import { useStyledAlert } from '@/components/ui/StyledAlert';

interface PinVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<boolean>;
  onCancel: () => void; // New prop for cancelling the entire payment
  loading: boolean;
  message?: string;
}

export default function PinVerificationModal({
  visible,
  onClose,
  onVerify,
  onCancel,
  loading,
  message = ERROR_MESSAGES.MULTIPLE_FACES_DETECTED,
}: PinVerificationModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const { showAlert, AlertComponent } = useStyledAlert();

  useEffect(() => {
    if (visible) {
      // Reset pin when modal opens
      setPin(['', '', '', '']);
      setError('');
      // Focus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [visible]);

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(''); // Clear error when user starts typing

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when PIN is complete
    if (newPin.every(digit => digit !== '') && value) {
      handleVerify(newPin.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (pinCode?: string) => {
    const fullPin = pinCode || pin.join('');

    if (fullPin.length !== 4) {
      setError('Please enter your complete 4-digit PIN');
      shakePin();
      return;
    }

    try {
      const success = await onVerify(fullPin);

      if (success) {
        // PIN verified successfully
        setPin(['', '', '', '']);
        setError('');
        onClose();
      } else {
        // PIN verification failed
        setError(ERROR_MESSAGES.INVALID_PIN);
        shakePin();
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError(ERROR_MESSAGES.PIN_VERIFICATION_FAILED);
      shakePin();
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const shakePin = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleForgotPin = () => {
    showAlert(
      'Forgot PIN?',
      'Please contact support for PIN reset assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contact Support', onPress: () => {
            // You can implement contact support functionality here
            showAlert('Contact Support', 'Please call support at 1-800-XXX-XXXX', [{ text: 'OK' }], 'info');
          }
        },
      ],
      'warning'
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, loading && styles.modalContentLoading]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.title}>PIN Verification Required</Text>
              <Text style={styles.subtitle}>{message}</Text>
            </View>

            {/* PIN Input */}
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Enter your 4-digit PIN</Text>
              <Animated.View
                style={[
                  styles.pinInputContainer,
                  { transform: [{ translateX: shakeAnimation }] }
                ]}
              >
                {pin.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.pinInput,
                      error ? styles.pinInputError : null,
                      digit ? styles.pinInputFilled : null,
                    ]}
                    value={digit}
                    onChangeText={(value) => handlePinChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    secureTextEntry
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </Animated.View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.forgotPinButton}
                onPress={handleForgotPin}
                disabled={loading}
              >
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>

              {/* Loading Animation when processing */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Verifying PIN...</Text>
                </View>
              )}

              {/* Cancel Button */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    showAlert(
                      'Cancel Payment',
                      'Are you sure you want to cancel this payment request?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: onCancel
                        },
                      ],
                      'warning'
                    );
                  }}
                // Don't disable during loading - allow cancellation anytime
                >
                  <Text style={styles.cancelButtonText}>Cancel Payment</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="lock-closed" size={16} color={Colors.text.secondary} />
              <Text style={styles.securityText}>
                Your PIN is used for secure verification only
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Styled Alert Component */}
      <AlertComponent />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContentLoading: {
    opacity: 0.95,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pinLabel: {
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 16,
    fontWeight: '500',
  },
  pinInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  pinInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  pinInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}10`,
  },
  pinInputError: {
    borderColor: Colors.error,
    backgroundColor: `${Colors.error}10`,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  forgotPinButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  forgotPinText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 200,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cancelButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  securityText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    gap: 12,
  },
  loadingText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
}); 