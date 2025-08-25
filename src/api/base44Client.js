import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "689114bd8ff9b1e25eb9ba78", 
  requiresAuth: true // Ensure authentication is required for all operations
});
