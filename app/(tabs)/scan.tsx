import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import apiService from '@/services/api';
import Colors from '@/constants/Colors';

interface FaceMatch {
  user_id: string;
  name: string;
  similarity: number;
}

export default function ScanScreen() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceMatches, setFaceMatches] = useState<FaceMatch[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const takePicture = async () => {
    // Validate amount first
    if (!amount.trim()) {
      Alert.alert('Amount Required', 'Please enter amount first');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processFaceImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const processFaceImage = async (imageUri: string) => {
    setLoading(true);
    
    try {
      // Call backend face verification API
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);

      const response = await apiService.face.verifyFace(formData);
      
      if (response.data.match_found && response.data.matches.length > 0) {
        // Filter matches with similarity >= 70%
        const validMatches = response.data.matches.filter(match => match.similarity >= 0.7);
        
        if (validMatches.length === 0) {
          Alert.alert('No Match', 'No matching face found with 70% or higher similarity');
          setFaceMatches([]);
          return;
        }

        setFaceMatches(validMatches);

        // If only one match, auto-select it
        if (validMatches.length === 1) {
          setSelectedUser(validMatches[0].user_id);
        }
      } else {
        Alert.alert('No Match', 'No matching face found in database');
        setFaceMatches([]);
      }
    } catch (error) {
      console.error('Face verification error:', error);
      Alert.alert('Error', 'Face verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedUser || !amount) {
      Alert.alert('Error', 'Please select a user and enter amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Merchant information not available');
        return;
      }

      const response = await apiService.merchant.initiatePayment(user.id, {
        user_id: selectedUser,
        face_scan_id: `scan_${Date.now()}`,
        amount: amountValue * 100, // Convert to cents
        currency: 'usd',
        description: `Payment by ${user?.business_name}`,
      });

      Alert.alert(
        'Payment Initiated',
        `Payment request of $${amountValue} has been sent to the customer!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setFaceMatches([]);
              setSelectedUser(null);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Face Scan Payment</Text>
          <Text style={styles.headerSubtitle}>Scan customer's face to process payment</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Amount</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={Colors.text.muted}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Scan Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.scanButton, loading && styles.scanButtonDisabled]}
              onPress={takePicture}
              disabled={loading}
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                style={styles.scanButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons 
                  name="camera" 
                  size={24} 
                  color={Colors.text.white} 
                />
                <Text style={styles.scanButtonText}>
                  {loading ? 'Processing...' : 'Scan Face'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Face Matches */}
          {faceMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Customer</Text>
              <View style={styles.matchesList}>
                {faceMatches.map((match) => (
                  <TouchableOpacity
                    key={match.user_id}
                    style={[
                      styles.matchItem,
                      selectedUser === match.user_id && styles.matchItemSelected
                    ]}
                    onPress={() => setSelectedUser(match.user_id)}
                  >
                    <View style={styles.matchLeft}>
                      <View style={styles.matchAvatar}>
                        <Text style={styles.matchAvatarText}>
                          {match.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.matchInfo}>
                        <Text style={styles.matchName}>{match.name}</Text>
                        <Text style={styles.matchSimilarity}>
                          {Math.round(match.similarity * 100)}% match
                        </Text>
                      </View>
                    </View>
                    {selectedUser === match.user_id && (
                      <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Process Payment Button */}
              <TouchableOpacity
                style={[styles.paymentButton, (!selectedUser || loading) && styles.paymentButtonDisabled]}
                onPress={processPayment}
                disabled={!selectedUser || loading}
              >
                <Text style={styles.paymentButtonText}>
                  {loading ? 'Processing...' : `Process Payment - $${amount}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Colors.border.light,
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text.primary,
    paddingVertical: 16,
  },
  scanButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
  matchesList: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 4,
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  matchItemSelected: {
    backgroundColor: Colors.accent.lavender,
  },
  matchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matchAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.white,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  matchSimilarity: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  paymentButton: {
    backgroundColor: Colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentButtonDisabled: {
    backgroundColor: Colors.text.muted,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
}); 