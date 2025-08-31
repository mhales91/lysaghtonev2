import { toast } from 'sonner';

// Global error handler for production
export const handleApiError = (error, context = 'Operation') => {
  console.error(`${context} error:`, error);
  
  // Parse error message
  let userMessage = `${context} failed`;
  let isRateLimit = false;
  
  if (error?.response?.status === 429 || error?.message?.includes('rate limit')) {
    userMessage = 'Server is busy. Please try again in a moment.';
    isRateLimit = true;
  } else if (error?.response?.status === 401) {
    userMessage = 'Your session has expired. Please refresh the page.';
  } else if (error?.response?.status === 403) {
    userMessage = 'You do not have permission to perform this action.';
  } else if (error?.response?.status === 404) {
    userMessage = 'The requested item was not found.';
  } else if (error?.response?.status >= 500) {
    userMessage = 'Server error. Our team has been notified.';
  } else if (error?.message) {
    userMessage = error.message;
  }
  
  toast.error(userMessage);
  
  return {
    userMessage,
    isRateLimit,
    shouldRetry: isRateLimit,
    originalError: error
  };
};

export const handleSuccess = (message) => {
  toast.success(message);
};

export const handleWarning = (message) => {
  toast.warning(message);
};

export const handleInfo = (message) => {
  toast.info(message);
};

// Retry wrapper with exponential backoff
export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const errorInfo = handleApiError(error, 'API Request');
      
      if (errorInfo.shouldRetry && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};