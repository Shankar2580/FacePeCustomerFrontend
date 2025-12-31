import FaceVerificationComponent from '@/components/screens/FaceVerificationComponent';
import PaymentWaitingScreen from '@/components/modals/PaymentWaitingScreen';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sharedHeaderStyles } from '@/constants/layout';
import apiService from '@/services/api/apiService';

// Loading states enum for better state management
enum LoadingState {
  IDLE = 'idle',
  FACE_VERIFICATION = 'face_verification',
  PIN_VERIFICATION = 'pin_verification',
  PAYMENT_PROCESSING = 'payment_processing',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_WAITING = 'payment_waiting',
}

export default function ScanScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertComponent } = useStyledAlert();
  const [amount, setAmount] = useState('');
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [faceVerificationComplete, setFaceVerificationComplete] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);

  const isLoading = loadingState !== LoadingState.IDLE && loadingState !== LoadingState.PAYMENT_WAITING;
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= 1;

  const handleFaceVerificationSuccess = (userId: string, faceScanId: string, paymentAlreadyProcessed?: boolean, requestId?: string) => {
    setSelectedUserId(userId);
    setFaceVerificationComplete(true);
    setPaymentRequestId(requestId || null);

    if (paymentAlreadyProcessed) {
      // PIN verification already processed the payment
      setLoadingState(LoadingState.PAYMENT_SUCCESS);
      setLoadingMessage('Payment complete!');

      // Show success alert after a brief delay
      setTimeout(() => {
        const amountValue = parseFloat(amount || '0');
        showAlert(
          'Payment Complete',
          `Payment of $${amountValue.toFixed(2)} has been processed successfully with PIN verification!`,
          [{ text: 'OK', onPress: () => resetForm() }],
          'success'
        );
      }, 1500);
    } else {
      // Backend created payment request - show waiting screen
      setLoadingState(LoadingState.PAYMENT_WAITING);
      setLoadingMessage('Payment request sent!');
    }
  };

  const handleFaceVerificationError = (error: string) => {

    // If user cancelled, reset everything completely
    if (error.includes('cancelled by user')) {
      resetForm();
    } else {
      setLoadingState(LoadingState.IDLE);
    }
    // Error is already handled by the FaceVerificationComponent
  };

  // Removed processPayment: backend auto-creates payment requests in verify-face and verify-pin flows

  const resetForm = () => {
    setAmount('');
    setSelectedUserId(null);
    setFaceVerificationComplete(false);
    setLoadingState(LoadingState.IDLE);
    setLoadingMessage('');
    setPaymentRequestId(null);
  };

  const resetVerification = () => {
    setSelectedUserId(null);
    setFaceVerificationComplete(false);
    setLoadingState(LoadingState.IDLE);
    setLoadingMessage('');
  };

  const handleCancelTransaction = async () => {
    if (!paymentRequestId) {
      resetForm();
      return;
    }

    try {
      // Call API to cancel the payment request on the backend
      await apiService.merchant.cancelPaymentRequest(paymentRequestId);

      showAlert(
        'Transaction Cancelled',
        'The payment request has been cancelled successfully.',
        [{ text: 'OK', onPress: resetForm }],
        'success'
      );
    } catch (error: any) {
      // Even if API call fails, still reset the form locally
      const errorMessage = error.response?.data?.detail || 'Failed to cancel payment request on server, but cleared locally.';
      showAlert(
        'Cancellation Error',
        errorMessage,
        [{ text: 'OK', onPress: resetForm }],
        'warning'
      );
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    // Close the waiting screen first
    setLoadingState(LoadingState.PAYMENT_SUCCESS);
    setLoadingMessage('Payment completed!');

    // Show success alert after a brief delay
    setTimeout(() => {
      setLoadingState(LoadingState.IDLE); // Close success overlay
      const amountValue = parseFloat(amount || '0');
      showAlert(
        'Payment Successful',
        `Payment of $${amountValue.toFixed(2)} has been completed successfully!`,
        [{ text: 'OK', onPress: () => resetForm() }],
        'success'
      );
    }, 1000);
  };

  const handlePaymentFailure = (payment: any) => {
    // Close the waiting screen first
    setLoadingState(LoadingState.IDLE);

    const statusText = payment.status === 'DECLINED' ? 'declined' : 'failed';

    // Show alert after a brief delay to allow screen transition
    setTimeout(() => {
      showAlert(
        'Payment Not Completed',
        `The customer has ${statusText} the payment request.`,
        [{ text: 'OK', onPress: () => resetForm() }],
        'error'
      );
    }, 100);
  };


  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>

          {loadingState === LoadingState.PAYMENT_SUCCESS && (
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Scan</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isLoading} // Disable scrolling during loading
      >

        {/* Amount Input Section */}
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
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Face Verification Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Verification</Text>
            {faceVerificationComplete && !isLoading && (
              <TouchableOpacity onPress={resetVerification}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>

          {faceVerificationComplete && !isLoading ? (
            <View style={styles.verificationComplete}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Customer Verified!</Text>
              <Text style={styles.successSubtitle}>
                Face verification completed successfully
              </Text>
            </View>
          ) : (
            <FaceVerificationComponent
              onVerificationSuccess={handleFaceVerificationSuccess}
              onVerificationError={handleFaceVerificationError}
              disabled={isLoading || !isValidAmount}
              amount={Math.round(parseFloat(amount || '0') * 100)} // Convert to cents
              currency="USD"
              description={`Payment by ${user?.business_name || 'Merchant'}`}
              onLoadingStateChange={(loading, message) => {
                if (loading && message) {
                  if (message.includes('PIN')) {
                    setLoadingState(LoadingState.PIN_VERIFICATION);
                  } else if (message.includes('face')) {
                    setLoadingState(LoadingState.FACE_VERIFICATION);
                  }
                  setLoadingMessage(message);
                }
              }}
            />
          )}
        </View>

        {/* Payment Processing Status */}
        {faceVerificationComplete && loadingState === LoadingState.PAYMENT_SUCCESS && (
          <View style={styles.section}>
            <View style={styles.processingStatus}>
              <Ionicons name={loadingMessage.includes('complete') ? "checkmark-circle" : "send"} size={24} color={Colors.success} />
              <Text style={styles.processingText}>
                {loadingMessage.includes('complete')
                  ? 'Payment completed successfully!'
                  : 'Payment request sent to customer!'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay />

      {/* Payment Waiting Screen */}
      <PaymentWaitingScreen
        visible={loadingState === LoadingState.PAYMENT_WAITING}
        amount={parsedAmount || 0}
        customerInfo="Customer"
        onCancel={handleCancelTransaction}
        paymentRequestId={paymentRequestId}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />

      {/* Styled Alert Component */}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 16,
    minHeight: 80,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  resetText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: Colors.border.light,
    marginTop: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    paddingVertical: 16,
  },
  verificationComplete: {
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.success,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  processingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.success,
    gap: 12,
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
    flex: 1,
  },
  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.background.primary,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  successIcon: {
    marginTop: 16,
  },
}); 