'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

  // Enhanced toggle function with theme enforcement
  const handleToggle = () => {
    toggleTheme();
    
    // Force theme application immediately
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const html = document.documentElement;
        const currentTheme = theme === 'dark' ? 'light' : 'dark';
        
        if (currentTheme === 'dark') {
          html.classList.add('dark');
          html.classList.remove('light');
        } else {
          html.classList.add('light');  
          html.classList.remove('dark');
        }
        
        html.setAttribute('data-theme', currentTheme);
      }
    }, 10);
  };

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="p-2 rounded-lg bg-zenith-card border border-zenith-border">
        <div className="h-5 w-5 animate-pulse bg-zenith-hover rounded"></div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-zenith-card dark:bg-gray-800 border border-zenith-border dark:border-gray-600 hover:bg-zenith-hover dark:hover:bg-gray-700 transition-all duration-200 group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
      )}
    </button>
  );
}
