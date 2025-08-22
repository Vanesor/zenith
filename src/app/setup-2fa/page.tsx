"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { 
  Shield, 
  Smartphone, 
  CheckCircle,
  Loader2,
  Copy,
  Download,
  ArrowRight,
  QrCode,
  Key
} from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const setupSchema = z.object({
  verificationCode: z.string().min(6, "Please enter the 6-digit code").max(6),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function Setup2FAPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [codesDownloaded, setCodesDownloaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    mode: "onChange",
  });

  useEffect(() => {
    // Generate QR code and secret key
    generateSetupData();
  }, []);

  const generateSetupData = async () => {
    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });

      const result = await response.json();

      if (response.ok) {
        setQrCodeUrl(result.qrCodeUrl);
        setSecretKey(result.secretKey);
      } else {
        toast.error('Failed to generate 2FA setup data');
      }
    } catch (error) {
      toast.error('Failed to generate 2FA setup data');
    }
  };

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-2fa-setup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ code: data.verificationCode }),
      });

      const result = await response.json();

      if (response.ok) {
        setBackupCodes(result.backupCodes);
        setStep(3);
        toast.success('2FA enabled successfully! 🎉');
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    toast.success('Secret key copied to clipboard!');
  };

  const downloadBackupCodes = () => {
    const content = `Zenith 2FA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Warning: If you lose your device and these backup codes, you will lose access to your account.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zenith-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    setCodesDownloaded(true);
    toast.success('Backup codes downloaded!');
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Set Up Two-Factor Authentication";
      case 2: return "Verify Your Setup";
      case 3: return "Save Your Backup Codes";
      default: return "2FA Setup Complete";
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return "Scan the QR code with your authenticator app";
      case 2: return "Enter the code from your authenticator app";
      case 3: return "Download and store these backup codes safely";
      default: return "Your account is now more secure";
    }
  };

  return (
    <AuthLayout 
      title={getStepTitle()}
      subtitle={getStepSubtitle()}
      backLink="/settings/security"
    >
      <div className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  stepNumber <= step
                    ? 'bg-blue-600 text-primary'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {stepNumber < step ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-12 h-1 mx-2 rounded ${
                    stepNumber < step
                      ? 'bg-blue-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5" />
                  <span>Scan QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <div className="p-4 bg-white rounded-lg">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Use Google Authenticator, Authy, or any compatible TOTP app
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Manual Entry</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Can't scan the QR code? Enter this secret key manually:
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    value={secretKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copySecretKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => setStep(2)}
              className="w-full h-12"
              disabled={!qrCodeUrl}
            >
              I've Added the Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4"
              >
                <Smartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open your authenticator app and enter the 6-digit code
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                {...register("verificationCode")}
                type="text"
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono h-14"
                maxLength={6}
                error={errors.verificationCode?.message}
              />

              <Button
                type="submit"
                disabled={isLoading || !isValid}
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
                    Verify & Enable 2FA
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4"
              >
                <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>
            </div>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Download className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Important: Save Your Backup Codes
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      These codes can be used to access your account if you lose your device
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={downloadBackupCodes}
                variant={codesDownloaded ? "outline" : "default"}
                className="w-full h-12"
              >
                {codesDownloaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Backup Codes Downloaded
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Backup Codes
                  </>
                )}
              </Button>

              <Button
                onClick={() => window.location.href = '/dashboard'}
                disabled={!codesDownloaded}
                className="w-full h-12"
              >
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
