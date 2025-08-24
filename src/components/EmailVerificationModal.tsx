'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'verification' | 'forgot_password';
  onSuccess?: (type: string) => void;
}

export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  type,
  onSuccess
}: EmailVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpString,
          type
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.(type);
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');

    try {
      const endpoint = type === 'verification' 
        ? '/api/auth/send-verification' 
        : '/api/auth/forgot-password';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setOtp(['', '', '', '', '', '']);
        // Could show a success message here
      } else {
        setError(data.message || 'Failed to resend email');
      }
    } catch (error) {
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
    setOtp(newOtp.slice(0, 6));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center space-x-3">
              {success ? (
                <CheckCircle className="text-green-300" size={32} />
              ) : (
                <Mail className="text-white" size={32} />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {type === 'verification' ? 'Verify Your Email' : 'Reset Your Password'}
                </h2>
                <p className="text-blue-100">
                  {type === 'verification' 
                    ? 'Enter the 6-digit code sent to your email'
                    : 'Enter the verification code to reset your password'
                  }
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
                  {type === 'verification' ? 'Email Verified!' : 'Code Verified!'}
                </h3>
                <p className="text-gray-600">
                  {type === 'verification' 
                    ? 'Your email has been successfully verified.'
                    : 'You can now reset your password.'
                  }
                </p>
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <p className="text-gray-600">
                    We sent a 6-digit code to:
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">{email}</p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center space-x-3 mb-6" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      maxLength={1}
                    />
                  ))}
                </div>

                {/* Error Message */}
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

                {/* Verify Button */}
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || otp.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>

                {/* Resend Button */}
                <div className="text-center mt-4">
                  <p className="text-gray-600 text-sm mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>

                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ The verification code will expire in 15 minutes.
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
