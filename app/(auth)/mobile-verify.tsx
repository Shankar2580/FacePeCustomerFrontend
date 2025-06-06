import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function MobileVerifyScreen() {
  const { verifyMobile, sendMobileVerification, isLoading, emailToken } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when code is complete
    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode?: string) => {
    const fullCode = verificationCode || code.join('');
    
    if (fullCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code');
      return;
    }

    const success = await verifyMobile(fullCode);
    
    if (success) {
      router.push('/(auth)/stripe-onboarding');
    } else {
      // Shake animation for error
      shakeCode();
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('Invalid Code', 'Please check your code and try again');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setTimer(60);
    setCanResend(false);
    
    const success = await sendMobileVerification(''); // Phone number from context
    
    if (success) {
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone');
    } else {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  const shakeCode = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={40} color={Colors.primary} />
        </View>
        
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your mobile number
        </Text>
      </View>

      {/* Code Input */}
      <Animated.View 
        style={[styles.codeContainer, { transform: [{ translateX: shakeAnimation }] }]}
      >
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.codeInput,
              digit && styles.codeInputFilled,
              index === code.findIndex(d => d === '') && styles.codeInputActive
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            autoFocus={index === 0}
            editable={!isLoading}
          />
        ))}
      </Animated.View>

      {/* Timer and Resend */}
      <View style={styles.timerSection}>
        {!canResend ? (
          <Text style={styles.timerText}>
            Resend code in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={isLoading}>
            <Text style={styles.resendText}>
              Didn't receive the code? Tap to resend
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify Button */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            code.every(digit => digit !== '') && styles.verifyButtonActive
          ]}
          onPress={() => handleVerify()}
          disabled={!code.every(digit => digit !== '') || isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </Text>
          {!isLoading && (
            <Ionicons name="checkmark" size={20} color={Colors.text.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Having trouble? {' '}
          <Text 
            style={styles.footerLink}
            onPress={() => Alert.alert('Support', 'Contact support for help')}
          >
            Contact Support
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 40,
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  codeInput: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.card,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background.primary,
  },
  codeInputActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  timerText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.medium,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  verifyButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  verifyButtonText: {
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
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
}); 