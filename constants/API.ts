// API Configuration
export const API_CONFIG = {
  BACKEND_URL: __DEV__ ? 'http://192.168.112.2:8000' : 'https://your-production-backend.com',
  FACE_API_URL: __DEV__ ? 'http://192.168.112.2:8001' : 'https://your-production-faceapi.com',
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
  },
  
  // Stripe Onboarding
  STRIPE: {
    ONBOARD: '/auth/onboard-stripe',
    MERCHANT_ONBOARD: '/auth/merchant-onboard-stripe',
    COMPLETE_ONBOARDING: '/auth/complete-onboarding',
  },
  
  // Merchant
  MERCHANT: {
    PROFILE: '/merchants/profile',
    UPDATE_PROFILE: '/merchants/profile',
    PAYMENT_REQUESTS: '/merchants/payment-requests',
    TRANSACTIONS: '/merchants/transactions',
  },
  
  // Payments
  PAYMENTS: {
    INITIATE: '/merchants/initiate-payment',
    STATUS: '/merchants/payment-status',
  },
  
  // Health
  HEALTH: '/health',
};

// Face Recognition API Endpoints
export const FACE_API_ENDPOINTS = {
  VERIFY: '/verify',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
  PHONE_VERIFICATION_FAILED: 'Phone verification failed. Please try again.',
  FACE_SCAN_FAILED: 'Face scan failed. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'Registration successful!',
  LOGIN_SUCCESS: 'Login successful!',
  PHONE_VERIFIED: 'Phone number verified successfully!',
  PAYMENT_SUCCESS: 'Payment processed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
};

export default API_CONFIG; 