'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, CheckCircle, AlertCircle, X, Loader2, Eye, EyeOff } from 'lucide-react';
import EmailVerificationModal from './EmailVerificationModal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifiedOtp, setVerifiedOtp] = useState('');

  const handleSendEmail = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setStep('verify');
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = (type: string) => {
    if (type === 'forgot_password') {
      setStep('reset');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: verifiedOtp,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset state
          setStep('email');
          setEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setSuccess(false);
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6 relative">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center space-x-3">
                {success ? (
                  <CheckCircle className="text-green-300" size={32} />
                ) : (
                  <Lock className="text-white" size={32} />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {step === 'email' ? 'Forgot Password' : 
                     step === 'verify' ? 'Check Your Email' : 
                     'Reset Password'}
                  </h2>
                  <p className="text-pink-100">
                    {step === 'email' ? 'Enter your email to receive a reset code' :
                     step === 'verify' ? 'Verify your identity with the code' :
                     'Create your new password'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Password Reset Successful!
                  </h3>
                  <p className="text-gray-600">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                </motion.div>
              ) : (
                <>
                  {step === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="mb-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                          <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2"
                        >
                          <AlertCircle className="text-red-500" size={20} />
                          <span className="text-red-700 text-sm">{error}</span>
                        </motion.div>
                      )}

                      <button
                        onClick={handleSendEmail}
                        disabled={isLoading || !email}
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Send Reset Code</span>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {step === 'reset' && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="space-y-4 mb-6">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                              id="newPassword"
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2"
                        >
                          <AlertCircle className="text-red-500" size={20} />
                          <span className="text-red-700 text-sm">{error}</span>
                        </motion.div>
                      )}

                      <button
                        onClick={handleResetPassword}
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-700 hover:to-rose-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Resetting...</span>
                          </>
                        ) : (
                          <span>Reset Password</span>
                        )}
                      </button>

                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          💡 Password must be at least 8 characters long and contain a mix of letters, numbers, and special characters.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={step === 'verify'}
        onClose={handleClose}
        email={email}
        type="forgot_password"
        onSuccess={handleOtpVerified}
      />
    </>
  );
}
