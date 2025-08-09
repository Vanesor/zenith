"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isLoaded: boolean;
}

// Create the context with the same shape as the original ThemeContext
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>("light");
  
  // Initialize theme from local storage or system preference
  useEffect(() => {
    // Check if user has a theme preference stored
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("zenith-theme") as Theme;
      if (savedTheme && (savedTheme === "light" || savedTheme === "dark")) {
        setCurrentTheme(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setCurrentTheme(prefersDark ? "dark" : "light");
      }
    }
    setIsLoaded(true);
  }, []);

  // Toggle theme function for backward compatibility
  const toggleTheme = () => {
    setCurrentTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("zenith-theme", newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme, isLoaded }}>
      <NextThemesProvider attribute="class" defaultTheme={currentTheme} enableSystem={false}>
        {children}
      </NextThemesProvider>
    </ThemeContext.Provider>
  );
}

// Export the useTheme hook with the same signature as the original
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
