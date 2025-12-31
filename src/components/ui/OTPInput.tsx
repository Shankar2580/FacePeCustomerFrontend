/**
 * Reusable OTP Input Component
 * 
 * Two variants:
 * - 'grouped': 3-3 format with separator (□□□ - □□□)
 * - 'inline': All 6 boxes in a row (□□□□□□)
 * 
 * Usage:
 * <OTPInput 
 *   code={otp} 
 *   setCode={setOtp} 
 *   variant="grouped" 
 *   onComplete={handleVerify}
 * />
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { scale, fontScale, wp } from '../../utils/responsive';
import Colors from '../../constants/colors';

// ============================================
// Types
// ============================================
interface OTPInputProps {
    /** Current OTP value */
    code: string;
    /** Function to update OTP value */
    setCode: (code: string) => void;
    /** Number of digits (default: 6) */
    length?: number;
    /** Layout variant */
    variant?: 'grouped' | 'inline';
    /** Callback when all digits are entered */
    onComplete?: (code: string) => void;
    /** Auto focus first input on mount */
    autoFocus?: boolean;
    /** Show error state */
    error?: boolean;
    /** Custom container style */
    containerStyle?: ViewStyle;
    /** Disabled state */
    disabled?: boolean;
}

// ============================================
// Component
// ============================================
export const OTPInput: React.FC<OTPInputProps> = ({
    code,
    setCode,
    length = 6,
    variant = 'grouped',
    onComplete,
    autoFocus = true,
    error = false,
    containerStyle,
    disabled = false,
}) => {
    const inputs = useRef<TextInput[]>([]);

    // Calculate responsive input size based on variant and screen width
    const getInputSize = () => {
        if (variant === 'grouped') {
            // For grouped: 6 inputs + separator, need to fit in ~80% of screen (accounting for card padding)
            return Math.min((wp(80) - scale(48)) / 6.5, scale(48));
        }
        // For inline: 6 inputs with small gaps
        return Math.min((wp(80) - scale(40)) / 6.5, scale(48));
    };

    const inputSize = getInputSize();

    // Handle text change - supports both single digit and paste
    const handleTextChange = (text: string, index: number) => {
        // Filter to only digits
        const digitsOnly = text.replace(/\D/g, '');

        // Handle paste (multiple digits) - This handles the case where user pastes full OTP
        if (digitsOnly.length > 1) {
            // Take up to 'length' digits and fill from the current index
            const pastedDigits = digitsOnly.slice(0, length);

            // If pasting at index 0 or pasting full code, use the pasted value directly
            if (index === 0 || pastedDigits.length >= length) {
                const newCode = pastedDigits.slice(0, length).padEnd(length, '');
                setCode(newCode);

                // Focus the last filled input or the next empty one
                const focusIndex = Math.min(pastedDigits.length, length) - 1;
                inputs.current[focusIndex]?.focus();

                if (onComplete && pastedDigits.length >= length) {
                    onComplete(pastedDigits.slice(0, length));
                }
            } else {
                // Pasting from middle - fill remaining slots
                const codeArray = code.split('');
                for (let i = 0; i < pastedDigits.length && (index + i) < length; i++) {
                    codeArray[index + i] = pastedDigits[i];
                }
                const newCode = codeArray.join('');
                setCode(newCode);

                const focusIndex = Math.min(index + pastedDigits.length, length - 1);
                inputs.current[focusIndex]?.focus();

                if (onComplete && newCode.length === length && !newCode.includes('')) {
                    onComplete(newCode);
                }
            }
            return;
        }

        // Handle single digit entry
        const codeArray = code.padEnd(length, ' ').split('');
        codeArray[index] = digitsOnly || ' ';
        const newCode = codeArray.join('').replace(/ /g, '');
        setCode(newCode.padEnd(length, '').slice(0, length));

        // Move to next input if digit entered
        if (digitsOnly && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }

        // Check completion
        const trimmedCode = newCode.replace(/\s/g, '');
        if (onComplete && trimmedCode.length === length) {
            onComplete(trimmedCode);
        }
    };

    // Handle backspace
    const handleKeyPress = (
        { nativeEvent: { key } }: { nativeEvent: { key: string } },
        index: number
    ) => {
        if (key === 'Backspace' && !code[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    // Render single input box
    const renderInput = (index: number) => (
        <TextInput
            key={index}
            ref={(el) => {
                if (el) inputs.current[index] = el;
            }}
            style={[
                styles.input,
                {
                    width: inputSize,
                    height: inputSize * 1.15,
                    fontSize: fontScale(24),
                },
                error && styles.inputError,
                disabled && styles.inputDisabled,
            ]}
            keyboardType="numeric"
            // maxLength removed to allow paste of full OTP code
            // Length is handled in handleTextChange
            onChangeText={(text) => handleTextChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            value={code[index] || ''}
            autoFocus={autoFocus && index === 0}
            editable={!disabled}
            allowFontScaling={false}
            selectTextOnFocus
            textContentType="oneTimeCode" // iOS: Enables OTP autofill from SMS
            autoComplete="sms-otp" // Android: Enables OTP autofill
            textAlignVertical="center"
        />
    );

    // Render grouped variant (3-3 with separator)
    const renderGrouped = () => (
        <View style={styles.groupedContainer}>
            {/* First group of 3 */}
            <View style={styles.group}>
                {[0, 1, 2].map(renderInput)}
            </View>

            {/* Separator */}
            <Text style={styles.separator}>-</Text>

            {/* Second group of 3 */}
            <View style={styles.group}>
                {[3, 4, 5].map(renderInput)}
            </View>
        </View>
    );

    // Render inline variant (all 6 in a row)
    const renderInline = () => (
        <View style={styles.inlineContainer}>
            {Array(length).fill(0).map((_, index) => renderInput(index))}
        </View>
    );

    return (
        <View style={[styles.container, containerStyle]}>
            {variant === 'grouped' ? renderGrouped() : renderInline()}
        </View>
    );
};

// Text component fallback for separator
const Text = ({ children, style }: { children: React.ReactNode; style: any }) => {
    const RNText = require('react-native').Text;
    return <RNText style={style}>{children}</RNText>;
};

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    groupedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: scale(8),
    },
    group: {
        flexDirection: 'row',
        gap: scale(8),
    },
    separator: {
        fontSize: fontScale(24),
        fontWeight: '600',
        color: Colors.text.secondary,
        marginHorizontal: scale(12),
    },
    input: {
        backgroundColor: Colors.background.card,
        borderRadius: scale(12),
        borderWidth: 2,
        borderColor: Colors.border.light,
        textAlign: 'center',
        fontWeight: '700',
        color: Colors.text.primary,
        paddingVertical: 0,
        includeFontPadding: false,
    },
    inputError: {
        borderColor: Colors.error,
        backgroundColor: '#FEF2F2',
    },
    inputDisabled: {
        backgroundColor: Colors.background.secondary,
        borderColor: Colors.border.medium,
        color: Colors.text.light,
    },
});

export default OTPInput;
