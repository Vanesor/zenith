'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedPlaygroundIconProps {
  className?: string;
  size?: number;
}

export const AnimatedPlaygroundIcon: React.FC<AnimatedPlaygroundIconProps> = ({ 
  className = "w-5 h-5", 
  size = 20 
}) => {
  return (
    <motion.div
      className={className}
      initial={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-current"
      >
        {/* Code brackets */}
        <motion.path
          d="M8 6L2 12L8 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
        <motion.path
          d="M16 6L22 12L16 18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        />
        
        {/* Play button in center */}
        <motion.circle
          cx="12"
          cy="12"
          r="3"
          fill="currentColor"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        />
        <motion.path
          d="M11 10L13.5 12L11 14V10Z"
          fill="white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        />
        
        {/* Animated dots representing code execution */}
        <motion.circle
          cx="12"
          cy="4"
          r="1"
          fill="currentColor"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0,
          }}
        />
        <motion.circle
          cx="16"
          cy="4"
          r="1"
          fill="currentColor"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.3,
          }}
        />
        <motion.circle
          cx="8"
          cy="4"
          r="1"
          fill="currentColor"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 0.6,
          }}
        />
      </motion.svg>
    </motion.div>
  );
};

export default AnimatedPlaygroundIcon;
