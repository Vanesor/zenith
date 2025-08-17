"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import Confetti from "react-confetti";
import Image from "next/image";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signIn } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'app' | 'email'>('app');
  const [userEmail, setUserEmail] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('registered') === 'true') {
      toast.success('Account created successfully! Please sign in.', {
        duration: 4000,
        position: 'top-center',
        icon: '🎉',
      });
    }
    if (urlParams.get('expired') === 'true') {
      setSessionExpired(true);
      toast.error('Your session has expired. Please sign in again.', {
        duration: 4000,
        position: 'top-center',
      });
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.requiresTwoFactor) {
          setShowTwoFactor(true);
          setUserEmail(data.email); // Store email for verification options
          toast.success('Please enter your 2FA code', {
            icon: '🔐',
          });
        } else {
          setLoginSuccess(true);
          setShowConfetti(true);
          toast.success('Welcome back! 🎉', {
            duration: 3000,
            icon: '👋',
          });
          await login(result.user, result.token);
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      const formData = getValues();
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: twoFactorCode,
          method: verificationMethod, // Include verification method
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLoginSuccess(true);
        setShowConfetti(true);
        toast.success('Welcome back! 🎉', {
          duration: 3000,
          icon: '🔓',
        });
        await login(result.user, result.token);
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setOAuthLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setOAuthLoading(null);
    }
  };

  // Utility function to mask email address
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 3) {
      return `${localPart[0]}**@${domain}`;
    }
    return `${localPart.substring(0, 3)}***@${domain}`;
  };

  // Handle email verification for 2FA
  const handleEmailVerification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/send-email-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await response.json();

      if (response.ok) {
        setEmailVerificationSent(true);
        toast.success('Verification code sent to your email', {
          icon: '📧',
        });
      } else {
        toast.error(result.error || 'Failed to send verification email');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']}
        />
      )}

      <div className="w-full max-w-lg relative z-10">
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

        {/* Main content card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-3xl border border-white/40 dark:border-gray-700/60 p-10 md:p-12 relative overflow-hidden min-h-[650px]"
        >
          {/* Subtle gradient overlay for enhanced depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-blue-50/40 dark:from-gray-900/40 dark:to-purple-900/20 rounded-3xl"></div>
          
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
                {showTwoFactor ? "Two-Factor Authentication" : "Welcome Back"}
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-gray-600 dark:text-gray-400 text-lg font-medium"
              >
                {showTwoFactor ? "Enter the verification code from your app" : "Sign in to your Zenith account"}
              </motion.p>
            </div>

            {/* Session expired warning */}
            {sessionExpired && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">Your session has expired. Please sign in again.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Main Form Content */}
            {!showTwoFactor ? (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="Email address"
                        icon={<Mail className="w-5 h-5" />}
                        error={errors.email?.message}
                        className="h-14 text-base bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 rounded-2xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                    
                    <div className="relative">
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        icon={<Lock className="w-5 h-5" />}
                        error={errors.password?.message}
                        className="h-14 text-base pr-12 bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 rounded-2xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        {...register("rememberMe")}
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 transition-colors"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors font-medium">
                        Remember me
                      </span>
                    </label>
                    
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium hover:no-underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className="w-full h-14 text-base relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    variant={loginSuccess ? "default" : "default"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    <div className="relative z-10 flex items-center justify-center">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-3" />
                          Signing in...
                        </>
                      ) : loginSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                          Success!
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </Button>
                </form>

                <div className="mt-10">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-6 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("google")}
                      disabled={oauthLoading === "google"}
                      className="h-14 relative overflow-hidden group bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        {oauthLoading === "google" ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-300" />
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">Google</span>
                          </>
                        )}
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("github")}
                      disabled={oauthLoading === "github"}
                      className="h-14 relative overflow-hidden group bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                      <div className="relative z-10 flex items-center justify-center">
                        {oauthLoading === "github" ? (
                          <Loader2 className="w-5 h-5 animate-spin text-gray-600 dark:text-gray-300" />
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-3" fill="#24292e" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="text-gray-700 dark:text-gray-300 font-medium">GitHub</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link 
                      href="/register" 
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:no-underline font-medium transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <form onSubmit={handleTwoFactorSubmit} className="space-y-8">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6"
                  >
                    <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {verificationMethod === 'app' 
                      ? 'Enter the 6-digit code from your authenticator app'
                      : `Enter the verification code sent to ${maskEmail(userEmail)}`
                    }
                  </p>
                </div>

                {/* Verification Method Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800/50 rounded-xl p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod('app');
                      setTwoFactorCode('');
                      setEmailVerificationSent(false);
                    }}
                    className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      verificationMethod === 'app'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Authenticator App
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationMethod('email');
                      setTwoFactorCode('');
                      setEmailVerificationSent(false);
                    }}
                    className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      verificationMethod === 'email'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </button>
                </div>

                {/* Email verification section */}
                {verificationMethod === 'email' && !emailVerificationSent && (
                  <div className="text-center mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      We'll send a verification code to your email address
                    </p>
                    <Button
                      type="button"
                      onClick={handleEmailVerification}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Code to {maskEmail(userEmail)}
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Code input (show for app method or after email sent) */}
                {(verificationMethod === 'app' || emailVerificationSent) && (
                  <>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl tracking-widest font-mono h-16 bg-white/80 dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 rounded-2xl focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
                      maxLength={6}
                      required
                    />

                    <Button
                      type="submit"
                      disabled={isLoading || twoFactorCode.length !== 6}
                      className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-3" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-3" />
                          Verify & Sign In
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Resend option for email verification */}
                {verificationMethod === 'email' && emailVerificationSent && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={handleEmailVerification}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:no-underline font-medium"
                    >
                      Resend Code
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTwoFactor(false);
                      setVerificationMethod('app');
                      setTwoFactorCode('');
                      setEmailVerificationSent(false);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors hover:no-underline font-medium"
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>

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
