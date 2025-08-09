"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark"); // Default to dark theme
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user has a theme preference stored
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("zenith-theme") as Theme;
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        setTheme(savedTheme);
      } else {
        // Default to dark theme instead of system preference
        setTheme("dark");
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    // Apply theme to document
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("zenith-theme", theme);

    // Force re-render by updating data attribute
    root.setAttribute("data-theme", theme);
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
