"use client"

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import UniversalLoader from './universal-loader'

interface LoadingProps {
  text?: string
  showLogo?: boolean
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
  useUniversalLoader?: boolean
}

export default function Loading({ 
  text = "Loading...", 
  showLogo = false, 
  fullScreen = false,
  size = 'md',
  useUniversalLoader = false
}: LoadingProps) {
  // Use universal loader for full screen loading
  if (fullScreen && useUniversalLoader) {
    return (
      <UniversalLoader 
        isVisible={true}
        texts={[text]}
        duration={0} // Infinite until manually dismissed
      />
    )
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-gradient-to-br from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95 backdrop-blur-md flex items-center justify-center z-50"
    : "flex items-center justify-center p-8"

  return (
    <div className={containerClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-6"
      >
        {showLogo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl flex items-center justify-center">
              <Image
                src="/zenithlogo.png"
                alt="Zenith"
                width={40}
                height={40}
                className="object-contain"
              />
              
              {/* Floating animation */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 10px 30px rgba(59, 130, 246, 0.3)',
                    '0 15px 40px rgba(147, 51, 234, 0.4)',
                    '0 10px 30px rgba(59, 130, 246, 0.3)'
                  ]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-2xl"
              />
            </div>
            
            {/* Orbiting particles */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 3 + i, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, delay: i * 0.5 }
                }}
                style={{
                  transformOrigin: `${40 + (i * 10)}px center`,
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col items-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Loader2 className={`${sizeClasses[size]} text-blue-500`} />
            
            {/* Inner glow */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${sizeClasses[size]} bg-blue-400 rounded-full blur-sm opacity-50`}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            {text}
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex space-x-1"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Background effects for full screen */}
      {fullScreen && !useUniversalLoader && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-indigo-300 to-pink-300 rounded-full blur-3xl"
          />
        </>
      )}
    </div>
  )
}
