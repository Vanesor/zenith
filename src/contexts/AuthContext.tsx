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
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount and validate it
    const validateStoredAuth = async () => {
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("zenith-token");
        const storedUser = localStorage.getItem("zenith-user");

        if (storedToken && storedUser) {
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
                const userData = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(userData);
              } else {
                // Token invalid, clear storage
                localStorage.removeItem("zenith-token");
                localStorage.removeItem("zenith-user");
              }
            } else {
              // Server validation failed, clear storage
              localStorage.removeItem("zenith-token");
              localStorage.removeItem("zenith-user");
            }
          } catch (error) {
            console.error("Error validating stored auth:", error);
            localStorage.removeItem("zenith-token");
            localStorage.removeItem("zenith-user");
          }
        }
      }
      setIsLoading(false);
    };

    validateStoredAuth();
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    if (typeof window !== "undefined") {
      localStorage.setItem("zenith-token", newToken);
      localStorage.setItem("zenith-user", JSON.stringify(userData));
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
