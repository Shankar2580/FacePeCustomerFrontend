/**
 * Error Handler Utility for Merchant App
 * Converts technical error messages into user-friendly messages
 */

export const getUserFriendlyErrorMessage = (error: any, fallback: string = 'Something went wrong. Please try again.'): string => {
  // Handle network errors (only if explicitly a network error)
  if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please check your network connection and try again.';
    }
    return 'Network connection issue. Please check your internet and try again.';
  }
  
  // If no response but we have error message, it might be a real error, not network
  if (!error.response) {
    // Check if it's genuinely a network issue
    if (error.message && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('connection') ||
      error.message.toLowerCase().includes('timeout') ||
      error.message.toLowerCase().includes('econnrefused')
    )) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    // Otherwise use the fallback message
    return fallback;
  }
  
  const status = error.response?.status;
  const backendMessage = error.response?.data?.detail || error.response?.data?.message;
  
  // Map common status codes to user-friendly messages
  switch (status) {
    case 400:
      // Check if backend message is user-friendly
      if (backendMessage && isUserFriendly(backendMessage)) {
        return backendMessage;
      }
      return 'Invalid request. Please check your information and try again.';
      
    case 401:
      // Check if backend message is user-friendly
      if (backendMessage && isUserFriendly(backendMessage)) {
        return backendMessage;
      }
      return 'Authentication required. Please log in again.';
      
    case 403:
      return 'You don\'t have permission to perform this action.';
      
    case 404:
      return 'The requested resource was not found.';
      
    case 422:
      // For validation errors, check if backend message is user-friendly
      if (backendMessage && isUserFriendly(backendMessage)) {
        return backendMessage;
      }
      return 'Please check your input and try again.';
      
    case 423:
      return 'Your account is temporarily locked. Please try again later.';
      
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
      
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server is temporarily unavailable. Please try again later.';
      
    default:
      // Use backend message only if it's user-friendly
      if (backendMessage && isUserFriendly(backendMessage)) {
        return backendMessage;
      }
      return fallback;
  }
};

/**
 * Check if a message is user-friendly (doesn't contain technical jargon)
 */
const isUserFriendly = (message: string): boolean => {
  if (!message) return false;
  
  const technicalTerms = [
    'status code',
    'failed with',
    'validation error',
    'validation failed',
    'request failed',
    'error:',
    'exception',
    'stack trace',
    'undefined',
    'null pointer',
    'internal server',
    'database',
    'sql',
    'query',
    'connection refused',
    'timeout error',
    'econnrefused',
    'econnaborted',
  ];
  
  const lowerMessage = message.toLowerCase();
  
  // Check if message contains any technical terms
  for (const term of technicalTerms) {
    if (lowerMessage.includes(term)) {
      return false;
    }
  }
  
  return true;
};
