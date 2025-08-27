"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import Image from "next/image";
import { 
  Mail, 
  ArrowLeft, 
  CheckCircle,
  Loader2,
  KeyRound,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    <div className="min-h-screen bg-zenith-main flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/login">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-zenith-secondary hover:text-zenith-primary p-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </motion.div>

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-zenith-card backdrop-blur-xl rounded-3xl shadow-lg border border-zenith-border p-10 md:p-12 relative overflow-hidden min-h-[600px]"
        >
          {/* Subtle gradient overlay for enhanced depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-purple-50/40 rounded-3xl"></div>
          
          <div className="relative z-10">
            {/* Logo and branding */}
            <div className="text-center mb-10">
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
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 shadow-xl border-3 border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-md overflow-hidden"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
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
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
              >
                {emailSent ? "Check Your Email" : "Forgot Password"}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-zenith-secondary text-lg font-medium"
              >
                {emailSent ? "We've sent you a password reset link" : "Enter your email to reset your password"}
              </motion.p>
            </div>

            {/* Main Form Content */}
            {!emailSent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6"
                  >
                    <KeyRound className="w-10 h-10 text-blue-600" />
                  </motion.div>
                  <p className="text-sm text-zenith-secondary">
                    Don't worry! It happens to everyone. Enter your email below to recover your password.
                  </p>
                </div>

                <Input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email address"
                  icon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  className="h-14 text-base px-6 bg-zenith-card border-zenith-border rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-zenith-muted"
                />

                <Button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="w-full h-14 text-base relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                        Sending Reset Email...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-3" />
                        Send Reset Email
                      </>
                    )}
                  </div>
                </Button>

                <div className="text-center mt-8">
                  <p className="text-sm text-zenith-secondary">
                    Remember your password?{" "}
                    <Link 
                      href="/login" 
                      className="text-blue-600 hover:text-blue-700 font-medium transition-colors hover:no-underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-6"
                >
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>

                <div className="space-y-6">
                  <p className="text-zenith-secondary text-lg">
                    We've sent a password reset link to:
                  </p>
                  <p className="font-medium text-zenith-primary text-xl">
                    {getValues().email}
                  </p>
                  <p className="text-sm text-zenith-muted">
                    The link will expire in 15 minutes for security purposes.
                  </p>
                </div>

                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Mail className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div className="text-left">
                        <p className="text-base font-medium text-blue-900">
                          Didn't receive the email?
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Check your spam folder or try again
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Button
                    onClick={handleResend}
                    disabled={!canResend}
                    variant="outline"
                    className="w-full h-14 text-base bg-zenith-card border-zenith-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {!canResend ? (
                      <>
                        <Clock className="w-5 h-5 mr-3" />
                        Resend in {countdown}s
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 mr-3" />
                        Resend Email
                      </>
                    )}
                  </Button>

                  <Button
                    asChild
                    variant="ghost"
                    className="w-full h-14 text-base rounded-2xl transition-all duration-300 hover:bg-zenith-hover"
                  >
                    <Link href="/login">
                      <ArrowLeft className="w-5 h-5 mr-3" />
                      Back to Login
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8 text-sm text-zenith-muted"
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
