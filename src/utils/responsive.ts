/**
 * Responsive Utility for MerchantApp
 * Ensures consistent UI across all screen sizes
 * 
 * Usage Guidelines:
 * - wp() → Container widths, card widths, overall layout
 * - scale() → Spacing, padding, margins, dimensions
 * - fontScale() → All text (less aggressive scaling)
 * - Aspect ratios → Cards, images, maintaining proportions
 * - Fixed values → Only for border-radius, border-width
 * - Min/Max constraints → Buttons, touch targets, fonts
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions - design was created for iPhone 8/X (375 x 812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size categories
export const screenSize = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < 350,      // iPhone SE, small Androids
    isMedium: SCREEN_WIDTH >= 350 && SCREEN_WIDTH < 400,  // iPhone 8, X, 11 Pro
    isLarge: SCREEN_WIDTH >= 400 && SCREEN_WIDTH < 450,   // iPhone Plus, Max, Pro Max
    isXLarge: SCREEN_WIDTH >= 450,    // Large Androids, tablets
    isTablet: SCREEN_WIDTH >= 768,    // Tablets
};

/**
 * Width Percentage - Returns a percentage of screen width
 * Use for: Container widths, card widths, overall layout
 * 
 * @param percentage - Percentage of screen width (0-100)
 * @returns Calculated width in pixels
 * 
 * @example
 * width: wp(90)  // 90% of screen width
 * maxWidth: wp(95)  // 95% of screen width
 */
export const wp = (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * Height Percentage - Returns a percentage of screen height
 * Use sparingly! Height varies greatly between devices and orientations
 * 
 * @param percentage - Percentage of screen height (0-100)
 * @returns Calculated height in pixels
 * 
 * @example
 * height: hp(50)  // 50% of screen height
 */
export const hp = (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

/**
 * Scale - Scales a value proportionally to screen width
 * Use for: Spacing, padding, margins, icon sizes, dimensions
 * 
 * @param size - The base size (designed for 375px width)
 * @param minSize - Optional minimum size constraint
 * @param maxSize - Optional maximum size constraint
 * @returns Scaled size in pixels
 * 
 * @example
 * padding: scale(16)  // Scales 16px proportionally
 * height: scale(56, 48)  // Min 48px for touch target
 * iconSize: scale(24, 20, 32)  // Between 20-32px
 */
export const scale = (size: number, minSize?: number, maxSize?: number): number => {
    const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
    let scaled = PixelRatio.roundToNearestPixel(size * scaleFactor);

    // Apply constraints
    if (minSize !== undefined && scaled < minSize) {
        scaled = minSize;
    }
    if (maxSize !== undefined && scaled > maxSize) {
        scaled = maxSize;
    }

    return scaled;
};

/**
 * Vertical Scale - Scales based on screen height
 * Use sparingly! Only for elements that should scale with height
 * 
 * @param size - The base size (designed for 812px height)
 * @returns Scaled size in pixels
 */
export const verticalScale = (size: number): number => {
    const scaleFactor = SCREEN_HEIGHT / BASE_HEIGHT;
    return PixelRatio.roundToNearestPixel(size * scaleFactor);
};

/**
 * Moderate Scale - Scales less aggressively (good for mixed content)
 * Scales by a factor between 0-1 (default 0.5 = 50% of the difference)
 * 
 * @param size - The base size
 * @param factor - How much to scale (0 = no scale, 1 = full scale)
 * @returns Moderately scaled size
 * 
 * @example
 * padding: moderateScale(16, 0.3)  // Only 30% of proportional scaling
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
    const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size + (size * (scaleFactor - 1) * factor);
    return PixelRatio.roundToNearestPixel(newSize);
};

/**
 * Font Scale - Specifically for text (less aggressive scaling)
 * Prevents fonts from becoming too large on tablets or too small on small phones
 * 
 * @param size - The base font size
 * @param minSize - Optional minimum font size (default: size * 0.8)
 * @param maxSize - Optional maximum font size (default: size * 1.3)
 * @returns Scaled font size
 * 
 * @example
 * fontSize: fontScale(16)  // Scales moderately
 * fontSize: fontScale(24, 20, 28)  // Title with constraints
 */
export const fontScale = (size: number, minSize?: number, maxSize?: number): number => {
    // Use moderate scaling (50%) for fonts
    const scaleFactor = SCREEN_WIDTH / BASE_WIDTH;
    let scaled = size + (size * (scaleFactor - 1) * 0.5);
    scaled = PixelRatio.roundToNearestPixel(scaled);

    // Apply default constraints if not specified
    const min = minSize ?? Math.round(size * 0.85);
    const max = maxSize ?? Math.round(size * 1.25);

    if (scaled < min) scaled = min;
    if (scaled > max) scaled = max;

    return scaled;
};

/**
 * Get responsive value based on screen size category
 * Allows different values for different screen sizes
 * 
 * @param options - Object with values for each screen size
 * @returns The appropriate value for current screen size
 * 
 * @example
 * fontSize: responsiveValue({ small: 14, medium: 16, large: 18, xlarge: 20 })
 */
export const responsiveValue = <T>(options: {
    small?: T;
    medium?: T;
    large?: T;
    xlarge?: T;
    default: T;
}): T => {
    if (screenSize.isSmall && options.small !== undefined) return options.small;
    if (screenSize.isMedium && options.medium !== undefined) return options.medium;
    if (screenSize.isLarge && options.large !== undefined) return options.large;
    if (screenSize.isXLarge && options.xlarge !== undefined) return options.xlarge;
    return options.default;
};

/**
 * Common responsive spacing values
 * Pre-calculated for convenience
 */
export const spacing = {
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(20),
    xxl: scale(24),
    xxxl: scale(32),
    huge: scale(40),
    massive: scale(48),
};

/**
 * Common responsive font sizes
 * Pre-calculated for convenience
 */
export const fontSize = {
    xs: fontScale(12),
    sm: fontScale(14),
    md: fontScale(16),
    lg: fontScale(18),
    xl: fontScale(20),
    xxl: fontScale(24),
    xxxl: fontScale(28),
    huge: fontScale(32),
    massive: fontScale(36),
};

/**
 * Minimum touch target size (Apple HIG recommends 44pt)
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Check if current device is iOS
 */
export const isIOS = Platform.OS === 'ios';

/**
 * Check if current device is Android
 */
export const isAndroid = Platform.OS === 'android';

export default {
    wp,
    hp,
    scale,
    verticalScale,
    moderateScale,
    fontScale,
    responsiveValue,
    screenSize,
    spacing,
    fontSize,
    MIN_TOUCH_TARGET,
    isIOS,
    isAndroid,
};
