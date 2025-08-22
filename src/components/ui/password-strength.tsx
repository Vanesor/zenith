'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, X } from 'lucide-react'

interface PasswordStrengthProps {
  password: string
  requirements: {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    number: boolean
    special: boolean
  }
  score: number
}

export function PasswordStrength({ password, requirements, score }: PasswordStrengthProps) {
  if (!password) return null

  const getStrengthColor = () => {
    if (score <= 2) return 'from-red-500 to-red-600'
    if (score <= 3) return 'from-yellow-500 to-orange-500'
    if (score <= 4) return 'from-blue-500 to-blue-600'
    return 'from-green-500 to-green-600'
  }

  const getStrengthText = () => {
    if (score <= 2) return 'Weak'
    if (score <= 3) return 'Fair'
    if (score <= 4) return 'Good'
    return 'Strong'
  }

  const getStrengthIcon = () => {
    if (score <= 2) return '😰'
    if (score <= 3) return '😐'
    if (score <= 4) return '😊'
    return '🔒'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 mt-3"
    >
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Password Strength
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs">{getStrengthIcon()}</span>
            <span className={`text-xs font-semibold ${
              score <= 2 ? 'text-red-600 dark:text-red-400' :
              score <= 3 ? 'text-yellow-600 dark:text-yellow-400' :
              score <= 4 ? 'text-blue-600 dark:text-blue-400' :
              'text-green-600 dark:text-green-400'
            }`}>
              {getStrengthText()}
            </span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 5) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getStrengthColor()} rounded-full shadow-sm`}
          />
        </div>
      </div>
      
      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {Object.entries(requirements).map(([key, met]) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`flex items-center gap-2 transition-colors ${
              met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            >
              {met ? (
                <CheckCircle2 className="h-3 w-3 text-green-500" />
              ) : (
                <X className="h-3 w-3 text-gray-300 dark:text-gray-600" />
              )}
            </motion.div>
            <span className="font-medium">
              {key === 'length' && 'At least 8 characters'}
              {key === 'lowercase' && 'One lowercase letter (a-z)'}
              {key === 'uppercase' && 'One uppercase letter (A-Z)'}
              {key === 'number' && 'One number (0-9)'}
              {key === 'special' && 'One special character (@$!%*?&)'}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
