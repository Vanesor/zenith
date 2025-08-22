"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { 
  Mail, 
  CheckCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Clock,
  Shield
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = searchParams.get('type') || 'verification'; // verification, reset, 2fa

  useEffect(() => {
    if (!email) {
      router.push('/login');
      return;
    }

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, router]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = type === 'reset' ? '/api/auth/verify-reset-otp' : '/api/auth/verify-email-otp';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setShowConfetti(true);
        
        toast.success('Email verified successfully! 🎉', {
          duration: 3000,
          position: 'top-center',
        });

        setTimeout(() => {
          if (type === 'reset') {
            router.push(`/reset-password?token=${result.token}`);
          } else {
            router.push('/login?verified=true');
          }
        }, 2000);
      } else {
        toast.error(result.error || 'Invalid verification code');
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setCanResend(false);
    setCountdown(60);

    try {
      const endpoint = type === 'reset' ? '/api/auth/resend-reset-otp' : '/api/auth/resend-email-otp';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success('New verification code sent! 📧');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        const result = await response.json();
        toast.error(result.error || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    }

    // Restart countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const getTitle = () => {
    switch (type) {
      case 'reset': return 'Verify Reset Code';
      case '2fa': return 'Two-Factor Authentication';
      default: return 'Verify Your Email';
    }
  };

  const getSubtitle = () => {
    switch (type) {
      case 'reset': return 'Enter the code sent to reset your password';
      case '2fa': return 'Enter your 2FA code to continue';
      default: return 'Enter the 6-digit code sent to your email';
    }
  };

  return (
    <AuthLayout 
      title={isVerified ? "Email Verified!" : getTitle()}
      subtitle={isVerified ? "Redirecting you now..." : getSubtitle()}
      backLink="/login"
    >
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B']}
        />
      )}

      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isVerified 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}
          >
            {isVerified ? (
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            ) : type === '2fa' ? (
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            ) : (
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            )}
          </motion.div>

          {!isVerified && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Code sent to:
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {email}
              </p>
            </div>
          )}
        </div>

        {!isVerified ? (
          <>
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-mono border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                  maxLength={1}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>

            <Button
              onClick={() => handleVerifyOTP()}
              disabled={isLoading || otp.some(digit => !digit)}
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <Card className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Didn't receive the code?
                    </span>
                  </div>
                  <Button
                    onClick={handleResendOTP}
                    disabled={!canResend}
                    variant="ghost"
                    size="sm"
                  >
                    {!canResend ? (
                      `Resend in ${countdown}s`
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Resend
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button
                variant="ghost"
                asChild
                className="text-sm"
              >
                <button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </button>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            </motion.div>
            <p className="text-gray-600 dark:text-gray-400">
              {type === 'reset' 
                ? 'Redirecting to password reset...' 
                : 'Redirecting to login...'}
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
