"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  KeyRound,
  Clock
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailSent(true);
        setCanResend(false);
        setCountdown(60);
        
        toast.success('Password reset email sent! 📧', {
          duration: 4000,
          position: 'top-center',
        });

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
      } else {
        toast.error(result.error || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    const formData = getValues();
    onSubmit(formData);
  };

  return (
    <AuthLayout 
      title={emailSent ? "Check Your Email" : "Forgot Password"}
      subtitle={emailSent ? "We've sent you a password reset link" : "Enter your email to reset your password"}
      backLink="/login"
    >
      {!emailSent ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4"
            >
              <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't worry! It happens to everyone. Enter your email below to recover your password.
            </p>
          </div>

          <Input
            {...register("email")}
            type="email"
            placeholder="Enter your email address"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            className="h-12"
          />

          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Reset Email...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Reset Email
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      ) : (
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
          >
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </motion.div>

          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a password reset link to:
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {getValues().email}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              The link will expire in 15 minutes for security purposes.
            </p>
          </div>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Didn't receive the email?
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Check your spam folder or try again
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={!canResend}
              variant="outline"
              className="w-full h-12"
            >
              {!canResend ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Email
                </>
              )}
            </Button>

            <Button
              asChild
              variant="ghost"
              className="w-full h-12"
            >
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </Button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
