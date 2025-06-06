import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
        } catch (error) {
          // Tokens are invalid or profile is incomplete, clear storage
          console.log('Stored tokens are invalid or profile incomplete, clearing data:', error);
          await clearAllData();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // No tokens or user data found, user needs to log in
        console.log('No valid authentication data found, user needs to log in');
        if (tokens || userData) {
          // Partial data found, clear it to avoid confusion
          await clearAllData();
        }
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Clear any potentially corrupted data
      await clearAllData();
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
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
    setRegistrationStep,
    setEmailToken,
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