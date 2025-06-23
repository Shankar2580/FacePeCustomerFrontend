import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { UserData, getStoredTokens, getUserData, clearAllData, storeTokens, storeUserData } from '../services/storage';
import api from '../services/api';

// Types
interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  
  // Registration flow state
  registrationStep: 'phone' | 'details' | 'mobile_verify' | 'stripe' | 'complete';
  emailToken: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<boolean>;
  sendMobileVerification: (phoneNumber: string) => Promise<boolean>;
  verifyMobile: (code: string) => Promise<boolean>;
  completeStripeOnboarding: (redirectUrl: string) => Promise<boolean>;
  startMerchantOnboarding: () => Promise<string | null>;
  refreshStripeOnboarding: () => Promise<string | null>;
  refreshUserProfile: () => Promise<void>;
  setRegistrationStep: (step: 'phone' | 'details' | 'mobile_verify' | 'stripe' | 'complete') => void;
  setEmailToken: (token: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  business_name: string;
  mobile_number: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationStep, setRegistrationStep] = useState<'phone' | 'details' | 'mobile_verify' | 'stripe' | 'complete'>('phone');
  const [emailToken, setEmailToken] = useState<string | null>(null);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Add AppState listener to refresh profile on app focus
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App has come to the foreground, refreshing profile...');
        refreshUserProfile();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]); // Re-run when authentication status changes

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const tokens = await getStoredTokens();
      const userData = await getUserData();
      
      // Only consider user authenticated if we have valid tokens AND user data
      // AND we can successfully verify the tokens with the backend
      if (tokens && userData && tokens.accessToken && tokens.refreshToken) {
        try {
          // Verify tokens are still valid by making a test API call
          const profileResponse = await api.merchant.getProfile();
          
          // Double-check that the profile data is valid and complete
          if (profileResponse.data && profileResponse.data.merchant_id && profileResponse.data.email) {
            setIsAuthenticated(true);
            setUser(userData);
            console.log('User authenticated successfully');
          } else {
            throw new Error('Invalid profile data received');
          }
        } catch (error: any) {
          // Handle authentication errors
          console.log('Authentication verification failed:', error);
          
          // If it's a 401 (Unauthorized) or 403 (Forbidden), definitely logout
          if (error?.response?.status === 401 || error?.response?.status === 403) {
            console.log('Invalid credentials detected - forcing logout');
            await forceLogout();
            return;
          }
          
          // For other errors, still clear data but log differently
          console.log('Profile verification failed, clearing stored data');
          await forceLogout();
        }
      } else {
        // No tokens or user data found, user needs to log in
        console.log('No valid authentication data found');
        await forceLogout();
      }
    } catch (error) {
      console.error('Critical error checking auth status:', error);
      // Clear any potentially corrupted data
      await forceLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const forceLogout = async () => {
    try {
      console.log('Forcing user logout and clearing all data');
      await clearAllData();
      setIsAuthenticated(false);
      setUser(null);
      setEmailToken(null);
      setRegistrationStep('phone');
    } catch (error) {
      console.error('Error during force logout:', error);
      // Even if clearing fails, reset state
      setIsAuthenticated(false);
      setUser(null);
      setEmailToken(null);
      setRegistrationStep('phone');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.login({ username: email, password });
      
      const tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      };
      
      await storeTokens(tokens);
      
      // Get user profile
      const profileResponse = await api.merchant.getProfile();
      const userData: UserData = {
        id: profileResponse.data.merchant_id,
        email: profileResponse.data.email,
        business_name: profileResponse.data.business_name,
        mobile_number: profileResponse.data.mobile_number,
        mobile_verified: profileResponse.data.mobile_verified,
        stripe_account_status: profileResponse.data.stripe_account_status,
        payout_enabled: profileResponse.data.payout_enabled,
      };
      
      await storeUserData(userData);
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const tokens = await getStoredTokens();
      if (tokens?.refreshToken) {
        await api.auth.logout(tokens.refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAllData();
      setIsAuthenticated(false);
      setUser(null);
      setEmailToken(null);
      setRegistrationStep('phone');
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.auth.registerInitiate(data);
      
      if (response.status === 200) {
        // Registration now returns tokens directly, so login the user
        const tokens = {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        };
        
        await storeTokens(tokens);
        
        // Get user profile
        const profileResponse = await api.merchant.getProfile();
        const userData: UserData = {
          id: profileResponse.data.merchant_id,
          email: profileResponse.data.email,
          business_name: profileResponse.data.business_name,
          mobile_number: profileResponse.data.mobile_number,
          mobile_verified: profileResponse.data.mobile_verified,
          stripe_account_status: profileResponse.data.stripe_account_status,
          payout_enabled: profileResponse.data.payout_enabled,
        };
        
        await storeUserData(userData);
        setUser(userData);
        setIsAuthenticated(true);
        setRegistrationStep('complete');
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendMobileVerification = async (phoneNumber: string): Promise<boolean> => {
    try {
      if (!emailToken) {
        throw new Error('Email token not found');
      }
      
      setIsLoading(true);
      const response = await api.auth.sendMobileVerification({
        email_token: emailToken,
        mobile_number: phoneNumber,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Send mobile verification error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMobile = async (code: string): Promise<boolean> => {
    try {
      if (!emailToken) {
        throw new Error('Email token not found');
      }
      
      setIsLoading(true);
      const response = await api.auth.verifyMobile({
        email_token: emailToken,
        verification_code: code,
      });
      
      if (response.status === 200) {
        setRegistrationStep('stripe');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Verify mobile error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const completeStripeOnboarding = async (redirectUrl: string): Promise<boolean> => {
    try {
      if (!emailToken) {
        throw new Error('Email token not found');
      }
      
      setIsLoading(true);
      const response = await api.stripe.onboard({
        email_token: emailToken,
        redirect_base: redirectUrl,
      });
      
      if (response.status === 200) {
        setRegistrationStep('complete');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Stripe onboarding error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const startMerchantOnboarding = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await api.stripe.merchantOnboard();
      
      if (response.status === 200 && response.data.onboarding_url) {
        return response.data.onboarding_url;
      }
      return null;
    } catch (error) {
      console.error('Merchant onboarding error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStripeOnboarding = async (): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await api.stripe.refreshOnboarding();
      
      if (response.status === 200 && response.data.onboarding_url) {
        return response.data.onboarding_url;
      }
      return null;
    } catch (error) {
      console.error('Refresh onboarding error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserProfile = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;
      
      // First sync Stripe status to ensure latest data
      try {
        await api.stripe.syncStatus();
        console.log('✅ Stripe status synced');
      } catch (syncError) {
        console.warn('⚠️ Stripe sync failed, continuing with cached data:', syncError);
      }
      
      const profileResponse = await api.merchant.getProfile();
      const userData: UserData = {
        id: profileResponse.data.merchant_id,
        email: profileResponse.data.email,
        business_name: profileResponse.data.business_name,
        mobile_number: profileResponse.data.mobile_number,
        mobile_verified: profileResponse.data.mobile_verified,
        stripe_account_status: profileResponse.data.stripe_account_status,
        payout_enabled: profileResponse.data.payout_enabled,
      };
      
      await storeUserData(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    registrationStep,
    emailToken,
    login,
    logout,
    register,
    sendMobileVerification,
    verifyMobile,
    completeStripeOnboarding,
    startMerchantOnboarding,
    refreshUserProfile,
    setRegistrationStep,
    setEmailToken,
    refreshStripeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 