import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, BACKEND_ENDPOINTS, FACE_API_ENDPOINTS } from '../../constants/api';
import { getStoredTokens, storeTokens, clearTokens, clearAllData } from '../storage/storageService';

// Create axios instances
const backendAPI = axios.create({
  baseURL: API_CONFIG.BACKEND_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
});

const faceAPI = axios.create({
  baseURL: API_CONFIG.FACE_API_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Request interceptor to add auth token
backendAPI.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const tokens = await getStoredTokens();
    if (tokens?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor to handle token refresh
backendAPI.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokens = await getStoredTokens();
        if (tokens?.refreshToken) {
          const response = await axios.post(
            `${API_CONFIG.BACKEND_URL}${BACKEND_ENDPOINTS.AUTH.REFRESH}`,
            { refresh_token: tokens.refreshToken }
          );
          
          const newTokens = {
            accessToken: response.data.access_token,
            refreshToken: tokens.refreshToken,
          };
          
          await storeTokens(newTokens);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return backendAPI(originalRequest);
        }
      } catch (refreshError) {

        await clearAllData();
        // Force logout - the AuthContext will handle the redirect
      }
    }
    
    // For any 401/403 error that reaches here, clear data
    if (error.response?.status === 401 || error.response?.status === 403) {

      await clearAllData();
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface RegisterRequest {
  email: string;
  password: string;
  business_name: string;
  mobile_number: string;
  email_verification_code: string;
  mobile_verification_code: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface MobileVerificationRequest {
  email_token: string;
  mobile_number: string;
}

export interface MobileVerifyRequest {
  email_token: string;
  verification_code: string;
}

export interface SendOTPRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  verification_code: string;
}

export interface ForgotPasswordRequest {
  mobile_number: string;
}

export interface ResetPasswordRequest {
  mobile_number: string;
  verification_code: string;
  email_verification_code: string;
  new_password: string;
}

export interface StripeOnboardRequest {
  email_token: string;
  redirect_base: string;
}

export interface PaymentInitiateRequest {
  user_id: string;
  face_scan_id: string;
  amount: number;
  currency: string;
  description?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MessageResponse {
  message: string;
}

export interface FaceMatch {
  user_id: string;
  name?: string;
  similarity: number;
}

export interface PaymentRequest {
  request_id: string;
  user_id: string;
  face_scan_id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'DECLINED';
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface FaceVerificationResponse {
  success: boolean;
  match_found: boolean;
  requires_pin: boolean;
  is_ambiguous?: boolean;
  matches?: FaceMatch[];
  potential_user_ids?: string[];
  face_scan_id?: string;
  auto_payment?: boolean;
  message?: string;
  request?: PaymentRequest;
  request_id?: string;
}

export interface PinVerificationRequest {
  pin: string;
  face_scan_id: string;
}

export interface PinVerificationResponse {
  success: boolean;
  verified_user_id?: string;
  message: string;
}

// Authentication API
export const authAPI = {
  registerInitiate: (data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.REGISTER_INITIATE, data),
    
  sendMobileVerification: (data: MobileVerificationRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.SEND_MOBILE_VERIFICATION, data),
    
  verifyMobile: (data: MobileVerifyRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.VERIFY_MOBILE, data),
    
  sendOTP: (data: SendOTPRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.SEND_OTP, data),
    
  verifyOTP: (data: VerifyOTPRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.VERIFY_OTP, data),
    
  login: (data: LoginRequest): Promise<AxiosResponse<AuthResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.LOGIN, data),
    
  logout: (refreshToken: string): Promise<AxiosResponse<void>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.LOGOUT, { refresh_token: refreshToken }),

  forgotPassword: (data: ForgotPasswordRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.FORGOT_PASSWORD, data),

  resetPassword: (data: ResetPasswordRequest): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.AUTH.RESET_PASSWORD, data),
};

// Verification API
export const verificationAPI = {
  sendEmailCode: (email: string): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.VERIFICATION.SEND_EMAIL_CODE, { email }),
    
  verifyEmailCode: (email: string, code: string): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.VERIFICATION.VERIFY_EMAIL_CODE, { email, code }),
    
  sendMobileCode: (mobile_number: string): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.VERIFICATION.SEND_MOBILE_CODE, { mobile_number }),
    
  verifyMobileCode: (mobile_number: string, code: string): Promise<AxiosResponse<MessageResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.VERIFICATION.VERIFY_MOBILE_CODE, { mobile_number, code }),
};

// Stripe API
export const stripeAPI = {
  onboard: (data: StripeOnboardRequest): Promise<AxiosResponse<{ onboarding_url: string }>> =>
    backendAPI.post(BACKEND_ENDPOINTS.STRIPE.ONBOARD, data),
    
  merchantOnboard: (): Promise<AxiosResponse<{ onboarding_url: string }>> =>
    backendAPI.post(BACKEND_ENDPOINTS.STRIPE.MERCHANT_ONBOARD),
    
  refreshOnboarding: (): Promise<AxiosResponse<{ onboarding_url: string }>> =>
    backendAPI.post(BACKEND_ENDPOINTS.STRIPE.REFRESH_ONBOARDING),
    
  getStatus: (): Promise<AxiosResponse<{
    has_stripe_account: boolean;
    stripe_account_id?: string;
    onboarding_status: string;
    can_accept_payments: boolean;
    can_receive_payouts: boolean;
    fully_onboarded: boolean;
    next_action: string;
    account_details: {
      email: string;
      country: string;
      currency: string;
      business_name: string;
      support_email: string;
      has_bank_account: boolean;
      bank_accounts_count: number;
    };
    requirements: {
      currently_due: string[];
      eventually_due: string[];
      past_due: string[];
      pending_verification: string[];
      disabled_reason: string | null;
    };
    individual_info: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      verification_status: string;
    };
    last_updated: string;
  }>> =>
    backendAPI.get(BACKEND_ENDPOINTS.STRIPE.STATUS),
    
  syncStatus: (): Promise<AxiosResponse<{
    success: boolean;
    message: string;
    has_stripe_account: boolean;
    stripe_account_id?: string;
    old_status?: string;
    new_status?: string;
    onboarding_status: string;
    can_accept_payments?: boolean;
    can_receive_payouts?: boolean;
    fully_onboarded?: boolean;
    requirements?: {
      currently_due: string[];
      past_due: string[];
      pending_verification: string[];
    };
  }>> =>
    backendAPI.post(BACKEND_ENDPOINTS.STRIPE.SYNC_STATUS),
};

// Merchant API
export const merchantAPI = {
  getProfile: (): Promise<AxiosResponse<any>> =>
    backendAPI.get(BACKEND_ENDPOINTS.MERCHANT.PROFILE),
    
  getTransactions: (statusFilter?: string): Promise<AxiosResponse<any[]>> => {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    return backendAPI.get(BACKEND_ENDPOINTS.MERCHANT.TRANSACTIONS, { params });
  },
    
  getPaymentRequests: (): Promise<AxiosResponse<any[]>> =>
    backendAPI.get(BACKEND_ENDPOINTS.MERCHANT.PAYMENT_REQUESTS),
  
  cancelPaymentRequest: (requestId: string): Promise<AxiosResponse<{ message: string }>> =>
    backendAPI.post(`/payment-requests/${requestId}/cancel`),
};

// // Face Recognition API
export const faceRecognitionAPI = {
  verifyFace: (formData: FormData): Promise<AxiosResponse<FaceVerificationResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.MERCHANT.VERIFY_FACE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  verifyPin: (data: PinVerificationRequest): Promise<AxiosResponse<PinVerificationResponse>> =>
    backendAPI.post(BACKEND_ENDPOINTS.MERCHANT.VERIFY_PIN, data),
};

// Health Check
export const healthAPI = {
  check: (): Promise<AxiosResponse<{ status: string; service: string }>> =>
    backendAPI.get(BACKEND_ENDPOINTS.HEALTH),
};

export default {
  auth: authAPI,
  verification: verificationAPI,
  stripe: stripeAPI,
  merchant: merchantAPI,
  face: faceRecognitionAPI,
  health: healthAPI,
}; 