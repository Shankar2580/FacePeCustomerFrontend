import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/api';
import apiService, { FaceVerificationResponse, PinVerificationRequest } from '@/services/api/apiService';
import PinVerificationModal from '../modals/PinVerificationModal';
import { useStyledAlert } from '@/components/ui/StyledAlert';

interface FaceVerificationComponentProps {
  onVerificationSuccess: (userId: string, faceScanId: string, paymentAlreadyProcessed?: boolean, requestId?: string) => void;
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
  const { showAlert, AlertComponent } = useStyledAlert();
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
    if (disabled || state.loading) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          'Camera Access Required',
          'FP Merchant needs camera permission to scan customer faces for payment verification. This ensures secure and accurate identity confirmation.',
          [
            { text: 'Deny', style: 'cancel' },
            { 
              text: 'Allow', 
              onPress: async () => {
                // Request permission again
                const retryPermission = await ImagePicker.requestCameraPermissionsAsync();
                if (retryPermission.granted) {
                  handleImageCapture();
                }
              }
            },
          ],
          'warning'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await processFaceImage(result.assets[0].uri);
      }
      // If cancelled, just return - no loading state to reset
    } catch (error) {
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

      // Handle different response scenarios
      await handleFaceVerificationResponse(data);

    } catch (error: any) {
      await handleFaceVerificationError(error);
    } finally {
      updateState({ loading: false });
    }
  };

  const handleFaceVerificationResponse = async (data: FaceVerificationResponse) => {
    // Condition A: Backend requires PIN (ambiguous or step-up verification)
    // Be resilient to backend variations: honor requires_pin regardless of match_found flag
    if (data.requires_pin) {
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

        // Extract request_id from response
        const requestId = data.request?.request_id || data.request_id;

        // Show success message briefly before proceeding
        setTimeout(() => {
          resetState();
          // Pass a dummy user ID since payment request was created
          onVerificationSuccess(
            'payment_request_created',
            data.face_scan_id || '',
            false, // Payment request sent, not auto-processed
            requestId
          );
        }, 1500);
        return;
      }

      // Clear single match, no PIN needed (auto payment handled by backend)
      if (data.match_found && !data.requires_pin) {
        if (data.matches && data.matches.length > 0 && data.face_scan_id) {
          const userId = data.matches[0].user_id;
          const userName = data.matches[0].name;
          const requestId = data.request?.request_id || data.request_id;

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
              data.auto_payment === true,
              requestId
            );
          }, 1500);
          return;
        }
      }
      
      // If success but no clear indication, treat as successful payment request creation
      const requestId = data.request?.request_id || data.request_id;
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
          false,
          requestId
        );
      }, 1500);
      return;
    }

    // Condition C: Check if message indicates PIN is needed (fallback for backend inconsistency)
    if (data.success && data.face_scan_id && (
      data.message?.toLowerCase().includes('multiple') || 
      data.message?.toLowerCase().includes('similar') ||
      data.message?.toLowerCase().includes('pin') ||
      data.message?.toLowerCase().includes('verification required')
    )) {
      // Force PIN modal even if backend flags are inconsistent

      updateState({
        showPinModal: true,
        faceScanId: data.face_scan_id,
      });
      return;
    }

    // Condition D: Aggressive fallback - if success but no clear single match, try PIN modal
    if (data.success && data.face_scan_id) {

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
        const requestId = data.request?.request_id || data.request_id;
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
            false,
            requestId
          );
        }, 1500);
        return;
      }

      // True error case
      const errorMessage = data.message || 'Face not recognized. Please try again.';
      updateState({ error: errorMessage });

      showAlert(
        'Face Not Recognized',
        'The customer\'s face could not be verified. Please ensure good lighting and ask them to look directly at the camera.',
        [
          { text: 'OK', onPress: resetState },
        ],
        'error'
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
    let errorMessage = ERROR_MESSAGES.FACE_SCAN_FAILED;
    
    if (error.message?.includes('timeout')) {
      errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
    } else if (error.message?.includes('Network')) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    }

    updateState({ error: errorMessage });
    
    showAlert(
      'Face Scan Failed',
      errorMessage,
      [
        { text: 'Try Again', onPress: resetState }
      ],
      'error'
    );
    
    onVerificationError(errorMessage);
  };

  const handlePinVerification = async (pin: string): Promise<boolean> => {
    updateState({ pinVerificationLoading: true });
    
    try {
      const pinRequest: any = {
        face_scan_id: state.faceScanId,
        pin: pin,
        amount: amount,
        currency: currency,
        description: description,
      };

      const response = await apiService.face.verifyPin(pinRequest);
      const data = response.data;

      if (data.success) {
        // PIN verification successful
        if ((data as any).matches && (data as any).matches.length > 0) {
          const userId = (data as any).matches[0].user_id;
          const userName = (data as any).matches[0].name;
          const requestId = (data as any).request?.request_id || (data as any).request_id;

          updateState({
            success: true,
            verifiedUserName: userName,
            pinVerificationLoading: false,
          });

          // Show success briefly before proceeding
          setTimeout(() => {
            resetState();
            onVerificationSuccess(
              userId,
              state.faceScanId,
              (data as any).auto_payment === true,
              requestId
            );
          }, 1000);
          
          return true;
        } else {
          updateState({ pinVerificationLoading: false });
          return false;
        }
      } else {
        updateState({ pinVerificationLoading: false });
        return false;
      }
    } catch (error: any) {
      // Handle specific HTTP error codes
      if (error.response) {
        if (error.response.status === 422) {
          showAlert(
            'Validation Error',
            `Request validation failed: ${error.response.data?.detail || 'Invalid data format'}`,
            [{ text: 'OK' }],
            'error'
          );
        }
      }
      
      updateState({ pinVerificationLoading: false });
      return false;
    }
  };

  const handlePinModalClose = () => {
    updateState({ showPinModal: false });
  };

  const handlePinModalCancel = () => {
    updateState({ showPinModal: false });
    onVerificationError('PIN verification cancelled by user');
  };

  return (
    <View style={styles.container}>
      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <View style={styles.instructionItem}>
          <Ionicons name="camera" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>
            Position your face in front of the camera
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="sunny" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>
            Ensure good lighting on your face
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="eye" size={20} color={Colors.primary} />
          <Text style={styles.instructionText}>
            Look directly at the camera
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (disabled || state.loading) && styles.actionButtonDisabled,
          ]}
          onPress={handleImageCapture}
          disabled={disabled || state.loading}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.actionButtonGradient}
          >
            {state.loading ? (
              <ActivityIndicator size="small" color={Colors.text.white} />
            ) : (
              <Ionicons name="camera" size={24} color={Colors.text.white} />
            )}
            <Text style={styles.actionButtonText}>
              {state.loading ? 'Verifying...' : 'Scan Face'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {state.error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}

      {/* Success Display */}
      {state.success && (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          <Text style={styles.successText}>
            {state.verifiedUserName 
              ? `Welcome, ${state.verifiedUserName}!`
              : 'Verification successful!'
            }
          </Text>
        </View>
      )}

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.text.secondary} />
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
      
      {/* Styled Alert Component */}
      <AlertComponent />
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
}); 