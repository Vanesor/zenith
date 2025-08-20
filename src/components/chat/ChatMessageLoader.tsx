'use client';

import { motion } from 'framer-motion';

interface ChatMessageLoaderProps {
  message?: string;
}

export function ChatMessageLoader({ message = 'Loading messages...' }: ChatMessageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      {/* Message bubbles animation */}
      <div className="relative w-20 h-16 mb-4">
        {/* Left bubble */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ 
            x: [-20, -10, -20],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute left-0 top-6 bg-gray-700 h-8 w-12 rounded-xl rounded-bl-none"
        />
        
        {/* Right bubble */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ 
            x: [20, 10, 20],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 1.8, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute right-0 top-2 bg-college-primary h-10 w-16 rounded-xl rounded-br-none"
        />
        
        {/* Middle bubble */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute left-6 top-14 bg-gray-600 h-8 w-12 rounded-xl rounded-bl-none"
        />
      </div>
      
      {/* Typing dots */}
      <div className="flex space-x-2 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-2.5 h-2.5 bg-college-primary rounded-full"
          />
        ))}
      </div>
      
      {/* Loading message */}
      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-gray-300 font-medium text-sm"
      >
        {message}
      </motion.p>
    </div>
  );
}
