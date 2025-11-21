// API Configuration
export const API_CONFIG = {
  BACKEND_URL: 'https://api.dev.facepe.ai/mb',
  FACE_API_URL: 'https://api.dev.facepe.ai/mb',
  TIMEOUT: 30000, // 30 seconds
  
  // Request headers
  HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // File upload headers
  UPLOAD_HEADERS: {
    'Content-Type': 'multipart/form-data',
  },
};

// Backend API Endpoints
export const BACKEND_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER_INITIATE: '/auth/register-initiate',
    VERIFY_EMAIL: '/auth/verify-email',
    SEND_MOBILE_VERIFICATION: '/auth/send-mobile-verification',
    VERIFY_MOBILE: '/auth/verify-mobile',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Verification
  VERIFICATION: {
    SEND_EMAIL_CODE: '/verification/send-email-code',
    VERIFY_EMAIL_CODE: '/verification/verify-email-code',
    SEND_MOBILE_CODE: '/verification/send-mobile-code',
    VERIFY_MOBILE_CODE: '/verification/verify-mobile-code',
  },
  
  // Stripe Onboarding
  STRIPE: {
    ONBOARD: '/auth/onboard-stripe',
    MERCHANT_ONBOARD: '/auth/merchant-onboard-stripe',
    COMPLETE_ONBOARDING: '/auth/complete-onboarding',
    REFRESH_ONBOARDING: '/auth/refresh-stripe-onboarding',
    STATUS: '/auth/stripe-status',
    SYNC_STATUS: '/auth/sync-stripe-status',
  },
  
  // Merchant
  MERCHANT: {
    PROFILE: '/profile',
    UPDATE_PROFILE: '/profile',
    PAYMENT_REQUESTS: '/payment-requests',
    TRANSACTIONS: '/transactions',
    VERIFY_FACE: '/verify-face',
    VERIFY_PIN: '/verify-pin',
  },
  
  // Payments (STATUS kept if used elsewhere)
  PAYMENTS: {
    STATUS: '/payment-status',
  },
  
  // Health
  HEALTH: '/health',
};

// Face Recognition API Endpoints
export const FACE_API_ENDPOINTS = {
  VERIFY: '/verify-face',
}; 

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
  PHONE_VERIFICATION_FAILED: 'Phone verification failed. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  
  // Face Verification Specific
  NO_FACE_DETECTED: 'No face detected. Please ensure your face is clearly visible in the frame.',
  NO_MATCH_FOUND: 'Face not recognized. Please try again or register.',
  MULTIPLE_FACES_DETECTED: 'Multiple similar faces detected. Please enter your PIN to confirm your identity.',
  INVALID_PIN: 'Invalid PIN. Please try again.',
  PIN_VERIFICATION_FAILED: 'PIN verification failed. Please try again.',
  IMAGE_TOO_LARGE: 'Image file too large. Please upload an image under 10MB.',
  VERIFICATION_SERVICE_UNAVAILABLE: 'Verification service is temporarily unavailable. Please try again later.',
  FACE_SCAN_FAILED: 'Please ensure good lighting and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful!',
  LOGIN_SUCCESS: 'Login successful!',
  PHONE_VERIFIED: 'Phone number verified successfully!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  
  // Face Verification Specific
  FACE_VERIFIED: 'Face verified successfully!',
  AUTHENTICATION_SUCCESSFUL: 'Authentication successful!',
  PIN_VERIFIED: 'PIN verified successfully!',
  IDENTITY_CONFIRMED: 'Identity confirmed!',
  WELCOME_USER: 'Welcome!',
};

export default API_CONFIG; 