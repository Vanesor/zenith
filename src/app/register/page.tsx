'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowLeft,
  Check,
  Phone,
  Calendar
} from 'lucide-react';
import { ZenithLogo } from '@/components/ZenithLogo';
import { UnifiedHeader } from '@/components/UnifiedHeader';
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    selectedClub: '', // Changed from interests array to single club selection
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const clubInterests = [
    { id: 'ascend', name: 'Ascend (Coding)', description: 'Programming & Tech' },
    { id: 'aster', name: 'Aster (Soft Skills)', description: 'Communication & Leadership' },
    { id: 'achievers', name: 'Achievers (Higher Studies)', description: 'Graduate Prep' },
    { id: 'altogether', name: 'Altogether (Holistic Growth)', description: 'Wellness & Life Skills' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = 'checked' in e.target ? e.target.checked : false;
    
    // Special handling for phone number - only allow digits and limit to 10
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClubSelect = (clubId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedClub: prev.selectedClub === clubId ? '' : clubId // Toggle selection or clear if same club clicked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    // Phone validation - must be exactly 10 digits
    if (formData.phone.trim()) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Phone number must be exactly 10 digits');
        setIsLoading(false);
        return;
      }
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // Password strength validation
    const hasLower = /[a-z]/.test(formData.password);
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasDigit = /\d/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    
    const strengthScore = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    
    if (strengthScore < 3) {
      setError('Password must contain at least 3 of: lowercase, uppercase, numbers, special characters');
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      // Prepare data in the format expected by the API
      const registrationPayload = {
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        club_id: formData.selectedClub || null, // Use selectedClub instead of interests array
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        selectedClub: formData.selectedClub // Send selected club info
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationPayload),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zenith-main dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      
      {/* College Header */}
      <UnifiedHeader showNavigation={true} />
      
      <div className="flex items-center justify-center p-4 pt-40">{/* Increased padding for college banner + nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-2xl"
        >
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-white mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

        {/* Register Card */}
        <div className="bg-zenith-card dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-zenith-border dark:border-gray-600 transition-colors duration-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <ZenithLogo size="lg" className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-zenith-primary dark:text-white transition-colors duration-200">Join Zenith</h1>
            <p className="text-zenith-secondary dark:text-gray-300 mt-2 transition-colors duration-200">Create your account to get started</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 transition-colors duration-200">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter your first name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone and Date of Birth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2">
                  Phone Number (10 digits)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Enter 10-digit phone number"
                  />
                </div>
                {formData.phone && formData.phone.length !== 10 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 dark:text-red-400 mt-1 transition-colors duration-200"
                  >
                    Phone number must be exactly 10 digits
                  </motion.p>
                )}
                {formData.phone && formData.phone.length === 10 && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center transition-colors duration-200"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Phone number verified: {formData.phone}
                  </motion.p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white transition-colors duration-200"
                  />
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-zenith-muted dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-white" />
                    ) : (
                      <Eye className="h-5 w-5 text-zenith-muted dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-white" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2 transition-colors duration-200">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white placeholder-zenith-muted dark:placeholder-gray-400 transition-colors duration-200"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-zenith-muted dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-white" />
                    ) : (
                      <Eye className="h-5 w-5 text-zenith-muted dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Club Selection */}
            <div>
              <label className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-3 transition-colors duration-200">
                Select a club to join (Choose one)
              </label>
              <p className="text-xs text-zenith-muted dark:text-gray-400 mb-4 transition-colors duration-200">
                You can only join one club. Choose the one that best matches your interests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clubInterests.map((club) => (
                  <div key={club.id} className="relative">
                    <button
                      type="button"
                      onClick={() => handleClubSelect(club.id)}
                      className={`w-full p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                        formData.selectedClub === club.id
                          ? 'border-zenith-primary bg-blue-50 dark:bg-blue-900/20'
                          : 'border-zenith-border dark:border-gray-600 hover:border-zenith-primary dark:hover:border-blue-700 bg-zenith-card dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-zenith-primary dark:text-white text-sm transition-colors duration-200">
                            {club.name}
                          </h4>
                          <p className="text-xs text-zenith-secondary dark:text-gray-400 transition-colors duration-200">
                            {club.description}
                          </p>
                        </div>
                        {formData.selectedClub === club.id && (
                          <Check className="w-5 h-5 text-zenith-primary dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
              {/* Option to not join any club */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => handleClubSelect('')}
                  className={`w-full p-3 text-left border-2 rounded-lg transition-all duration-200 ${
                    formData.selectedClub === ''
                      ? 'border-zenith-primary bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zenith-border dark:border-gray-600 hover:border-zenith-primary dark:hover:border-blue-700 bg-zenith-card dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-zenith-primary dark:text-white text-sm transition-colors duration-200">
                        No Club (for now)
                      </h4>
                      <p className="text-xs text-zenith-secondary dark:text-gray-400 transition-colors duration-200">
                        I'll join a club later
                      </p>
                    </div>
                    {formData.selectedClub === '' && (
                      <Check className="w-5 h-5 text-zenith-primary dark:text-blue-400" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                required
                className="h-4 w-4 text-zenith-primary focus:ring-zenith-primary border-zenith-border dark:border-gray-500 rounded mt-1 bg-zenith-card dark:bg-gray-700 transition-colors duration-200"
              />
              <label htmlFor="agreeToTerms" className="ml-3 text-sm text-zenith-secondary dark:text-gray-300 transition-colors duration-200">
                I agree to the{' '}
                <Link href="/terms" className="text-zenith-primary dark:text-blue-400 hover:text-zenith-accent dark:hover:text-blue-300 transition-colors duration-200">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-zenith-primary dark:text-blue-400 hover:text-zenith-accent dark:hover:text-blue-300 transition-colors duration-200">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zenith-border dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zenith-card dark:bg-gray-800 text-zenith-muted dark:text-gray-400 transition-colors duration-200">
                  Or sign up with
                </span>
              </div>
            </div>
          </div>
          
          {/* OAuth Signup Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
              className="flex items-center justify-center w-full py-2.5 px-4 border border-zenith-border dark:border-gray-600 rounded-lg shadow-sm bg-zenith-card dark:bg-gray-700 hover:bg-zenith-section dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-zenith-primary dark:text-white">Google</span>
            </button>
            <button
              type="button"
              onClick={() => signIn('github', { callbackUrl: '/onboarding' })}
              className="flex items-center justify-center w-full py-2.5 px-4 border border-zenith-border dark:border-gray-600 rounded-lg shadow-sm bg-zenith-card dark:bg-gray-700 hover:bg-zenith-section dark:hover:bg-gray-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2 text-zenith-primary dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="text-zenith-primary dark:text-white">GitHub</span>
            </button>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-zenith-secondary dark:text-gray-400 transition-colors duration-200">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-zenith-primary dark:text-blue-400 hover:text-zenith-accent dark:hover:text-blue-300 font-semibold transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
}
