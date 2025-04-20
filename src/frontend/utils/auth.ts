/**
 * Utility functions for authentication
 */

/**
 * Redirects to the login page
 */
export function redirectToLogin() {
  // If using OIDC auth, redirect to the OIDC login endpoint
  if (import.meta.env.VITE_USE_OIDC_AUTH === 'true') {
    window.location.href = '/api/login';
  } else {
    // Otherwise, use the Google OAuth login
    window.location.href = '/api/auth/login/google';
  }
}

/**
 * Handles API responses that might require authentication
 * @param response The fetch response
 * @returns The response if authenticated, or redirects to login
 */
export async function handleAuthResponse(response: Response) {
  if (response.status === 401) {
    // Redirect to login page
    redirectToLogin();
    // Throw an error to stop further processing
    throw new Error('Authentication required');
  }
  return response;
}

/**
 * Logs the user out
 */
export function logout() {
  // If using OIDC auth, redirect to the OIDC logout endpoint
  if (import.meta.env.VITE_USE_OIDC_AUTH === 'true') {
    window.location.href = '/api/logout';
  } else {
    // Otherwise, use the Google OAuth logout
    window.location.href = '/api/auth/logout';
  }
}
