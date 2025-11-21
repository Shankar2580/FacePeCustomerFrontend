import React, { useEffect, useState } from 'react';

import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import apiService, { PaymentRequest } from '@/services/api/apiService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStyledAlert } from '@/components/ui/StyledAlert';
import { getTimeRemaining, formatCountdown } from '@/utils/timeUtils';

interface PaymentWaitingScreenProps {
  visible: boolean;
  amount: number;
  customerInfo?: string;
  onCancel: () => void;
  paymentRequestId: string | null;
  onPaymentSuccess: (payment: PaymentRequest) => void;
  onPaymentFailure: (payment: PaymentRequest) => void;
}

export default function PaymentWaitingScreen({
  visible,
  amount,
  customerInfo = "customer",
  onCancel,
  paymentRequestId,
  onPaymentSuccess,
  onPaymentFailure,
}: PaymentWaitingScreenProps) {
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isPolling, setIsPolling] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{ minutes: number; seconds: number; expired: boolean }>({ minutes: 5, seconds: 0, expired: false });
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const pulseAnim = new Animated.Value(1);
  const { showAlert, AlertComponent } = useStyledAlert();

  // Reset state when visibility changes
  useEffect(() => {
    if (visible) {
      setElapsed(0);
      setIsPolling(true);
      // Calculate default expiry time (5 minutes from now) to prevent timer stuck at 5:00
      const defaultExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      setExpiresAt(defaultExpiry);
      setTimeRemaining({ minutes: 5, seconds: 0, expired: false });
    }
  }, [visible]);

  // Animated dots for waiting effect
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [visible]);

  // Elapsed time counter
  useEffect(() => {
    if (!visible || !isPolling) return;

    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, isPolling]);

  // Payment status polling
  useEffect(() => {
    if (!visible || !paymentRequestId || !isPolling) return;

// Poll every 2 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiService.merchant.getPaymentRequests();
        const paymentRequests: PaymentRequest[] = response.data;

        // Find the current payment request
        const currentRequest = paymentRequests.find(
          req => req.request_id === paymentRequestId
        );

        if (!currentRequest) {
          return;
        }

        // Update expiry time from backend if available
        if (currentRequest.expires_at) {
          setExpiresAt(currentRequest.expires_at);
        }

        // Check status - including CANCELLED/FAILED states
        if (currentRequest.status === 'COMPLETED') {
          setIsPolling(false);
          clearInterval(pollInterval);
          onPaymentSuccess(currentRequest);
        } else if (currentRequest.status === 'FAILED' || currentRequest.status === 'DECLINED' || currentRequest.status === 'CANCELLED') {
          setIsPolling(false);
          clearInterval(pollInterval);
          onPaymentFailure(currentRequest);
        }
        // If still PENDING, continue polling

      } catch (error) {
        // Continue polling on error (don't stop)
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  }, [visible, paymentRequestId, isPolling, onPaymentSuccess, onPaymentFailure, expiresAt]);

  // Update countdown timer
  useEffect(() => {
    if (!visible || !expiresAt) return;

    const interval = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      // Check if expired
      if (remaining.expired) {
        setIsPolling(false);
        clearInterval(interval);
        showAlert(
          'Request Expired',
          'The payment request has expired. Please try again.',
          [{ text: 'OK', onPress: onCancel }],
          'warning'
        );
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt, onCancel]);

  // Pulse animation for waiting indicator
  useEffect(() => {
    if (!visible) return;

    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [visible]);

  const handleCancelTransaction = () => {
    showAlert(
      'Cancel Transaction',
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
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top','left','right','bottom']}>
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons name="time" size={32} color={Colors.text.white} />
          </Animated.View>
          <Text style={styles.title}>Payment Request Sent</Text>
          <Text style={styles.subtitle}>
            Waiting for customer response{dots}
          </Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Time Remaining:</Text>
            <Text style={[styles.timerValue, timeRemaining.minutes < 1 && styles.timerCritical]}>
              {formatCountdown(timeRemaining.minutes, timeRemaining.seconds)}
            </Text>
          </View>
        </View>

        {/* Amount Display */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Requested</Text>
          <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
        </View>

        {/* Main Message */}
        <View style={styles.messageSection}>
          <View style={styles.messageCard}>
            <Ionicons name="phone-portrait" size={24} color={Colors.primary} />
            <Text style={styles.messageText}>
              Accept the payment request from your{' '}
              <Text style={styles.appName}>FacePe</Text> application
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <View style={styles.timelineContainer}>
            {/* <View style={styles.timelineLine} /> */}
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>Payment request created</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>Sent to customer</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, styles.statusDotPending]} />
              <Text style={[styles.statusText, styles.statusTextPending]}>
                Awaiting customer response
              </Text>
            </View>
          </View>
        </View>
        </View>
        </ScrollView>
        
        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelTransaction}
            >
              <Ionicons name="close-circle" size={20} color={Colors.error} />
              <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      </SafeAreaView>
      
      {/* Styled Alert Component */}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.primary,
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 0,
    flexGrow: 1,
  },
  mainContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.white,
    textAlign: 'center',
    opacity: 0.9,
    minHeight: 24, // Prevent layout shift from dots
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  timerLabel: {
    fontSize: 12,
    color: Colors.text.white,
    opacity: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.white,
    fontVariant: ['tabular-nums'],
  },
  timerCritical: {
    color: '#EF4444',
  },
  elapsedTime: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.white,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  amountSection: {
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.text.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text.white,
  },
  messageSection: {
    marginBottom: 32,
  },
  messageCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  messageText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    marginLeft: 16,
    flex: 1,
  },
  appName: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionsSection: {
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.error,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 8,
  },
  statusSection: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 14,
    height: 32,
    width: 2,
    backgroundColor: Colors.border.light,
    borderRadius: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.border.medium,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.background.primary,
    marginLeft: -17,
    zIndex: 1,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusDotPending: {
    backgroundColor: Colors.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  statusTextPending: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
