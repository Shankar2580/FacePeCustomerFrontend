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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Colors from '@/constants/Colors';

export default function RegisterScreen() {
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const registrationSuccess = await register({
      email: formData.email,
      password: formData.password,
      business_name: formData.businessName,
      mobile_number: phoneNumber || '',
    });

    if (registrationSuccess) {
      // Registration successful, user is now logged in
      router.replace('/(tabs)');
    } else {
      Alert.alert('Registration Failed', 'Please try again');
    }
  };

  const isFormValid = 
    formData.businessName.trim() &&
    formData.email.trim() &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
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

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
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
          </View>
        </ScrollView>

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
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
}); 