import React, { useState, useEffect } from 'react';

/**
 * Component to show auth status and handle token expiry warnings
 */
function AuthStatus() {
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [warningShown, setWarningShown] = useState(false);

  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        // Decode JWT token (simple base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeLeft = exp - now;

        setTokenExpiry(exp);

        // Show warning if token expires in less than 5 minutes
        if (timeLeft > 0 && timeLeft < 5 * 60 * 1000 && !warningShown) {
          setWarningShown(true);
          // Token will be auto-refreshed by interceptor, but show a subtle notification
          console.log('Token will expire soon, will auto-refresh if needed');
        }
      } catch (e) {
        // Invalid token format
        console.warn('Could not parse token expiry:', e);
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [warningShown]);

  // Don't render anything visible, just handle logic
  return null;
}

export default AuthStatus;

