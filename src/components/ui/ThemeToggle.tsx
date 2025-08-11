'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

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
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-zenith-card border border-zenith-border hover:bg-zenith-hover transition-all duration-200 group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-zenith-secondary group-hover:text-zenith-brand transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-zenith-secondary group-hover:text-zenith-accent transition-colors" />
      )}
    </button>
  );
}
