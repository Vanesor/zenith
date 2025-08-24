"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Helper function to validate JWT format
const isValidJWTFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  // Check for placeholder values
  if (token === 'session-based' || token === 'null' || token === 'undefined') {
    return false;
  }
  
  // Check JWT format (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3;
};

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: string;
  club_id: string | null; // Single club membership
  avatar?: string;
  profile_image_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: (redirect?: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
  forceRefreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount and validate it
    const validateStoredAuth = async () => {
      if (typeof window !== "undefined") {
        // First try to get user data from localStorage for an instant UI response
        const storedToken = localStorage.getItem("zenith-token");
        const storedUser = localStorage.getItem("zenith-user");
        const refreshToken = localStorage.getItem("zenith-refresh-token");
        const sessionCookie = document.cookie.includes('zenith-session=');
        
        // If we have local storage data, set it immediately to prevent UI flashing
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            // Check if stored user data has avatar fields, if not, clear it to force refresh
            if (!userData.hasOwnProperty('avatar') && !userData.hasOwnProperty('profile_image_url')) {
              console.log('AuthContext: Stored user data missing avatar fields, clearing cache');
              localStorage.removeItem("zenith-user");
              localStorage.removeItem("zenith-token");
            } else {
              setToken(storedToken || 'session-based');
              setUser(userData);
              console.log('AuthContext: Loaded cached user data:', {
                name: userData.name,
                avatar: userData.avatar,
                profile_image_url: userData.profile_image_url
              });
            }
            // Keep isLoading true while we verify with server
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }

        // Then check server-side session (most reliable)
        if (sessionCookie || storedToken) {
          try {
            // Fetch current user from API - include credentials to send cookies
            console.log('AuthContext: Calling /api/auth/check with credentials');
            const response = await fetch("/api/auth/check", {
              credentials: 'include', // Important to include cookies in the request
              headers: storedToken ? {
                Authorization: `Bearer ${storedToken}`
              } : {}
            });
            
            console.log('AuthContext: /api/auth/check response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('AuthContext: /api/auth/check response data:', data);
              
              if (data.authenticated && data.user) {
                console.log('AuthContext: Setting user data:', {
                  name: data.user.name,
                  avatar: data.user.avatar,
                  profile_image_url: data.user.profile_image_url
                });
                
                // Only set token if we have a valid JWT token, not session-based auth
                if (storedToken && isValidJWTFormat(storedToken)) {
                  setToken(storedToken);
                } else {
                  setToken(null); // Clear invalid token but keep user session
                }
                setUser(data.user);
                
                // Update localStorage to match server state
                localStorage.setItem("zenith-user", JSON.stringify(data.user));
                // Don't store invalid tokens
                if (!storedToken || !isValidJWTFormat(storedToken)) {
                  localStorage.removeItem("zenith-token");
                }
                setIsLoading(false);
                return; // Exit early since we have valid session
              } else {
                console.log('AuthContext: Auth check failed - not authenticated or no user data');
              }
            } else {
              console.log('AuthContext: Auth check response not ok:', response.status);
            }
          } catch (e) {
            console.error("Error checking session:", e);
          }
        } else {
          console.log('AuthContext: No session cookie or stored token found');
        }

        // Fall back to local storage token if session check fails
        if (storedToken && storedUser) {
          // First, set from localStorage to prevent flash of unauthenticated state
          try {
            const userData = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(userData);
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
          
          // Then validate with server
          try {
            // Validate token with server
            const response = await fetch("/api/auth/validate", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${storedToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const validationData = await response.json();
              if (validationData.valid) {
                // Token is valid, keep the current state
                console.log("Token validated successfully");
              } else if (refreshToken) {
                // Try to refresh the token
                try {
                  const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setToken(refreshData.accessToken);
                    
                    // Update localStorage
                    localStorage.setItem("zenith-token", refreshData.accessToken);
                    if (refreshData.refreshToken) {
                      localStorage.setItem("zenith-refresh-token", refreshData.refreshToken);
                    }
                    
                    console.log("Token refreshed successfully");
                  } else {
                    // Refresh failed, clear auth state
                    console.error("Token refresh failed");
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem("zenith-token");
                    localStorage.removeItem("zenith-refresh-token");
                    localStorage.removeItem("zenith-user");
                  }
                } catch (refreshError) {
                  console.error("Error refreshing token:", refreshError);
                  setToken(null);
                  setUser(null);
                  localStorage.removeItem("zenith-token");
                  localStorage.removeItem("zenith-refresh-token");
                  localStorage.removeItem("zenith-user");
                }
              } else {
                // Token invalid and no refresh token, clear storage
                console.error("Token invalid and no refresh token");
                setToken(null);
                setUser(null);
                localStorage.removeItem("zenith-token");
                localStorage.removeItem("zenith-user");
              }
            } else {
              // Server validation failed, try refresh if available
              if (refreshToken) {
                try {
                  const refreshResponse = await fetch("/api/auth/refresh", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ refreshToken }),
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    setToken(refreshData.accessToken);
                    
                    // Update localStorage
                    localStorage.setItem("zenith-token", refreshData.accessToken);
                    if (refreshData.refreshToken) {
                      localStorage.setItem("zenith-refresh-token", refreshData.refreshToken);
                    }
                    
                    console.log("Token refreshed successfully after validation failure");
                  } else {
                    // Refresh failed, clear auth state
                    console.error("Token refresh failed after validation failure");
                    setToken(null);
                    setUser(null);
                    localStorage.removeItem("zenith-token");
                    localStorage.removeItem("zenith-refresh-token");
                    localStorage.removeItem("zenith-user");
                  }
                } catch (refreshError) {
                  console.error("Error refreshing token after validation failure:", refreshError);
                  setToken(null);
                  setUser(null);
                  localStorage.removeItem("zenith-token");
                  localStorage.removeItem("zenith-refresh-token");
                  localStorage.removeItem("zenith-user");
                }
              } else {
                // No refresh token available, clear storage
                console.error("Validation failed and no refresh token");
                setToken(null);
                setUser(null);
                localStorage.removeItem("zenith-token");
                localStorage.removeItem("zenith-user");
              }
            }
          } catch (error) {
            console.error("Error validating stored auth:", error);
            // On network errors, keep the current state to allow offline usage
          }
        } else {
          console.log("No stored token or user found");
        }
      }
      setIsLoading(false);
    };

    validateStoredAuth();
    
    // Set up periodic validation
    const interval = setInterval(() => {
      if (token) {
        validateStoredAuth();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const forceRefreshUser = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('AuthContext: Force refresh - got user data:', {
            name: data.user.name,
            avatar: data.user.avatar,
            profile_image_url: data.user.profile_image_url
          });
          setUser(data.user);
          if (data.user.name) {
            localStorage.setItem("zenith-user", JSON.stringify(data.user));
          }
        }
      }
    } catch (error) {
      console.error('Force refresh failed:', error);
    }
  };

  const login = (newToken: string, userData: User) => {
    // Validate token format before storing
    if (!isValidJWTFormat(newToken)) {
      console.error("Invalid JWT format provided to login function");
      return;
    }
    
    setToken(newToken);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("zenith-token", newToken);
      localStorage.setItem("zenith-user", JSON.stringify(userData));
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("zenith-user", JSON.stringify(updatedUser));
      }
    }
  };

  const logout = (redirect = true) => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("zenith-token");
      localStorage.removeItem("zenith-user");
      localStorage.removeItem("zenith-refresh-token");
      // Only redirect if explicitly requested and we're in browser
      if (redirect) {
        window.location.href = "/";
      }
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    forceRefreshUser,
    isLoading,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
