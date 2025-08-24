"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface UniversalLoaderProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'detailed';
}

export function UniversalLoader({ 
  fullScreen = true, 
  message = "Loading...",
  size = 'md',
  variant = 'default'
}: UniversalLoaderProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" 
    : "w-full h-full";

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { logo: 'w-8 h-8', dots: 'w-2 h-2', spacing: 'space-y-2', padding: 'p-4' };
      case 'md':
        return { logo: 'w-16 h-16', dots: 'w-3 h-3', spacing: 'space-y-4', padding: 'p-8' };
      case 'lg':
        return { logo: 'w-24 h-24', dots: 'w-4 h-4', spacing: 'space-y-6', padding: 'p-12' };
      default:
        return { logo: 'w-16 h-16', dots: 'w-3 h-3', spacing: 'space-y-4', padding: 'p-8' };
    }
  };

  const sizeClasses = getSizeClasses();

  if (variant === 'minimal') {
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        <div className="flex items-center space-x-3">
          <Loader2 className={`${sizeClasses.logo} animate-spin text-blue-600`} />
          <span className="text-gray-600 dark:text-gray-300 font-medium">{message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col items-center ${sizeClasses.spacing} ${sizeClasses.padding}`}
      >
        {/* Zenith logo loader */}
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
            className={`${sizeClasses.logo} bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg`}
          >
            <motion.div
              animate={{ 
                rotate: -360,
                scale: [0.8, 1, 0.8]
              }}
              transition={{
                rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="flex items-center justify-center w-full h-full"
            >
              <img 
                src="/zenithlogo.png" 
                alt="Zenith Logo" 
                className="w-3/4 h-3/4 object-contain"
              />
            </motion.div>
          </motion.div>
          
          {/* Spinning ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-xl`}
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
              className={`${sizeClasses.dots} bg-blue-500 rounded-full`}
            />
          ))}
        </div>

        {/* Loading message */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-gray-600 dark:text-gray-300 font-medium text-center"
        >
          {message}
        </motion.p>

        {/* Paperpal-style brand - only show in detailed variant */}
        {variant === 'detailed' && (
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Zenith - CS Student Portal
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              St. Vincent Pallotti College of Engineering and Technology
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Page transition loader
export function PageLoader({ message = "Loading page..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <UniversalLoader message={message} variant="detailed" />
    </div>
  );
}

// Component loader for smaller sections
export function ComponentLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <UniversalLoader 
        message={message} 
        fullScreen={false} 
        size="sm" 
        variant="minimal" 
      />
    </div>
  );
}

// Content loader for sections
export function SectionLoader({ message = "Loading content..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <UniversalLoader 
        message={message} 
        fullScreen={false} 
        size="md" 
        variant="default" 
      />
    </div>
  );
}

// Inline loader for buttons and small components
export function InlineLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      <span className="text-sm text-gray-500 dark:text-gray-400">{message}</span>
    </div>
  );
}
