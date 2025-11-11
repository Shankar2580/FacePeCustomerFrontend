/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const Colors = {
  // Primary Brand Colors (Refined Purple)
  primary: '#7C3AED',        // Softer purple
  primaryLight: '#A855F7',   // Light purple accent
  primaryDark: '#5B21B6',    // Deep purple
  
  // Background Colors (More White-Focused)
  background: {
    primary: '#FFFFFF',       // Pure white
    secondary: '#F8FAFC',     // Very light gray-white
    card: '#FFFFFF',          // White cards
    overlay: '#F1F5F9',       // Light overlay
    input: '#F8FAFC',         // Light input background
  },
  
  // Text Colors (Better Contrast)
  text: {
    primary: '#1E293B',       // Dark gray-blue
    secondary: '#475569',     // Medium gray
    light: '#64748B',         // Light gray
    white: '#FFFFFF',         // Pure white
    muted: '#94A3B8',         // Very light gray
  },
  
  // Status Colors (Professional)
  success: '#10B981',         // Green
  warning: '#F59E0B',         // Amber
  error: '#EF4444',           // Red
  info: '#3B82F6',            // Blue
  
  // Accent Colors (Subtle Purple Touches)
  accent: {
    purple: '#E879F9',        // Light purple
    lavender: '#F3E8FF',      // Very light purple
    violet: '#DDD6FE',        // Soft violet
  },
  
  // Border Colors (Clean)
  border: {
    light: '#E2E8F0',         // Light border
    medium: '#CBD5E1',        // Medium border
    dark: '#94A3B8',          // Dark border
    focus: '#7C3AED',         // Purple focus
  },
  
  // Shadow Colors (Subtle)
  shadow: {
    light: '#00000008',       // Very light shadow
    medium: '#00000015',      // Medium shadow
    dark: '#00000025',        // Darker shadow
  },
  
  // Status-specific backgrounds (Clean & Professional)
  status: {
    completed: '#ECFDF5',     // Light green
    pending: '#FEF3C7',       // Light yellow
    failed: '#FEF2F2',        // Light red
    processing: '#EFF6FF',    // Light blue
  },
  
  // Gradients (Subtle Purple Touches)
  gradients: {
    primary: ['#7C3AED', '#A855F7'] as const,      // Purple gradient
    card: ['#FFFFFF', '#F8FAFC'] as const,         // White gradient
    header: ['#7C3AED', '#6366F1'] as const,       // Header gradient
    subtle: ['#F8FAFC', '#F1F5F9'] as const,       // Subtle gradient
  },
};

export default Colors;
