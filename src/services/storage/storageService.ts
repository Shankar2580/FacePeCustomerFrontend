import * as SecureStore from 'expo-secure-store';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  EMAIL_TOKEN: 'email_token',
  ONBOARDING_STATUS: 'onboarding_status',
};

// Types
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserData {
  id: string;
  email: string;
  business_name: string;
  mobile_number: string;
  mobile_verified: boolean;
  stripe_account_status: string;
  payout_enabled: boolean;
}

// Token management
export const storeTokens = async (tokens: StoredTokens): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  } catch (error) {
    throw new Error('Failed to store authentication tokens');
  }
};

export const getStoredTokens = async (): Promise<StoredTokens | null> => {
  try {
    const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
  }
};

// User data management
export const storeUserData = async (userData: UserData): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  } catch (error) {
    throw new Error('Failed to store user data');
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  try {
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

export const clearUserData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
  } catch (error) {
  }
};

// Email token for registration flow
export const storeEmailToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.EMAIL_TOKEN, token);
  } catch (error) {
    throw new Error('Failed to store email token');
  }
};

export const getEmailToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.EMAIL_TOKEN);
  } catch (error) {
    return null;
  }
};

export const clearEmailToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.EMAIL_TOKEN);
  } catch (error) {
  }
};

// Onboarding status
export const setOnboardingStatus = async (status: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.ONBOARDING_STATUS, status);
  } catch (error) {
  }
};

export const getOnboardingStatus = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ONBOARDING_STATUS);
  } catch (error) {
    return null;
  }
};

// Clear all stored data
export const clearAllData = async (): Promise<void> => {
  try {
    await Promise.all([
      clearTokens(),
      clearUserData(),
      clearEmailToken(),
      SecureStore.deleteItemAsync(STORAGE_KEYS.ONBOARDING_STATUS),
    ]);
  } catch (error) {
  }
};

export default {
  storeTokens,
  getStoredTokens,
  clearTokens,
  storeUserData,
  getUserData,
  clearUserData,
  storeEmailToken,
  getEmailToken,
  clearEmailToken,
  setOnboardingStatus,
  getOnboardingStatus,
  clearAllData,
}; 