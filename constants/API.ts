// API Configuration
export const API_CONFIG = {
  BACKEND_URL: 'http://10.243.17.2:8002',
  FACE_API_URL: 'http://10.204.16.2:8002',
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
    REGISTER_INITIATE: '/merchants/auth/register-initiate',
    VERIFY_EMAIL: '/merchants/auth/verify-email',
    SEND_MOBILE_VERIFICATION: '/merchants/auth/send-mobile-verification',
    VERIFY_MOBILE: '/merchants/auth/verify-mobile',
    SEND_OTP: '/merchants/auth/send-otp',
    VERIFY_OTP: '/merchants/auth/verify-otp',
    LOGIN: '/merchants/auth/login',
    REFRESH: '/merchants/auth/refresh',
    LOGOUT: '/merchants/auth/logout',
    FORGOT_PASSWORD: '/merchants/auth/forgot-password',
    RESET_PASSWORD: '/merchants/auth/reset-password',
  },
  
  // Stripe Onboarding
  STRIPE: {
    ONBOARD: '/merchants/auth/onboard-stripe',
    MERCHANT_ONBOARD: '/merchants/auth/merchant-onboard-stripe',
    COMPLETE_ONBOARDING: '/merchants/auth/complete-onboarding',
    REFRESH_ONBOARDING: '/merchants/auth/refresh-stripe-onboarding',
    STATUS: '/merchants/auth/stripe-status',
    SYNC_STATUS: '/merchants/auth/sync-stripe-status',
  },
  
  // Merchant
  MERCHANT: {
    PROFILE: '/merchants/profile',
    UPDATE_PROFILE: '/merchants/profile',
    PAYMENT_REQUESTS: '/merchants/payment-requests',
    TRANSACTIONS: '/merchants/transactions',
    VERIFY_FACE: '/merchants/verify-face',
    VERIFY_PIN: '/merchants/verify-pin',
  },
  
  // Payments (STATUS kept if used elsewhere)
  PAYMENTS: {
    STATUS: '/merchants/payment-status',
  },
  
  // Health
  HEALTH: '/merchants/health',
};

// Face Recognition API Endpoints
export const FACE_API_ENDPOINTS = {
  VERIFY: '/merchants/verify-face',
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