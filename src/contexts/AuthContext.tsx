"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: (redirect?: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
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
            setToken(storedToken || 'session-based');
            setUser(userData);
            // Keep isLoading true while we verify with server
          } catch (e) {
            console.error("Error parsing stored user:", e);
          }
        }

        // Then check server-side session (most reliable)
        if (sessionCookie || storedToken) {
          try {
            // Fetch current user from API - include credentials to send cookies
            const response = await fetch("/api/auth/check", {
              credentials: 'include', // Important to include cookies in the request
              headers: storedToken ? {
                Authorization: `Bearer ${storedToken}`
              } : {}
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.authenticated && data.user) {
                setToken(storedToken || 'session-based'); // Use existing token or placeholder
                setUser(data.user);
                
                // Update localStorage to match server state
                localStorage.setItem("zenith-user", JSON.stringify(data.user));
                if (!storedToken) {
                  // If we have a session but no token, store a placeholder
                  localStorage.setItem("zenith-token", 'session-based');
                }
                setIsLoading(false);
                return; // Exit early since we have valid session
              }
            }
          } catch (e) {
            console.error("Error checking session:", e);
          }
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

  const login = (newToken: string, userData: User) => {
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
