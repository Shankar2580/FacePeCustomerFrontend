import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/colors';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { scale, fontScale } from '@/utils/responsive';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useStyledAlert();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Validation Error', 'Please fill in all fields', [{ text: 'OK' }], 'warning');
      return;
    }

    // Process email/phone - add +1 for phone numbers
    let processedEmail = email.trim();

    // Check if it's not an email (no @ symbol) and looks like a phone number
    if (!processedEmail.includes('@')) {
      // Remove any spaces or dashes
      const cleanedNumber = processedEmail.replace(/[\s-]/g, '');

      // Check if it's only digits (no + prefix)
      if (/^\d+$/.test(cleanedNumber)) {
        // Add +1 prefix for US numbers
        processedEmail = `+1${cleanedNumber}`;
      }
    }

    const success = await login(processedEmail, password);
    if (success) {
      // Login successful, clear auth stack and go to main app
      router.dismissAll();
      router.replace('/(tabs)');
    } else {
      showAlert('Login Failed', 'Invalid credentials. Please try again.', [{ text: 'OK' }], 'error');
    }
  };

  const isFormValid = email.trim() && password.trim();

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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="log-in" size={40} color={Colors.primary} />
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your merchant account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number or Email"
                  placeholderTextColor={Colors.text.light}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={Colors.text.light} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.text.light}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
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
            </View>

            {/* Login Button */}
            <View style={styles.buttonSection}>
              <TouchableOpacity
                style={[styles.loginButton, isFormValid && styles.loginButtonActive]}
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
                {!isLoading && (
                  <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/forgot-password' as any)}
                >
                  Forgot Password?
                </Text>
              </Text>

              <Text style={[styles.footerText, { marginTop: 12 }]}>
                Don't have an account?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/phone-verification')}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
  },
  header: {
    alignItems: 'center',
    paddingBottom: scale(40),
  },
  iconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(24),
  },
  title: {
    fontSize: fontScale(28),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: scale(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontScale(16),
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: fontScale(24),
  },
  form: {
    flex: 1,
    paddingTop: scale(20),
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
  inputIcon: {
    marginRight: scale(12),
  },
  input: {
    flex: 1,
    fontSize: fontScale(16),
    color: Colors.text.primary,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: scale(4),
  },
  buttonSection: {
    paddingTop: scale(24),
    paddingBottom: scale(16),
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.border.medium,
    borderRadius: scale(16),
    paddingVertical: scale(18),
    paddingHorizontal: scale(24),
  },
  loginButtonActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 4,
  },
  loginButtonText: {
    fontSize: fontScale(16),
    fontWeight: '600',
    color: Colors.text.white,
    marginRight: scale(8),
  },
  footer: {
    alignItems: 'center',
    paddingBottom: scale(24),
  },
  footerText: {
    fontSize: fontScale(14),
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  footerLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
}); 