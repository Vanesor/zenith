"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface UniversalLoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export function UniversalLoader({ fullScreen = true, message = "Loading..." }: UniversalLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" 
    : "w-full h-full";

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4 p-8"
      >
        {/* Paperpal-style logo loader */}
        <div className="relative">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <span className="text-white font-bold text-2xl">Z</span>
          </motion.div>
          
          {/* Spinning ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-xl"
          />
        </div>

        {/* Loading dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
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
              className="w-3 h-3 bg-blue-500 rounded-full"
            />
          ))}
        </div>

        {/* Loading message */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-gray-600 dark:text-gray-300 font-medium"
        >
          {message}
        </motion.p>

        {/* Paperpal-style brand */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Zenith - CS Student Portal
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            St. Joseph Engineering College
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Page transition loader
export function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <UniversalLoader message="Loading page..." />
    </div>
  );
}

// Component loader for smaller sections
export function ComponentLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
