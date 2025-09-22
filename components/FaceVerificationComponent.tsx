import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/API';
import apiService, { FaceVerificationResponse, PinVerificationRequest } from '@/services/api';
import PinVerificationModal from './PinVerificationModal';

interface FaceVerificationComponentProps {
  onVerificationSuccess: (userId: string, faceScanId: string, paymentAlreadyProcessed?: boolean) => void;
  onVerificationError: (error: string) => void;
  disabled?: boolean;
  amount: number; // Required amount in cents
  currency?: string; // Optional, defaults to "USD"
  description?: string; // Optional, defaults to "Face payment"
  onLoadingStateChange?: (loading: boolean, message?: string) => void; // New prop for loading state communication
}

interface VerificationState {
  loading: boolean;
  showPinModal: boolean;
  faceScanId: string;
  error: string | null;
  success: boolean;
  verifiedUserName?: string;
  pinVerificationLoading: boolean; // New state for PIN verification loading
}

export default function FaceVerificationComponent({
  onVerificationSuccess,
  onVerificationError,
  disabled = false,
  amount,
  currency = "USD",
  description = "Face payment",
  onLoadingStateChange,
}: FaceVerificationComponentProps) {
  const [state, setState] = useState<VerificationState>({
    loading: false,
    showPinModal: false,
    faceScanId: '',
    error: null,
    success: false,
    verifiedUserName: undefined,
    pinVerificationLoading: false,
  });

  const updateState = useCallback((updates: Partial<VerificationState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Communicate loading state changes to parent
      if (onLoadingStateChange) {
        const isLoading = newState.loading || newState.pinVerificationLoading;
        let message = '';
        
        if (newState.loading) {
          message = 'Verifying face...';
        } else if (newState.pinVerificationLoading) {
          message = 'Verifying PIN...';
        }
        
        onLoadingStateChange(isLoading, message);
      }
      
      return newState;
    });
  }, [onLoadingStateChange]);

  const resetState = useCallback(() => {
    setState({
      loading: false,
      showPinModal: false,
      faceScanId: '',
      error: null,
      success: false,
      verifiedUserName: undefined,
      pinVerificationLoading: false,
    });
    
    // Notify parent that loading is complete
    if (onLoadingStateChange) {
      onLoadingStateChange(false);
    }
  }, [onLoadingStateChange]);

  const handleImageCapture = async () => {
    if (disabled) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is needed to take photos for face verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => ImagePicker.requestCameraPermissionsAsync() },
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processFaceImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      const errorMessage = 'Failed to capture image. Please try again.';
      updateState({ error: errorMessage });
      onVerificationError(errorMessage);
    }
  };

  const processFaceImage = async (imageUri: string) => {
    updateState({ loading: true, error: null, success: false });

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'face.jpg',
      } as any);
      formData.append('amount', amount.toString());
      formData.append('currency', currency);
      formData.append('description', description);

      // Call face verification API
      const response = await apiService.face.verifyFace(formData);
      const data: FaceVerificationResponse = response.data;

      // Debug: Log the exact response
      console.log('Face verification response:', JSON.stringify(data, null, 2));

      // Handle different response scenarios
      await handleFaceVerificationResponse(data);

    } catch (error: any) {
      console.error('Face verification error:', error);
      await handleFaceVerificationError(error);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFaceVerificationResponse = async (data: FaceVerificationResponse) => {
    // Condition A: Backend requires PIN (ambiguous or step-up verification)
    // Be resilient to backend variations: honor requires_pin regardless of match_found flag
    if (data.success && data.requires_pin) {
      if (data.face_scan_id) {
        updateState({
          showPinModal: true,
          faceScanId: data.face_scan_id,
        });
        return;
      }
      const errorMessage = 'Invalid response from verification service. Please try again.';
      updateState({ error: errorMessage });
      onVerificationError(errorMessage);
      return;
    }

    // Condition B: Success response - check for payment request creation
    if (data.success) {
      // Check if message indicates payment request was created and sent
      if (data.message && (
        data.message.toLowerCase().includes('payment request created') ||
        data.message.toLowerCase().includes('sent to customer') ||
        data.message.toLowerCase().includes('payment initiated')
      )) {
        // Payment request was successfully created and sent to customer
        updateState({
          success: true,
          verifiedUserName: undefined,
          faceScanId: data.face_scan_id || '',
        });

        // Show success message briefly before proceeding
        setTimeout(() => {
          resetState();
          // Pass a dummy user ID since payment request was created
          onVerificationSuccess(
            'payment_request_created',
            data.face_scan_id || '',
            false // Payment request sent, not auto-processed
          );
        }, 1500);
        return;
      }

      // Clear single match, no PIN needed (auto payment handled by backend)
      if (data.match_found && !data.requires_pin) {
        if (data.matches && data.matches.length > 0 && data.face_scan_id) {
          const userId = data.matches[0].user_id;
          const userName = data.matches[0].name;

          updateState({
            success: true,
            verifiedUserName: userName,
            faceScanId: data.face_scan_id,
          });

          // Show welcome message briefly before proceeding
          setTimeout(() => {
            resetState();
            // If backend already created the payment request, mark as processed
            onVerificationSuccess(
              userId,
              data.face_scan_id!,
              data.auto_payment === true
            );
          }, 1500);
          return;
        }
      }
      
      // If success but no clear indication, treat as successful payment request creation
      updateState({
        success: true,
        verifiedUserName: undefined,
        faceScanId: data.face_scan_id || '',
      });

      setTimeout(() => {
        resetState();
        onVerificationSuccess(
          'success_generic',
          data.face_scan_id || '',
          false
        );
      }, 1500);
      return;
    }

    // Condition C: Check if message indicates PIN is needed (fallback for backend inconsistency)
    if (data.message && (
      data.message.toLowerCase().includes('multiple') || 
      data.message.toLowerCase().includes('similar') ||
      data.message.toLowerCase().includes('pin') ||
      data.message.toLowerCase().includes('verification required')
    )) {
      // Force PIN modal even if backend flags are inconsistent
      console.log('Forcing PIN modal due to message content:', data.message);
      const tempFaceScanId = data.face_scan_id || `temp_${Date.now()}`;
      
      updateState({
        showPinModal: true,
        faceScanId: tempFaceScanId,
      });
      return;
    }

    // Condition D: Aggressive fallback - if success but no clear single match, try PIN modal
    if (data.success && data.face_scan_id) {
      console.log('Aggressive fallback: Forcing PIN modal for ambiguous success response');
      
      updateState({
        showPinModal: true,
        faceScanId: data.face_scan_id,
      });
      return;
    }

    // Condition E: No match found - but check message first to avoid false negatives
    if (!data.success) {
      // Only show "Face Not Recognized" if it's truly a recognition failure
      // Don't show it for successful payment request creation
      if (data.message && (
        data.message.toLowerCase().includes('payment request created') ||
        data.message.toLowerCase().includes('sent to customer') ||
        data.message.toLowerCase().includes('payment initiated')
      )) {
        // This is actually a success case, treat as generic success
        updateState({
          success: true,
          verifiedUserName: undefined,
          faceScanId: data.face_scan_id || '',
        });

        setTimeout(() => {
          resetState();
          onVerificationSuccess(
            'payment_request_created',
            data.face_scan_id || '',
            false
          );
        }, 1500);
        return;
      }

      // True error case
      const errorMessage = data.message || 'Face not recognized. Please try again or register.';
      updateState({ error: errorMessage });

      Alert.alert(
        'Face Not Recognized',
        errorMessage,
        [
          { text: 'Try Again', onPress: resetState },
          {
            text: 'Register',
            onPress: () => {
              Alert.alert('Registration', 'Please contact support for registration assistance.');
            },
          },
        ]
      );

      onVerificationError(errorMessage);
      return;
    }

    // Fallback for unexpected response
    const errorMessage = 'Unexpected response from verification service. Please try again.';
    updateState({ error: errorMessage });
    onVerificationError(errorMessage);
  };

  const handleFaceVerificationError = async (error: any) => {
    let errorMessage = 'Please ensure good lighting and try again';

    // Handle specific HTTP error codes
    if (error.response) {
      switch (error.response.status) {
        case 413:
          errorMessage = ERROR_MESSAGES.IMAGE_TOO_LARGE;
          break;
        case 500:
          errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR;
          break;
        case 504:
          errorMessage = ERROR_MESSAGES.VERIFICATION_SERVICE_UNAVAILABLE;
          break;
        default:
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          }
          break;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
    } else if (error.message?.includes('Network')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    }

    updateState({ error: errorMessage });
    
    Alert.alert(
      'Face Scan Failed',
      errorMessage,
      [
        { text: 'Try Again', onPress: resetState }
      ]
    );
    
    onVerificationError(errorMessage);
  };

  const handlePinVerification = async (pin: string): Promise<boolean> => {
    updateState({ pinVerificationLoading: true });
    
    try {
      // Validate required data
      if (!state.faceScanId) {
        console.error('Missing face_scan_id for PIN verification');
        updateState({ pinVerificationLoading: false });
        return false;
      }

      // Note: Backend only needs pin and face_scan_id

      const pinRequest: PinVerificationRequest = {
        pin: pin,
        face_scan_id: state.faceScanId,
      };

      console.log('PIN verification request:', JSON.stringify(pinRequest, null, 2));
      console.log('Request details - PIN length:', pin.length, 'Face scan ID:', state.faceScanId);

      const response = await apiService.face.verifyPin(pinRequest);
      const data = response.data;

      console.log('PIN verification response:', JSON.stringify(data, null, 2));

      if (data.success && data.verified_user_id) {
        // PIN verification successful - show success message briefly
        updateState({ 
          success: true, 
          pinVerificationLoading: false,
          showPinModal: false,
          verifiedUserName: undefined // Clear any previous user name
        });
        
        // Brief delay to show success state before transitioning
        setTimeout(() => {
          resetState();
          onVerificationSuccess(data.verified_user_id!, state.faceScanId, true); // Payment already processed
        }, 1000);
        
        return true;
      } else {
        // PIN verification failed - show error message from response
        console.error('PIN verification failed:', data.message);
        updateState({ pinVerificationLoading: false });
        return false;
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      
      // Handle specific HTTP error codes
      if (error.response) {
        console.error('HTTP Error Status:', error.response.status);
        console.error('HTTP Error Data:', error.response.data);
        
        if (error.response.status === 422) {
          console.error('Validation Error Details:', JSON.stringify(error.response.data, null, 2));
          Alert.alert(
            'Validation Error',
            `Request validation failed: ${error.response.data?.detail || 'Invalid data format'}`,
            [{ text: 'OK' }]
          );
        }
      }
      
      updateState({ pinVerificationLoading: false });
      return false;
    }
  };

  const handlePinModalClose = () => {
    updateState({ showPinModal: false, pinVerificationLoading: false });
    resetState();
  };

  const handlePinModalCancel = () => {
    // Cancel the entire payment and reset everything
    updateState({ 
      showPinModal: false, 
      pinVerificationLoading: false,
      loading: false,
      error: null,
      success: false
    });
    
    // Notify parent to clear loading states immediately
    if (onLoadingStateChange) {
      onLoadingStateChange(false);
    }
    
    resetState();
    
    // Notify parent that verification was cancelled
    onVerificationError('Payment cancelled by user');
  };

  // Don't render the component content if PIN verification is in progress
  // This prevents screen blinking during the transition
  if (state.pinVerificationLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.pinVerificationLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.pinVerificationText}>Verifying PIN...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionItem}>
          <Ionicons name="camera" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>Position your face within the frame</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="sunny" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>Ensure good lighting</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>Face scan is performed for verification</Text>
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
          onPress={handleImageCapture}
          disabled={disabled || state.loading}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {state.loading ? (
              <ActivityIndicator size="small" color={Colors.text.white} />
            ) : (
              <Ionicons name="camera" size={24} color={Colors.text.white} />
            )}
            <Text style={styles.actionButtonText}>
              {state.loading ? 'Processing...' : 'Scan Face'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {state.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}

      {/* Success Display */}
      {state.success && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.successText}>
            {state.verifiedUserName 
              ? `Welcome ${state.verifiedUserName}!` 
              : 'Payment request created and sent to customer!'}
          </Text>
        </View>
      )}

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="lock-closed" size={16} color={Colors.text.secondary} />
        <Text style={styles.securityText}>
          Your face data is encrypted and securely stored for verification purposes only
        </Text>
      </View>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        visible={state.showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerification}
        onCancel={handlePinModalCancel}
        loading={state.pinVerificationLoading}
        message="Multiple similar faces detected. Please enter your PIN to confirm your identity."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.white,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}15`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.success}15`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  successText: {
    fontSize: 14,
    color: Colors.success,
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  securityText: {
    fontSize: 12,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
  // New styles for PIN verification loading
  pinVerificationLoading: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  pinVerificationText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
}); 