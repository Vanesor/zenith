"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  backLink?: string
  showBackButton?: boolean
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  backLink = "/", 
  showBackButton = true 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-main flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        {showBackButton && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link href={backLink}>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-secondary hover:text-primary p-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-2xl border border-white/30 dark:border-gray-700/50 p-8 md:p-10 relative overflow-hidden"
        >
          {/* Subtle gradient overlay for light mode */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/30 dark:from-transparent dark:to-transparent rounded-3xl"></div>
          
          <div className="relative z-10">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: -10 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  y: 0,
                  rotate: [0, 3, -3, 0]
                }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.5,
                  rotate: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg border-2 border-blue-500/30 dark:border-purple-500/30 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))'
                }}
              >
                <span className="text-blue-600 dark:text-blue-400 text-2xl font-bold">Z</span>
              </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold text-primary mb-2"
            >
              {title}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-secondary text-lg"
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Form content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {children}
          </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400"
        >
          © 2025 Zenith. All rights reserved.
        </motion.div>
      </div>
    </div>
  )
}

// Add custom CSS for grid pattern
const styles = `
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  .dark .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
