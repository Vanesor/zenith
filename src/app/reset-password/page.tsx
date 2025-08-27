"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle,
  Loader2,
  KeyRound,
  Shield
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const password = watch("password", "");

  useEffect(() => {
    if (!token) {
      router.push('/forgot-password');
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          setTokenValid(false);
          toast.error('Reset link is invalid or expired');
        }
      } catch (error) {
        setTokenValid(false);
        toast.error('Failed to verify reset link');
      }
    };

    verifyToken();
  }, [token, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsReset(true);
        setShowConfetti(true);
        
        toast.success('Password reset successful! 🎉', {
          duration: 3000,
          position: 'top-center',
        });

        setTimeout(() => {
          router.push('/login?reset=true');
        }, 2000);
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
    if (strength <= 3) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    if (strength <= 4) return { level: 'good', color: 'bg-blue-500', text: 'Good' };
    return { level: 'strong', color: 'bg-green-500', text: 'Strong' };
  };

  if (!tokenValid) {
    return (
      <AuthLayout 
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or has expired"
        backLink="/forgot-password"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-4"
          >
            <KeyRound className="w-8 h-8 text-red-600" />
          </motion.div>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <p className="text-sm text-red-800">
                The password reset link you're using is either invalid or has expired. 
                Please request a new password reset link.
              </p>
            </CardContent>
          </Card>

          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full h-12"
          >
            Request New Reset Link
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title={isReset ? "Password Reset!" : "Set New Password"}
      subtitle={isReset ? "Your password has been updated successfully" : "Create a strong new password for your account"}
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

      {!isReset ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4"
            >
              <Shield className="w-8 h-8 text-blue-600" />
            </motion.div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                className="h-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zenith-muted hover:text-zenith-secondary transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zenith-secondary">
                    Password strength:
                  </span>
                  <span className={`text-sm font-medium ${
                    getPasswordStrength(password).level === 'weak' ? 'text-red-600' :
                    getPasswordStrength(password).level === 'medium' ? 'text-yellow-600' :
                    getPasswordStrength(password).level === 'good' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {getPasswordStrength(password).text}
                  </span>
                </div>
                <div className="w-full bg-zenith-hover rounded-full h-2">
                  <div
                    className={`${getPasswordStrength(password).color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(getPasswordStrength(password).level === 'weak' ? 20 : 
                      getPasswordStrength(password).level === 'medium' ? 40 :
                      getPasswordStrength(password).level === 'good' ? 60 : 80)}%` }}
                  ></div>
                </div>
              </motion.div>
            )}

            <div className="relative">
              <Input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                icon={<Lock className="w-4 h-4" />}
                error={errors.confirmPassword?.message}
                className="h-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zenith-muted hover:text-zenith-secondary transition-colors z-10"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Password Requirements:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>At least 8 characters</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>One uppercase letter</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>One number</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating Password...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-zenith-secondary">
              Your password has been successfully updated!
            </p>
            <p className="text-sm text-zenith-muted">
              Redirecting to login page...
            </p>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
