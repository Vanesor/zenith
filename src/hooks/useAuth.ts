// React hook for authentication and token management
import { useState, useEffect, useCallback } from 'react';
import TokenManager from '../lib/TokenManager';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  club_id?: string;
  name?: string;
}

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenManager = TokenManager.getInstance();

  // Load user from localStorage on mount and validate token
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('zenith-user');
        const accessToken = tokenManager.getAccessToken();
        
        if (storedUser && accessToken) {
          // Always parse the user first so we have it available
          const parsedUser = JSON.parse(storedUser);
          
          // Check if token is expired
          if (tokenManager.isTokenExpired(accessToken)) {
            console.log('Token expired, attempting refresh');
            // Try to refresh the token
            try {
              await tokenManager.refreshAccessToken();
              setUser(parsedUser);
              console.log('Token refresh successful');
            } catch (error) {
              console.error('Token refresh failed on mount:', error);
              tokenManager.clearTokens();
              setUser(null);
            }
          } else {
            console.log('Token valid, setting user');
            setUser(parsedUser);
          }
        } else {
          console.log('No stored user or token found');
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        tokenManager.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Set up periodic token validation
  useEffect(() => {
    if (!user) return;

    const validateToken = async () => {
      try {
        const accessToken = tokenManager.getAccessToken();
        if (!accessToken) {
          setUser(null);
          return;
        }

        // If token is expired, try to refresh it
        if (tokenManager.isTokenExpired(accessToken)) {
          await tokenManager.refreshAccessToken();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        tokenManager.clearTokens();
        setUser(null);
      }
    };

    // Check token every 5 minutes
    const interval = setInterval(validateToken, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, tokenManager]);

  const login = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store tokens and user data
      tokenManager.setTokens(data.access_token, data.refresh_token);
      localStorage.setItem('zenith-user', JSON.stringify(data.user));
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenManager.clearTokens();
    setUser(null);
    window.location.href = '/login';
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      await tokenManager.refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
  };
};
