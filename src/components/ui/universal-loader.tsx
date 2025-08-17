"use client"

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Sparkles, Zap, Star, Rocket } from 'lucide-react'

interface UniversalLoaderProps {
  isVisible: boolean
  texts?: string[]
  duration?: number
  onComplete?: () => void
}

const defaultTexts = [
  "Welcome to Zenith...",
  "Loading your experience...", 
  "Preparing something amazing...",
  "Almost ready...",
  "Get ready to shine..."
]

export default function UniversalLoader({ 
  isVisible, 
  texts = defaultTexts, 
  duration = 4000,
  onComplete 
}: UniversalLoaderProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [showLogo, setShowLogo] = useState(false)

  useEffect(() => {
    if (!isVisible) return

    // Show logo after a brief delay
    const logoTimer = setTimeout(() => setShowLogo(true), 300)

    // Cycle through texts
    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length)
    }, duration / texts.length)

    // Complete the loader
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete()
    }, duration)

    return () => {
      clearTimeout(logoTimer)
      clearInterval(textInterval)
      clearTimeout(completeTimer)
    }
  }, [isVisible, texts, duration, onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 backdrop-blur-sm"
      >

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo container with simple entrance */}
          <AnimatePresence>
            {showLogo && (
              <motion.div
                initial={{ 
                  scale: 0,
                  opacity: 0
                }}
                animate={{ 
                  scale: 1,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut",
                  type: "spring",
                  bounce: 0.3
                }}
                className="relative mb-8"
              >
                {/* Simple logo with gentle glow */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(59, 130, 246, 0.3)',
                      '0 0 30px rgba(147, 51, 234, 0.4)',
                      '0 0 20px rgba(59, 130, 246, 0.3)'
                    ]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <Image
                    src="/zenithlogo.png"
                    alt="Zenith"
                    width={60}
                    height={60}
                    className="object-contain filter drop-shadow-lg"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading text with typewriter effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="text-center"
          >
            <AnimatePresence mode="wait">
              <motion.h2
                key={currentTextIndex}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent"
              >
                {texts[currentTextIndex]}
              </motion.h2>
            </AnimatePresence>

            {/* Animated progress dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-white/60 rounded-full"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Brand text */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <motion.h1
              animate={{ 
                textShadow: [
                  '0 0 20px rgba(255, 255, 255, 0.5)',
                  '0 0 30px rgba(59, 130, 246, 0.8)',
                  '0 0 20px rgba(255, 255, 255, 0.5)'
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-4xl md:text-6xl font-extrabold text-white tracking-wider"
              style={{
                background: 'linear-gradient(45deg, #ffffff, #60a5fa, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              ZENITH
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 0.6 }}
              className="text-white/80 text-lg mt-2 tracking-widest font-light"
            >
              Where Excellence Meets Innovation
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
