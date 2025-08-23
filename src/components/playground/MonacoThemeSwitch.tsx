'use client';

import { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MonacoThemeSwitchProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const themes = [
  { value: 'vs-dark', label: 'VS Dark', description: 'Default dark theme' },
  { value: 'vs-dark-plus', label: 'VS Dark+', description: 'Enhanced dark theme' },
  { value: 'vs', label: 'VS Light', description: 'Default light theme' },
  { value: 'monokai', label: 'Monokai', description: 'Classic Monokai theme' },
  { value: 'github', label: 'GitHub', description: 'GitHub light theme' },
  { value: 'solarized-dark', label: 'Solarized Dark', description: 'Solarized dark theme' },
  { value: 'solarized-light', label: 'Solarized Light', description: 'Solarized light theme' },
];

export function MonacoThemeSwitch({ currentTheme, onThemeChange }: MonacoThemeSwitchProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeInfo = themes.find(theme => theme.value === currentTheme) || themes[0];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-section border border-custom rounded-lg hover:bg-hover transition-all duration-200 text-sm"
        title={`Current theme: ${currentThemeInfo.label}`}
        style={{
          background: `linear-gradient(to right, var(--bg-section), var(--bg-section))`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'var(--border-color)',
          borderImage: currentTheme === 'vs-dark' || currentTheme === 'solarized-dark' || currentTheme === 'monokai' ? 
            'linear-gradient(90deg, #3b82f6, #a855f7) 1' : 'none'
        }}
      >
        <Palette className="w-4 h-4 text-accent" />
        <span className="text-primary font-medium">{currentThemeInfo.label}</span>
        <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-card border border-custom rounded-xl shadow-lg z-20 overflow-hidden"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-secondary uppercase tracking-wide px-3 py-2">
                  Monaco Editor Themes
                </div>
                {themes.map((theme, index) => (
                  <motion.button
                    key={theme.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => {
                      onThemeChange(theme.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group relative ${
                      currentTheme === theme.value
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'text-primary hover:bg-hover border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{theme.label}</div>
                        <div className={`text-xs ${
                          currentTheme === theme.value
                            ? 'text-accent/80'
                            : 'text-muted'
                        }`}>
                          {theme.description}
                        </div>
                      </div>
                      {currentTheme === theme.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center justify-center bg-accent text-white rounded-full w-5 h-5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              
              {/* Theme preview colors */}
              <div className="border-t border-custom p-3 bg-section">
                <div className="text-xs text-muted mb-2">Current theme: <span className="font-medium text-accent">{currentThemeInfo.label}</span></div>
                <div className="flex gap-2 mt-2">
                  {getThemeColors(currentTheme).map((color, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-6 h-6 rounded-full border border-custom shadow-sm"
                      style={{ backgroundColor: color }}
                      title={`Theme color ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get theme colors for preview
function getThemeColors(theme: string): string[] {
  switch (theme) {
    case 'vs-dark':
    case 'vs-dark-plus':
      return ['#1E1E1E', '#569CD6', '#CE9178', '#6A9955', '#B5CEA8'];
    case 'vs':
      return ['#FFFFFF', '#0000FF', '#A31515', '#008000', '#098658'];
    case 'monokai':
      return ['#272822', '#F92672', '#E6DB74', '#75715E', '#AE81FF'];
    case 'github':
      return ['#FFFFFF', '#D73A49', '#032F62', '#6F42C1', '#005CC5'];
    case 'solarized-dark':
      return ['#002B36', '#859900', '#2AA198', '#586E75', '#D33682'];
    case 'solarized-light':
      return ['#FDF6E3', '#859900', '#2AA198', '#93A1A1', '#D33682'];
    default:
      return ['#1E1E1E', '#569CD6', '#CE9178', '#6A9955', '#B5CEA8'];
  }
}
