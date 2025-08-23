'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import Confetti from 'react-confetti'
import Image from 'next/image'
import Captcha, { CaptchaRef } from '@/components/ui/Captcha'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Sparkles,
  Trophy,
  Users,
  Github,
  Loader2,
  ArrowRight,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

// Enhanced registration schema with comprehensive validation
const registerSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  
  phone: z.string()
    .min(10, 'Mobile number must be exactly 10 digits')
    .max(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[1-9][0-9]{9}$/, 'Mobile number must be exactly 10 digits, contain only numbers, and cannot start with 0'),
  
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 16 && age <= 100
    }, 'You must be between 16 and 100 years old'),
  
  selectedClub: z.string()
    .min(1, 'Please select a club preference'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  
  agreeToTerms: z.boolean()
    .refine(val => val === true, 'You must accept the terms and conditions'),
  
  marketingOptIn: z.boolean().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

// Enhanced club options with better descriptions
const clubOptions = [
  { 
    id: 'none', 
    name: 'No Club Preference', 
    description: 'I prefer not to join any club at this time', 
    color: 'from-gray-500 to-slate-500',
    icon: '🚫'
  },
  { 
    id: 'ascend', 
    name: 'Ascend (Coding)', 
    description: 'Programming & Technology Excellence', 
    color: 'from-blue-500 to-cyan-500',
    icon: '💻'
  },
  { 
    id: 'aster', 
    name: 'Aster (Soft Skills)', 
    description: 'Communication & Leadership Development', 
    color: 'from-purple-500 to-pink-500',
    icon: '🗣️'
  },
  { 
    id: 'achievers', 
    name: 'Achievers (Higher Studies)', 
    description: 'Graduate Preparation & Academic Excellence', 
    color: 'from-green-500 to-emerald-500',
    icon: '🎓'
  },
  { 
    id: 'altogether', 
    name: 'Altogether (Holistic Growth)', 
    description: 'Wellness & Comprehensive Life Skills', 
    color: 'from-violet-500 to-indigo-500',
    icon: '🌟'
  },
]

// Password strength calculation
const calculatePasswordStrength = (password: string) => {
  let score = 0
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  }
  
  Object.values(requirements).forEach(met => {
    if (met) score++
  })
  
  return { score, requirements }
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null)
  const [captchaValid, setCaptchaValid] = useState(false)
  const captchaRef = useRef<CaptchaRef>(null)
  const { theme, resolvedTheme } = useTheme()
  const totalSteps = 3
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    trigger,
    setValue
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  })

  const password = watch('password', '')
  const confirmPassword = watch('confirmPassword', '')
  const { score: passwordScore, requirements } = calculatePasswordStrength(password)

  // Re-validate confirm password when password changes
  useEffect(() => {
    if (confirmPassword) {
      trigger('confirmPassword')
    }
  }, [password, confirmPassword, trigger])

  const getPasswordStrengthColor = () => {
    if (passwordScore <= 2) return 'bg-red-500'
    if (passwordScore <= 3) return 'bg-yellow-500'
    if (passwordScore <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordScore <= 2) return 'Weak'
    if (passwordScore <= 3) return 'Fair'
    if (passwordScore <= 4) return 'Good'
    return 'Strong'
  }

  const onSubmit = useCallback(async (data: RegisterFormData) => {
    setIsSubmitting(true)
    
    // Validate captcha when form is submitted
    const isCaptchaValid = captchaRef.current?.validate();
    
    if (!isCaptchaValid) {
      toast.error('CAPTCHA verification failed. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
      setIsSubmitting(false)
      return;
    }

    console.log('CAPTCHA passed, proceeding with registration...');
    
    try {
      // Prepare registration data - send all required fields
      const registrationData = {
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || null,
        dateOfBirth: data.dateOfBirth || null,
        selectedClub: data.selectedClub || 'none',
      };
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Account created successfully! Welcome to Zenith! 🎉', {
          duration: 4000,
          icon: '🚀',
          position: 'top-center',
        })
        
        setShowConfetti(true)
        
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000)
        
        // Redirect after success animation
        setTimeout(() => {
          router.push('/login?registered=true')
        }, 2000)
      } else {
        toast.error(result.error || 'Registration failed. Please try again.', {
          duration: 4000,
          position: 'top-center',
        })
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Network error. Please try again.', {
        duration: 4000,
        position: 'top-center',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [router])

  const handleOAuthLogin = async (provider: string) => {
    setOAuthLoading(provider)
    try {
      await signIn(provider, { callbackUrl: "/dashboard" })
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`)
    } finally {
      setOAuthLoading(null)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step: number): (keyof RegisterFormData)[] => {
    switch (step) {
      case 1:
        return ['firstName', 'lastName', 'email', 'phone']
      case 2:
        return ['dateOfBirth', 'selectedClub']
      case 3:
        return ['password', 'confirmPassword', 'agreeToTerms']
      default:
        return []
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Personal Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let's start with your basic details
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  icon={<User className="w-5 h-5" />}
                  {...register('firstName')}
                  error={errors.firstName?.message}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Last Name *
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  icon={<User className="w-5 h-5" />}
                  {...register('lastName')}
                  error={errors.lastName?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                icon={<Mail className="w-5 h-5" />}
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your 10-digit mobile number"
                  className="pl-10"
                  maxLength={10}
                  onInput={(e) => {
                    // Only allow numbers
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')
                  }}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone.message}
                </p>
              )}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <GraduationCap className="h-12 w-12 text-purple-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Academic Information
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tell us about your interests and background
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of Birth *
              </label>
              <div className="relative isolate">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <input
                  id="dateOfBirth"
                  type="date"
                  className="flex h-14 w-full rounded-2xl border border-gray-200/80 bg-white/80 px-6 py-4 pl-10 text-base text-gray-900 dark:text-gray-100 ring-offset-white file:border-0 file:bg-transparent file:text-base file:font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:focus-visible:ring-blue-400/20 focus-visible:ring-offset-2 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700/80 dark:bg-gray-800/80 dark:ring-offset-gray-950 transition-all duration-300 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 shadow-sm backdrop-blur-sm caret-blue-600 dark:caret-blue-400 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  {...register('dateOfBirth')}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Choose Your Club Interest *
              </label>
              
              <div className="grid gap-3">
                {clubOptions.map((club) => (
                  <label
                    key={club.id}
                    className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      watch('selectedClub') === club.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      value={club.id}
                      {...register('selectedClub')}
                      className="sr-only"
                    />
                    
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${club.color} flex items-center justify-center mr-4 text-lg`}>
                      {club.icon}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{club.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{club.description}</p>
                    </div>
                    
                    {watch('selectedClub') === club.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    )}
                  </label>
                ))}
              </div>
              
              {errors.selectedClub && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.selectedClub.message}
                </p>
              )}
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Security & Privacy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create a secure password and accept our terms
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  icon={<Lock className="w-5 h-5" />}
                  className="pr-12"
                  {...register('password')}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-20 bg-transparent p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(requirements).map(([key, met]) => (
                      <div key={key} className={`flex items-center gap-1 ${met ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle2 className={`h-3 w-3 ${met ? 'text-green-600' : 'text-gray-300'}`} />
                        {key === 'length' && '8+ characters'}
                        {key === 'lowercase' && 'Lowercase letter'}
                        {key === 'uppercase' && 'Uppercase letter'}
                        {key === 'number' && 'Number'}
                        {key === 'special' && 'Special character'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="pl-10 pr-10"
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  {...register('agreeToTerms')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 mt-1"
                />
                <label htmlFor="agreeToTerms" className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                    Privacy Policy
                  </Link>
                  *
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.agreeToTerms.message}
                </p>
              )}

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="marketingOptIn"
                  {...register('marketingOptIn')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 mt-1"
                />
                <label htmlFor="marketingOptIn" className="text-sm leading-5 text-gray-600 dark:text-gray-400">
                  I would like to receive updates about events, activities, and opportunities from Zenith
                </label>
              </div>

              {/* Security Verification */}
              <div className="mt-6">
                <Captcha
                  ref={captchaRef}
                  onVerify={setCaptchaValid}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 dark:from-purple-400/30 dark:to-pink-400/30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 dark:from-blue-400/30 dark:to-cyan-400/30 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-400/15 to-purple-400/15 dark:from-indigo-400/20 dark:to-purple-400/20 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <div className="w-full max-w-2xl relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </motion.div>

        {/* Logo and branding - outside the card */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: -20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              delay: 0.2, 
              duration: 0.6,
              rotate: {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-xl border-3 border-blue-500/20 dark:border-purple-500/30 bg-white/20 dark:bg-gray-800/20 backdrop-blur-md overflow-hidden"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))'
            }}
          >
            <Image
              src="/zenithlogo.png"
              alt="Zenith Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-purple-600 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent mb-3"
          >
            Join Zenith
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-400 text-lg font-medium"
          >
            Create your account and become part of our vibrant community
          </motion.p>
        </div>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}

      <Card className="w-full max-w-3xl mx-auto bg-gradient-to-br from-white/95 to-blue-50/90 dark:from-gray-900/95 dark:to-gray-800/90 backdrop-blur-md border-blue-200/50 dark:border-gray-700/50 shadow-2xl shadow-blue-500/10 dark:shadow-purple-500/10">
        <CardHeader className="text-center space-y-1 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-t-lg border-b border-blue-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-3 mb-3">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="h-7 w-7 text-blue-500 dark:text-blue-400" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            >
              <Sparkles className="h-7 w-7 text-purple-500 dark:text-purple-400" />
            </motion.div>
          </div>
          <CardDescription className="text-base text-gray-600 dark:text-gray-300 font-medium">
            Step {currentStep} of {totalSteps}: Complete all steps to join Zenith
          </CardDescription>
          
          {/* Enhanced Progress Bar */}
          <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-full h-3 mt-6 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full shadow-lg"
              style={{
                boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)"
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-8 bg-gradient-to-b from-transparent to-blue-50/30 dark:to-gray-800/30">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex items-center gap-2"
                >
                  ← Previous
                </Button>
              )}
              
              <div className="flex-1" />
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>

          {/* OAuth Options - Only show on first step */}
          {currentStep === 1 && (
            <>
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                      Or sign up with
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin("google")}
                    disabled={oauthLoading === "google"}
                    className="h-12 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {oauthLoading === "google" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google
                        </>
                      )}
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthLogin("github")}
                    disabled={oauthLoading === "github"}
                    className="h-12 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {oauthLoading === "github" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="#24292e" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          GitHub
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

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
    
    {/* CSS for grid pattern */}
    <style jsx>{`
      .bg-grid-pattern {
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      
      :global(.dark) .bg-grid-pattern {
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
      }
    `}</style>
  </div>
  );
}
