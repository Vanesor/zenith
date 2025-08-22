"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

interface SessionExpirationHandlerProps {
  // Children components that will be wrapped by this handler
  children: React.ReactNode;
}

/**
 * Component that manages session expiration handling across protected routes
 * - Periodically checks token validity
 * - Shows toast notifications for impending expiration
 * - Handles redirects when tokens have fully expired
 */
export function SessionExpirationHandler({ children }: SessionExpirationHandlerProps) {
  const { user, refreshToken, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  // Set up periodic checks for token expiration
  useEffect(() => {
    if (!user) return;

    // Function to get token expiration time from JWT
    const getTokenExpiration = (): { expiryTime: number; timeLeft: number } | null => {
      try {
        const token = localStorage.getItem('zenith-token');
        if (!token) return null;

        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const timeLeft = expiryTime - Date.now();
        
        return { expiryTime, timeLeft };
      } catch (error) {
        console.error('Error checking token expiration:', error);
        return null;
      }
    };

    // Function to check and handle token expiration
    const checkTokenExpiration = async () => {
      const expInfo = getTokenExpiration();
      
      if (!expInfo) {
        // No valid token found
        logout();
        return;
      }
      
      const { timeLeft } = expInfo;
      
      // If less than 5 minutes left (300000 ms), try to refresh the token
      if (timeLeft < 300000 && timeLeft > 0) {
        showToast({
          title: 'Session Expiring Soon',
          message: 'Your session will expire soon. Refreshing...',
          type: 'warning',
          duration: 10000,
        });
        
        const refreshed = await refreshToken();
        
        if (refreshed) {
          showToast({
            title: 'Session Extended',
            message: 'Your session has been refreshed',
            type: 'success',
            duration: 5000,
          });
        }
      }
      
      // If token has already expired
      if (timeLeft <= 0) {
        showToast({
          title: 'Session Expired',
          message: 'Your session has expired. Please log in again.',
          type: 'error',
          duration: 7000,
        });
        
        logout();
      }
    };

    // Run the check when the component mounts
    checkTokenExpiration();
    
    // Set interval to check every minute
    const intervalId = setInterval(checkTokenExpiration, 60000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user, refreshToken, logout, router, showToast]);

  return <>{children}</>;
}
