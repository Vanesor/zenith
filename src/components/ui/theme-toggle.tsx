"use client"

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme()

  if (!isLoaded) {
    return (
      <Button variant="ghost" size="sm" className="w-10 h-10 p-0 rounded-full">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="w-10 h-10 p-0 rounded-full relative overflow-hidden group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      {/* Animated background */}
      <motion.div
        animate={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #1e293b, #334155)' 
            : 'linear-gradient(135deg, #fef3c7, #fcd34d)'
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 opacity-20 group-hover:opacity-30"
      />
      
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 180, opacity: 0 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeInOut",
              type: "spring",
              bounce: 0.3
            }}
            className="flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            ) : (
              <Sun className="h-4 w-4 text-amber-600 group-hover:text-amber-500 transition-colors" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Glow effect */}
      <motion.div
        animate={{
          boxShadow: theme === 'dark' 
            ? '0 0 20px rgba(59, 130, 246, 0.3)' 
            : '0 0 20px rgba(245, 158, 11, 0.3)'
        }}
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
    </Button>
  )
}
