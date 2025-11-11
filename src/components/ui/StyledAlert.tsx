import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
}

export const StyledAlert: React.FC<StyledAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  type = 'info',
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: Colors.success,
          gradientColors: [Colors.success, '#059669'],
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#F59E0B',
          gradientColors: ['#F59E0B', '#D97706'],
          backgroundColor: '#FFFBEB',
          borderColor: '#FED7AA',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: Colors.error,
          gradientColors: [Colors.error, '#DC2626'],
          backgroundColor: '#FEF2F2',
          borderColor: '#FECACA',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: Colors.primary,
          gradientColors: [Colors.primary, '#8B5CF6'],
          backgroundColor: '#F8FAFC',
          borderColor: '#E2E8F0',
        };
    }
  };

  const config = getTypeConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (buttonStyle: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return {
          backgroundColor: Colors.error,
          textColor: '#FFFFFF',
        };
      case 'cancel':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.text.secondary,
          borderColor: Colors.border.light,
        };
      default:
        return {
          backgroundColor: config.gradientColors[0],
          textColor: '#FFFFFF',
        };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <StatusBar barStyle="dark-content" backgroundColor="rgba(0,0,0,0.3)" translucent />
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [
                { scale: scaleAnim },
                { 
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }
              ],
            }
          ]}
        >
          <View style={[styles.modal, { backgroundColor: config.backgroundColor, borderColor: config.borderColor }]}>
            {/* Icon Header */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={config.gradientColors as [string, string]}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={config.icon as any} size={32} color="white" />
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => {
                const buttonStyle = getButtonStyle(button.style || 'default');
                const isLast = index === buttons.length - 1;
                const isCancel = button.style === 'cancel';
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      {
                        backgroundColor: buttonStyle.backgroundColor,
                        borderColor: buttonStyle.borderColor,
                        borderWidth: isCancel ? 1 : 0,
                        marginLeft: index > 0 ? 12 : 0,
                        flex: 1,
                      }
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text style={[styles.buttonText, { color: buttonStyle.textColor }]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
  },
  modal: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// Hook for easy usage
export const useStyledAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    type?: 'info' | 'success' | 'warning' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      buttons?: AlertButton[],
      type?: 'info' | 'success' | 'warning' | 'error'
    ) => {
      setAlertState({ visible: true, title, message, buttons, type });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState((prevState) => ({ ...prevState, visible: false }));
  }, []);

  const AlertComponent = useCallback(() => {
    return (
      <StyledAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        type={alertState.type}
        onDismiss={hideAlert}
      />
    );
  }, [alertState, hideAlert]);

  return { showAlert, hideAlert, AlertComponent };
};
