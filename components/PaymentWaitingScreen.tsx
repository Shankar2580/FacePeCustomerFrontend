import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';

interface PaymentWaitingScreenProps {
  visible: boolean;
  amount: number;
  customerInfo?: string;
  onCancel: () => void;
  onAutoPayToggle: (enabled: boolean) => void;
  autoPayEnabled: boolean;
}

export default function PaymentWaitingScreen({
  visible,
  amount,
  customerInfo = "customer",
  onCancel,
  onAutoPayToggle,
  autoPayEnabled,
}: PaymentWaitingScreenProps) {
  const [dots, setDots] = useState('');
  const pulseAnim = new Animated.Value(1);

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
    Alert.alert(
      'Cancel Transaction',
      'Are you sure you want to cancel this payment request?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: onCancel 
        },
      ]
    );
  };

  const handleAutoPayToggle = () => {
    Alert.alert(
      autoPayEnabled ? 'Disable Auto Pay' : 'Enable Auto Pay',
      autoPayEnabled 
        ? 'Future payments will require manual confirmation from the customer.'
        : 'Future payments from this customer will be processed automatically without confirmation.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: autoPayEnabled ? 'Disable' : 'Enable', 
          onPress: () => onAutoPayToggle(!autoPayEnabled)
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.gradients.header}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
              <Text style={styles.appName}>FacePe</Text> application for more 
              flowless future payment select the auto pay
            </Text>
          </View>
        </View>

        {/* Auto Pay Option */}
        <View style={styles.autoPaySection}>
          <TouchableOpacity 
            style={[
              styles.autoPayButton,
              autoPayEnabled && styles.autoPayButtonActive
            ]}
            onPress={handleAutoPayToggle}
          >
            <View style={styles.autoPayContent}>
              <Ionicons 
                name={autoPayEnabled ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={autoPayEnabled ? Colors.success : Colors.text.secondary} 
              />
              <View style={styles.autoPayTextContainer}>
                <Text style={[
                  styles.autoPayTitle,
                  autoPayEnabled && styles.autoPayTitleActive
                ]}>
                  Enable Auto Pay
                </Text>
                <Text style={styles.autoPaySubtitle}>
                  Future payments will be processed automatically
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelTransaction}
          >
            <Ionicons name="close-circle" size={20} color={Colors.error} />
            <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text style={styles.statusText}>Payment request created</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text style={styles.statusText}>Sent to customer</Text>
          </View>
          <View style={styles.statusRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={[styles.statusText, styles.statusTextPending]}>
              Awaiting customer response
            </Text>
          </View>
        </View>
      </LinearGradient>
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
  gradient: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
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
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  autoPaySection: {
    marginBottom: 32,
  },
  autoPayButton: {
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.border.light,
  },
  autoPayButtonActive: {
    borderColor: Colors.success,
    backgroundColor: `${Colors.success}10`,
  },
  autoPayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoPayTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  autoPayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  autoPayTitleActive: {
    color: Colors.success,
  },
  autoPaySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  actionsSection: {
    marginBottom: 32,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.error,
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
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border.medium,
    marginRight: 12,
  },
  statusDotActive: {
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 14,
    color: Colors.text.secondary,
    flex: 1,
  },
  statusTextPending: {
    color: Colors.primary,
    fontWeight: '500',
  },
});
