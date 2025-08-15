"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { useAuth } from "@/contexts/AuthContext";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'2fa_app' | 'email_otp' | undefined>();
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();

  // Check for session expired URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('expired') === 'true') {
        setShowSessionExpired(true);
      }
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // If 2FA is required and we're submitting the form again, it means we're submitting the 2FA code
      if (requiresTwoFactor && userId) {
        // Determine the 2FA method correctly
        const verifyMethod = twoFactorMethod === 'email_otp' ? 'email' : 'app';
        console.log('Verifying 2FA with method:', verifyMethod, 'rememberMe:', rememberMe, 'trustDevice:', trustDevice);
        
        const response = await fetch("/api/auth/2fa/unified-verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId: userId,
            otp: twoFactorCode,
            method: verifyMethod,
            rememberMe: rememberMe,
            trustDevice: trustDevice
          }),
        });

        const data = await response.json();

        if (response.ok) {
          login(data.token, data.user);
          router.push("/dashboard");
        } else {
          setError(data.error || "Invalid verification code. Please try again.");
        }
      } else {
        // Normal login flow
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, rememberMe }),
        });

        const data = await response.json();

        if (response.ok) {
          // Check if 2FA is required
          if (data.requiresTwoFactor) {
            setRequiresTwoFactor(true);
            setUserId(data.userId);
            setTwoFactorMethod(data.method || '2fa_app');
          } else {
            // Normal login success
            login(data.token, data.user);
            router.push("/dashboard");
          }
        } else {
          setError(data.error || "Login failed. Please check your credentials.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      
      {/* College Header */}
      <UnifiedHeader showNavigation={true} />
      
      <div className="flex items-center justify-center p-4 pt-40">{/* Increased padding for college banner + nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center text-zenith-primary dark:text-blue-400 hover:text-zenith-primary/90 dark:hover:text-blue-300 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

        {/* Login Card */}
        <div className="bg-zenith-card rounded-2xl shadow-xl p-8 border border-zenith-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <ZenithLogo size="lg" className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-zenith-primary dark:text-white">
              Welcome Back
            </h1>
            <p className="text-zenith-secondary dark:text-zenith-muted mt-2">
              Sign in to your Zenith account
            </p>
          </div>

          {/* Session Expired Message */}
          {showSessionExpired && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-lg mb-6">
              Your session has expired. Please log in again to continue.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">{!requiresTwoFactor ? (
              <>
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-section text-zenith-primary placeholder-zenith-muted"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-10 pr-10 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-section text-zenith-primary placeholder-zenith-muted"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                      ) : (
                        <Eye className="h-5 w-5 text-zenith-muted dark:text-zenith-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-zenith-primary focus:ring-zenith-primary border-zenith-border rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-zenith-secondary"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-zenith-primary hover:text-zenith-primary/90 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* 2FA Verification */}
                <div>
                  <h2 className="text-xl font-semibold text-zenith-primary dark:text-white mb-4">
                    Two-Factor Authentication
                  </h2>
                  
                  {twoFactorMethod === 'email_otp' ? (
                    <div>
                      <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-4">
                        Enter the 6-digit verification code sent to your email.
                      </p>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-zenith-primary dark:text-blue-400 px-4 py-3 rounded-lg mb-6">
                        A verification code has been sent to your email address.
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-4">
                      Enter the 6-digit verification code from your authentication app.
                    </p>
                  )}
                  
                  <label
                    htmlFor="twoFactorCode"
                    className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                  >
                    Verification Code
                  </label>
                  <div className="relative">
                    <input
                      id="twoFactorCode"
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      autoComplete="off"
                      className="block w-full py-3 px-4 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-section text-zenith-primary text-center tracking-widest text-xl font-mono"
                      placeholder="000000"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      autoFocus
                      required
                    />
                  </div>
                  
                  {twoFactorMethod === 'email_otp' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!userId || isResendingOtp) return;
                        
                        setIsResendingOtp(true);
                        try {
                          const response = await fetch("/api/auth/2fa/email-login-request", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ userId }),
                          });
                          
                          if (response.ok) {
                            setError("");
                          } else {
                            const data = await response.json();
                            setError(data.error || "Failed to resend code");
                          }
                        } catch (err) {
                          setError("Network error. Please try again.");
                        } finally {
                          setIsResendingOtp(false);
                        }
                      }}
                      disabled={isResendingOtp}
                      className="mt-3 text-sm text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                    >
                      {isResendingOtp ? "Sending..." : "Resend verification code"}
                    </button>
                  )}
                  
                  {/* Option to switch 2FA methods */}
                  <div className="mt-4 text-center">
                    {twoFactorMethod === '2fa_app' ? (
                      <button
                        type="button"
                        onClick={async () => {
                          // Request email OTP
                          setIsResendingOtp(true);
                          try {
                            const response = await fetch("/api/auth/2fa/email-login-request", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId }),
                            });
                            
                            if (response.ok) {
                              setTwoFactorMethod('email_otp');
                              setTwoFactorCode('');
                              setError("");
                            } else {
                              const data = await response.json();
                              setError(data.error || "Failed to send email code");
                            }
                          } catch (err) {
                            setError("Network error. Please try again.");
                          } finally {
                            setIsResendingOtp(false);
                          }
                        }}
                        disabled={isResendingOtp}
                        className="text-sm text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                      >
                        Use email verification instead
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTwoFactorMethod('2fa_app');
                          setTwoFactorCode('');
                        }}
                        className="text-sm text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Use authenticator app instead
                      </button>
                    )}
                  </div>
                  
                  {/* Trust device option for 2FA */}
                  <div className="mt-6">
                    <div className="flex items-center">
                      <input
                        id="trust-device"
                        name="trust-device"
                        type="checkbox"
                        checked={trustDevice}
                        onChange={(e) => setTrustDevice(e.target.checked)}
                        className="h-4 w-4 text-zenith-primary focus:ring-zenith-primary border-zenith-border rounded"
                      />
                      <label
                        htmlFor="trust-device"
                        className="ml-2 block text-sm text-zenith-secondary dark:text-gray-300"
                      >
                        Remember this device (won't ask for 2FA on this device for 30 days)
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRequiresTwoFactor(false);
                        setUserId(null);
                        setTwoFactorCode("");
                      }}
                      className="text-sm text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {requiresTwoFactor ? "Verifying..." : "Signing in..."}
                </div>
              ) : requiresTwoFactor ? "Verify" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zenith-border dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zenith-card text-zenith-muted">
                  Or continue with
                </span>
              </div>
            </div>
          </div>
          
          {/* OAuth Login Buttons - Only shown when not in 2FA mode */}
          {!requiresTwoFactor && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setOAuthLoading('google');
                  signIn('google');
                }}
                disabled={oauthLoading === 'google'}
                className="flex items-center justify-center w-full py-2.5 px-4 border border-zenith-border dark:border-gray-600 rounded-lg shadow-sm bg-zenith-card dark:bg-gray-700 hover:bg-zenith-section dark:hover:bg-zenith-secondary transition-colors disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <svg
                    className="animate-spin h-5 w-5 text-zenith-muted dark:text-zenith-muted"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <>
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
                    Google
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOAuthLoading('github');
                  signIn('github');
                }}
                disabled={oauthLoading === 'github'}
                className="flex items-center justify-center w-full py-2.5 px-4 border border-zenith-border dark:border-gray-600 rounded-lg shadow-sm bg-zenith-card dark:bg-gray-700 hover:bg-zenith-section dark:hover:bg-zenith-secondary transition-colors disabled:opacity-50"
              >
                {oauthLoading === 'github' ? (
                  <svg
                    className="animate-spin h-5 w-5 text-zenith-muted dark:text-zenith-muted"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </>
                )}
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zenith-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zenith-card text-zenith-muted">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <Link
              href="/register"
              className="text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              Create a new account
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
            Demo Credentials:
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Email: alex.chen.coord@zenith.edu
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Password: password123
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            (Alex Chen - Ascend Club Coordinator)
          </p>
        </div>
        </motion.div>
      </div>
    </div>
  );
}
